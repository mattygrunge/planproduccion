import { useState, useEffect } from "react";
import { Package } from "lucide-react";
import { productosApi, clientesApi } from "../../api/api";
import type {
  Producto,
  ProductoCreate,
  ProductoUpdate,
  PaginatedResponse,
  Cliente,
} from "../../api/api";
import "./AdminPages.css";

// Opciones de colores de banda
const COLORES_BANDA = [
  "Amarilla",
  "Roja",
  "Verde",
  "Azul",
  "Naranja",
  "Blanca",
  "Negra",
];

const Productos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
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
  const [editingItem, setEditingItem] = useState<Producto | null>(null);
  const [formData, setFormData] = useState<ProductoCreate>({
    nombre: "",
    descripcion: "",
    formato_lote: "",
    cliente_id: undefined,
    tipo_producto: "",
    color_banda: "",
    codigo_producto: "",
    densidad: undefined,
    bidon_proveedor: "",
    bidon_descripcion: "",
    tapa_proveedor: "",
    tapa_descripcion: "",
    pallet_proveedor: "",
    pallet_descripcion: "",
    cobertor_proveedor: "",
    cobertor_descripcion: "",
    funda_etiqueta_proveedor: "",
    funda_etiqueta_descripcion: "",
    esquinero_proveedor: "",
    esquinero_descripcion: "",
    litros_por_pallet: undefined,
    bidones_por_pallet: undefined,
    bidones_por_piso: "",
    unidad_medida: "unidad",
    precio_unitario: 0,
    anos_vencimiento: 2,
    litros_por_unidad: 1,
    activo: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const fetchClientes = async () => {
    try {
      const response = await clientesApi.list({ size: 1000, activo: true });
      setClientes(response.items);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchClientes();
  }, [pagination.page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const getInitialFormData = (): ProductoCreate => ({
    nombre: "",
    descripcion: "",
    formato_lote: "",
    cliente_id: undefined,
    tipo_producto: "",
    color_banda: "",
    codigo_producto: "",
    densidad: undefined,
    bidon_proveedor: "",
    bidon_descripcion: "",
    tapa_proveedor: "",
    tapa_descripcion: "",
    pallet_proveedor: "",
    pallet_descripcion: "",
    cobertor_proveedor: "",
    cobertor_descripcion: "",
    funda_etiqueta_proveedor: "",
    funda_etiqueta_descripcion: "",
    esquinero_proveedor: "",
    esquinero_descripcion: "",
    litros_por_pallet: undefined,
    bidones_por_pallet: undefined,
    bidones_por_piso: "",
    unidad_medida: "unidad",
    precio_unitario: 0,
    anos_vencimiento: 2,
    litros_por_unidad: 1,
    activo: true,
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(getInitialFormData());
    setShowModal(true);
  };

  const openEditModal = (item: Producto) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre,
      descripcion: item.descripcion || "",
      formato_lote: item.formato_lote || "",
      cliente_id: item.cliente_id || undefined,
      tipo_producto: item.tipo_producto || "",
      color_banda: item.color_banda || "",
      codigo_producto: item.codigo_producto || "",
      densidad: item.densidad || undefined,
      bidon_proveedor: item.bidon_proveedor || "",
      bidon_descripcion: item.bidon_descripcion || "",
      tapa_proveedor: item.tapa_proveedor || "",
      tapa_descripcion: item.tapa_descripcion || "",
      pallet_proveedor: item.pallet_proveedor || "",
      pallet_descripcion: item.pallet_descripcion || "",
      cobertor_proveedor: item.cobertor_proveedor || "",
      cobertor_descripcion: item.cobertor_descripcion || "",
      funda_etiqueta_proveedor: item.funda_etiqueta_proveedor || "",
      funda_etiqueta_descripcion: item.funda_etiqueta_descripcion || "",
      esquinero_proveedor: item.esquinero_proveedor || "",
      esquinero_descripcion: item.esquinero_descripcion || "",
      litros_por_pallet: item.litros_por_pallet || undefined,
      bidones_por_pallet: item.bidones_por_pallet || undefined,
      bidones_por_piso: item.bidones_por_piso || "",
      unidad_medida: item.unidad_medida || "unidad",
      precio_unitario: item.precio_unitario || 0,
      anos_vencimiento: item.anos_vencimiento || 2,
      litros_por_unidad: item.litros_por_unidad || 1,
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
        const updateData: ProductoUpdate = { ...formData };
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
      setDeleteError(null);
      await productosApi.delete(id);
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
        <h1><Package className="title-icon" size={24} strokeWidth={1.5} /> Productos</h1>
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
            placeholder="Buscar por código, nombre, código producto..."
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
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Formato Lote</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-row">
                      No hay productos registrados
                    </td>
                  </tr>
                ) : (
                  productos.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.codigo}</strong></td>
                      <td>{item.nombre}</td>
                      <td>{item.cliente?.nombre || "-"}</td>
                      <td>{item.tipo_producto || "-"}</td>
                      <td>{item.formato_lote || "-"}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={pagination.page === 1} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}>
                Anterior
              </button>
              <span>Página {pagination.page} de {pagination.pages}</span>
              <button disabled={pagination.page === pagination.pages} onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}>
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
              <h2>{editingItem ? "Editar Producto" : "Nuevo Producto"}</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <h3 className="section-title">Información Básica</h3>
                
                <div className="form-group">
                  <label htmlFor="nombre">Nombre del Producto *</label>
                  <input type="text" id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required maxLength={200} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="formato_lote">Formato de Lote</label>
                    <input type="text" id="formato_lote" value={formData.formato_lote} onChange={(e) => setFormData({ ...formData, formato_lote: e.target.value })} placeholder="Ej: AF01-25" maxLength={50} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cliente_id">Cliente</label>
                    <select id="cliente_id" value={formData.cliente_id || ""} onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value ? parseInt(e.target.value) : undefined })}>
                      <option value="">-- Sin cliente --</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tipo_producto">Tipo de Producto</label>
                    <input type="text" id="tipo_producto" value={formData.tipo_producto} onChange={(e) => setFormData({ ...formData, tipo_producto: e.target.value })} placeholder="Ej: HERBICIDA GRUPO 4" maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="color_banda">Color de Banda</label>
                    <select id="color_banda" value={formData.color_banda} onChange={(e) => setFormData({ ...formData, color_banda: e.target.value })}>
                      <option value="">-- Seleccionar --</option>
                      {COLORES_BANDA.map((color) => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="codigo_producto">Código de Producto</label>
                    <input type="text" id="codigo_producto" value={formData.codigo_producto} onChange={(e) => setFormData({ ...formData, codigo_producto: e.target.value })} placeholder="Ej: 48387" maxLength={50} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="densidad">Densidad</label>
                    <input type="number" id="densidad" value={formData.densidad || ""} onChange={(e) => setFormData({ ...formData, densidad: e.target.value ? parseFloat(e.target.value) : undefined })} step="0.001" min="0" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea id="descripcion" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} maxLength={500} rows={2} />
                </div>

                <h3 className="section-title">Envases</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bidon_proveedor">Bidón - Proveedor</label>
                    <input type="text" id="bidon_proveedor" value={formData.bidon_proveedor} onChange={(e) => setFormData({ ...formData, bidon_proveedor: e.target.value })} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bidon_descripcion">Bidón - Descripción</label>
                    <input type="text" id="bidon_descripcion" value={formData.bidon_descripcion} onChange={(e) => setFormData({ ...formData, bidon_descripcion: e.target.value })} maxLength={200} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tapa_proveedor">Tapa - Proveedor</label>
                    <input type="text" id="tapa_proveedor" value={formData.tapa_proveedor} onChange={(e) => setFormData({ ...formData, tapa_proveedor: e.target.value })} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tapa_descripcion">Tapa - Descripción</label>
                    <input type="text" id="tapa_descripcion" value={formData.tapa_descripcion} onChange={(e) => setFormData({ ...formData, tapa_descripcion: e.target.value })} maxLength={200} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pallet_proveedor">Pallet - Proveedor</label>
                    <input type="text" id="pallet_proveedor" value={formData.pallet_proveedor} onChange={(e) => setFormData({ ...formData, pallet_proveedor: e.target.value })} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pallet_descripcion">Pallet - Descripción</label>
                    <input type="text" id="pallet_descripcion" value={formData.pallet_descripcion} onChange={(e) => setFormData({ ...formData, pallet_descripcion: e.target.value })} maxLength={200} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cobertor_proveedor">Cobertor - Proveedor</label>
                    <input type="text" id="cobertor_proveedor" value={formData.cobertor_proveedor} onChange={(e) => setFormData({ ...formData, cobertor_proveedor: e.target.value })} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cobertor_descripcion">Cobertor - Descripción</label>
                    <input type="text" id="cobertor_descripcion" value={formData.cobertor_descripcion} onChange={(e) => setFormData({ ...formData, cobertor_descripcion: e.target.value })} maxLength={200} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="funda_etiqueta_proveedor">Funda/Etiqueta - Proveedor</label>
                    <input type="text" id="funda_etiqueta_proveedor" value={formData.funda_etiqueta_proveedor} onChange={(e) => setFormData({ ...formData, funda_etiqueta_proveedor: e.target.value })} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="funda_etiqueta_descripcion">Funda/Etiqueta - Descripción</label>
                    <input type="text" id="funda_etiqueta_descripcion" value={formData.funda_etiqueta_descripcion} onChange={(e) => setFormData({ ...formData, funda_etiqueta_descripcion: e.target.value })} maxLength={200} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="esquinero_proveedor">Esquinero - Proveedor</label>
                    <input type="text" id="esquinero_proveedor" value={formData.esquinero_proveedor} onChange={(e) => setFormData({ ...formData, esquinero_proveedor: e.target.value })} maxLength={100} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="esquinero_descripcion">Esquinero - Descripción</label>
                    <input type="text" id="esquinero_descripcion" value={formData.esquinero_descripcion} onChange={(e) => setFormData({ ...formData, esquinero_descripcion: e.target.value })} maxLength={200} />
                  </div>
                </div>

                <h3 className="section-title">Palletizado</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="litros_por_pallet">Litros por Pallet</label>
                    <input type="number" id="litros_por_pallet" value={formData.litros_por_pallet || ""} onChange={(e) => setFormData({ ...formData, litros_por_pallet: e.target.value ? parseInt(e.target.value) : undefined })} min="0" placeholder="Ej: 960" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bidones_por_pallet">Bidones por Pallet</label>
                    <input type="number" id="bidones_por_pallet" value={formData.bidones_por_pallet || ""} onChange={(e) => setFormData({ ...formData, bidones_por_pallet: e.target.value ? parseInt(e.target.value) : undefined })} min="0" placeholder="Ej: 48" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="bidones_por_piso">Bidones por Piso</label>
                    <input type="text" id="bidones_por_piso" value={formData.bidones_por_piso} onChange={(e) => setFormData({ ...formData, bidones_por_piso: e.target.value })} placeholder="Ej: 16 bidones x 3 filas" maxLength={50} />
                  </div>
                </div>

                <h3 className="section-title">Configuración Adicional</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="unidad_medida">Unidad de Medida</label>
                    <select id="unidad_medida" value={formData.unidad_medida} onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}>
                      <option value="unidad">Unidad</option>
                      <option value="kg">Kilogramo</option>
                      <option value="lt">Litro</option>
                      <option value="mt">Metro</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="litros_por_unidad">Litros por Unidad</label>
                    <input type="number" id="litros_por_unidad" value={formData.litros_por_unidad} onChange={(e) => setFormData({ ...formData, litros_por_unidad: parseFloat(e.target.value) || 1 })} min="0" step="0.01" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="anos_vencimiento">Años de Vencimiento</label>
                    <input type="number" id="anos_vencimiento" value={formData.anos_vencimiento} onChange={(e) => setFormData({ ...formData, anos_vencimiento: parseInt(e.target.value) || 2 })} min="0" max="10" />
                  </div>
                  <div className="form-group checkbox-group" style={{ paddingTop: "2rem" }}>
                    <label>
                      <input type="checkbox" checked={formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} />
                      Activo
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
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
              {deleteError && (
                <div className="alert alert-error" style={{ marginTop: "1rem" }}>
                  {deleteError}
                </div>
              )}
              {!deleteError && <p className="text-muted">Esta acción no se puede deshacer.</p>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setDeleteConfirm(null); setDeleteError(null); }}>Cancelar</button>
              {!deleteError && (
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Eliminar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;
