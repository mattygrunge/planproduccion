import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './AdminPages.css';
import './Auditoria.css';

interface AuditLog {
  id: number;
  usuario_id: number | null;
  usuario_username: string | null;
  accion: string;
  entidad: string;
  entidad_id: number;
  entidad_descripcion: string | null;
  datos_anteriores: string | null;
  datos_nuevos: string | null;
  fecha_hora: string;
  ip_address: string | null;
  user_agent: string | null;
  accion_label: string | null;
  entidad_label: string | null;
}

interface AuditLogList {
  items: AuditLog[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface AuditStats {
  total_logs: number;
  por_accion: { accion: string; accion_label: string; cantidad: number }[];
  por_entidad: { entidad: string; entidad_label: string; cantidad: number }[];
  por_usuario: { usuario: string; cantidad: number }[];
}

export default function Auditoria() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');
  
  // Detalle
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [page, filtroAccion, filtroEntidad, filtroBusqueda, filtroFechaDesde, filtroFechaHasta]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        size: '15',
      });
      
      if (filtroAccion) params.append('accion', filtroAccion);
      if (filtroEntidad) params.append('entidad', filtroEntidad);
      if (filtroBusqueda) params.append('search', filtroBusqueda);
      if (filtroFechaDesde) params.append('fecha_desde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fecha_hasta', filtroFechaHasta);

      const response = await fetch(`${API_URL}/api/auditoria?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los logs de auditoría');
      }

      const data: AuditLogList = await response.json();
      setLogs(data.items);
      setTotalPages(data.pages);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroFechaDesde) params.append('fecha_desde', filtroFechaDesde);
      if (filtroFechaHasta) params.append('fecha_hasta', filtroFechaHasta);

      const response = await fetch(`${API_URL}/api/auditoria/estadisticas?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getAccionClass = (accion: string) => {
    switch (accion) {
      case 'crear': return 'accion-crear';
      case 'editar': return 'accion-editar';
      case 'eliminar': return 'accion-eliminar';
      default: return '';
    }
  };

  const formatJSON = (jsonString: string | null) => {
    if (!jsonString) return null;
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonString;
    }
  };

  const clearFilters = () => {
    setFiltroAccion('');
    setFiltroEntidad('');
    setFiltroBusqueda('');
    setFiltroFechaDesde('');
    setFiltroFechaHasta('');
    setPage(1);
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setShowDetail(true);
  };

  return (
    <div className="admin-page auditoria-page">
      <div className="page-header">
        <h1><Shield className="title-icon" size={24} strokeWidth={1.5} /> Auditoría del Sistema</h1>
        <p className="page-description">
          Registro de todas las operaciones realizadas en el sistema (solo lectura)
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{stats.total_logs}</div>
            <div className="stat-label">Total de Registros</div>
          </div>
          {stats.por_accion.map((item) => (
            <div key={item.accion} className={`stat-card ${getAccionClass(item.accion)}`}>
              <div className="stat-value">{item.cantidad}</div>
              <div className="stat-label">{item.accion_label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Acción:</label>
          <select 
            value={filtroAccion} 
            onChange={(e) => { setFiltroAccion(e.target.value); setPage(1); }}
          >
            <option value="">Todas</option>
            <option value="crear">Creación</option>
            <option value="editar">Edición</option>
            <option value="eliminar">Eliminación</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Entidad:</label>
          <select 
            value={filtroEntidad} 
            onChange={(e) => { setFiltroEntidad(e.target.value); setPage(1); }}
          >
            <option value="">Todas</option>
            <option value="producto">Producto</option>
            <option value="lote">Lote</option>
            <option value="estado_linea">Estado de Línea</option>
            <option value="sector">Sector</option>
            <option value="linea">Línea</option>
            <option value="cliente">Cliente</option>
            <option value="usuario">Usuario</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Desde:</label>
          <input 
            type="date" 
            value={filtroFechaDesde}
            onChange={(e) => { setFiltroFechaDesde(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filter-group">
          <label>Hasta:</label>
          <input 
            type="date" 
            value={filtroFechaHasta}
            onChange={(e) => { setFiltroFechaHasta(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filter-group">
          <label>Buscar:</label>
          <input 
            type="text" 
            placeholder="Usuario o descripción..."
            value={filtroBusqueda}
            onChange={(e) => { setFiltroBusqueda(e.target.value); setPage(1); }}
          />
        </div>

        <button className="btn-clear-filters" onClick={clearFilters}>
          Limpiar filtros
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Cargando logs de auditoría...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="admin-table auditoria-table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Descripción</th>
                  <th>IP</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="no-data">
                      No se encontraron registros de auditoría
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="fecha-col">{formatDate(log.fecha_hora)}</td>
                      <td>{log.usuario_username || 'Sistema'}</td>
                      <td>
                        <span className={`accion-badge ${getAccionClass(log.accion)}`}>
                          {log.accion_label || log.accion}
                        </span>
                      </td>
                      <td>{log.entidad_label || log.entidad}</td>
                      <td className="descripcion-col">
                        {log.entidad_descripcion || `ID: ${log.entidad_id}`}
                      </td>
                      <td className="ip-col">{log.ip_address || '-'}</td>
                      <td>
                        <button 
                          className="btn-detail"
                          onClick={() => handleViewDetail(log)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="pagination">
            <span className="pagination-info">
              Mostrando {logs.length} de {total} registros
            </span>
            <div className="pagination-controls">
              <button 
                onClick={() => setPage(1)} 
                disabled={page === 1}
              >
                ««
              </button>
              <button 
                onClick={() => setPage(page - 1)} 
                disabled={page === 1}
              >
                «
              </button>
              <span className="page-info">
                Página {page} de {totalPages}
              </span>
              <button 
                onClick={() => setPage(page + 1)} 
                disabled={page === totalPages}
              >
                »
              </button>
              <button 
                onClick={() => setPage(totalPages)} 
                disabled={page === totalPages}
              >
                »»
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal de Detalle */}
      {showDetail && selectedLog && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content audit-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle del Registro de Auditoría</h2>
              <button className="modal-close" onClick={() => setShowDetail(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>ID:</label>
                  <span>{selectedLog.id}</span>
                </div>
                <div className="detail-item">
                  <label>Fecha/Hora:</label>
                  <span>{formatDate(selectedLog.fecha_hora)}</span>
                </div>
                <div className="detail-item">
                  <label>Usuario:</label>
                  <span>{selectedLog.usuario_username || 'Sistema'}</span>
                </div>
                <div className="detail-item">
                  <label>Acción:</label>
                  <span className={`accion-badge ${getAccionClass(selectedLog.accion)}`}>
                    {selectedLog.accion_label || selectedLog.accion}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Entidad:</label>
                  <span>{selectedLog.entidad_label || selectedLog.entidad}</span>
                </div>
                <div className="detail-item">
                  <label>ID Entidad:</label>
                  <span>{selectedLog.entidad_id}</span>
                </div>
                <div className="detail-item full-width">
                  <label>Descripción:</label>
                  <span>{selectedLog.entidad_descripcion || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>IP:</label>
                  <span>{selectedLog.ip_address || '-'}</span>
                </div>
                <div className="detail-item full-width">
                  <label>User Agent:</label>
                  <span className="user-agent">{selectedLog.user_agent || '-'}</span>
                </div>
              </div>

              {selectedLog.datos_anteriores && (
                <div className="json-section">
                  <h3>Datos Anteriores:</h3>
                  <pre className="json-display">
                    {formatJSON(selectedLog.datos_anteriores)}
                  </pre>
                </div>
              )}

              {selectedLog.datos_nuevos && (
                <div className="json-section">
                  <h3>Datos Nuevos:</h3>
                  <pre className="json-display">
                    {formatJSON(selectedLog.datos_nuevos)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
