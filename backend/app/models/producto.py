from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)  # Auto-generado: PD250001
    nombre = Column(String(200), nullable=False, index=True)
    descripcion = Column(String(500), nullable=True)
    
    # Formato de Lote (antes era "código" manual, ej: AF01-25)
    formato_lote = Column(String(50), nullable=True, index=True)
    
    # Cliente asociado
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    
    # Tipo de producto (ej: HERBICIDA GRUPO 4)
    tipo_producto = Column(String(100), nullable=True)
    
    # Color de banda (ej: Amarilla, Roja, Verde, Azul)
    color_banda = Column(String(50), nullable=True)
    
    # Código de producto (código externo/comercial, ej: 48387)
    codigo_producto = Column(String(50), nullable=True, index=True)
    
    # Densidad del producto
    densidad = Column(Float, nullable=True)
    
    # Envases - Bidón
    bidon_proveedor = Column(String(100), nullable=True)
    bidon_descripcion = Column(String(200), nullable=True)
    
    # Envases - Tapa
    tapa_proveedor = Column(String(100), nullable=True)
    tapa_descripcion = Column(String(200), nullable=True)
    
    # Envases - Pallet
    pallet_proveedor = Column(String(100), nullable=True)
    pallet_descripcion = Column(String(200), nullable=True)
    
    # Envases - Cobertor
    cobertor_proveedor = Column(String(100), nullable=True)
    cobertor_descripcion = Column(String(200), nullable=True)
    
    # Envases - Funda/Etiqueta
    funda_etiqueta_proveedor = Column(String(100), nullable=True)
    funda_etiqueta_descripcion = Column(String(200), nullable=True)
    
    # Envases - Esquinero
    esquinero_proveedor = Column(String(100), nullable=True)
    esquinero_descripcion = Column(String(200), nullable=True)
    
    # Palletizado
    litros_por_pallet = Column(Integer, nullable=True)  # ej: 960
    bidones_por_pallet = Column(Integer, nullable=True)  # ej: 48
    bidones_por_piso = Column(String(50), nullable=True)  # ej: "16 bidones x 3 filas"
    
    # Campos heredados (mantener compatibilidad)
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
    
    # Relación con cliente
    cliente = relationship("Cliente", backref="productos")

    def __repr__(self):
        return f"<Producto {self.codigo} - {self.nombre}>"
