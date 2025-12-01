from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
from datetime import datetime, date, time, timedelta
import math

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_active_admin
from app.core.audit import audit_crear, audit_editar, audit_eliminar, get_client_info, _model_to_dict
from app.models.user import User
from app.models.estado_linea import EstadoLinea
from app.models.sector import Sector
from app.models.linea import Linea
from app.schemas.estado_linea import (
    EstadoLineaCreate,
    EstadoLineaUpdate,
    EstadoLineaResponse,
    EstadoLineaList,
    TipoEstadoOption,
    TipoEstadoEnum,
    TIPO_ESTADO_LABELS,
)

router = APIRouter(prefix="/estados-linea", tags=["Estados de Línea"])


@router.get("/tipos-estado", response_model=list[TipoEstadoOption])
def listar_tipos_estado(current_user: User = Depends(get_current_user)):
    """Lista todos los tipos de estado disponibles."""
    return [
        TipoEstadoOption(value=tipo.value, label=TIPO_ESTADO_LABELS[tipo])
        for tipo in TipoEstadoEnum
    ]


@router.get("/timeline/{fecha}", response_model=dict)
def obtener_estados_timeline(
    fecha: date,
    sector_id: Optional[int] = Query(None, description="Filtrar por sector"),
    linea_id: Optional[int] = Query(None, description="Filtrar por línea"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene todos los estados de línea para un día específico, 
    organizados para mostrar en un timeline.
    
    Retorna:
    - fecha: La fecha consultada
    - sectores: Lista de sectores con sus líneas y estados
    - estados: Lista plana de todos los estados del día
    """
    # Definir inicio y fin del día
    fecha_inicio = datetime.combine(fecha, time.min)
    fecha_fin = datetime.combine(fecha, time.max)
    
    # Obtener todos los sectores activos
    sectores_query = db.query(Sector).filter(Sector.activo == True)
    if sector_id:
        sectores_query = sectores_query.filter(Sector.id == sector_id)
    sectores = sectores_query.order_by(Sector.nombre).all()
    
    # Obtener todas las líneas activas
    lineas_query = db.query(Linea).filter(Linea.activo == True)
    if sector_id:
        lineas_query = lineas_query.filter(Linea.sector_id == sector_id)
    if linea_id:
        lineas_query = lineas_query.filter(Linea.id == linea_id)
    lineas = lineas_query.order_by(Linea.sector_id, Linea.nombre).all()
    
    # Query de estados para el día
    estados_query = db.query(EstadoLinea).options(
        joinedload(EstadoLinea.sector),
        joinedload(EstadoLinea.linea),
        joinedload(EstadoLinea.usuario)
    ).filter(
        EstadoLinea.activo == True,
        # Estados que comienzan en el día O que terminan en el día O que abarcan todo el día
        (
            (EstadoLinea.fecha_hora_inicio >= fecha_inicio) & 
            (EstadoLinea.fecha_hora_inicio <= fecha_fin)
        ) | (
            (EstadoLinea.fecha_hora_fin >= fecha_inicio) & 
            (EstadoLinea.fecha_hora_fin <= fecha_fin)
        ) | (
            (EstadoLinea.fecha_hora_inicio <= fecha_inicio) & 
            (
                (EstadoLinea.fecha_hora_fin >= fecha_fin) | 
                (EstadoLinea.fecha_hora_fin == None)
            )
        )
    )
    
    # Aplicar filtros adicionales
    if sector_id:
        estados_query = estados_query.filter(EstadoLinea.sector_id == sector_id)
    if linea_id:
        estados_query = estados_query.filter(EstadoLinea.linea_id == linea_id)
    
    estados = estados_query.order_by(EstadoLinea.fecha_hora_inicio).all()
    
    # Convertir estados a diccionarios con labels
    estados_response = []
    for estado in estados:
        estado_dict = {
            "id": estado.id,
            "sector_id": estado.sector_id,
            "linea_id": estado.linea_id,
            "tipo_estado": estado.tipo_estado,
            "fecha_hora_inicio": estado.fecha_hora_inicio.isoformat() if estado.fecha_hora_inicio else None,
            "fecha_hora_fin": estado.fecha_hora_fin.isoformat() if estado.fecha_hora_fin else None,
            "duracion_minutos": estado.duracion_minutos,
            "observaciones": estado.observaciones,
            "sector": {"id": estado.sector.id, "nombre": estado.sector.nombre} if estado.sector else None,
            "linea": {"id": estado.linea.id, "nombre": estado.linea.nombre} if estado.linea else None,
            "usuario": {
                "id": estado.usuario.id, 
                "username": estado.usuario.username,
                "full_name": estado.usuario.full_name
            } if estado.usuario else None,
        }
        
        # Agregar label del tipo de estado
        try:
            tipo_enum = TipoEstadoEnum(estado.tipo_estado)
            estado_dict["tipo_estado_label"] = TIPO_ESTADO_LABELS.get(tipo_enum, estado.tipo_estado)
        except ValueError:
            estado_dict["tipo_estado_label"] = estado.tipo_estado
        
        estados_response.append(estado_dict)
    
    # Organizar sectores con sus líneas
    sectores_response = []
    for sector in sectores:
        lineas_sector = [l for l in lineas if l.sector_id == sector.id]
        sectores_response.append({
            "id": sector.id,
            "nombre": sector.nombre,
            "lineas": [
                {
                    "id": linea.id,
                    "nombre": linea.nombre,
                    "estados": [e for e in estados_response if e["linea_id"] == linea.id]
                }
                for linea in lineas_sector
            ]
        })
    
    return {
        "fecha": fecha.isoformat(),
        "sectores": sectores_response,
        "estados": estados_response,
        "tipos_estado": [
            {"value": tipo.value, "label": TIPO_ESTADO_LABELS[tipo]}
            for tipo in TipoEstadoEnum
        ]
    }


@router.get("", response_model=EstadoLineaList)
def listar_estados(
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    sector_id: Optional[int] = Query(None, description="Filtrar por sector"),
    linea_id: Optional[int] = Query(None, description="Filtrar por línea"),
    tipo_estado: Optional[str] = Query(None, description="Filtrar por tipo de estado"),
    fecha_desde: Optional[datetime] = Query(None, description="Filtrar desde fecha"),
    fecha_hasta: Optional[datetime] = Query(None, description="Filtrar hasta fecha"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos los estados de línea con paginación y filtros."""
    query = db.query(EstadoLinea).options(
        joinedload(EstadoLinea.sector),
        joinedload(EstadoLinea.linea),
        joinedload(EstadoLinea.usuario)
    )
    
    # Filtros
    if sector_id:
        query = query.filter(EstadoLinea.sector_id == sector_id)
    if linea_id:
        query = query.filter(EstadoLinea.linea_id == linea_id)
    if tipo_estado:
        query = query.filter(EstadoLinea.tipo_estado == tipo_estado)
    if fecha_desde:
        query = query.filter(EstadoLinea.fecha_hora_inicio >= fecha_desde)
    if fecha_hasta:
        query = query.filter(EstadoLinea.fecha_hora_inicio <= fecha_hasta)
    if activo is not None:
        query = query.filter(EstadoLinea.activo == activo)
    
    # Contar total
    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    
    # Paginación - ordenar por fecha más reciente primero
    offset = (page - 1) * size
    items = query.order_by(EstadoLinea.fecha_hora_inicio.desc()).offset(offset).limit(size).all()
    
    # Convertir a response con labels
    items_response = []
    for item in items:
        response = EstadoLineaResponse.model_validate(item)
        try:
            tipo_enum = TipoEstadoEnum(item.tipo_estado)
            response.tipo_estado_label = TIPO_ESTADO_LABELS.get(tipo_enum, item.tipo_estado)
        except ValueError:
            response.tipo_estado_label = item.tipo_estado
        items_response.append(response)
    
    return EstadoLineaList(
        items=items_response,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{estado_id}", response_model=EstadoLineaResponse)
def obtener_estado(
    estado_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene un estado de línea por su ID."""
    estado = db.query(EstadoLinea).options(
        joinedload(EstadoLinea.sector),
        joinedload(EstadoLinea.linea),
        joinedload(EstadoLinea.usuario)
    ).filter(EstadoLinea.id == estado_id).first()
    
    if not estado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estado de línea no encontrado"
        )
    
    response = EstadoLineaResponse.model_validate(estado)
    try:
        tipo_enum = TipoEstadoEnum(estado.tipo_estado)
        response.tipo_estado_label = TIPO_ESTADO_LABELS.get(tipo_enum, estado.tipo_estado)
    except ValueError:
        response.tipo_estado_label = estado.tipo_estado
    
    return response


@router.post("", response_model=EstadoLineaResponse, status_code=status.HTTP_201_CREATED)
def crear_estado(
    estado_data: EstadoLineaCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crea un nuevo estado de línea."""
    # Verificar que el sector exista
    sector = db.query(Sector).filter(Sector.id == estado_data.sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El sector especificado no existe"
        )
    
    # Verificar que la línea exista y pertenezca al sector
    linea = db.query(Linea).filter(Linea.id == estado_data.linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La línea especificada no existe"
        )
    if linea.sector_id != estado_data.sector_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La línea no pertenece al sector seleccionado"
        )
    
    # Calcular duración si hay fecha fin
    duracion_minutos = estado_data.duracion_minutos
    if estado_data.fecha_hora_fin and not duracion_minutos:
        delta = estado_data.fecha_hora_fin - estado_data.fecha_hora_inicio
        duracion_minutos = int(delta.total_seconds() / 60)
    
    # Crear el estado
    estado_dict = estado_data.model_dump()
    estado_dict['tipo_estado'] = estado_data.tipo_estado.value
    estado_dict['duracion_minutos'] = duracion_minutos
    estado_dict['usuario_id'] = current_user.id
    
    estado = EstadoLinea(**estado_dict)
    db.add(estado)
    
    try:
        db.commit()
        db.refresh(estado)
        
        # Registrar auditoría
        ip_address, user_agent = get_client_info(request)
        audit_crear(
            db=db,
            usuario=current_user,
            entidad="estado_linea",
            registro=estado,
            descripcion=f"Estado: {estado_data.tipo_estado.value} en línea {linea.nombre}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear el estado de línea"
        )
    
    # Recargar con relaciones
    estado = db.query(EstadoLinea).options(
        joinedload(EstadoLinea.sector),
        joinedload(EstadoLinea.linea),
        joinedload(EstadoLinea.usuario)
    ).filter(EstadoLinea.id == estado.id).first()
    
    response = EstadoLineaResponse.model_validate(estado)
    try:
        tipo_enum = TipoEstadoEnum(estado.tipo_estado)
        response.tipo_estado_label = TIPO_ESTADO_LABELS.get(tipo_enum, estado.tipo_estado)
    except ValueError:
        response.tipo_estado_label = estado.tipo_estado
    
    return response


@router.put("/{estado_id}", response_model=EstadoLineaResponse)
def actualizar_estado(
    estado_id: int,
    estado_data: EstadoLineaUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualiza un estado de línea existente."""
    estado = db.query(EstadoLinea).filter(EstadoLinea.id == estado_id).first()
    if not estado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estado de línea no encontrado"
        )
    
    # Guardar datos anteriores para auditoría
    datos_anteriores = _model_to_dict(estado)
    
    update_data = estado_data.model_dump(exclude_unset=True)
    
    # Verificar sector si se está cambiando
    if 'sector_id' in update_data:
        sector = db.query(Sector).filter(Sector.id == update_data['sector_id']).first()
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El sector especificado no existe"
            )
    
    # Verificar línea si se está cambiando
    if 'linea_id' in update_data:
        linea = db.query(Linea).filter(Linea.id == update_data['linea_id']).first()
        if not linea:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La línea especificada no existe"
            )
        # Verificar que la línea pertenezca al sector
        sector_id = update_data.get('sector_id', estado.sector_id)
        if linea.sector_id != sector_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La línea no pertenece al sector seleccionado"
            )
    
    # Convertir enum a string si está presente
    if 'tipo_estado' in update_data and update_data['tipo_estado']:
        update_data['tipo_estado'] = update_data['tipo_estado'].value
    
    # Recalcular duración si cambió fecha fin
    if 'fecha_hora_fin' in update_data:
        fecha_inicio = update_data.get('fecha_hora_inicio', estado.fecha_hora_inicio)
        fecha_fin = update_data['fecha_hora_fin']
        if fecha_fin and fecha_inicio:
            delta = fecha_fin - fecha_inicio
            update_data['duracion_minutos'] = int(delta.total_seconds() / 60)
    
    # Actualizar campos
    for field, value in update_data.items():
        setattr(estado, field, value)
    
    try:
        db.commit()
        db.refresh(estado)
        
        # Registrar auditoría
        ip_address, user_agent = get_client_info(request)
        audit_editar(
            db=db,
            usuario=current_user,
            entidad="estado_linea",
            registro_anterior=datos_anteriores,
            registro_nuevo=estado,
            descripcion=f"Estado ID: {estado.id}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar el estado de línea"
        )
    
    # Recargar con relaciones
    estado = db.query(EstadoLinea).options(
        joinedload(EstadoLinea.sector),
        joinedload(EstadoLinea.linea),
        joinedload(EstadoLinea.usuario)
    ).filter(EstadoLinea.id == estado.id).first()
    
    response = EstadoLineaResponse.model_validate(estado)
    try:
        tipo_enum = TipoEstadoEnum(estado.tipo_estado)
        response.tipo_estado_label = TIPO_ESTADO_LABELS.get(tipo_enum, estado.tipo_estado)
    except ValueError:
        response.tipo_estado_label = estado.tipo_estado
    
    return response


@router.delete("/{estado_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_estado(
    estado_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Elimina un estado de línea. Solo para administradores."""
    estado = db.query(EstadoLinea).filter(EstadoLinea.id == estado_id).first()
    if not estado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estado de línea no encontrado"
        )
    
    # Registrar auditoría antes de eliminar
    ip_address, user_agent = get_client_info(request)
    audit_eliminar(
        db=db,
        usuario=current_user,
        entidad="estado_linea",
        registro=estado,
        descripcion=f"Estado ID: {estado.id} - {estado.tipo_estado}",
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.delete(estado)
    db.commit()
    return None
