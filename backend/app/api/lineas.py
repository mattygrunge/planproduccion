from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import Optional
import math

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_active_admin
from app.core.id_generator import generar_codigo_linea
from app.models.user import User
from app.models.linea import Linea
from app.models.sector import Sector
from app.models.estado_linea import EstadoLinea
from app.schemas.linea import LineaCreate, LineaUpdate, LineaResponse, LineaList

router = APIRouter(prefix="/lineas", tags=["Líneas"])


@router.get("", response_model=LineaList)
def listar_lineas(
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    search: Optional[str] = Query(None, description="Buscar por nombre"),
    sector_id: Optional[int] = Query(None, description="Filtrar por sector"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todas las líneas con paginación y filtros."""
    query = db.query(Linea).options(joinedload(Linea.sector))
    
    # Filtros
    if search:
        query = query.filter(Linea.nombre.ilike(f"%{search}%"))
    if sector_id:
        query = query.filter(Linea.sector_id == sector_id)
    if activo is not None:
        query = query.filter(Linea.activo == activo)
    
    # Contar total
    total = query.count()
    pages = math.ceil(total / size)
    
    # Paginación
    offset = (page - 1) * size
    items = query.order_by(Linea.nombre).offset(offset).limit(size).all()
    
    return LineaList(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{linea_id}", response_model=LineaResponse)
def obtener_linea(
    linea_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene una línea por su ID."""
    linea = db.query(Linea).options(joinedload(Linea.sector)).filter(Linea.id == linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    return linea


@router.post("", response_model=LineaResponse, status_code=status.HTTP_201_CREATED)
def crear_linea(
    linea_data: LineaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Crea una nueva línea. Solo para administradores."""
    # Verificar que el sector exista
    sector = db.query(Sector).filter(Sector.id == linea_data.sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El sector especificado no existe"
        )
    
    # Generar código automático
    codigo = generar_codigo_linea(db)
    
    linea = Linea(codigo=codigo, **linea_data.model_dump())
    db.add(linea)
    
    try:
        db.commit()
        db.refresh(linea)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear la línea"
        )
    
    # Cargar la relación sector
    db.refresh(linea)
    return linea


@router.put("/{linea_id}", response_model=LineaResponse)
def actualizar_linea(
    linea_id: int,
    linea_data: LineaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Actualiza una línea existente. Solo para administradores."""
    linea = db.query(Linea).filter(Linea.id == linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    
    # Verificar que el sector exista si se está cambiando
    if linea_data.sector_id:
        sector = db.query(Sector).filter(Sector.id == linea_data.sector_id).first()
        if not sector:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El sector especificado no existe"
            )
    
    # Actualizar solo los campos proporcionados
    update_data = linea_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(linea, field, value)
    
    try:
        db.commit()
        db.refresh(linea)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar la línea"
        )
    
    return linea


@router.delete("/{linea_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_linea(
    linea_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Elimina una línea. Solo para administradores."""
    linea = db.query(Linea).filter(Linea.id == linea_id).first()
    if not linea:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Línea no encontrada"
        )
    
    # Verificar si tiene estados de línea asociados
    estados_count = db.query(EstadoLinea).filter(EstadoLinea.linea_id == linea_id).count()
    if estados_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar la línea porque tiene {estados_count} estado(s) de línea asociado(s). Elimine primero los estados de línea relacionados."
        )
    
    db.delete(linea)
    db.commit()
    return None
