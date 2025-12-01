import { useState, useEffect } from "react";
import { lineasApi, sectoresApi } from "../../api/api";
import type {
  Linea,
  LineaCreate,
  LineaUpdate,
  Sector,
  PaginatedResponse,
} from "../../api/api";
import "./AdminPages.css";

const Lineas = () => {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [filterSector, setFilterSector] = useState<number | "">("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Linea | null>(null);
  const [formData, setFormData] = useState<LineaCreate>({
    nombre: "",
    descripcion: "",
    sector_id: 0,
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchSectores = async () => {
    try {
      const response = await sectoresApi.list({ size: 100, activo: true });
      setSectores(response.items);
    } catch (err) {
      console.error("Error al cargar sectores:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Linea> = await lineasApi.list({
        page: pagination.page,
        size: pagination.size,
        search: search || undefined,
        sector_id: filterSector || undefined,
      });
      setLineas(response.items);
      setPagination((prev) => ({
        ...prev,
        total: response.total,
        pages: response.pages,
      }));
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar líneas";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSectores();
  }, []);

  useEffect(() => {
    fetchData();
  }, [pagination.page, search, filterSector]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      nombre: "",
      descripcion: "",
      sector_id: sectores.length > 0 ? sectores[0].id : 0,
      activo: true,
    });
    setShowModal(true);
  };

  const openEditModal = (item: Linea) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      sector_id: item.sector_id,
      activo: item.activo,
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
      if (editingItem) {
        const updateData: LineaUpdate = {
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          sector_id: formData.sector_id,
          activo: formData.activo,
        };
        await lineasApi.update(editingItem.id, updateData);
      } else {
        await lineasApi.create(formData);
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
      await lineasApi.delete(id);
      setDeleteConfirm(null);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar";
      setError(errorMessage);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>🔗 Líneas</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nueva Línea
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={filterSector}
            onChange={(e) => setFilterSector(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">Todos los sectores</option>
            {sectores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <button type="submit">Buscar</button>
        </form>
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
                  <th>Nombre</th>
                  <th>Sector</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lineas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      No hay líneas registradas
                    </td>
                  </tr>
                ) : (
                  lineas.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.nombre}</td>
                      <td>{item.sector?.nombre || "-"}</td>
                      <td>{item.descripcion || "-"}</td>
                      <td>
                        <span
                          className={`badge ${item.activo ? "badge-success" : "badge-danger"}`}
                        >
                          {item.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn btn-sm btn-secondary"
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
          <div className="modal">
            <div className="modal-header">
              <h2>{editingItem ? "Editar Línea" : "Nueva Línea"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  required
                  maxLength={100}
                />
              </div>
              <div className="form-group">
                <label htmlFor="sector_id">Sector *</label>
                <select
                  id="sector_id"
                  value={formData.sector_id}
                  onChange={(e) =>
                    setFormData({ ...formData, sector_id: Number(e.target.value) })
                  }
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
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  maxLength={255}
                  rows={3}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) =>
                      setFormData({ ...formData, activo: e.target.checked })
                    }
                  />
                  Activo
                </label>
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
              <p>¿Estás seguro de que deseas eliminar esta línea?</p>
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

export default Lineas;
