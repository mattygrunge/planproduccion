"""
API de Lotes con validaciones inteligentes.

Este módulo implementa:
- CRUD de lotes
- Cálculo automático de litros totales
- Cálculo automático de fecha de vencimiento
- Validación de lote duplicado
- Validación de salto de lote
- Advertencias de fecha (muy antigua o futura)
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from typing import Optional, List
from datetime import date, timedelta
import re

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.audit import audit_crear, audit_editar, audit_eliminar, get_client_info, _model_to_dict
from app.core.id_generator import generar_codigo_lote
from app.models import Lote, Producto, EstadoLinea, User, TipoEstado
from app.schemas.lote import (
    LoteCreate,
    LoteUpdate,
    LoteResponse,
    LoteResponseConAdvertencias,
    LoteList,
    LoteWarning,
    WarningType,
    ValidacionLoteRequest,
    ValidacionLoteResponse,
)

router = APIRouter(prefix="/lotes", tags=["Lotes"])


# ============================================================================
# FUNCIONES DE VALIDACIÓN
# ============================================================================

def extraer_numero_de_lote(numero_lote: str) -> Optional[int]:
    """
    Extrae el número entero de un string de lote.
    Ejemplos:
    - "2024001" -> 2024001
    - "L-001" -> 1
    - "LOTE-2024-0005" -> 5
    - "ABC123XYZ" -> 123
    
    Busca el último grupo de dígitos consecutivos en el string.
    """
    # Buscar todos los grupos de dígitos
    matches = re.findall(r'\d+', numero_lote)
    if matches:
        # Retornar el último grupo como número entero
        return int(matches[-1])
    return None


def detectar_lote_duplicado(
    db: Session,
    numero_lote: str,
    producto_id: int,
    lote_id_excluir: Optional[int] = None
) -> bool:
    """
    Detecta si ya existe un lote con el mismo número para el mismo producto.
    
    Lógica:
    - Busca en la base de datos un lote con el mismo numero_lote y producto_id
    - Excluye el lote actual si se está editando (lote_id_excluir)
    """
    query = db.query(Lote).filter(
        Lote.numero_lote == numero_lote,
        Lote.producto_id == producto_id,
        Lote.activo == True
    )
    
    if lote_id_excluir:
        query = query.filter(Lote.id != lote_id_excluir)
    
    return query.first() is not None


def detectar_salto_lote(
    db: Session,
    numero_lote: str,
    producto_id: int
) -> tuple[bool, Optional[str], Optional[str]]:
    """
    Detecta si hay un salto en la secuencia de números de lote.
    
    Lógica:
    1. Extrae el número del lote nuevo (ej: "L-005" -> 5)
    2. Busca el último lote del mismo producto
    3. Extrae el número del último lote (ej: "L-003" -> 3)
    4. Si nuevo_numero > ultimo_numero + 1, hay salto
    
    Retorna: (hay_salto, numero_lote_anterior, numero_lote_esperado)
    """
    numero_nuevo = extraer_numero_de_lote(numero_lote)
    
    if numero_nuevo is None:
        return False, None, None
    
    # Buscar el último lote del mismo producto
    ultimo_lote = db.query(Lote).filter(
        Lote.producto_id == producto_id,
        Lote.activo == True
    ).order_by(desc(Lote.id)).first()
    
    if ultimo_lote is None:
        # Es el primer lote, verificar si empieza desde un número razonable
        if numero_nuevo > 1:
            return True, None, "1"
        return False, None, None
    
    numero_anterior = extraer_numero_de_lote(ultimo_lote.numero_lote)
    
    if numero_anterior is None:
        return False, None, None
    
    # Verificar si hay salto
    if numero_nuevo > numero_anterior + 1:
        # Hay salto - calcular el número esperado
        numero_esperado = numero_anterior + 1
        # Reconstruir el formato del lote esperado
        lote_esperado = re.sub(
            r'\d+$',
            str(numero_esperado).zfill(len(str(numero_anterior))),
            ultimo_lote.numero_lote
        )
        return True, ultimo_lote.numero_lote, lote_esperado
    
    return False, ultimo_lote.numero_lote, None


def validar_fecha_produccion(fecha_produccion: date) -> List[LoteWarning]:
    """
    Valida la fecha de producción y genera advertencias.
    
    Lógica:
    - Fecha futura: Si es mayor a hoy, advertencia
    - Fecha muy antigua: Si es más de 30 días en el pasado, advertencia
    """
    advertencias = []
    hoy = date.today()
    
    if fecha_produccion > hoy:
        dias_futuro = (fecha_produccion - hoy).days
        advertencias.append(LoteWarning(
            tipo=WarningType.FECHA_FUTURA,
            mensaje=f"La fecha de producción es {dias_futuro} día(s) en el futuro",
            detalle=f"Fecha ingresada: {fecha_produccion.isoformat()}, Fecha actual: {hoy.isoformat()}"
        ))
    elif (hoy - fecha_produccion).days > 30:
        dias_pasados = (hoy - fecha_produccion).days
        advertencias.append(LoteWarning(
            tipo=WarningType.FECHA_MUY_ANTIGUA,
            mensaje=f"La fecha de producción tiene {dias_pasados} días de antigüedad",
            detalle=f"Fecha ingresada: {fecha_produccion.isoformat()}, Fecha actual: {hoy.isoformat()}"
        ))
    
    return advertencias


def validar_lote(
    db: Session,
    numero_lote: str,
    producto_id: int,
    fecha_produccion: date,
    lote_id_excluir: Optional[int] = None
) -> List[LoteWarning]:
    """
    Ejecuta todas las validaciones para un lote y retorna las advertencias.
    """
    advertencias = []
    
    # 1. Verificar lote duplicado
    if detectar_lote_duplicado(db, numero_lote, producto_id, lote_id_excluir):
        advertencias.append(LoteWarning(
            tipo=WarningType.LOTE_DUPLICADO,
            mensaje=f"Ya existe un lote '{numero_lote}' para este producto",
            detalle="Se recomienda verificar si es un error o si el lote ya fue registrado"
        ))
    
    # 2. Verificar salto de lote
    hay_salto, lote_anterior, lote_esperado = detectar_salto_lote(db, numero_lote, producto_id)
    if hay_salto:
        if lote_anterior:
            advertencias.append(LoteWarning(
                tipo=WarningType.SALTO_LOTE,
                mensaje=f"Se detectó un salto en la secuencia de lotes",
                detalle=f"Último lote: {lote_anterior}, Esperado: {lote_esperado}, Ingresado: {numero_lote}"
            ))
        else:
            advertencias.append(LoteWarning(
                tipo=WarningType.SALTO_LOTE,
                mensaje=f"El primer lote debería ser '{lote_esperado}', se ingresó '{numero_lote}'",
                detalle="Se recomienda iniciar la secuencia desde 1 o verificar si faltan lotes anteriores"
            ))
    
    # 3. Validar fecha de producción
    advertencias.extend(validar_fecha_produccion(fecha_produccion))
    
    return advertencias


def calcular_litros_totales(
    pallets: int,
    parciales: int,
    unidades_por_pallet: int,
    litros_por_unidad: float
) -> float:
    """
    Calcula los litros totales de un lote.
    
    Fórmula: (pallets * unidades_por_pallet + parciales) * litros_por_unidad
    """
    total_unidades = (pallets or 0) * (unidades_por_pallet or 1) + (parciales or 0)
    return total_unidades * (litros_por_unidad or 1.0)


def calcular_fecha_vencimiento(fecha_produccion: date, anos_vencimiento: int) -> date:
    """
    Calcula la fecha de vencimiento.
    
    Fórmula: fecha_produccion + (años_vencimiento * 365 días)
    """
    return fecha_produccion + timedelta(days=365 * (anos_vencimiento or 2))


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/validar", response_model=ValidacionLoteResponse)
def validar_lote_endpoint(
    data: ValidacionLoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Valida un lote sin crearlo.
    Útil para mostrar advertencias en el frontend antes de confirmar la creación.
    """
    # Verificar que el producto existe
    producto = db.query(Producto).filter(Producto.id == data.producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Ejecutar validaciones
    advertencias = validar_lote(db, data.numero_lote, data.producto_id, data.fecha_produccion)
    
    # Obtener información del último lote
    _, lote_anterior, lote_esperado = detectar_salto_lote(db, data.numero_lote, data.producto_id)
    
    return ValidacionLoteResponse(
        valido=len(advertencias) == 0,
        advertencias=advertencias,
        lote_anterior=lote_anterior,
        lote_esperado=lote_esperado
    )


@router.post("", response_model=LoteResponseConAdvertencias)
def create_lote(
    lote: LoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crear un nuevo lote.
    
    Si hay advertencias y no se especifica ignorar_advertencias=True,
    retorna las advertencias sin crear el lote.
    """
    # Verificar que el producto existe
    producto = db.query(Producto).filter(Producto.id == lote.producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar estado de línea si se especifica
    if lote.estado_linea_id:
        estado = db.query(EstadoLinea).filter(EstadoLinea.id == lote.estado_linea_id).first()
        if not estado:
            raise HTTPException(status_code=404, detail="Estado de línea no encontrado")
        if estado.tipo_estado != TipoEstado.PRODUCCION:
            raise HTTPException(
                status_code=400,
                detail="Solo se pueden asociar lotes a estados de tipo 'Producción'"
            )
    
    # Ejecutar validaciones
    advertencias = validar_lote(db, lote.numero_lote, lote.producto_id, lote.fecha_produccion)
    
    # Si hay advertencias y no se ignoran, retornar sin crear
    if advertencias and not lote.ignorar_advertencias:
        return LoteResponseConAdvertencias(
            lote=None,
            advertencias=advertencias,
            creado=False,
            mensaje="Se encontraron advertencias. Confirme para continuar."
        )
    
    # Calcular litros totales si no se especifica
    litros_totales = lote.litros_totales
    if litros_totales is None:
        litros_totales = calcular_litros_totales(
            lote.pallets or 0,
            lote.parciales or 0,
            lote.unidades_por_pallet or 1,
            producto.litros_por_unidad or 1.0
        )
    
    # Calcular fecha de vencimiento si no se especifica
    fecha_vencimiento = lote.fecha_vencimiento
    if fecha_vencimiento is None:
        fecha_vencimiento = calcular_fecha_vencimiento(
            lote.fecha_produccion,
            producto.anos_vencimiento or 2
        )
    
    # Generar código automático
    codigo = generar_codigo_lote(db)
    
    # Crear el lote
    db_lote = Lote(
        codigo=codigo,
        numero_lote=lote.numero_lote,
        producto_id=lote.producto_id,
        estado_linea_id=lote.estado_linea_id,
        pallets=lote.pallets or 0,
        parciales=lote.parciales or 0,
        unidades_por_pallet=lote.unidades_por_pallet or 1,
        litros_totales=litros_totales,
        fecha_produccion=lote.fecha_produccion,
        fecha_vencimiento=fecha_vencimiento,
        link_senasa=lote.link_senasa,
        observaciones=lote.observaciones,
        usuario_id=current_user.id,
        activo=lote.activo
    )
    
    db.add(db_lote)
    db.commit()
    db.refresh(db_lote)
    
    # Registrar auditoría
    ip_address, user_agent = get_client_info(request)
    audit_crear(
        db=db,
        usuario=current_user,
        entidad="lote",
        registro=db_lote,
        descripcion=f"Lote: {db_lote.numero_lote}",
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()
    
    # Cargar relaciones
    db_lote = db.query(Lote).options(
        joinedload(Lote.producto),
        joinedload(Lote.estado_linea)
    ).filter(Lote.id == db_lote.id).first()
    
    return LoteResponseConAdvertencias(
        lote=LoteResponse.model_validate(db_lote),
        advertencias=advertencias,
        creado=True,
        mensaje="Lote creado exitosamente" + (" (con advertencias ignoradas)" if advertencias else "")
    )


@router.get("", response_model=LoteList)
def list_lotes(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    producto_id: Optional[int] = None,
    estado_linea_id: Optional[int] = None,
    activo: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar lotes con paginación y filtros."""
    query = db.query(Lote).options(
        joinedload(Lote.producto),
        joinedload(Lote.estado_linea)
    )
    
    # Filtros
    if producto_id:
        query = query.filter(Lote.producto_id == producto_id)
    if estado_linea_id:
        query = query.filter(Lote.estado_linea_id == estado_linea_id)
    if activo is not None:
        query = query.filter(Lote.activo == activo)
    if search:
        query = query.filter(Lote.numero_lote.ilike(f"%{search}%"))
    
    # Contar total
    total = query.count()
    
    # Paginación
    pages = (total + size - 1) // size
    offset = (page - 1) * size
    
    items = query.order_by(desc(Lote.id)).offset(offset).limit(size).all()
    
    return LoteList(
        items=[LoteResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{lote_id}", response_model=LoteResponse)
def get_lote(
    lote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener un lote por ID."""
    lote = db.query(Lote).options(
        joinedload(Lote.producto),
        joinedload(Lote.estado_linea)
    ).filter(Lote.id == lote_id).first()
    
    if not lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    return LoteResponse.model_validate(lote)


@router.put("/{lote_id}", response_model=LoteResponseConAdvertencias)
def update_lote(
    lote_id: int,
    lote_update: LoteUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar un lote existente.
    
    Si hay advertencias y no se especifica ignorar_advertencias=True,
    retorna las advertencias sin actualizar el lote.
    """
    db_lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not db_lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    # Guardar datos anteriores para auditoría
    datos_anteriores = _model_to_dict(db_lote)
    
    # Preparar datos para validación
    numero_lote = lote_update.numero_lote or db_lote.numero_lote
    producto_id = lote_update.producto_id or db_lote.producto_id
    fecha_produccion = lote_update.fecha_produccion or db_lote.fecha_produccion
    
    # Verificar producto si se cambió
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar estado de línea si se especifica
    if lote_update.estado_linea_id:
        estado = db.query(EstadoLinea).filter(EstadoLinea.id == lote_update.estado_linea_id).first()
        if not estado:
            raise HTTPException(status_code=404, detail="Estado de línea no encontrado")
        if estado.tipo_estado != TipoEstado.PRODUCCION:
            raise HTTPException(
                status_code=400,
                detail="Solo se pueden asociar lotes a estados de tipo 'Producción'"
            )
    
    # Ejecutar validaciones (excluyendo el lote actual)
    advertencias = validar_lote(db, numero_lote, producto_id, fecha_produccion, lote_id)
    
    # Si hay advertencias y no se ignoran, retornar sin actualizar
    if advertencias and not lote_update.ignorar_advertencias:
        return LoteResponseConAdvertencias(
            lote=LoteResponse.model_validate(db_lote),
            advertencias=advertencias,
            creado=False,
            mensaje="Se encontraron advertencias. Confirme para continuar."
        )
    
    # Actualizar campos
    update_data = lote_update.model_dump(exclude_unset=True, exclude={"ignorar_advertencias"})
    
    for field, value in update_data.items():
        setattr(db_lote, field, value)
    
    # Recalcular litros si cambiaron los parámetros
    if any(f in update_data for f in ["pallets", "parciales", "unidades_por_pallet"]):
        if lote_update.litros_totales is None:
            db_lote.litros_totales = calcular_litros_totales(
                db_lote.pallets or 0,
                db_lote.parciales or 0,
                db_lote.unidades_por_pallet or 1,
                producto.litros_por_unidad or 1.0
            )
    
    # Recalcular fecha de vencimiento si cambió la fecha de producción
    if "fecha_produccion" in update_data and lote_update.fecha_vencimiento is None:
        db_lote.fecha_vencimiento = calcular_fecha_vencimiento(
            db_lote.fecha_produccion,
            producto.anos_vencimiento or 2
        )
    
    db.commit()
    db.refresh(db_lote)
    
    # Registrar auditoría
    ip_address, user_agent = get_client_info(request)
    audit_editar(
        db=db,
        usuario=current_user,
        entidad="lote",
        registro_anterior=datos_anteriores,
        registro_nuevo=db_lote,
        descripcion=f"Lote: {db_lote.numero_lote}",
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.commit()
    
    # Cargar relaciones
    db_lote = db.query(Lote).options(
        joinedload(Lote.producto),
        joinedload(Lote.estado_linea)
    ).filter(Lote.id == db_lote.id).first()
    
    return LoteResponseConAdvertencias(
        lote=LoteResponse.model_validate(db_lote),
        advertencias=advertencias,
        creado=True,
        mensaje="Lote actualizado exitosamente" + (" (con advertencias ignoradas)" if advertencias else "")
    )


@router.delete("/{lote_id}")
def delete_lote(
    lote_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar (desactivar) un lote."""
    db_lote = db.query(Lote).filter(Lote.id == lote_id).first()
    if not db_lote:
        raise HTTPException(status_code=404, detail="Lote no encontrado")
    
    # Registrar auditoría antes de eliminar (desactivar)
    ip_address, user_agent = get_client_info(request)
    audit_eliminar(
        db=db,
        usuario=current_user,
        entidad="lote",
        registro=db_lote,
        descripcion=f"Lote: {db_lote.numero_lote}",
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db_lote.activo = False
    db.commit()
    
    return {"message": "Lote eliminado exitosamente"}


@router.get("/producto/{producto_id}/ultimo", response_model=Optional[LoteResponse])
def get_ultimo_lote_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener el último lote de un producto (útil para sugerir el siguiente número)."""
    lote = db.query(Lote).options(
        joinedload(Lote.producto),
        joinedload(Lote.estado_linea)
    ).filter(
        Lote.producto_id == producto_id,
        Lote.activo == True
    ).order_by(desc(Lote.id)).first()
    
    if not lote:
        return None
    
    return LoteResponse.model_validate(lote)


@router.get("/producto/{producto_id}/sugerir-numero")
def sugerir_numero_lote(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sugiere el siguiente número de lote basándose en el último lote del producto.
    """
    # Verificar que el producto existe
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Buscar el último lote
    ultimo_lote = db.query(Lote).filter(
        Lote.producto_id == producto_id,
        Lote.activo == True
    ).order_by(desc(Lote.id)).first()
    
    if not ultimo_lote:
        # Sugerir el primer lote
        return {
            "sugerencia": "001",
            "ultimo_lote": None,
            "mensaje": "No hay lotes anteriores. Se sugiere iniciar desde 001."
        }
    
    # Extraer número y sugerir el siguiente
    numero_actual = extraer_numero_de_lote(ultimo_lote.numero_lote)
    
    if numero_actual is not None:
        siguiente_numero = numero_actual + 1
        # Mantener el formato del último lote
        sugerencia = re.sub(
            r'\d+$',
            str(siguiente_numero).zfill(len(str(numero_actual)) if numero_actual > 0 else 3),
            ultimo_lote.numero_lote
        )
    else:
        sugerencia = ultimo_lote.numero_lote + "-2"
    
    return {
        "sugerencia": sugerencia,
        "ultimo_lote": ultimo_lote.numero_lote,
        "mensaje": f"Basado en el último lote '{ultimo_lote.numero_lote}'"
    }
