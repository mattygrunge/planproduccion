from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class ClienteBase(BaseModel):
    codigo: str = Field(..., min_length=1, max_length=50)
    nombre: str = Field(..., min_length=1, max_length=200)
    razon_social: Optional[str] = Field(None, max_length=200)
    cuit: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = Field(None, max_length=300)
    telefono: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    contacto: Optional[str] = Field(None, max_length=100)
    activo: bool = True


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    codigo: Optional[str] = Field(None, min_length=1, max_length=50)
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    razon_social: Optional[str] = Field(None, max_length=200)
    cuit: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = Field(None, max_length=300)
    telefono: Optional[str] = Field(None, max_length=50)
    email: Optional[str] = Field(None, max_length=100)
    contacto: Optional[str] = Field(None, max_length=100)
    activo: Optional[bool] = None


class ClienteResponse(ClienteBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClienteList(BaseModel):
    items: list[ClienteResponse]
    total: int
    page: int
    size: int
    pages: int
