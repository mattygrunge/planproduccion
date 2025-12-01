import { useState, useEffect, useCallback } from "react";
import {
  lotesApi,
  productosApi,
} from "../../api/api";
import type {
  Lote,
  LoteCreate,
  LoteUpdate,
  LoteWarning,
  LoteResponseConAdvertencias,
  Producto,
  PaginatedResponse,
} from "../../api/api";
import "./AdminPages.css";

interface LoteFormData {
  numero_lote: string;
  producto_id: number | "";
  pallets: number;
  parciales: number;
  unidades_por_pallet: number;
  litros_totales: number | "";
  fecha_produccion: string;
  fecha_vencimiento: string;
  link_senasa: string;
  observaciones: string;
}

const initialFormData: LoteFormData = {
  numero_lote: "",
  producto_id: "",
  pallets: 0,
  parciales: 0,
  unidades_por_pallet: 1,
  litros_totales: "",
  fecha_produccion: new Date().toISOString().split("T")[0],
  fecha_vencimiento: "",
  link_senasa: "",
  observaciones: "",
};

export default function Lotes() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [filterProducto, setFilterProducto] = useState<number | "">("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [formData, setFormData] = useState<LoteFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  // Warning modal states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [currentWarnings, setCurrentWarnings] = useState<LoteWarning[]>([]);

  // Sugerencia de número de lote
  const [sugerenciaLote, setSugerenciaLote] = useState<string>("");

  // Cargar productos para el select
  const loadProductos = useCallback(async () => {
    try {
      const response = await productosApi.list({ size: 1000, activo: true });
      setProductos(response.items);
    } catch (err) {
      console.error("Error loading productos:", err);
    }
  }, []);

  // Cargar lotes
  const loadLotes = useCallback(async () => {
    try {
      setLoading(true);
      const params: { page: number; size: number; search?: string; producto_id?: number } = {
        page,
        size: 10,
      };
      if (search) params.search = search;
      if (filterProducto) params.producto_id = filterProducto;

      const response: PaginatedResponse<Lote> = await lotesApi.list(params);
      setLotes(response.items);
      setTotalPages(response.pages);
      setError(null);
    } catch (err) {
      setError("Error al cargar los lotes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterProducto]);

  useEffect(() => {
    loadProductos();
  }, [loadProductos]);

  useEffect(() => {
    loadLotes();
  }, [loadLotes]);

  // Cargar sugerencia de número de lote cuando cambia el producto
  const loadSugerenciaLote = async (productoId: number) => {
    try {
      const response = await lotesApi.sugerirNumeroLote(productoId);
      setSugerenciaLote(response.sugerencia);
      // Auto-rellenar si el campo está vacío
      if (!formData.numero_lote) {
        setFormData((prev) => ({ ...prev, numero_lote: response.sugerencia }));
      }
    } catch (err) {
      console.error("Error loading sugerencia:", err);
      setSugerenciaLote("");
    }
  };

  // Calcular fecha de vencimiento
  const calcularFechaVencimiento = (fechaProduccion: string, productoId: number | "") => {
    if (!fechaProduccion || !productoId) return "";
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return "";

    const fecha = new Date(fechaProduccion);
    const anosVencimiento = producto.anos_vencimiento || 2;
    fecha.setFullYear(fecha.getFullYear() + anosVencimiento);
    return fecha.toISOString().split("T")[0];
  };

  // Calcular litros totales
  const calcularLitrosTotales = (
    pallets: number,
    parciales: number,
    unidadesPorPallet: number,
    productoId: number | ""
  ): number => {
    if (!productoId) return 0;
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return 0;

    const totalUnidades = pallets * unidadesPorPallet + parciales;
    return totalUnidades * (producto.litros_por_unidad || 1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLotes();
  };

  const openCreateModal = () => {
    setModalMode("create");
    setSelectedLote(null);
    setFormData(initialFormData);
    setSugerenciaLote("");
    setShowModal(true);
  };

  const openEditModal = (lote: Lote) => {
    setModalMode("edit");
    setSelectedLote(lote);
    setFormData({
      numero_lote: lote.numero_lote,
      producto_id: lote.producto_id,
      pallets: lote.pallets,
      parciales: lote.parciales,
      unidades_por_pallet: lote.unidades_por_pallet,
      litros_totales: lote.litros_totales || "",
      fecha_produccion: lote.fecha_produccion,
      fecha_vencimiento: lote.fecha_vencimiento || "",
      link_senasa: lote.link_senasa || "",
      observaciones: lote.observaciones || "",
    });
    setSugerenciaLote("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLote(null);
    setFormData(initialFormData);
    setCurrentWarnings([]);
    setSugerenciaLote("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    let newValue: string | number = value;
    if (type === "number") {
      newValue = value === "" ? "" : Number(value);
    }

    const updatedFormData = { ...formData, [name]: newValue };

    // Si cambia el producto, cargar sugerencia y recalcular
    if (name === "producto_id" && value) {
      const productoId = Number(value);
      loadSugerenciaLote(productoId);
      // Recalcular fecha de vencimiento
      if (updatedFormData.fecha_produccion) {
        updatedFormData.fecha_vencimiento = calcularFechaVencimiento(
          updatedFormData.fecha_produccion,
          productoId
        );
      }
      // Recalcular litros
      updatedFormData.litros_totales = calcularLitrosTotales(
        updatedFormData.pallets,
        updatedFormData.parciales,
        updatedFormData.unidades_por_pallet,
        productoId
      );
    }

    // Si cambia la fecha de producción, recalcular vencimiento
    if (name === "fecha_produccion" && updatedFormData.producto_id) {
      updatedFormData.fecha_vencimiento = calcularFechaVencimiento(
        value,
        updatedFormData.producto_id as number
      );
    }

    // Si cambian pallets, parciales o unidades, recalcular litros
    if (["pallets", "parciales", "unidades_por_pallet"].includes(name)) {
      const pallets = name === "pallets" ? Number(value) || 0 : updatedFormData.pallets;
      const parciales = name === "parciales" ? Number(value) || 0 : updatedFormData.parciales;
      const unidades =
        name === "unidades_por_pallet" ? Number(value) || 1 : updatedFormData.unidades_por_pallet;
      updatedFormData.litros_totales = calcularLitrosTotales(
        pallets,
        parciales,
        unidades,
        updatedFormData.producto_id as number
      );
    }

    setFormData(updatedFormData);
  };

  const handleSubmit = async (e: React.FormEvent, ignorarAdvertencias: boolean = false) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSend: LoteCreate | LoteUpdate = {
        numero_lote: formData.numero_lote,
        producto_id: formData.producto_id as number,
        pallets: formData.pallets,
        parciales: formData.parciales,
        unidades_por_pallet: formData.unidades_por_pallet,
        litros_totales: formData.litros_totales || undefined,
        fecha_produccion: formData.fecha_produccion,
        fecha_vencimiento: formData.fecha_vencimiento || undefined,
        link_senasa: formData.link_senasa || undefined,
        observaciones: formData.observaciones || undefined,
        ignorar_advertencias: ignorarAdvertencias,
      };

      let response: LoteResponseConAdvertencias;

      if (modalMode === "create") {
        response = await lotesApi.create(dataToSend as LoteCreate);
      } else {
        response = await lotesApi.update(selectedLote!.id, dataToSend as LoteUpdate);
      }

      // Si hay advertencias y no se creó/actualizó, mostrar modal de advertencias
      if (response.advertencias.length > 0 && !response.creado) {
        setCurrentWarnings(response.advertencias);
        setShowWarningModal(true);
      } else {
        // Éxito
        closeModal();
        loadLotes();
        if (response.advertencias.length > 0) {
          alert(`${response.mensaje}\n\nAdvertencias ignoradas:\n${response.advertencias.map(w => `- ${w.mensaje}`).join('\n')}`);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error al guardar el lote";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmWithWarnings = async () => {
    setShowWarningModal(false);
    // Reenviar con ignorar_advertencias = true
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(fakeEvent, true);
  };

  const handleCancelWarnings = () => {
    setShowWarningModal(false);
    setCurrentWarnings([]);
  };

  const handleDelete = async (lote: Lote) => {
    if (!confirm(`¿Está seguro de eliminar el lote "${lote.numero_lote}"?`)) {
      return;
    }

    try {
      await lotesApi.delete(lote.id);
      loadLotes();
    } catch (err) {
      setError("Error al eliminar el lote");
      console.error(err);
    }
  };

  const usarSugerencia = () => {
    if (sugerenciaLote) {
      setFormData((prev) => ({ ...prev, numero_lote: sugerenciaLote }));
    }
  };

  // Obtener el label del tipo de advertencia
  const getWarningIcon = (tipo: string) => {
    switch (tipo) {
      case "lote_duplicado":
        return "⚠️";
      case "salto_lote":
        return "🔢";
      case "fecha_muy_antigua":
        return "📅";
      case "fecha_futura":
        return "🔮";
      default:
        return "⚠️";
    }
  };

  const getWarningColor = (tipo: string) => {
    switch (tipo) {
      case "lote_duplicado":
        return "#dc3545"; // rojo
      case "salto_lote":
        return "#fd7e14"; // naranja
      case "fecha_muy_antigua":
        return "#ffc107"; // amarillo
      case "fecha_futura":
        return "#17a2b8"; // azul
      default:
        return "#6c757d";
    }
  };

  if (loading && lotes.length === 0) {
    return <div className="admin-page">Cargando...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Lotes</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + Nuevo Lote
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filtros */}
      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Buscar por número de lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <select
            value={filterProducto}
            onChange={(e) => {
              setFilterProducto(e.target.value ? Number(e.target.value) : "");
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">Todos los productos</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} - {p.nombre}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary">
            Buscar
          </button>
        </form>
      </div>

      {/* Tabla de lotes */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nº Lote</th>
              <th>Producto</th>
              <th>Pallets</th>
              <th>Parciales</th>
              <th>Litros</th>
              <th>F. Producción</th>
              <th>F. Vencimiento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lotes.map((lote) => (
              <tr key={lote.id} className={!lote.activo ? "inactive-row" : ""}>
                <td>
                  <strong>{lote.numero_lote}</strong>
                </td>
                <td>
                  {lote.producto ? (
                    <span title={lote.producto.nombre}>
                      {lote.producto.codigo} - {lote.producto.nombre}
                    </span>
                  ) : (
                    <span className="text-muted">Sin producto</span>
                  )}
                </td>
                <td>{lote.pallets}</td>
                <td>{lote.parciales}</td>
                <td>{lote.litros_totales?.toFixed(2) || "-"}</td>
                <td>{new Date(lote.fecha_produccion).toLocaleDateString()}</td>
                <td>
                  {lote.fecha_vencimiento
                    ? new Date(lote.fecha_vencimiento).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openEditModal(lote)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    {lote.link_senasa && (
                      <a
                        href={lote.link_senasa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-info"
                        title="Ver en SENASA"
                      >
                        🔗
                      </a>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(lote)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <span>
            Página {page} de {totalPages}
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

      {/* Modal de creación/edición */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === "create" ? "Nuevo Lote" : "Editar Lote"}</h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={(e) => handleSubmit(e, false)}>
              <div className="modal-body">
                <div className="form-grid">
                  {/* Producto */}
                  <div className="form-group form-group-full">
                    <label htmlFor="producto_id">Producto *</label>
                    <select
                      id="producto_id"
                      name="producto_id"
                      value={formData.producto_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccione un producto</option>
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo} - {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Número de lote con sugerencia */}
                  <div className="form-group">
                    <label htmlFor="numero_lote">Número de Lote *</label>
                    <div className="input-with-suggestion">
                      <input
                        type="text"
                        id="numero_lote"
                        name="numero_lote"
                        value={formData.numero_lote}
                        onChange={handleInputChange}
                        required
                        maxLength={50}
                      />
                      {sugerenciaLote && formData.numero_lote !== sugerenciaLote && (
                        <button
                          type="button"
                          className="btn btn-sm btn-suggestion"
                          onClick={usarSugerencia}
                          title={`Usar sugerencia: ${sugerenciaLote}`}
                        >
                          💡 {sugerenciaLote}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Fecha de producción */}
                  <div className="form-group">
                    <label htmlFor="fecha_produccion">Fecha de Producción *</label>
                    <input
                      type="date"
                      id="fecha_produccion"
                      name="fecha_produccion"
                      value={formData.fecha_produccion}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  {/* Fecha de vencimiento */}
                  <div className="form-group">
                    <label htmlFor="fecha_vencimiento">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      id="fecha_vencimiento"
                      name="fecha_vencimiento"
                      value={formData.fecha_vencimiento}
                      onChange={handleInputChange}
                    />
                    <small className="form-hint">Se calcula automáticamente según el producto</small>
                  </div>

                  {/* Pallets */}
                  <div className="form-group">
                    <label htmlFor="pallets">Pallets</label>
                    <input
                      type="number"
                      id="pallets"
                      name="pallets"
                      value={formData.pallets}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  {/* Unidades por pallet */}
                  <div className="form-group">
                    <label htmlFor="unidades_por_pallet">Unidades/Pallet</label>
                    <input
                      type="number"
                      id="unidades_por_pallet"
                      name="unidades_por_pallet"
                      value={formData.unidades_por_pallet}
                      onChange={handleInputChange}
                      min="1"
                    />
                  </div>

                  {/* Parciales */}
                  <div className="form-group">
                    <label htmlFor="parciales">Parciales</label>
                    <input
                      type="number"
                      id="parciales"
                      name="parciales"
                      value={formData.parciales}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>

                  {/* Litros totales */}
                  <div className="form-group">
                    <label htmlFor="litros_totales">Litros Totales</label>
                    <input
                      type="number"
                      id="litros_totales"
                      name="litros_totales"
                      value={formData.litros_totales}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                    />
                    <small className="form-hint">Se calcula automáticamente</small>
                  </div>

                  {/* Link SENASA */}
                  <div className="form-group form-group-full">
                    <label htmlFor="link_senasa">Link SENASA</label>
                    <input
                      type="url"
                      id="link_senasa"
                      name="link_senasa"
                      value={formData.link_senasa}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="form-group form-group-full">
                    <label htmlFor="observaciones">Observaciones</label>
                    <textarea
                      id="observaciones"
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : modalMode === "create" ? "Crear" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de advertencias */}
      {showWarningModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-warning">
            <div className="modal-header warning-header">
              <h2>⚠️ Advertencias Detectadas</h2>
            </div>
            <div className="modal-body">
              <p className="warning-intro">
                Se han detectado las siguientes advertencias. ¿Desea continuar de todos modos?
              </p>
              <div className="warnings-list">
                {currentWarnings.map((warning, index) => (
                  <div
                    key={index}
                    className="warning-item"
                    style={{ borderLeftColor: getWarningColor(warning.tipo) }}
                  >
                    <div className="warning-icon">{getWarningIcon(warning.tipo)}</div>
                    <div className="warning-content">
                      <div className="warning-message">{warning.mensaje}</div>
                      {warning.detalle && (
                        <div className="warning-detail">{warning.detalle}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelWarnings}>
                Cancelar
              </button>
              <button
                className="btn btn-warning"
                onClick={handleConfirmWithWarnings}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Continuar de todos modos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
