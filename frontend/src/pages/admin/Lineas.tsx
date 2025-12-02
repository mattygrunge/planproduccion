import { useState, useEffect, useMemo } from "react";
import { Link, ChevronDown, ChevronRight } from "lucide-react";
import { lineasApi, sectoresApi } from "../../api/api";
import type {
  Linea,
  LineaCreate,
  LineaUpdate,
  Sector,
  PaginatedResponse,
} from "../../api/api";
import "./AdminPages.css";

interface LineasPorSector {
  sector: Sector;
  lineas: Linea[];
}

const Lineas = () => {
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 100, // Aumentamos para traer todas las líneas
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
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Estados para sectores colapsados
  const [collapsedSectors, setCollapsedSectors] = useState<Set<number>>(new Set());

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

  // Agrupar líneas por sector
  const lineasAgrupadas = useMemo((): LineasPorSector[] => {
    const grupos: Map<number, Linea[]> = new Map();
    
    // Agrupar líneas por sector_id
    lineas.forEach((linea) => {
      const sectorId = linea.sector_id;
      if (!grupos.has(sectorId)) {
        grupos.set(sectorId, []);
      }
      grupos.get(sectorId)!.push(linea);
    });
    
    // Convertir a array ordenado por nombre del sector
    const resultado: LineasPorSector[] = [];
    sectores.forEach((sector) => {
      const lineasDelSector = grupos.get(sector.id);
      if (lineasDelSector && lineasDelSector.length > 0) {
        resultado.push({
          sector,
          lineas: lineasDelSector.sort((a, b) => a.nombre.localeCompare(b.nombre)),
        });
      }
    });
    
    // Agregar líneas sin sector asignado (si las hay)
    const lineasSinSector = lineas.filter(l => !sectores.find(s => s.id === l.sector_id));
    if (lineasSinSector.length > 0) {
      resultado.push({
        sector: { id: 0, nombre: "Sin Sector", descripcion: "", activo: true, codigo: "", created_at: "", updated_at: "" } as Sector,
        lineas: lineasSinSector,
      });
    }
    
    return resultado;
  }, [lineas, sectores]);

  const toggleSector = (sectorId: number) => {
    setCollapsedSectors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectorId)) {
        newSet.delete(sectorId);
      } else {
        newSet.add(sectorId);
      }
      return newSet;
    });
  };

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
      setDeleteError(null);
      await lineasApi.delete(id);
      setDeleteConfirm(null);
      fetchData();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        if (axiosError.response?.data?.detail) {
          setDeleteError(axiosError.response.data.detail);
          return;
        }
      }
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar";
      setDeleteError(errorMessage);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1><Link className="title-icon" size={24} strokeWidth={1.5} /> Líneas</h1>
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
          {lineasAgrupadas.length === 0 ? (
            <div className="table-container">
              <div className="empty-row" style={{ padding: "2rem", textAlign: "center" }}>
                No hay líneas registradas
              </div>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "140px" }}>Código</th>
                    <th style={{ width: "200px" }}>Nombre</th>
                    <th>Descripción</th>
                    <th style={{ width: "100px" }}>Estado</th>
                    <th style={{ width: "180px" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lineasAgrupadas.map((grupo) => (
                    <>
                      {/* Header de sector */}
                      <tr
                        key={`sector-${grupo.sector.id}`}
                        className="sector-header-row"
                        onClick={() => toggleSector(grupo.sector.id)}
                        style={{
                          background: "var(--color-background-dark)",
                          cursor: "pointer",
                        }}
                      >
                        <td colSpan={5} style={{ padding: "0.6rem 1rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-text)" }}>
                            {collapsedSectors.has(grupo.sector.id) ? (
                              <ChevronRight size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                            <span>{grupo.sector.nombre}</span>
                            <span style={{ opacity: 0.6, fontSize: "0.85em", marginLeft: "auto", fontWeight: 400 }}>
                              {grupo.lineas.length} línea{grupo.lineas.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {/* Líneas del sector */}
                      {!collapsedSectors.has(grupo.sector.id) && grupo.lineas.map((item) => (
                        <tr key={item.id}>
                          <td><strong>{item.codigo || `SN${item.id}`}</strong></td>
                          <td>{item.nombre}</td>
                          <td>{item.descripcion || "-"}</td>
                          <td>
                            <span className={`badge ${item.activo ? "badge-success" : "badge-danger"}`}>
                              {item.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(item)}>
                              Editar
                            </button>
                            <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm(item.id)}>
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
                  className="btn btn-outline"
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
              {deleteError && (
                <div className="alert alert-error" style={{ marginTop: "1rem" }}>
                  {deleteError}
                </div>
              )}
              {!deleteError && <p className="text-muted">Esta acción no se puede deshacer.</p>}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => { setDeleteConfirm(null); setDeleteError(null); }}
              >
                Cancelar
              </button>
              {!deleteError && (
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lineas;
