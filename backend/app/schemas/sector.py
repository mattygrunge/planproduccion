from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SectorBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    activo: bool = True


class SectorCreate(SectorBase):
    pass


class SectorUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    activo: Optional[bool] = None


class SectorResponse(SectorBase):
    id: int
    codigo: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SectorList(BaseModel):
    items: list[SectorResponse]
    total: int
    page: int
    size: int
    pages: int
