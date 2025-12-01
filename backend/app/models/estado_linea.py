from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class TipoEstado:
    """Tipos de estado disponibles para una línea."""
    PRODUCCION = "produccion"
    PARADA_PROGRAMADA = "parada_programada"
    PARADA_NO_PROGRAMADA = "parada_no_programada"
    MANTENIMIENTO = "mantenimiento"
    LIMPIEZA = "limpieza"
    CAMBIO_FORMATO = "cambio_formato"
    SIN_DEMANDA = "sin_demanda"
    OTRO = "otro"

    CHOICES = [
        PRODUCCION,
        PARADA_PROGRAMADA,
        PARADA_NO_PROGRAMADA,
        MANTENIMIENTO,
        LIMPIEZA,
        CAMBIO_FORMATO,
        SIN_DEMANDA,
        OTRO,
    ]

    LABELS = {
        PRODUCCION: "Producción",
        PARADA_PROGRAMADA: "Parada Programada",
        PARADA_NO_PROGRAMADA: "Parada No Programada",
        MANTENIMIENTO: "Mantenimiento",
        LIMPIEZA: "Limpieza",
        CAMBIO_FORMATO: "Cambio de Formato",
        SIN_DEMANDA: "Sin Demanda",
        OTRO: "Otro",
    }


class EstadoLinea(Base):
    __tablename__ = "estados_linea"

    id = Column(Integer, primary_key=True, index=True)
    
    # Relaciones con sector y línea
    sector_id = Column(Integer, ForeignKey("sectores.id"), nullable=False)
    linea_id = Column(Integer, ForeignKey("lineas.id"), nullable=False)
    
    # Tipo de estado
    tipo_estado = Column(String(50), nullable=False, index=True)
    
    # Fecha y hora del estado
    fecha_hora_inicio = Column(DateTime(timezone=True), nullable=False)
    fecha_hora_fin = Column(DateTime(timezone=True), nullable=True)
    
    # Duración en minutos (calculada o manual)
    duracion_minutos = Column(Integer, nullable=True)
    
    # Observaciones adicionales
    observaciones = Column(Text, nullable=True)
    
    # Usuario que registró el estado
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Campos de auditoría
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    sector = relationship("Sector", backref="estados_linea")
    linea = relationship("Linea", backref="estados_linea")
    usuario = relationship("User", backref="estados_linea_registrados")

    def __repr__(self):
        return f"<EstadoLinea {self.id} - {self.tipo_estado}>"
