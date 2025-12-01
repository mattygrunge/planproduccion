"""
Servicio de Auditoría.

Proporciona funciones para registrar acciones de auditoría
en la base de datos.
"""

from sqlalchemy.orm import Session
from typing import Optional, Any, Dict
from datetime import datetime
import json

from app.models.audit_log import AuditLog
from app.models.user import User


def _serialize_value(value: Any) -> Any:
    """Serializa un valor para poder guardarlo en JSON."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, 'isoformat'):  # date, time
        return value.isoformat()
    if hasattr(value, '__dict__'):
        # Es un objeto, intentar obtener sus atributos simples
        return str(value)
    return value


def _model_to_dict(obj: Any, exclude_fields: Optional[list] = None) -> Dict[str, Any]:
    """
    Convierte un modelo SQLAlchemy a diccionario.
    Excluye campos sensibles por defecto.
    """
    if obj is None:
        return {}
    
    exclude = exclude_fields or []
    # Siempre excluir campos sensibles
    exclude.extend(['hashed_password', '_sa_instance_state'])
    
    result = {}
    for column in obj.__table__.columns:
        if column.name not in exclude:
            value = getattr(obj, column.name)
            result[column.name] = _serialize_value(value)
    
    return result


def registrar_auditoria(
    db: Session,
    usuario: Optional[User],
    accion: str,
    entidad: str,
    entidad_id: int,
    entidad_descripcion: Optional[str] = None,
    datos_anteriores: Optional[Dict[str, Any]] = None,
    datos_nuevos: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    """
    Registra una acción de auditoría en la base de datos.
    
    Args:
        db: Sesión de base de datos
        usuario: Usuario que realiza la acción (puede ser None si es sistema)
        accion: Tipo de acción ('crear', 'editar', 'eliminar')
        entidad: Tipo de entidad afectada ('producto', 'lote', 'usuario', 'estado_linea')
        entidad_id: ID del registro afectado
        entidad_descripcion: Descripción legible del registro (ej: "Producto: CODIGO001")
        datos_anteriores: Diccionario con valores anteriores (para edición/eliminación)
        datos_nuevos: Diccionario con valores nuevos (para creación/edición)
        ip_address: Dirección IP del cliente
        user_agent: User-Agent del cliente
    
    Returns:
        El registro de auditoría creado
    """
    log = AuditLog(
        usuario_id=usuario.id if usuario else None,
        usuario_username=usuario.username if usuario else "sistema",
        accion=accion,
        entidad=entidad,
        entidad_id=entidad_id,
        entidad_descripcion=entidad_descripcion,
        datos_anteriores=json.dumps(datos_anteriores, ensure_ascii=False) if datos_anteriores else None,
        datos_nuevos=json.dumps(datos_nuevos, ensure_ascii=False) if datos_nuevos else None,
        fecha_hora=datetime.utcnow(),
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(log)
    # No hacemos commit aquí para que sea parte de la transacción principal
    # El commit se hará en el endpoint
    
    return log


def audit_crear(
    db: Session,
    usuario: User,
    entidad: str,
    registro: Any,
    descripcion: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    """
    Registra la creación de un registro.
    
    Args:
        db: Sesión de base de datos
        usuario: Usuario que realiza la acción
        entidad: Tipo de entidad ('producto', 'lote', etc.)
        registro: El objeto creado
        descripcion: Descripción opcional del registro
        ip_address: Dirección IP del cliente
        user_agent: User-Agent del cliente
    """
    datos_nuevos = _model_to_dict(registro)
    
    return registrar_auditoria(
        db=db,
        usuario=usuario,
        accion="crear",
        entidad=entidad,
        entidad_id=registro.id,
        entidad_descripcion=descripcion,
        datos_nuevos=datos_nuevos,
        ip_address=ip_address,
        user_agent=user_agent
    )


def audit_editar(
    db: Session,
    usuario: User,
    entidad: str,
    registro_anterior: Dict[str, Any],
    registro_nuevo: Any,
    descripcion: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    """
    Registra la edición de un registro.
    
    Args:
        db: Sesión de base de datos
        usuario: Usuario que realiza la acción
        entidad: Tipo de entidad ('producto', 'lote', etc.)
        registro_anterior: Diccionario con los valores anteriores
        registro_nuevo: El objeto después de la actualización
        descripcion: Descripción opcional del registro
        ip_address: Dirección IP del cliente
        user_agent: User-Agent del cliente
    """
    datos_nuevos = _model_to_dict(registro_nuevo)
    
    # Filtrar solo los campos que cambiaron
    cambios_anteriores = {}
    cambios_nuevos = {}
    
    for key, valor_nuevo in datos_nuevos.items():
        valor_anterior = registro_anterior.get(key)
        if valor_anterior != valor_nuevo:
            cambios_anteriores[key] = valor_anterior
            cambios_nuevos[key] = valor_nuevo
    
    return registrar_auditoria(
        db=db,
        usuario=usuario,
        accion="editar",
        entidad=entidad,
        entidad_id=registro_nuevo.id,
        entidad_descripcion=descripcion,
        datos_anteriores=cambios_anteriores if cambios_anteriores else registro_anterior,
        datos_nuevos=cambios_nuevos if cambios_nuevos else datos_nuevos,
        ip_address=ip_address,
        user_agent=user_agent
    )


def audit_eliminar(
    db: Session,
    usuario: User,
    entidad: str,
    registro: Any,
    descripcion: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> AuditLog:
    """
    Registra la eliminación de un registro.
    
    Args:
        db: Sesión de base de datos
        usuario: Usuario que realiza la acción
        entidad: Tipo de entidad ('producto', 'lote', etc.)
        registro: El objeto que será eliminado
        descripcion: Descripción opcional del registro
        ip_address: Dirección IP del cliente
        user_agent: User-Agent del cliente
    """
    datos_anteriores = _model_to_dict(registro)
    
    return registrar_auditoria(
        db=db,
        usuario=usuario,
        accion="eliminar",
        entidad=entidad,
        entidad_id=registro.id,
        entidad_descripcion=descripcion,
        datos_anteriores=datos_anteriores,
        ip_address=ip_address,
        user_agent=user_agent
    )


def get_client_info(request) -> tuple[Optional[str], Optional[str]]:
    """
    Extrae información del cliente desde el request.
    
    Returns:
        Tupla con (ip_address, user_agent)
    """
    ip_address = None
    user_agent = None
    
    if request:
        # Intentar obtener IP real (considerando proxies)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else None
        
        user_agent = request.headers.get("User-Agent")
    
    return ip_address, user_agent
