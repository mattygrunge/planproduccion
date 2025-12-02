import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { clientesApi } from "../../api/api";
import type {
  Cliente,
  ClienteCreate,
  PaginatedResponse,
} from "../../api/api";
import "./AdminPages.css";

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteCreate>({
    nombre: "",
    razon_social: "",
    cuit: "",
    direccion: "",
    telefono: "",
    email: "",
    contacto: "",
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Cliente> = await clientesApi.list({
        page: pagination.page,
        size: pagination.size,
        search: search || undefined,
      });
      setClientes(response.items);
      setPagination((prev) => ({
        ...prev,
        total: response.total,
        pages: response.pages,
      }));
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar clientes";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      nombre: "",
      razon_social: "",
      cuit: "",
      direccion: "",
      telefono: "",
      email: "",
      contacto: "",
      activo: true,
    });
    setShowModal(true);
  };

  const openEditModal = (item: Cliente) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      razon_social: item.razon_social || "",
      cuit: item.cuit || "",
      direccion: item.direccion || "",
      telefono: item.telefono || "",
      email: item.email || "",
      contacto: item.contacto || "",
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
      // Preparar datos limpiando strings vacías para campos opcionales
      const cleanData: ClienteCreate = {
        nombre: formData.nombre,
        razon_social: formData.razon_social?.trim() || undefined,
        cuit: formData.cuit?.trim() || undefined,
        direccion: formData.direccion?.trim() || undefined,
        telefono: formData.telefono?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        contacto: formData.contacto?.trim() || undefined,
        activo: formData.activo,
      };

      if (editingItem) {
        await clientesApi.update(editingItem.id, cleanData);
      } else {
        await clientesApi.create(cleanData);
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
      await clientesApi.delete(id);
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
        <h1><Users className="title-icon" size={24} strokeWidth={1.5} /> Clientes</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nuevo Cliente
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
            placeholder="Buscar por código, nombre o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
                  <th>Código</th>
                  <th>Empresa</th>
                  <th>CUIT</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      No hay clientes registrados
                    </td>
                  </tr>
                ) : (
                  clientes.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.codigo}</strong></td>
                      <td>{item.nombre}</td>
                      <td>{item.cuit || "-"}</td>
                      <td>{item.telefono || "-"}</td>
                      <td>{item.email || "-"}</td>
                      <td>
                        <span
                          className={`badge ${item.activo ? "badge-success" : "badge-danger"}`}
                        >
                          {item.activo ? "Activo" : "Inactivo"}
                        </span>
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
              <h2>{editingItem ? "Editar Cliente" : "Nuevo Cliente"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre">Empresa *</label>
                  <input
                    type="text"
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                    maxLength={200}
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cuit">CUIT</label>
                  <input
                    type="text"
                    id="cuit"
                    value={formData.cuit}
                    onChange={(e) =>
                      setFormData({ ...formData, cuit: e.target.value })
                    }
                    maxLength={20}
                    placeholder="XX-XXXXXXXX-X"
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="razon_social">Razón Social</label>
                <input
                  type="text"
                  id="razon_social"
                  value={formData.razon_social}
                  onChange={(e) =>
                    setFormData({ ...formData, razon_social: e.target.value })
                  }
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                <input
                  type="text"
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  maxLength={300}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="text"
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="contacto">Contacto</label>
                  <input
                    type="text"
                    id="contacto"
                    value={formData.contacto}
                    onChange={(e) =>
                      setFormData({ ...formData, contacto: e.target.value })
                    }
                    maxLength={100}
                    placeholder="Nombre del contacto"
                  />
                </div>
                <div className="form-group checkbox-group" style={{ paddingTop: "2rem" }}>
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
              <p>¿Estás seguro de que deseas eliminar este cliente?</p>
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

export default Clientes;
