"""
API de Historial de Producción.

Este módulo implementa:
- Consulta de historial de lotes con filtros avanzados
- Exportación a CSV
- Estadísticas de producción
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_
from typing import Optional, List
from datetime import date, datetime
import csv
import io

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import Lote, Producto, User
from app.schemas.lote import LoteResponse, LoteList

router = APIRouter(prefix="/historial", tags=["Historial"])


# ============================================================================
# SCHEMAS ESPECÍFICOS DE HISTORIAL
# ============================================================================

from pydantic import BaseModel


class HistorialFiltros(BaseModel):
    """Filtros disponibles para el historial."""
    fecha_desde: Optional[date] = None
    fecha_hasta: Optional[date] = None
    producto_id: Optional[int] = None
    numero_lote: Optional[str] = None
    orden_campo: Optional[str] = "fecha_produccion"  # fecha_produccion, numero_lote, litros_totales
    orden_direccion: Optional[str] = "desc"  # asc, desc


class HistorialEstadisticas(BaseModel):
    """Estadísticas del historial filtrado."""
    total_lotes: int
    total_litros: float
    total_pallets: int
    total_parciales: int
    productos_unicos: int
    fecha_primer_lote: Optional[date] = None
    fecha_ultimo_lote: Optional[date] = None


class HistorialResponse(BaseModel):
    """Respuesta completa del historial."""
    items: List[LoteResponse]
    estadisticas: HistorialEstadisticas
    filtros_aplicados: dict
    total: int
    page: int
    size: int
    pages: int


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=HistorialResponse)
def get_historial(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    producto_id: Optional[int] = None,
    numero_lote: Optional[str] = None,
    orden_campo: str = Query("fecha_produccion", regex="^(fecha_produccion|numero_lote|litros_totales|created_at)$"),
    orden_direccion: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener historial de producción con filtros avanzados.
    
    Filtros disponibles:
    - fecha_desde: Fecha de producción desde (inclusive)
    - fecha_hasta: Fecha de producción hasta (inclusive)
    - producto_id: Filtrar por producto específico
    - numero_lote: Buscar por número de lote (parcial)
    
    Ordenamiento:
    - orden_campo: fecha_produccion, numero_lote, litros_totales, created_at
    - orden_direccion: asc (ascendente) o desc (descendente)
    """
    # Construir query base
    query = db.query(Lote).options(
        joinedload(Lote.producto),
        joinedload(Lote.estado_linea)
    ).filter(Lote.activo == True)
    
    # Aplicar filtros
    filtros_aplicados = {}
    
    if fecha_desde:
        query = query.filter(Lote.fecha_produccion >= fecha_desde)
        filtros_aplicados["fecha_desde"] = fecha_desde.isoformat()
    
    if fecha_hasta:
        query = query.filter(Lote.fecha_produccion <= fecha_hasta)
        filtros_aplicados["fecha_hasta"] = fecha_hasta.isoformat()
    
    if producto_id:
        query = query.filter(Lote.producto_id == producto_id)
        filtros_aplicados["producto_id"] = producto_id
    
    if numero_lote:
        query = query.filter(Lote.numero_lote.ilike(f"%{numero_lote}%"))
        filtros_aplicados["numero_lote"] = numero_lote
    
    # Calcular estadísticas antes de paginar
    stats_query = query.with_entities(
        func.count(Lote.id).label("total_lotes"),
        func.coalesce(func.sum(Lote.litros_totales), 0).label("total_litros"),
        func.coalesce(func.sum(Lote.pallets), 0).label("total_pallets"),
        func.coalesce(func.sum(Lote.parciales), 0).label("total_parciales"),
        func.count(func.distinct(Lote.producto_id)).label("productos_unicos"),
        func.min(Lote.fecha_produccion).label("fecha_primer_lote"),
        func.max(Lote.fecha_produccion).label("fecha_ultimo_lote")
    ).first()
    
    estadisticas = HistorialEstadisticas(
        total_lotes=stats_query.total_lotes or 0,
        total_litros=float(stats_query.total_litros or 0),
        total_pallets=int(stats_query.total_pallets or 0),
        total_parciales=int(stats_query.total_parciales or 0),
        productos_unicos=stats_query.productos_unicos or 0,
        fecha_primer_lote=stats_query.fecha_primer_lote,
        fecha_ultimo_lote=stats_query.fecha_ultimo_lote
    )
    
    # Aplicar ordenamiento
    orden_columna = getattr(Lote, orden_campo, Lote.fecha_produccion)
    if orden_direccion == "desc":
        query = query.order_by(desc(orden_columna))
    else:
        query = query.order_by(asc(orden_columna))
    
    # Contar total
    total = query.count()
    
    # Paginación
    pages = (total + size - 1) // size if total > 0 else 1
    offset = (page - 1) * size
    
    items = query.offset(offset).limit(size).all()
    
    return HistorialResponse(
        items=[LoteResponse.model_validate(item) for item in items],
        estadisticas=estadisticas,
        filtros_aplicados=filtros_aplicados,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


@router.get("/exportar/csv")
def exportar_historial_csv(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    producto_id: Optional[int] = None,
    numero_lote: Optional[str] = None,
    orden_campo: str = Query("fecha_produccion"),
    orden_direccion: str = Query("desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exportar historial a CSV.
    
    Devuelve un archivo CSV con todos los lotes que coincidan con los filtros.
    """
    # Construir query base
    query = db.query(Lote).options(
        joinedload(Lote.producto)
    ).filter(Lote.activo == True)
    
    # Aplicar filtros
    if fecha_desde:
        query = query.filter(Lote.fecha_produccion >= fecha_desde)
    
    if fecha_hasta:
        query = query.filter(Lote.fecha_produccion <= fecha_hasta)
    
    if producto_id:
        query = query.filter(Lote.producto_id == producto_id)
    
    if numero_lote:
        query = query.filter(Lote.numero_lote.ilike(f"%{numero_lote}%"))
    
    # Aplicar ordenamiento
    orden_columna = getattr(Lote, orden_campo, Lote.fecha_produccion)
    if orden_direccion == "desc":
        query = query.order_by(desc(orden_columna))
    else:
        query = query.order_by(asc(orden_columna))
    
    # Obtener todos los resultados (sin paginación)
    lotes = query.all()
    
    # Crear CSV en memoria
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    
    # Encabezados
    writer.writerow([
        "Nº Lote",
        "Producto Código",
        "Producto Nombre",
        "Pallets",
        "Parciales",
        "Unid/Pallet",
        "Litros Totales",
        "Fecha Producción",
        "Fecha Vencimiento",
        "Link SENASA",
        "Observaciones"
    ])
    
    # Datos
    for lote in lotes:
        writer.writerow([
            lote.numero_lote,
            lote.producto.codigo if lote.producto else "",
            lote.producto.nombre if lote.producto else "",
            lote.pallets,
            lote.parciales,
            lote.unidades_por_pallet,
            lote.litros_totales or 0,
            lote.fecha_produccion.isoformat() if lote.fecha_produccion else "",
            lote.fecha_vencimiento.isoformat() if lote.fecha_vencimiento else "",
            lote.link_senasa or "",
            lote.observaciones or ""
        ])
    
    # Preparar respuesta
    output.seek(0)
    
    # Generar nombre de archivo con fecha
    fecha_export = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"historial_produccion_{fecha_export}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/estadisticas")
def get_estadisticas_generales(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener estadísticas generales de producción.
    
    Devuelve estadísticas agregadas por producto.
    """
    # Construir query base
    query = db.query(Lote).filter(Lote.activo == True)
    
    # Aplicar filtros de fecha
    if fecha_desde:
        query = query.filter(Lote.fecha_produccion >= fecha_desde)
    
    if fecha_hasta:
        query = query.filter(Lote.fecha_produccion <= fecha_hasta)
    
    # Estadísticas generales
    stats_general = query.with_entities(
        func.count(Lote.id).label("total_lotes"),
        func.coalesce(func.sum(Lote.litros_totales), 0).label("total_litros"),
        func.coalesce(func.sum(Lote.pallets), 0).label("total_pallets"),
        func.coalesce(func.sum(Lote.parciales), 0).label("total_parciales")
    ).first()
    
    # Estadísticas por producto
    stats_por_producto = db.query(
        Producto.id,
        Producto.codigo,
        Producto.nombre,
        func.count(Lote.id).label("total_lotes"),
        func.coalesce(func.sum(Lote.litros_totales), 0).label("total_litros"),
        func.coalesce(func.sum(Lote.pallets), 0).label("total_pallets")
    ).join(
        Lote, Lote.producto_id == Producto.id
    ).filter(
        Lote.activo == True
    )
    
    if fecha_desde:
        stats_por_producto = stats_por_producto.filter(Lote.fecha_produccion >= fecha_desde)
    if fecha_hasta:
        stats_por_producto = stats_por_producto.filter(Lote.fecha_produccion <= fecha_hasta)
    
    stats_por_producto = stats_por_producto.group_by(
        Producto.id, Producto.codigo, Producto.nombre
    ).order_by(desc("total_litros")).all()
    
    return {
        "general": {
            "total_lotes": stats_general.total_lotes or 0,
            "total_litros": float(stats_general.total_litros or 0),
            "total_pallets": int(stats_general.total_pallets or 0),
            "total_parciales": int(stats_general.total_parciales or 0)
        },
        "por_producto": [
            {
                "producto_id": row.id,
                "producto_codigo": row.codigo,
                "producto_nombre": row.nombre,
                "total_lotes": row.total_lotes,
                "total_litros": float(row.total_litros),
                "total_pallets": int(row.total_pallets)
            }
            for row in stats_por_producto
        ],
        "filtros": {
            "fecha_desde": fecha_desde.isoformat() if fecha_desde else None,
            "fecha_hasta": fecha_hasta.isoformat() if fecha_hasta else None
        }
    }
