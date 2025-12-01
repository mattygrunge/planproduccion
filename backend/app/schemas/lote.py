from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


class WarningType(str, Enum):
    """Tipos de advertencias para validación de lotes."""
    LOTE_DUPLICADO = "lote_duplicado"
    SALTO_LOTE = "salto_lote"
    FECHA_MUY_ANTIGUA = "fecha_muy_antigua"
    FECHA_FUTURA = "fecha_futura"


class LoteWarning(BaseModel):
    """Modelo para representar una advertencia de validación."""
    tipo: WarningType
    mensaje: str
    detalle: Optional[str] = None


class LoteBase(BaseModel):
    numero_lote: str = Field(..., min_length=1, max_length=50, description="Número de lote")
    producto_id: int = Field(..., gt=0, description="ID del producto asociado")
    estado_linea_id: Optional[int] = Field(None, description="ID del estado de línea (solo para producción)")
    pallets: Optional[int] = Field(0, ge=0, description="Cantidad de pallets")
    parciales: Optional[int] = Field(0, ge=0, description="Unidades parciales/sueltas")
    unidades_por_pallet: Optional[int] = Field(1, ge=1, description="Unidades por pallet")
    litros_totales: Optional[float] = Field(None, ge=0, description="Litros totales (calculado automáticamente si no se especifica)")
    fecha_produccion: date = Field(..., description="Fecha de producción")
    fecha_vencimiento: Optional[date] = Field(None, description="Fecha de vencimiento (calculada automáticamente si no se especifica)")
    link_senasa: Optional[str] = Field(None, max_length=500, description="Link al registro de SENASA")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    activo: bool = True


class LoteCreate(LoteBase):
    """Schema para crear un nuevo lote."""
    # Si ignora_advertencias es True, se crea el lote aunque haya advertencias
    ignorar_advertencias: bool = Field(False, description="Ignorar advertencias y crear el lote de todos modos")


class LoteUpdate(BaseModel):
    """Schema para actualizar un lote existente."""
    numero_lote: Optional[str] = Field(None, min_length=1, max_length=50)
    producto_id: Optional[int] = Field(None, gt=0)
    estado_linea_id: Optional[int] = None
    pallets: Optional[int] = Field(None, ge=0)
    parciales: Optional[int] = Field(None, ge=0)
    unidades_por_pallet: Optional[int] = Field(None, ge=1)
    litros_totales: Optional[float] = Field(None, ge=0)
    fecha_produccion: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    link_senasa: Optional[str] = Field(None, max_length=500)
    observaciones: Optional[str] = None
    activo: Optional[bool] = None
    ignorar_advertencias: bool = Field(False, description="Ignorar advertencias y actualizar el lote de todos modos")


class ProductoSimple(BaseModel):
    """Schema simplificado de Producto para respuestas de Lote."""
    id: int
    codigo: str
    nombre: str
    anos_vencimiento: Optional[int] = None
    litros_por_unidad: Optional[float] = None

    class Config:
        from_attributes = True


class EstadoLineaSimple(BaseModel):
    """Schema simplificado de EstadoLinea para respuestas de Lote."""
    id: int
    tipo_estado: str
    fecha_hora_inicio: Optional[datetime] = None

    class Config:
        from_attributes = True


class LoteResponse(LoteBase):
    """Schema de respuesta para un lote."""
    id: int
    usuario_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    producto: Optional[ProductoSimple] = None
    estado_linea: Optional[EstadoLineaSimple] = None

    class Config:
        from_attributes = True


class LoteResponseConAdvertencias(BaseModel):
    """Schema de respuesta que incluye advertencias de validación."""
    lote: Optional[LoteResponse] = None
    advertencias: List[LoteWarning] = []
    creado: bool = False
    mensaje: Optional[str] = None


class LoteList(BaseModel):
    """Schema para listado paginado de lotes."""
    items: List[LoteResponse]
    total: int
    page: int
    size: int
    pages: int


class ValidacionLoteRequest(BaseModel):
    """Schema para solicitar validación de un lote sin crearlo."""
    numero_lote: str = Field(..., min_length=1, max_length=50)
    producto_id: int = Field(..., gt=0)
    fecha_produccion: date


class ValidacionLoteResponse(BaseModel):
    """Schema de respuesta para validación de lote."""
    valido: bool
    advertencias: List[LoteWarning] = []
    lote_anterior: Optional[str] = None  # Número del lote anterior detectado
    lote_esperado: Optional[str] = None  # Número de lote esperado (si hay salto)
