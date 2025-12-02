from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
import math

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_active_admin
from app.core.id_generator import generar_codigo_sector
from app.models.user import User
from app.models.sector import Sector
from app.schemas.sector import SectorCreate, SectorUpdate, SectorResponse, SectorList

router = APIRouter(prefix="/sectores", tags=["Sectores"])


@router.get("", response_model=SectorList)
def listar_sectores(
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    search: Optional[str] = Query(None, description="Buscar por nombre"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos los sectores con paginación y filtros."""
    query = db.query(Sector)
    
    # Filtros
    if search:
        query = query.filter(Sector.nombre.ilike(f"%{search}%"))
    if activo is not None:
        query = query.filter(Sector.activo == activo)
    
    # Contar total
    total = query.count()
    pages = math.ceil(total / size)
    
    # Paginación
    offset = (page - 1) * size
    items = query.order_by(Sector.nombre).offset(offset).limit(size).all()
    
    return SectorList(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{sector_id}", response_model=SectorResponse)
def obtener_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene un sector por su ID."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sector no encontrado"
        )
    return sector


@router.post("", response_model=SectorResponse, status_code=status.HTTP_201_CREATED)
def crear_sector(
    sector_data: SectorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Crea un nuevo sector. Solo para administradores."""
    # Verificar si ya existe
    existing = db.query(Sector).filter(Sector.nombre == sector_data.nombre).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un sector con ese nombre"
        )
    
    # Generar código automático
    codigo = generar_codigo_sector(db)
    
    sector = Sector(codigo=codigo, **sector_data.model_dump())
    db.add(sector)
    
    try:
        db.commit()
        db.refresh(sector)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear el sector"
        )
    
    return sector


@router.put("/{sector_id}", response_model=SectorResponse)
def actualizar_sector(
    sector_id: int,
    sector_data: SectorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Actualiza un sector existente. Solo para administradores."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sector no encontrado"
        )
    
    # Verificar nombre duplicado si se está cambiando
    if sector_data.nombre and sector_data.nombre != sector.nombre:
        existing = db.query(Sector).filter(Sector.nombre == sector_data.nombre).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un sector con ese nombre"
            )
    
    # Actualizar solo los campos proporcionados
    update_data = sector_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sector, field, value)
    
    try:
        db.commit()
        db.refresh(sector)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar el sector"
        )
    
    return sector


@router.delete("/{sector_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_sector(
    sector_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Elimina un sector. Solo para administradores."""
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sector no encontrado"
        )
    
    # Verificar si tiene líneas asociadas
    if sector.lineas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar el sector porque tiene líneas asociadas"
        )
    
    db.delete(sector)
    db.commit()
    return None
