from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import Optional
import math

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_active_admin
from app.core.id_generator import generar_codigo_cliente
from app.models.user import User
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse, ClienteList

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("", response_model=ClienteList)
def listar_clientes(
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=1000, description="Tamaño de página"),
    search: Optional[str] = Query(None, description="Buscar por código, nombre o CUIT"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos los clientes con paginación y filtros."""
    query = db.query(Cliente)
    
    # Filtros
    if search:
        query = query.filter(
            (Cliente.codigo.ilike(f"%{search}%")) | 
            (Cliente.nombre.ilike(f"%{search}%")) |
            (Cliente.cuit.ilike(f"%{search}%"))
        )
    if activo is not None:
        query = query.filter(Cliente.activo == activo)
    
    # Contar total
    total = query.count()
    pages = math.ceil(total / size)
    
    # Paginación
    offset = (page - 1) * size
    items = query.order_by(Cliente.nombre).offset(offset).limit(size).all()
    
    return ClienteList(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{cliente_id}", response_model=ClienteResponse)
def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene un cliente por su ID."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    return cliente


@router.post("", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
def crear_cliente(
    cliente_data: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Crea un nuevo cliente. Solo para administradores."""
    # Verificar CUIT duplicado si se proporciona
    if cliente_data.cuit:
        existing_cuit = db.query(Cliente).filter(Cliente.cuit == cliente_data.cuit).first()
        if existing_cuit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un cliente con ese CUIT"
            )
    
    # Generar código automático
    codigo = generar_codigo_cliente(db)
    
    cliente = Cliente(codigo=codigo, **cliente_data.model_dump())
    db.add(cliente)
    
    try:
        db.commit()
        db.refresh(cliente)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear el cliente"
        )
    
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
def actualizar_cliente(
    cliente_id: int,
    cliente_data: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Actualiza un cliente existente. Solo para administradores."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    # Verificar CUIT duplicado si se está cambiando
    if cliente_data.cuit and cliente_data.cuit != cliente.cuit:
        existing_cuit = db.query(Cliente).filter(Cliente.cuit == cliente_data.cuit).first()
        if existing_cuit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Ya existe un cliente con ese CUIT"
            )
    
    # Actualizar solo los campos proporcionados
    update_data = cliente_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cliente, field, value)
    
    try:
        db.commit()
        db.refresh(cliente)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar el cliente"
        )
    
    return cliente


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Elimina un cliente. Solo para administradores."""
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    db.delete(cliente)
    db.commit()
    return None
