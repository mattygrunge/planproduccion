import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import {
  estadosLineaApi,
  sectoresApi,
  lineasApi,
} from "../../api/api";
import type {
  EstadoLinea,
  EstadoLineaCreate,
  EstadoLineaUpdate,
  Sector,
  Linea,
  TipoEstadoOption,
  PaginatedResponse,
} from "../../api/api";
import "./AdminPages.css";

const EstadosLinea = () => {
  const [estados, setEstados] = useState<EstadoLinea[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [lineasFiltradas, setLineasFiltradas] = useState<Linea[]>([]);
  const [tiposEstado, setTiposEstado] = useState<TipoEstadoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 0,
  });

  // Filtros
  const [filterSector, setFilterSector] = useState<number | "">("");
  const [filterLinea, setFilterLinea] = useState<number | "">("");
  const [filterTipoEstado, setFilterTipoEstado] = useState<string>("");

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EstadoLinea | null>(null);
  const [formData, setFormData] = useState<EstadoLineaCreate>({
    sector_id: 0,
    linea_id: 0,
    tipo_estado: "",
    fecha_hora_inicio: "",
    fecha_hora_fin: "",
    duracion_minutos: undefined,
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Cargar datos iniciales
  const fetchInitialData = async () => {
    try {
      const [sectoresRes, lineasRes, tiposRes] = await Promise.all([
        sectoresApi.list({ size: 100, activo: true }),
        lineasApi.list({ size: 100, activo: true }),
        estadosLineaApi.getTiposEstado(),
      ]);
      setSectores(sectoresRes.items);
      setLineas(lineasRes.items);
      setTiposEstado(tiposRes);
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<EstadoLinea> = await estadosLineaApi.list({
        page: pagination.page,
        size: pagination.size,
        sector_id: filterSector || undefined,
        linea_id: filterLinea || undefined,
        tipo_estado: filterTipoEstado || undefined,
      });
      setEstados(response.items);
      setPagination((prev) => ({
        ...prev,
        total: response.total,
        pages: response.pages,
      }));
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar estados";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.page, filterSector, filterLinea, filterTipoEstado]);

  // Filtrar líneas según sector seleccionado
  useEffect(() => {
    if (filterSector) {
      setLineasFiltradas(lineas.filter((l) => l.sector_id === filterSector));
    } else {
      setLineasFiltradas(lineas);
    }
  }, [filterSector, lineas]);

  // Filtrar líneas en el formulario según sector seleccionado
  const getLineasForForm = () => {
    if (formData.sector_id) {
      return lineas.filter((l) => l.sector_id === formData.sector_id);
    }
    return [];
  };

  const handleFilterChange = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openCreateModal = () => {
    setEditingItem(null);
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData({
      sector_id: sectores.length > 0 ? sectores[0].id : 0,
      linea_id: 0,
      tipo_estado: tiposEstado.length > 0 ? tiposEstado[0].value : "",
      fecha_hora_inicio: localDateTime,
      fecha_hora_fin: "",
      duracion_minutos: undefined,
      observaciones: "",
    });
    setShowModal(true);
  };

  const openEditModal = (item: EstadoLinea) => {
    setEditingItem(item);
    const formatDateTime = (dateStr: string | null) => {
      if (!dateStr) return "";
      return new Date(dateStr).toISOString().slice(0, 16);
    };
    setFormData({
      sector_id: item.sector_id,
      linea_id: item.linea_id,
      tipo_estado: item.tipo_estado,
      fecha_hora_inicio: formatDateTime(item.fecha_hora_inicio),
      fecha_hora_fin: formatDateTime(item.fecha_hora_fin),
      duracion_minutos: item.duracion_minutos || undefined,
      observaciones: item.observaciones || "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend = {
        ...formData,
        fecha_hora_fin: formData.fecha_hora_fin || undefined,
        duracion_minutos: formData.duracion_minutos || undefined,
        observaciones: formData.observaciones || undefined,
      };

      if (editingItem) {
        const updateData: EstadoLineaUpdate = dataToSend;
        await estadosLineaApi.update(editingItem.id, updateData);
      } else {
        await estadosLineaApi.create(dataToSend);
      }
      closeModal();
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await estadosLineaApi.delete(id);
      setDeleteConfirm(null);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar";
      setError(errorMessage);
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuracion = (minutos: number | null) => {
    if (!minutos) return "-";
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`;
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><Activity className="title-icon" size={24} strokeWidth={1.5} /> Estados de Línea</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nuevo Estado
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-form">
          <select
            value={filterSector}
            onChange={(e) => {
              setFilterSector(e.target.value ? Number(e.target.value) : "");
              setFilterLinea("");
              handleFilterChange();
            }}
          >
            <option value="">Todos los sectores</option>
            {sectores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <select
            value={filterLinea}
            onChange={(e) => {
              setFilterLinea(e.target.value ? Number(e.target.value) : "");
              handleFilterChange();
            }}
          >
            <option value="">Todas las líneas</option>
            {lineasFiltradas.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
          <select
            value={filterTipoEstado}
            onChange={(e) => {
              setFilterTipoEstado(e.target.value);
              handleFilterChange();
            }}
          >
            <option value="">Todos los tipos</option>
            {tiposEstado.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sector</th>
                  <th>Línea</th>
                  <th>Tipo de Estado</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Duración</th>
                  <th>Observaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {estados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      No hay estados registrados
                    </td>
                  </tr>
                ) : (
                  estados.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.sector?.nombre || "-"}</td>
                      <td>{item.linea?.nombre || "-"}</td>
                      <td>
                        <span className={`badge badge-estado badge-${item.tipo_estado}`}>
                          {item.tipo_estado_label || item.tipo_estado}
                        </span>
                      </td>
                      <td>{formatDateTime(item.fecha_hora_inicio)}</td>
                      <td>{formatDateTime(item.fecha_hora_fin)}</td>
                      <td>{formatDuracion(item.duracion_minutos)}</td>
                      <td className="observaciones-cell">
                        {item.observaciones ? (
                          <span title={item.observaciones}>
                            {item.observaciones.substring(0, 30)}
                            {item.observaciones.length > 30 ? "..." : ""}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn btn-sm btn-edit"
                          onClick={() => openEditModal(item)}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setDeleteConfirm(item.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                Anterior
              </button>
              <span>
                Página {pagination.page} de {pagination.pages}
              </span>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h2>{editingItem ? "Editar Estado" : "Nuevo Estado"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="sector_id">Sector *</label>
                  <select
                    id="sector_id"
                    value={formData.sector_id}
                    onChange={(e) => {
                      const sectorId = Number(e.target.value);
                      setFormData({
                        ...formData,
                        sector_id: sectorId,
                        linea_id: 0,
                      });
                    }}
                    required
                  >
                    <option value="">Seleccionar sector...</option>
                    {sectores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="linea_id">Línea *</label>
                  <select
                    id="linea_id"
                    value={formData.linea_id}
                    onChange={(e) =>
                      setFormData({ ...formData, linea_id: Number(e.target.value) })
                    }
                    required
                    disabled={!formData.sector_id}
                  >
                    <option value="">Seleccionar línea...</option>
                    {getLineasForForm().map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="tipo_estado">Tipo de Estado *</label>
                <select
                  id="tipo_estado"
                  value={formData.tipo_estado}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo_estado: e.target.value })
                  }
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  {tiposEstado.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fecha_hora_inicio">Fecha/Hora Inicio *</label>
                  <input
                    type="datetime-local"
                    id="fecha_hora_inicio"
                    value={formData.fecha_hora_inicio}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_hora_inicio: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="fecha_hora_fin">Fecha/Hora Fin</label>
                  <input
                    type="datetime-local"
                    id="fecha_hora_fin"
                    value={formData.fecha_hora_fin}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_hora_fin: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="duracion_minutos">
                  Duración (minutos) - Se calcula automáticamente si hay fecha fin
                </label>
                <input
                  type="number"
                  id="duracion_minutos"
                  value={formData.duracion_minutos || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duracion_minutos: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min={0}
                  placeholder="Se calcula automáticamente"
                />
              </div>

              <div className="form-group">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  maxLength={1000}
                  rows={3}
                  placeholder="Detalles adicionales sobre el estado..."
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm !== null && (
        <div className="modal-overlay">
          <div className="modal modal-sm">
            <div className="modal-header">
              <h2>Confirmar Eliminación</h2>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar este estado?</p>
              <p className="text-muted">Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstadosLinea;
