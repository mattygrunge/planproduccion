from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LineaBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    sector_id: int
    activo: bool = True


class LineaCreate(LineaBase):
    pass


class LineaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=100)
    descripcion: Optional[str] = Field(None, max_length=255)
    sector_id: Optional[int] = None
    activo: Optional[bool] = None


class SectorMinimal(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class LineaResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    sector_id: int
    activo: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    sector: Optional[SectorMinimal] = None

    class Config:
        from_attributes = True


class LineaList(BaseModel):
    items: list[LineaResponse]
    total: int
    page: int
    size: int
    pages: int
