from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductoBase(BaseModel):
    codigo: str = Field(..., min_length=1, max_length=50)
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: Optional[str] = Field(None, max_length=500)
    unidad_medida: Optional[str] = Field("unidad", max_length=20)
    precio_unitario: Optional[float] = Field(0.0, ge=0)
    # Años de vencimiento para calcular fecha de vencimiento de lotes
    anos_vencimiento: Optional[int] = Field(2, ge=0, le=10)
    # Litros por unidad (para cálculo de litros totales en lotes)
    litros_por_unidad: Optional[float] = Field(1.0, ge=0)
    activo: bool = True


class ProductoCreate(ProductoBase):
    pass


class ProductoUpdate(BaseModel):
    codigo: Optional[str] = Field(None, min_length=1, max_length=50)
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    descripcion: Optional[str] = Field(None, max_length=500)
    unidad_medida: Optional[str] = Field(None, max_length=20)
    precio_unitario: Optional[float] = Field(None, ge=0)
    anos_vencimiento: Optional[int] = Field(None, ge=0, le=10)
    litros_por_unidad: Optional[float] = Field(None, ge=0)
    activo: Optional[bool] = None


class ProductoResponse(ProductoBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProductoList(BaseModel):
    items: list[ProductoResponse]
    total: int
    page: int
    size: int
    pages: int
