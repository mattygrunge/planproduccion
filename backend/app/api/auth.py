from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserResponse, UserProfileUpdate, PasswordChange

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Endpoint para iniciar sesión.
    Retorna un token JWT si las credenciales son correctas.
    """
    # Buscar usuario por username
    user = db.query(User).filter(User.username == user_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar contraseña
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verificar que el usuario esté activo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo"
        )
    
    # Crear token
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.name}
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Retorna la información del usuario autenticado.
    """
    return UserResponse(
        id=current_user.id,
        codigo=current_user.codigo,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        role_id=current_user.role_id,
        role_name=current_user.role.name,
        created_at=current_user.created_at
    )


@router.put("/me", response_model=UserResponse)
def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza la información del perfil del usuario autenticado.
    Permite cambiar username, email y nombre completo.
    """
    # Verificar si el username ya está en uso por otro usuario
    if profile_data.username and profile_data.username != current_user.username:
        existing_user = db.query(User).filter(
            User.username == profile_data.username,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya está en uso"
            )
        current_user.username = profile_data.username
    
    # Verificar si el email ya está en uso por otro usuario
    if profile_data.email and profile_data.email != current_user.email:
        existing_user = db.query(User).filter(
            User.email == profile_data.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está en uso por otro usuario"
            )
        current_user.email = profile_data.email
    
    # Actualizar nombre completo si se proporciona
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse(
        id=current_user.id,
        codigo=current_user.codigo,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        role_id=current_user.role_id,
        role_name=current_user.role.name,
        created_at=current_user.created_at
    )


@router.put("/me/password")
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cambia la contraseña del usuario autenticado.
    Requiere la contraseña actual y la nueva contraseña.
    """
    # Verificar que la contraseña actual sea correcta
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )
    
    # Verificar que la nueva contraseña y la confirmación coincidan
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña y la confirmación no coinciden"
        )
    
    # Verificar que la nueva contraseña sea diferente a la actual
    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe ser diferente a la actual"
        )
    
    # Verificar longitud mínima de la contraseña
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 6 caracteres"
        )
    
    # Actualizar la contraseña
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada correctamente"}
