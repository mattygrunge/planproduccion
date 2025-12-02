from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.core.database import get_db
from app.core.security import get_password_hash
from app.core.deps import get_current_user, get_admin_user
from app.core.id_generator import generar_codigo_usuario
from app.models.user import User, Role
from app.schemas.user import (
    UserResponse, UserAdminCreate, UserAdminUpdate, UserResetPassword
)
from app.schemas.role import RoleResponse

router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("", response_model=List[UserResponse])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    role_id: Optional[int] = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Lista todos los usuarios (solo admin).
    """
    query = db.query(User)
    
    # Filtros
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.username.ilike(search_filter)) |
            (User.email.ilike(search_filter)) |
            (User.full_name.ilike(search_filter))
        )
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    if role_id is not None:
        query = query.filter(User.role_id == role_id)
    
    # Ordenar por fecha de creación descendente
    query = query.order_by(User.created_at.desc())
    
    users = query.offset(skip).limit(limit).all()
    
    return [
        UserResponse(
            id=user.id,
            codigo=user.codigo,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            role_id=user.role_id,
            role_name=user.role.name,
            created_at=user.created_at
        )
        for user in users
    ]


@router.get("/roles", response_model=List[RoleResponse])
def list_roles(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Lista todos los roles disponibles (solo admin).
    """
    roles = db.query(Role).all()
    return roles


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene un usuario por ID (solo admin).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return UserResponse(
        id=user.id,
        codigo=user.codigo,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        role_id=user.role_id,
        role_name=user.role.name,
        created_at=user.created_at
    )


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserAdminCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo usuario (solo admin).
    """
    # Verificar si el username ya existe
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso"
        )
    
    # Verificar si el email ya existe
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Verificar que el rol existe
    role = db.query(Role).filter(Role.id == user_data.role_id).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El rol especificado no existe"
        )
    
    # Validar longitud de contraseña
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )
    
    # Generar código automático
    codigo = generar_codigo_usuario(db)
    
    # Crear usuario
    new_user = User(
        codigo=codigo,
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        role_id=user_data.role_id,
        is_active=user_data.is_active
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        codigo=new_user.codigo,
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        is_active=new_user.is_active,
        role_id=new_user.role_id,
        role_name=new_user.role.name,
        created_at=new_user.created_at
    )


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_data: UserAdminUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza un usuario (solo admin).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # No permitir que el admin se desactive a sí mismo
    if user_id == current_user.id and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propia cuenta"
        )
    
    # No permitir que el admin cambie su propio rol
    if user_id == current_user.id and user_data.role_id is not None and user_data.role_id != current_user.role_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes cambiar tu propio rol"
        )
    
    # Verificar username único
    if user_data.username and user_data.username != user.username:
        existing = db.query(User).filter(
            User.username == user_data.username,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
        user.username = user_data.username
    
    # Verificar email único
    if user_data.email and user_data.email != user.email:
        existing = db.query(User).filter(
            User.email == user_data.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        user.email = user_data.email
    
    # Verificar que el rol existe
    if user_data.role_id is not None:
        role = db.query(Role).filter(Role.id == user_data.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El rol especificado no existe"
            )
        user.role_id = user_data.role_id
    
    # Actualizar otros campos
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    
    if user_data.is_active is not None:
        user.is_active = user_data.is_active
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        codigo=user.codigo,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        role_id=user.role_id,
        role_name=user.role.name,
        created_at=user.created_at
    )


@router.put("/{user_id}/reset-password")
def reset_user_password(
    user_id: int,
    password_data: UserResetPassword,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Resetea la contraseña de un usuario (solo admin).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Validar longitud de contraseña
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )
    
    user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada correctamente"}


@router.put("/{user_id}/toggle-active", response_model=UserResponse)
def toggle_user_active(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Activa/desactiva un usuario (solo admin).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # No permitir que el admin se desactive a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propia cuenta"
        )
    
    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        codigo=user.codigo,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        role_id=user.role_id,
        role_name=user.role.name,
        created_at=user.created_at
    )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un usuario (solo admin).
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # No permitir que el admin se elimine a sí mismo
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propia cuenta"
        )
    
    db.delete(user)
    db.commit()
    
    return None
