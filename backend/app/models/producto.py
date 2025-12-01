from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    descripcion = Column(String(500), nullable=True)
    unidad_medida = Column(String(20), nullable=True, default="unidad")
    precio_unitario = Column(Float, nullable=True, default=0.0)
    # Años de vencimiento para calcular fecha de vencimiento de lotes
    anos_vencimiento = Column(Integer, nullable=True, default=2)
    # Litros por unidad (para cálculo de litros totales en lotes)
    litros_por_unidad = Column(Float, nullable=True, default=1.0)
    activo = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación con lotes
    lotes = relationship("Lote", back_populates="producto")

    def __repr__(self):
        return f"<Producto {self.codigo} - {self.nombre}>"
