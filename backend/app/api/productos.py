from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import Optional
import math

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_active_admin
from app.core.audit import audit_crear, audit_editar, audit_eliminar, get_client_info, _model_to_dict
from app.core.id_generator import generar_codigo_producto
from app.models.user import User
from app.models.producto import Producto
from app.models.lote import Lote
from app.models.cliente import Cliente
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse, ProductoList

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("", response_model=ProductoList)
def listar_productos(
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(10, ge=1, le=100, description="Tamaño de página"),
    search: Optional[str] = Query(None, description="Buscar por código o nombre"),
    activo: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    cliente_id: Optional[int] = Query(None, description="Filtrar por cliente"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todos los productos con paginación y filtros."""
    query = db.query(Producto).options(joinedload(Producto.cliente))
    
    # Filtros
    if search:
        query = query.filter(
            (Producto.codigo.ilike(f"%{search}%")) | 
            (Producto.nombre.ilike(f"%{search}%")) |
            (Producto.codigo_producto.ilike(f"%{search}%")) |
            (Producto.formato_lote.ilike(f"%{search}%"))
        )
    if activo is not None:
        query = query.filter(Producto.activo == activo)
    if cliente_id is not None:
        query = query.filter(Producto.cliente_id == cliente_id)
    
    # Contar total
    total = query.count()
    pages = math.ceil(total / size)
    
    # Paginación
    offset = (page - 1) * size
    items = query.order_by(Producto.codigo).offset(offset).limit(size).all()
    
    return ProductoList(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/{producto_id}", response_model=ProductoResponse)
def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtiene un producto por su ID."""
    producto = db.query(Producto).options(joinedload(Producto.cliente)).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    return producto


@router.post("", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED)
def crear_producto(
    producto_data: ProductoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Crea un nuevo producto. Solo para administradores."""
    # Verificar que el cliente existe si se proporciona
    if producto_data.cliente_id:
        cliente = db.query(Cliente).filter(Cliente.id == producto_data.cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El cliente especificado no existe"
            )
    
    # Generar código automático
    codigo = generar_codigo_producto(db)
    
    producto = Producto(codigo=codigo, **producto_data.model_dump())
    db.add(producto)
    
    try:
        db.commit()
        db.refresh(producto)
        
        # Registrar auditoría
        ip_address, user_agent = get_client_info(request)
        audit_crear(
            db=db,
            usuario=current_user,
            entidad="producto",
            registro=producto,
            descripcion=f"Producto: {producto.codigo} - {producto.nombre}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al crear el producto"
        )
    
    # Recargar con relación cliente
    db.refresh(producto)
    return producto


@router.put("/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(
    producto_id: int,
    producto_data: ProductoUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Actualiza un producto existente. Solo para administradores."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Verificar que el cliente existe si se proporciona
    if producto_data.cliente_id:
        cliente = db.query(Cliente).filter(Cliente.id == producto_data.cliente_id).first()
        if not cliente:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El cliente especificado no existe"
            )
    
    # Guardar datos anteriores para auditoría
    datos_anteriores = _model_to_dict(producto)
    
    # Actualizar solo los campos proporcionados
    update_data = producto_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(producto, field, value)
    
    try:
        db.commit()
        db.refresh(producto)
        
        # Registrar auditoría
        ip_address, user_agent = get_client_info(request)
        audit_editar(
            db=db,
            usuario=current_user,
            entidad="producto",
            registro_anterior=datos_anteriores,
            registro_nuevo=producto,
            descripcion=f"Producto: {producto.codigo} - {producto.nombre}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error al actualizar el producto"
        )
    
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    producto_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Elimina un producto. Solo para administradores."""
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Verificar si tiene lotes asociados
    lotes_count = db.query(Lote).filter(Lote.producto_id == producto_id).count()
    if lotes_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar el producto porque tiene {lotes_count} lote(s) asociado(s). Elimine primero los lotes relacionados."
        )
    
    # Registrar auditoría antes de eliminar
    ip_address, user_agent = get_client_info(request)
    audit_eliminar(
        db=db,
        usuario=current_user,
        entidad="producto",
        registro=producto,
        descripcion=f"Producto: {producto.codigo} - {producto.nombre}",
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.delete(producto)
    db.commit()
    return None
