"""
Utilidad para generación automática de IDs/códigos únicos.
Formato: PREFIJO + AÑO (2 dígitos) + SECUENCIA (4 dígitos)
Ejemplo: PD250001 (Producto, año 2025, secuencia 0001)
"""
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func


class TipoCodigo:
    """Prefijos para cada tipo de entidad."""
    PRODUCTO = "PD"
    SECTOR = "SC"
    LINEA = "LN"
    CLIENTE = "CL"
    ESTADO_LINEA = "EL"
    LOTE = "LT"
    USUARIO = "US"
    ROL = "RL"
    AUDIT_LOG = "AU"


def generar_codigo(
    db: Session,
    modelo,
    prefijo: str,
    campo_codigo: str = "codigo"
) -> str:
    """
    Genera un código único para una entidad.
    
    Args:
        db: Sesión de base de datos
        modelo: Modelo SQLAlchemy de la entidad
        prefijo: Prefijo del código (ej: "PD" para productos)
        campo_codigo: Nombre del campo que almacena el código (por defecto "codigo")
    
    Returns:
        Código único generado (ej: "PD250001")
    """
    # Obtener los últimos 2 dígitos del año actual
    ano_actual = datetime.now().year % 100  # Ej: 2025 -> 25
    ano_str = str(ano_actual).zfill(2)  # Asegurar 2 dígitos
    
    # Patrón de búsqueda: PREFIJO + AÑO + cualquier secuencia
    patron = f"{prefijo}{ano_str}%"
    
    # Obtener el campo de código del modelo
    campo = getattr(modelo, campo_codigo, None)
    
    if campo is None:
        raise ValueError(f"El modelo {modelo.__name__} no tiene el campo '{campo_codigo}'")
    
    # Buscar el último código del año actual
    ultimo_codigo = db.query(campo).filter(
        campo.like(patron)
    ).order_by(campo.desc()).first()
    
    if ultimo_codigo and ultimo_codigo[0]:
        # Extraer la secuencia del último código
        ultimo = ultimo_codigo[0]
        try:
            # La secuencia son los últimos 4 caracteres
            secuencia_actual = int(ultimo[-4:])
            nueva_secuencia = secuencia_actual + 1
        except (ValueError, IndexError):
            # Si hay error al parsear, empezar desde 1
            nueva_secuencia = 1
    else:
        # No hay códigos para este año, empezar desde 1
        nueva_secuencia = 1
    
    # Formatear la secuencia con 4 dígitos
    secuencia_str = str(nueva_secuencia).zfill(4)
    
    # Construir el código final
    codigo = f"{prefijo}{ano_str}{secuencia_str}"
    
    return codigo


def generar_codigo_producto(db: Session) -> str:
    """Genera código para Producto (PD + año + secuencia)."""
    from app.models.producto import Producto
    return generar_codigo(db, Producto, TipoCodigo.PRODUCTO, "codigo")


def generar_codigo_sector(db: Session) -> str:
    """Genera código para Sector (SC + año + secuencia)."""
    from app.models.sector import Sector
    return generar_codigo(db, Sector, TipoCodigo.SECTOR, "codigo")


def generar_codigo_linea(db: Session) -> str:
    """Genera código para Línea (LN + año + secuencia)."""
    from app.models.linea import Linea
    return generar_codigo(db, Linea, TipoCodigo.LINEA, "codigo")


def generar_codigo_cliente(db: Session) -> str:
    """Genera código para Cliente (CL + año + secuencia)."""
    from app.models.cliente import Cliente
    return generar_codigo(db, Cliente, TipoCodigo.CLIENTE, "codigo")


def generar_codigo_estado_linea(db: Session) -> str:
    """Genera código para Estado de Línea (EL + año + secuencia)."""
    from app.models.estado_linea import EstadoLinea
    return generar_codigo(db, EstadoLinea, TipoCodigo.ESTADO_LINEA, "codigo")


def generar_codigo_lote(db: Session) -> str:
    """Genera código para Lote (LT + año + secuencia)."""
    from app.models.lote import Lote
    return generar_codigo(db, Lote, TipoCodigo.LOTE, "codigo")


def generar_codigo_usuario(db: Session) -> str:
    """Genera código para Usuario (US + año + secuencia)."""
    from app.models.user import User
    return generar_codigo(db, User, TipoCodigo.USUARIO, "codigo")


def generar_codigo_rol(db: Session) -> str:
    """Genera código para Rol (RL + año + secuencia)."""
    from app.models.user import Role
    return generar_codigo(db, Role, TipoCodigo.ROL, "codigo")
