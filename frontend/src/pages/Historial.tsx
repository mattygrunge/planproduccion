import { useState, useEffect, useCallback } from "react";
import { History, Download, Search } from "lucide-react";
import { historialApi, productosApi } from "../api/api";
import type {
  Lote,
  Producto,
  HistorialResponse,
  HistorialEstadisticas,
  HistorialParams,
} from "../api/api";
import "./Historial.css";

export default function Historial() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [estadisticas, setEstadisticas] = useState<HistorialEstadisticas | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");
  const [productoId, setProductoId] = useState<number | "">("");
  const [numeroLote, setNumeroLote] = useState<string>("");
  
  // Ordenamiento
  const [ordenCampo, setOrdenCampo] = useState<string>("fecha_produccion");
  const [ordenDireccion, setOrdenDireccion] = useState<string>("desc");

  // Cargar productos para el filtro
  const loadProductos = useCallback(async () => {
    try {
      const response = await productosApi.list({ size: 1000, activo: true });
      setProductos(response.items);
    } catch (err) {
      console.error("Error loading productos:", err);
    }
  }, []);

  // Construir parámetros de consulta
  const buildParams = useCallback((): HistorialParams => {
    const params: HistorialParams = {
      page,
      size: 20,
      orden_campo: ordenCampo,
      orden_direccion: ordenDireccion,
    };
    
    if (fechaDesde) params.fecha_desde = fechaDesde;
    if (fechaHasta) params.fecha_hasta = fechaHasta;
    if (productoId) params.producto_id = productoId;
    if (numeroLote) params.numero_lote = numeroLote;
    
    return params;
  }, [page, fechaDesde, fechaHasta, productoId, numeroLote, ordenCampo, ordenDireccion]);

  // Cargar historial
  const loadHistorial = useCallback(async () => {
    try {
      setLoading(true);
      const params = buildParams();
      const response: HistorialResponse = await historialApi.get(params);
      
      setLotes(response.items);
      setEstadisticas(response.estadisticas);
      setTotalPages(response.pages);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      setError("Error al cargar el historial");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  useEffect(() => {
    loadHistorial();
  }, [loadHistorial]);

  // Aplicar filtros
  const handleAplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadHistorial();
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFechaDesde("");
    setFechaHasta("");
    setProductoId("");
    setNumeroLote("");
    setOrdenCampo("fecha_produccion");
    setOrdenDireccion("desc");
    setPage(1);
  };

  // Cambiar orden
  const handleOrdenChange = (campo: string) => {
    if (ordenCampo === campo) {
      // Cambiar dirección si es el mismo campo
      setOrdenDireccion(ordenDireccion === "asc" ? "desc" : "asc");
    } else {
      // Nuevo campo, orden descendente por defecto
      setOrdenCampo(campo);
      setOrdenDireccion("desc");
    }
    setPage(1);
  };

  // Exportar a CSV
  const handleExportarCSV = async () => {
    try {
      setExporting(true);
      const params = buildParams();
      // Remover paginación para exportar todo
      delete params.page;
      delete params.size;
      
      const blob = await historialApi.exportarCSV(params);
      
      // Crear link de descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historial_produccion_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Error al exportar CSV");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  // Obtener icono de orden
  const getOrdenIcon = (campo: string) => {
    if (ordenCampo !== campo) return "↕️";
    return ordenDireccion === "asc" ? "⬆️" : "⬇️";
  };

  // Formatear número
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return "-";
    return num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="historial-page">
      <div className="historial-header">
        <h1><History className="title-icon" size={24} strokeWidth={1.5} /> Historial de Producción</h1>
        <button
          className="btn btn-export"
          onClick={handleExportarCSV}
          disabled={exporting || lotes.length === 0}
        >
          <Download size={16} strokeWidth={2} />
          {exporting ? "Exportando..." : "Exportar CSV"}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Panel de filtros */}
      <div className="filtros-panel">
        <h3><Search className="filter-icon" size={18} strokeWidth={1.5} /> Filtros</h3>
        <form onSubmit={handleAplicarFiltros} className="filtros-form">
          <div className="filtros-grid">
            <div className="filtro-group">
              <label>Fecha Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            
            <div className="filtro-group">
              <label>Fecha Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
            
            <div className="filtro-group">
              <label>Producto</label>
              <select
                value={productoId}
                onChange={(e) => setProductoId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Todos los productos</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="filtro-group">
              <label>Nº Lote</label>
              <input
                type="text"
                value={numeroLote}
                onChange={(e) => setNumeroLote(e.target.value)}
                placeholder="Buscar lote..."
              />
            </div>
          </div>
          
          <div className="filtros-actions">
            <button type="submit" className="btn btn-primary">
              Aplicar Filtros
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleLimpiarFiltros}>
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-panel">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.total_lotes}</div>
              <div className="stat-label">Lotes</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💧</div>
            <div className="stat-content">
              <div className="stat-value">{formatNumber(estadisticas.total_litros)}</div>
              <div className="stat-label">Litros Totales</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.total_pallets}</div>
              <div className="stat-label">Pallets</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏷️</div>
            <div className="stat-content">
              <div className="stat-value">{estadisticas.productos_unicos}</div>
              <div className="stat-label">Productos</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de historial */}
      <div className="table-container">
        {loading ? (
          <div className="loading">Cargando historial...</div>
        ) : lotes.length === 0 ? (
          <div className="empty-state">
            <p>No se encontraron lotes con los filtros seleccionados.</p>
          </div>
        ) : (
          <table className="historial-table">
            <thead>
              <tr>
                <th 
                  className="sortable" 
                  onClick={() => handleOrdenChange("numero_lote")}
                >
                  Nº Lote {getOrdenIcon("numero_lote")}
                </th>
                <th>Producto</th>
                <th>Pallets</th>
                <th>Parciales</th>
                <th 
                  className="sortable" 
                  onClick={() => handleOrdenChange("litros_totales")}
                >
                  Litros {getOrdenIcon("litros_totales")}
                </th>
                <th 
                  className="sortable" 
                  onClick={() => handleOrdenChange("fecha_produccion")}
                >
                  F. Producción {getOrdenIcon("fecha_produccion")}
                </th>
                <th>F. Vencimiento</th>
                <th>SENASA</th>
              </tr>
            </thead>
            <tbody>
              {lotes.map((lote) => (
                <tr key={lote.id}>
                  <td>
                    <strong>{lote.numero_lote}</strong>
                  </td>
                  <td>
                    {lote.producto ? (
                      <span title={lote.producto.nombre}>
                        {lote.producto.codigo}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="text-center">{lote.pallets}</td>
                  <td className="text-center">{lote.parciales}</td>
                  <td className="text-right">{formatNumber(lote.litros_totales)}</td>
                  <td>{new Date(lote.fecha_produccion).toLocaleDateString("es-AR")}</td>
                  <td>
                    {lote.fecha_vencimiento
                      ? new Date(lote.fecha_vencimiento).toLocaleDateString("es-AR")
                      : "-"}
                  </td>
                  <td className="text-center">
                    {lote.link_senasa ? (
                      <a
                        href={lote.link_senasa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-senasa"
                        title="Ver en SENASA"
                      >
                        🔗
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {page} de {totalPages} | {total} registros
          </span>
          <button
            className="btn btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
