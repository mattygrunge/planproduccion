"""
Modelo de Log de Auditoría.

Registra todas las operaciones de creación, edición y eliminación
de las entidades principales del sistema.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.core.database import Base


class TipoAccion(enum.Enum):
    """Tipos de acciones que se pueden auditar."""
    CREAR = "crear"
    EDITAR = "editar"
    ELIMINAR = "eliminar"


class TipoEntidad(enum.Enum):
    """Tipos de entidades que se pueden auditar."""
    PRODUCTO = "producto"
    LOTE = "lote"
    USUARIO = "usuario"
    ESTADO_LINEA = "estado_linea"
    SECTOR = "sector"
    LINEA = "linea"
    CLIENTE = "cliente"


class AuditLog(Base):
    """
    Tabla de logs de auditoría.
    
    Registra:
    - Quién realizó la acción
    - Qué tipo de acción (crear, editar, eliminar)
    - Qué entidad fue afectada
    - Cuál fue el ID de la entidad
    - Detalles del cambio (valores anteriores y nuevos en JSON)
    - Cuándo se realizó la acción
    - IP desde donde se realizó (opcional)
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Usuario que realizó la acción
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    usuario_username = Column(String(100), nullable=True)  # Guardamos el username por si el usuario se elimina
    
    # Tipo de acción
    accion = Column(String(20), nullable=False)  # crear, editar, eliminar
    
    # Entidad afectada
    entidad = Column(String(50), nullable=False)  # producto, lote, usuario, estado_linea, etc.
    entidad_id = Column(Integer, nullable=False)  # ID del registro afectado
    entidad_descripcion = Column(String(255), nullable=True)  # Descripción legible (ej: "Producto: CODIGO001")
    
    # Detalles del cambio
    datos_anteriores = Column(Text, nullable=True)  # JSON con los valores anteriores (para edición/eliminación)
    datos_nuevos = Column(Text, nullable=True)  # JSON con los valores nuevos (para creación/edición)
    
    # Metadata
    fecha_hora = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv4 o IPv6
    user_agent = Column(String(255), nullable=True)
    
    # Relación con usuario
    usuario = relationship("User", backref="audit_logs")
    
    def __repr__(self):
        return f"<AuditLog {self.id}: {self.accion} {self.entidad} #{self.entidad_id} by {self.usuario_username}>"
