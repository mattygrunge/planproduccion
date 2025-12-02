from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import date, timedelta
from app.core.database import Base


class Lote(Base):
    """
    Modelo para gestionar lotes de producción.
    Un lote está asociado a un producto y opcionalmente a un estado de línea de tipo "Producción".
    """
    __tablename__ = "lotes"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True, nullable=False, index=True)
    
    # Número de lote (ej: "2024001", "L-001", etc.)
    numero_lote = Column(String(50), nullable=False, index=True)
    
    # Producto asociado al lote
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    
    # Estado de línea asociado (opcional, solo para estados tipo "produccion")
    estado_linea_id = Column(Integer, ForeignKey("estados_linea.id"), nullable=True)
    
    # Cantidades
    pallets = Column(Integer, nullable=True, default=0)
    parciales = Column(Integer, nullable=True, default=0)  # Unidades sueltas/parciales
    unidades_por_pallet = Column(Integer, nullable=True, default=1)  # Unidades por pallet
    
    # Litros totales (calculado automáticamente o manual)
    litros_totales = Column(Float, nullable=True, default=0.0)
    
    # Fechas
    fecha_produccion = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=True)  # Calculada automáticamente
    
    # Link a SENASA (trazabilidad)
    link_senasa = Column(String(500), nullable=True)
    
    # Observaciones
    observaciones = Column(Text, nullable=True)
    
    # Usuario que registró el lote
    usuario_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Campos de auditoría
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relaciones
    producto = relationship("Producto", back_populates="lotes")
    estado_linea = relationship("EstadoLinea", backref="lotes")
    usuario = relationship("User", backref="lotes_registrados")

    def __repr__(self):
        return f"<Lote {self.numero_lote} - Producto: {self.producto_id}>"

    def calcular_litros_totales(self, litros_por_unidad: float = 1.0) -> float:
        """
        Calcula los litros totales basándose en pallets, parciales y litros por unidad.
        Formula: (pallets * unidades_por_pallet + parciales) * litros_por_unidad
        """
        total_unidades = (self.pallets or 0) * (self.unidades_por_pallet or 1) + (self.parciales or 0)
        return total_unidades * litros_por_unidad

    @staticmethod
    def calcular_fecha_vencimiento(fecha_produccion: date, anos_vencimiento: int = 2) -> date:
        """
        Calcula la fecha de vencimiento sumando años de vencimiento a la fecha de producción.
        """
        # Usamos timedelta para mayor precisión (365 días * años)
        return fecha_produccion + timedelta(days=365 * anos_vencimiento)
