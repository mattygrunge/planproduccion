from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    email: str  # Usar str en lugar de EmailStr para aceptar dominios locales
    username: str
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role_id: int


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    codigo: str
    is_active: bool
    role_id: int
    role_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Schema para actualizar el perfil del usuario."""
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None


class PasswordChange(BaseModel):
    """Schema para cambiar la contraseña."""
    current_password: str
    new_password: str
    confirm_password: str


class UserAdminCreate(BaseModel):
    """Schema para crear usuario desde panel admin."""
    email: str
    username: str
    password: str
    full_name: Optional[str] = None
    role_id: int
    is_active: bool = True


class UserAdminUpdate(BaseModel):
    """Schema para actualizar usuario desde panel admin."""
    email: Optional[str] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class UserResetPassword(BaseModel):
    """Schema para resetear contraseña de usuario (admin)."""
    new_password: str
