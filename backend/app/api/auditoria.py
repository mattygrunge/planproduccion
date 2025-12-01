"""
API de Auditoría.

Endpoint de solo lectura para consultar los logs de auditoría.
Solo accesible para administradores.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime, date
import math

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_active_admin
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.audit_log import (
    AuditLogResponse, 
    AuditLogList, 
    AuditLogFilters,
    ACCION_LABELS,
    ENTIDAD_LABELS
)

router = APIRouter(prefix="/auditoria", tags=["Auditoría"])


@router.get("/filtros", response_model=AuditLogFilters)
def obtener_filtros(
    current_user: User = Depends(get_current_active_admin)
):
    """
    Obtiene los filtros disponibles para la auditoría.
    Solo para administradores.
    """
    return AuditLogFilters()


@router.get("", response_model=AuditLogList)
def listar_logs(
    page: int = Query(1, ge=1, description="Número de página"),
    size: int = Query(20, ge=1, le=100, description="Tamaño de página"),
    accion: Optional[str] = Query(None, description="Filtrar por acción (crear, editar, eliminar)"),
    entidad: Optional[str] = Query(None, description="Filtrar por entidad"),
    usuario_id: Optional[int] = Query(None, description="Filtrar por usuario"),
    fecha_desde: Optional[date] = Query(None, description="Filtrar desde fecha"),
    fecha_hasta: Optional[date] = Query(None, description="Filtrar hasta fecha"),
    search: Optional[str] = Query(None, description="Buscar en descripción o username"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Lista los logs de auditoría con paginación y filtros.
    Solo para administradores (solo lectura).
    """
    query = db.query(AuditLog)
    
    # Filtros
    if accion:
        query = query.filter(AuditLog.accion == accion)
    if entidad:
        query = query.filter(AuditLog.entidad == entidad)
    if usuario_id:
        query = query.filter(AuditLog.usuario_id == usuario_id)
    if fecha_desde:
        query = query.filter(AuditLog.fecha_hora >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        query = query.filter(AuditLog.fecha_hora <= datetime.combine(fecha_hasta, datetime.max.time()))
    if search:
        query = query.filter(
            (AuditLog.entidad_descripcion.ilike(f"%{search}%")) |
            (AuditLog.usuario_username.ilike(f"%{search}%"))
        )
    
    # Contar total
    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 1
    
    # Paginación - ordenar por fecha más reciente primero
    offset = (page - 1) * size
    items = query.order_by(desc(AuditLog.fecha_hora)).offset(offset).limit(size).all()
    
    # Convertir a response con labels
    items_response = []
    for item in items:
        response = AuditLogResponse.model_validate(item)
        response.accion_label = ACCION_LABELS.get(item.accion, item.accion)
        response.entidad_label = ENTIDAD_LABELS.get(item.entidad, item.entidad)
        items_response.append(response)
    
    return AuditLogList(
        items=items_response,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/estadisticas")
def obtener_estadisticas(
    fecha_desde: Optional[date] = Query(None, description="Filtrar desde fecha"),
    fecha_hasta: Optional[date] = Query(None, description="Filtrar hasta fecha"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Obtiene estadísticas de auditoría.
    Solo para administradores.
    """
    from sqlalchemy import func
    
    query = db.query(AuditLog)
    
    if fecha_desde:
        query = query.filter(AuditLog.fecha_hora >= datetime.combine(fecha_desde, datetime.min.time()))
    if fecha_hasta:
        query = query.filter(AuditLog.fecha_hora <= datetime.combine(fecha_hasta, datetime.max.time()))
    
    # Estadísticas por acción
    stats_accion = query.with_entities(
        AuditLog.accion,
        func.count(AuditLog.id).label('cantidad')
    ).group_by(AuditLog.accion).all()
    
    # Estadísticas por entidad
    stats_entidad = query.with_entities(
        AuditLog.entidad,
        func.count(AuditLog.id).label('cantidad')
    ).group_by(AuditLog.entidad).all()
    
    # Estadísticas por usuario (top 10)
    stats_usuario = query.with_entities(
        AuditLog.usuario_username,
        func.count(AuditLog.id).label('cantidad')
    ).group_by(AuditLog.usuario_username).order_by(
        desc(func.count(AuditLog.id))
    ).limit(10).all()
    
    return {
        "total_logs": query.count(),
        "por_accion": [
            {"accion": a, "accion_label": ACCION_LABELS.get(a, a), "cantidad": c}
            for a, c in stats_accion
        ],
        "por_entidad": [
            {"entidad": e, "entidad_label": ENTIDAD_LABELS.get(e, e), "cantidad": c}
            for e, c in stats_entidad
        ],
        "por_usuario": [
            {"usuario": u or "sistema", "cantidad": c}
            for u, c in stats_usuario
        ]
    }


@router.get("/{log_id}", response_model=AuditLogResponse)
def obtener_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """
    Obtiene un log de auditoría por su ID.
    Solo para administradores.
    """
    from fastapi import HTTPException, status
    
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log de auditoría no encontrado"
        )
    
    response = AuditLogResponse.model_validate(log)
    response.accion_label = ACCION_LABELS.get(log.accion, log.accion)
    response.entidad_label = ENTIDAD_LABELS.get(log.entidad, log.entidad)
    
    return response
