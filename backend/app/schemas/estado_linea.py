from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class TipoEstadoEnum(str, Enum):
    """Tipos de estado disponibles para una línea."""
    PRODUCCION = "produccion"
    PARADA_PROGRAMADA = "parada_programada"
    PARADA_NO_PROGRAMADA = "parada_no_programada"
    MANTENIMIENTO = "mantenimiento"
    LIMPIEZA = "limpieza"
    CAMBIO_FORMATO = "cambio_formato"
    SIN_DEMANDA = "sin_demanda"
    OTRO = "otro"


# Diccionario para labels en español
TIPO_ESTADO_LABELS = {
    TipoEstadoEnum.PRODUCCION: "Producción",
    TipoEstadoEnum.PARADA_PROGRAMADA: "Parada Programada",
    TipoEstadoEnum.PARADA_NO_PROGRAMADA: "Parada No Programada",
    TipoEstadoEnum.MANTENIMIENTO: "Mantenimiento",
    TipoEstadoEnum.LIMPIEZA: "Limpieza",
    TipoEstadoEnum.CAMBIO_FORMATO: "Cambio de Formato",
    TipoEstadoEnum.SIN_DEMANDA: "Sin Demanda",
    TipoEstadoEnum.OTRO: "Otro",
}


class EstadoLineaBase(BaseModel):
    sector_id: int
    linea_id: int
    tipo_estado: TipoEstadoEnum
    fecha_hora_inicio: datetime
    fecha_hora_fin: Optional[datetime] = None
    duracion_minutos: Optional[int] = Field(None, ge=0)
    observaciones: Optional[str] = Field(None, max_length=1000)


class EstadoLineaCreate(EstadoLineaBase):
    pass


class EstadoLineaUpdate(BaseModel):
    sector_id: Optional[int] = None
    linea_id: Optional[int] = None
    tipo_estado: Optional[TipoEstadoEnum] = None
    fecha_hora_inicio: Optional[datetime] = None
    fecha_hora_fin: Optional[datetime] = None
    duracion_minutos: Optional[int] = Field(None, ge=0)
    observaciones: Optional[str] = Field(None, max_length=1000)
    activo: Optional[bool] = None


class SectorMinimal(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class LineaMinimal(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class UsuarioMinimal(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class EstadoLineaResponse(BaseModel):
    id: int
    sector_id: int
    linea_id: int
    tipo_estado: str
    tipo_estado_label: Optional[str] = None
    fecha_hora_inicio: datetime
    fecha_hora_fin: Optional[datetime] = None
    duracion_minutos: Optional[int] = None
    observaciones: Optional[str] = None
    usuario_id: Optional[int] = None
    activo: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    sector: Optional[SectorMinimal] = None
    linea: Optional[LineaMinimal] = None
    usuario: Optional[UsuarioMinimal] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_label(cls, obj):
        """Crea una instancia con el label del tipo de estado."""
        response = cls.model_validate(obj)
        try:
            tipo_enum = TipoEstadoEnum(obj.tipo_estado)
            response.tipo_estado_label = TIPO_ESTADO_LABELS.get(tipo_enum, obj.tipo_estado)
        except ValueError:
            response.tipo_estado_label = obj.tipo_estado
        return response


class EstadoLineaList(BaseModel):
    items: list[EstadoLineaResponse]
    total: int
    page: int
    size: int
    pages: int


class TipoEstadoOption(BaseModel):
    """Opción de tipo de estado para select en frontend."""
    value: str
    label: str
