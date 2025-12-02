from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ClienteSimple(BaseModel):
    """Schema simple para mostrar cliente en producto."""
    id: int
    codigo: str
    nombre: str

    class Config:
        from_attributes = True


class ProductoBase(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=200)
    descripcion: Optional[str] = Field(None, max_length=500)
    
    # Formato de Lote (antes "código", ej: AF01-25)
    formato_lote: Optional[str] = Field(None, max_length=50)
    
    # Cliente asociado
    cliente_id: Optional[int] = Field(None)
    
    # Tipo de producto (ej: HERBICIDA GRUPO 4)
    tipo_producto: Optional[str] = Field(None, max_length=100)
    
    # Color de banda (ej: Amarilla, Roja, Verde, Azul)
    color_banda: Optional[str] = Field(None, max_length=50)
    
    # Código de producto externo/comercial (ej: 48387)
    codigo_producto: Optional[str] = Field(None, max_length=50)
    
    # Densidad
    densidad: Optional[float] = Field(None, ge=0)
    
    # Envases - Bidón
    bidon_proveedor: Optional[str] = Field(None, max_length=100)
    bidon_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Tapa
    tapa_proveedor: Optional[str] = Field(None, max_length=100)
    tapa_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Pallet
    pallet_proveedor: Optional[str] = Field(None, max_length=100)
    pallet_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Cobertor
    cobertor_proveedor: Optional[str] = Field(None, max_length=100)
    cobertor_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Funda/Etiqueta
    funda_etiqueta_proveedor: Optional[str] = Field(None, max_length=100)
    funda_etiqueta_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Esquinero
    esquinero_proveedor: Optional[str] = Field(None, max_length=100)
    esquinero_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Palletizado
    litros_por_pallet: Optional[int] = Field(None, ge=0)
    bidones_por_pallet: Optional[int] = Field(None, ge=0)
    bidones_por_piso: Optional[str] = Field(None, max_length=50)
    
    # Campos heredados
    unidad_medida: Optional[str] = Field("unidad", max_length=20)
    precio_unitario: Optional[float] = Field(0.0, ge=0)
    # Años de vencimiento para calcular fecha de vencimiento de lotes
    anos_vencimiento: Optional[int] = Field(2, ge=0, le=10)
    # Litros por unidad (para cálculo de litros totales en lotes)
    litros_por_unidad: Optional[float] = Field(1.0, ge=0)
    activo: bool = True


class ProductoCreate(ProductoBase):
    """Schema para crear producto - el código se genera automáticamente."""
    pass


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, max_length=200)
    descripcion: Optional[str] = Field(None, max_length=500)
    
    # Formato de Lote
    formato_lote: Optional[str] = Field(None, max_length=50)
    
    # Cliente asociado
    cliente_id: Optional[int] = Field(None)
    
    # Tipo de producto
    tipo_producto: Optional[str] = Field(None, max_length=100)
    
    # Color de banda
    color_banda: Optional[str] = Field(None, max_length=50)
    
    # Código de producto externo
    codigo_producto: Optional[str] = Field(None, max_length=50)
    
    # Densidad
    densidad: Optional[float] = Field(None, ge=0)
    
    # Envases - Bidón
    bidon_proveedor: Optional[str] = Field(None, max_length=100)
    bidon_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Tapa
    tapa_proveedor: Optional[str] = Field(None, max_length=100)
    tapa_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Pallet
    pallet_proveedor: Optional[str] = Field(None, max_length=100)
    pallet_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Cobertor
    cobertor_proveedor: Optional[str] = Field(None, max_length=100)
    cobertor_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Funda/Etiqueta
    funda_etiqueta_proveedor: Optional[str] = Field(None, max_length=100)
    funda_etiqueta_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Envases - Esquinero
    esquinero_proveedor: Optional[str] = Field(None, max_length=100)
    esquinero_descripcion: Optional[str] = Field(None, max_length=200)
    
    # Palletizado
    litros_por_pallet: Optional[int] = Field(None, ge=0)
    bidones_por_pallet: Optional[int] = Field(None, ge=0)
    bidones_por_piso: Optional[str] = Field(None, max_length=50)
    
    # Campos heredados
    unidad_medida: Optional[str] = Field(None, max_length=20)
    precio_unitario: Optional[float] = Field(None, ge=0)
    anos_vencimiento: Optional[int] = Field(None, ge=0, le=10)
    litros_por_unidad: Optional[float] = Field(None, ge=0)
    activo: Optional[bool] = None


class ProductoResponse(ProductoBase):
    id: int
    codigo: str
    cliente: Optional[ClienteSimple] = None
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
