"""
Schemas de Auditoría.
"""

from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime


class AuditLogResponse(BaseModel):
    """Response para un log de auditoría."""
    id: int
    usuario_id: Optional[int] = None
    usuario_username: Optional[str] = None
    accion: str
    entidad: str
    entidad_id: int
    entidad_descripcion: Optional[str] = None
    datos_anteriores: Optional[str] = None
    datos_nuevos: Optional[str] = None
    fecha_hora: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    
    # Labels para mostrar en el frontend
    accion_label: Optional[str] = None
    entidad_label: Optional[str] = None
    
    class Config:
        from_attributes = True


class AuditLogList(BaseModel):
    """Response paginada de logs de auditoría."""
    items: List[AuditLogResponse]
    total: int
    page: int
    size: int
    pages: int


class AuditLogFilters(BaseModel):
    """Filtros disponibles para buscar logs de auditoría."""
    acciones: List[str] = ["crear", "editar", "eliminar"]
    entidades: List[str] = ["producto", "lote", "usuario", "estado_linea", "sector", "linea", "cliente"]


# Labels para mostrar en el frontend
ACCION_LABELS = {
    "crear": "Creación",
    "editar": "Edición",
    "eliminar": "Eliminación"
}

ENTIDAD_LABELS = {
    "producto": "Producto",
    "lote": "Lote",
    "usuario": "Usuario",
    "estado_linea": "Estado de Línea",
    "sector": "Sector",
    "linea": "Línea",
    "cliente": "Cliente"
}
