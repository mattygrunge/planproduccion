import { useState, useEffect } from "react";
import { productosApi } from "../../api/api";
import type {
  Producto,
  ProductoCreate,
  ProductoUpdate,
  PaginatedResponse,
} from "../../api/api";
import "./AdminPages.css";

const Productos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
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
  const [editingItem, setEditingItem] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<ProductoCreate>({
    codigo: "",
    nombre: "",
    descripcion: "",
    unidad_medida: "unidad",
    precio_unitario: 0,
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Producto> = await productosApi.list({
        page: pagination.page,
        size: pagination.size,
        search: search || undefined,
      });
      setProductos(response.items);
      setPagination((prev) => ({
        ...prev,
        total: response.total,
        pages: response.pages,
      }));
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar productos";
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
      codigo: "",
      nombre: "",
      descripcion: "",
      unidad_medida: "unidad",
      precio_unitario: 0,
      activo: true,
    });
    setShowModal(true);
  };

  const openEditModal = (item: Producto) => {
    setEditingItem(item);
    setFormData({
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      unidad_medida: item.unidad_medida || "unidad",
      precio_unitario: item.precio_unitario || 0,
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
        const updateData: ProductoUpdate = {
          codigo: formData.codigo,
          nombre: formData.nombre,
          descripcion: formData.descripcion || undefined,
          unidad_medida: formData.unidad_medida,
          precio_unitario: formData.precio_unitario,
          activo: formData.activo,
        };
        await productosApi.update(editingItem.id, updateData);
      } else {
        await productosApi.create(formData);
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
      await productosApi.delete(id);
      setDeleteConfirm(null);
      fetchData();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar";
      setError(errorMessage);
    }
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "-";
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>📦 Productos</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nuevo Producto
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
            placeholder="Buscar por código o nombre..."
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
                  <th>Nombre</th>
                  <th>Unidad</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      No hay productos registrados
                    </td>
                  </tr>
                ) : (
                  productos.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.codigo}</strong></td>
                      <td>{item.nombre}</td>
                      <td>{item.unidad_medida || "-"}</td>
                      <td>{formatPrice(item.precio_unitario)}</td>
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
              <h2>{editingItem ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button className="close-btn" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="codigo">Código *</label>
                  <input
                    type="text"
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo: e.target.value })
                    }
                    required
                    maxLength={50}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="unidad_medida">Unidad de Medida</label>
                  <select
                    id="unidad_medida"
                    value={formData.unidad_medida}
                    onChange={(e) =>
                      setFormData({ ...formData, unidad_medida: e.target.value })
                    }
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo</option>
                    <option value="lt">Litro</option>
                    <option value="mt">Metro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>
              </div>
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
                  maxLength={200}
                />
              </div>
              <div className="form-group">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  maxLength={500}
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="precio_unitario">Precio Unitario</label>
                  <input
                    type="number"
                    id="precio_unitario"
                    value={formData.precio_unitario}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_unitario: parseFloat(e.target.value) || 0,
                      })
                    }
                    min="0"
                    step="0.01"
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
              <p>¿Estás seguro de que deseas eliminar este producto?</p>
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

export default Productos;
