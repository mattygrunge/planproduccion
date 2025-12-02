import axios from "axios";

// La URL de la API se configura desde variables de entorno
// En desarrollo: http://localhost:8000/api
// En producción: se configura con VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token a las requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  role_id: number;
  role_name: string;
  created_at: string;
}

export interface UserProfileUpdate {
  username?: string;
  email?: string;
  full_name?: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
}

export interface UserAdminCreate {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  role_id: number;
  is_active?: boolean;
}

export interface UserAdminUpdate {
  email?: string;
  username?: string;
  full_name?: string;
  role_id?: number;
  is_active?: boolean;
}

export interface UserResetPassword {
  new_password: string;
}

export interface UsersListParams {
  skip?: number;
  limit?: number;
  search?: string;
  is_active?: boolean;
  role_id?: number;
}

// Interfaces para Maestros
export interface Sector {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface SectorCreate {
  nombre: string;
  descripcion?: string;
  activo?: boolean;
}

export interface SectorUpdate {
  nombre?: string;
  descripcion?: string;
  activo?: boolean;
}

export interface Linea {
  id: number;
  nombre: string;
  descripcion: string | null;
  sector_id: number;
  activo: boolean;
  created_at: string | null;
  updated_at: string | null;
  sector?: { id: number; nombre: string };
}

export interface LineaCreate {
  nombre: string;
  descripcion?: string;
  sector_id: number;
  activo?: boolean;
}

export interface LineaUpdate {
  nombre?: string;
  descripcion?: string;
  sector_id?: number;
  activo?: boolean;
}

export interface ClienteSimple {
  id: number;
  codigo: string;
  nombre: string;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  // Formato de Lote (ej: AF01-25)
  formato_lote: string | null;
  // Cliente asociado
  cliente_id: number | null;
  cliente: ClienteSimple | null;
  // Tipo de producto (ej: HERBICIDA GRUPO 4)
  tipo_producto: string | null;
  // Color de banda (ej: Amarilla)
  color_banda: string | null;
  // Código de producto externo (ej: 48387)
  codigo_producto: string | null;
  // Densidad
  densidad: number | null;
  // Envases - Bidón
  bidon_proveedor: string | null;
  bidon_descripcion: string | null;
  // Envases - Tapa
  tapa_proveedor: string | null;
  tapa_descripcion: string | null;
  // Envases - Pallet
  pallet_proveedor: string | null;
  pallet_descripcion: string | null;
  // Envases - Cobertor
  cobertor_proveedor: string | null;
  cobertor_descripcion: string | null;
  // Envases - Funda/Etiqueta
  funda_etiqueta_proveedor: string | null;
  funda_etiqueta_descripcion: string | null;
  // Envases - Esquinero
  esquinero_proveedor: string | null;
  esquinero_descripcion: string | null;
  // Palletizado
  litros_por_pallet: number | null;
  bidones_por_pallet: number | null;
  bidones_por_piso: string | null;
  // Campos heredados
  unidad_medida: string | null;
  precio_unitario: number | null;
  anos_vencimiento: number | null;
  litros_por_unidad: number | null;
  activo: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ProductoCreate {
  nombre: string;
  descripcion?: string;
  formato_lote?: string;
  cliente_id?: number;
  tipo_producto?: string;
  color_banda?: string;
  codigo_producto?: string;
  densidad?: number;
  bidon_proveedor?: string;
  bidon_descripcion?: string;
  tapa_proveedor?: string;
  tapa_descripcion?: string;
  pallet_proveedor?: string;
  pallet_descripcion?: string;
  cobertor_proveedor?: string;
  cobertor_descripcion?: string;
  funda_etiqueta_proveedor?: string;
  funda_etiqueta_descripcion?: string;
  esquinero_proveedor?: string;
  esquinero_descripcion?: string;
  litros_por_pallet?: number;
  bidones_por_pallet?: number;
  bidones_por_piso?: string;
  unidad_medida?: string;
  precio_unitario?: number;
  anos_vencimiento?: number;
  litros_por_unidad?: number;
  activo?: boolean;
}

export interface ProductoUpdate {
  nombre?: string;
  descripcion?: string;
  formato_lote?: string;
  cliente_id?: number;
  tipo_producto?: string;
  color_banda?: string;
  codigo_producto?: string;
  densidad?: number;
  bidon_proveedor?: string;
  bidon_descripcion?: string;
  tapa_proveedor?: string;
  tapa_descripcion?: string;
  pallet_proveedor?: string;
  pallet_descripcion?: string;
  cobertor_proveedor?: string;
  cobertor_descripcion?: string;
  funda_etiqueta_proveedor?: string;
  funda_etiqueta_descripcion?: string;
  esquinero_proveedor?: string;
  esquinero_descripcion?: string;
  litros_por_pallet?: number;
  bidones_por_pallet?: number;
  bidones_por_piso?: string;
  unidad_medida?: string;
  precio_unitario?: number;
  anos_vencimiento?: number;
  litros_por_unidad?: number;
  activo?: boolean;
}

export interface Cliente {
  id: number;
  codigo: string;
  nombre: string;
  razon_social: string | null;
  cuit: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  contacto: string | null;
  activo: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClienteCreate {
  codigo: string;
  nombre: string;
  razon_social?: string;
  cuit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo?: boolean;
}

export interface ClienteUpdate {
  codigo?: string;
  nombre?: string;
  razon_social?: string;
  cuit?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  contacto?: string;
  activo?: boolean;
}

// Interfaces para Estados de Línea
export interface TipoEstadoOption {
  value: string;
  label: string;
}

export interface EstadoLinea {
  id: number;
  sector_id: number;
  linea_id: number;
  tipo_estado: string;
  tipo_estado_label: string | null;
  fecha_hora_inicio: string;
  fecha_hora_fin: string | null;
  duracion_minutos: number | null;
  observaciones: string | null;
  usuario_id: number | null;
  activo: boolean;
  created_at: string | null;
  updated_at: string | null;
  sector?: { id: number; nombre: string } | null;
  linea?: { id: number; nombre: string } | null;
  usuario?: { id: number; username: string; full_name: string | null } | null;
}

export interface EstadoLineaCreate {
  sector_id: number;
  linea_id: number;
  tipo_estado: string;
  fecha_hora_inicio: string;
  fecha_hora_fin?: string;
  duracion_minutos?: number;
  observaciones?: string;
}

export interface EstadoLineaUpdate {
  sector_id?: number;
  linea_id?: number;
  tipo_estado?: string;
  fecha_hora_inicio?: string;
  fecha_hora_fin?: string;
  duracion_minutos?: number;
  observaciones?: string;
  activo?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ListParams {
  page?: number;
  size?: number;
  search?: string;
  activo?: boolean;
}

export interface EstadoLineaListParams extends ListParams {
  sector_id?: number;
  linea_id?: number;
  tipo_estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

// Interfaces para Timeline
export interface TimelineEstado {
  id: number;
  sector_id: number;
  linea_id: number;
  tipo_estado: string;
  tipo_estado_label: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string | null;
  duracion_minutos: number | null;
  observaciones: string | null;
  sector: { id: number; nombre: string } | null;
  linea: { id: number; nombre: string } | null;
  usuario: { id: number; username: string; full_name: string | null } | null;
}

export interface TimelineLinea {
  id: number;
  nombre: string;
  estados: TimelineEstado[];
}

export interface TimelineSector {
  id: number;
  nombre: string;
  lineas: TimelineLinea[];
}

export interface TimelineResponse {
  fecha: string;
  sectores: TimelineSector[];
  estados: TimelineEstado[];
  tipos_estado: TipoEstadoOption[];
}

export interface TimelineParams {
  sector_id?: number;
  linea_id?: number;
}

// Interfaces para Lotes
export type WarningType = 'lote_duplicado' | 'salto_lote' | 'fecha_muy_antigua' | 'fecha_futura';

export interface LoteWarning {
  tipo: WarningType;
  mensaje: string;
  detalle: string | null;
}

export interface ProductoSimple {
  id: number;
  codigo: string;
  nombre: string;
  anos_vencimiento: number | null;
  litros_por_unidad: number | null;
}

export interface EstadoLineaSimple {
  id: number;
  tipo_estado: string;
  fecha_hora_inicio: string | null;
}

export interface Lote {
  id: number;
  numero_lote: string;
  producto_id: number;
  estado_linea_id: number | null;
  pallets: number;
  parciales: number;
  unidades_por_pallet: number;
  litros_totales: number | null;
  fecha_produccion: string;
  fecha_vencimiento: string | null;
  link_senasa: string | null;
  observaciones: string | null;
  usuario_id: number | null;
  activo: boolean;
  created_at: string | null;
  updated_at: string | null;
  producto: ProductoSimple | null;
  estado_linea: EstadoLineaSimple | null;
}

export interface LoteCreate {
  numero_lote: string;
  producto_id: number;
  estado_linea_id?: number;
  pallets?: number;
  parciales?: number;
  unidades_por_pallet?: number;
  litros_totales?: number;
  fecha_produccion: string;
  fecha_vencimiento?: string;
  link_senasa?: string;
  observaciones?: string;
  activo?: boolean;
  ignorar_advertencias?: boolean;
}

export interface LoteUpdate {
  numero_lote?: string;
  producto_id?: number;
  estado_linea_id?: number;
  pallets?: number;
  parciales?: number;
  unidades_por_pallet?: number;
  litros_totales?: number;
  fecha_produccion?: string;
  fecha_vencimiento?: string;
  link_senasa?: string;
  observaciones?: string;
  activo?: boolean;
  ignorar_advertencias?: boolean;
}

export interface LoteResponseConAdvertencias {
  lote: Lote | null;
  advertencias: LoteWarning[];
  creado: boolean;
  mensaje: string | null;
}

export interface ValidacionLoteRequest {
  numero_lote: string;
  producto_id: number;
  fecha_produccion: string;
}

export interface ValidacionLoteResponse {
  valido: boolean;
  advertencias: LoteWarning[];
  lote_anterior: string | null;
  lote_esperado: string | null;
}

export interface SugerenciaNumeroLote {
  sugerencia: string;
  ultimo_lote: string | null;
  mensaje: string;
}

export interface LoteListParams extends ListParams {
  producto_id?: number;
  estado_linea_id?: number;
}

// Funciones de autenticación
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", credentials);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>("/auth/me");
    return response.data;
  },

  updateProfile: async (data: UserProfileUpdate): Promise<User> => {
    const response = await api.put<User>("/auth/me", data);
    return response.data;
  },

  changePassword: async (data: PasswordChange): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>("/auth/me/password", data);
    return response.data;
  },
};

// Funciones para Sectores
export const sectoresApi = {
  list: async (params?: ListParams): Promise<PaginatedResponse<Sector>> => {
    const response = await api.get<PaginatedResponse<Sector>>("/sectores", { params });
    return response.data;
  },

  get: async (id: number): Promise<Sector> => {
    const response = await api.get<Sector>(`/sectores/${id}`);
    return response.data;
  },

  create: async (data: SectorCreate): Promise<Sector> => {
    const response = await api.post<Sector>("/sectores", data);
    return response.data;
  },

  update: async (id: number, data: SectorUpdate): Promise<Sector> => {
    const response = await api.put<Sector>(`/sectores/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/sectores/${id}`);
  },
};

// Funciones para Líneas
export const lineasApi = {
  list: async (params?: ListParams & { sector_id?: number }): Promise<PaginatedResponse<Linea>> => {
    const response = await api.get<PaginatedResponse<Linea>>("/lineas", { params });
    return response.data;
  },

  get: async (id: number): Promise<Linea> => {
    const response = await api.get<Linea>(`/lineas/${id}`);
    return response.data;
  },

  create: async (data: LineaCreate): Promise<Linea> => {
    const response = await api.post<Linea>("/lineas", data);
    return response.data;
  },

  update: async (id: number, data: LineaUpdate): Promise<Linea> => {
    const response = await api.put<Linea>(`/lineas/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/lineas/${id}`);
  },
};

// Funciones para Productos
export const productosApi = {
  list: async (params?: ListParams): Promise<PaginatedResponse<Producto>> => {
    const response = await api.get<PaginatedResponse<Producto>>("/productos", { params });
    return response.data;
  },

  get: async (id: number): Promise<Producto> => {
    const response = await api.get<Producto>(`/productos/${id}`);
    return response.data;
  },

  create: async (data: ProductoCreate): Promise<Producto> => {
    const response = await api.post<Producto>("/productos", data);
    return response.data;
  },

  update: async (id: number, data: ProductoUpdate): Promise<Producto> => {
    const response = await api.put<Producto>(`/productos/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/productos/${id}`);
  },
};

// Funciones para Clientes
export const clientesApi = {
  list: async (params?: ListParams): Promise<PaginatedResponse<Cliente>> => {
    const response = await api.get<PaginatedResponse<Cliente>>("/clientes", { params });
    return response.data;
  },

  get: async (id: number): Promise<Cliente> => {
    const response = await api.get<Cliente>(`/clientes/${id}`);
    return response.data;
  },

  create: async (data: ClienteCreate): Promise<Cliente> => {
    const response = await api.post<Cliente>("/clientes", data);
    return response.data;
  },

  update: async (id: number, data: ClienteUpdate): Promise<Cliente> => {
    const response = await api.put<Cliente>(`/clientes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clientes/${id}`);
  },
};

// Funciones para Estados de Línea
export const estadosLineaApi = {
  list: async (params?: EstadoLineaListParams): Promise<PaginatedResponse<EstadoLinea>> => {
    const response = await api.get<PaginatedResponse<EstadoLinea>>("/estados-linea", { params });
    return response.data;
  },

  get: async (id: number): Promise<EstadoLinea> => {
    const response = await api.get<EstadoLinea>(`/estados-linea/${id}`);
    return response.data;
  },

  create: async (data: EstadoLineaCreate): Promise<EstadoLinea> => {
    const response = await api.post<EstadoLinea>("/estados-linea", data);
    return response.data;
  },

  update: async (id: number, data: EstadoLineaUpdate): Promise<EstadoLinea> => {
    const response = await api.put<EstadoLinea>(`/estados-linea/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/estados-linea/${id}`);
  },

  getTiposEstado: async (): Promise<TipoEstadoOption[]> => {
    const response = await api.get<TipoEstadoOption[]>("/estados-linea/tipos-estado");
    return response.data;
  },

  getTimeline: async (fecha: string, params?: TimelineParams): Promise<TimelineResponse> => {
    const response = await api.get<TimelineResponse>(`/estados-linea/timeline/${fecha}`, { params });
    return response.data;
  },
};

// Funciones para Lotes
export const lotesApi = {
  list: async (params?: LoteListParams): Promise<PaginatedResponse<Lote>> => {
    const response = await api.get<PaginatedResponse<Lote>>("/lotes", { params });
    return response.data;
  },

  get: async (id: number): Promise<Lote> => {
    const response = await api.get<Lote>(`/lotes/${id}`);
    return response.data;
  },

  create: async (data: LoteCreate): Promise<LoteResponseConAdvertencias> => {
    const response = await api.post<LoteResponseConAdvertencias>("/lotes", data);
    return response.data;
  },

  update: async (id: number, data: LoteUpdate): Promise<LoteResponseConAdvertencias> => {
    const response = await api.put<LoteResponseConAdvertencias>(`/lotes/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/lotes/${id}`);
  },

  validar: async (data: ValidacionLoteRequest): Promise<ValidacionLoteResponse> => {
    const response = await api.post<ValidacionLoteResponse>("/lotes/validar", data);
    return response.data;
  },

  getUltimoLoteProducto: async (productoId: number): Promise<Lote | null> => {
    const response = await api.get<Lote | null>(`/lotes/producto/${productoId}/ultimo`);
    return response.data;
  },

  sugerirNumeroLote: async (productoId: number): Promise<SugerenciaNumeroLote> => {
    const response = await api.get<SugerenciaNumeroLote>(`/lotes/producto/${productoId}/sugerir-numero`);
    return response.data;
  },
};

// Interfaces para Historial
export interface HistorialEstadisticas {
  total_lotes: number;
  total_litros: number;
  total_pallets: number;
  total_parciales: number;
  productos_unicos: number;
  fecha_primer_lote: string | null;
  fecha_ultimo_lote: string | null;
}

export interface HistorialResponse {
  items: Lote[];
  estadisticas: HistorialEstadisticas;
  filtros_aplicados: Record<string, string | number>;
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface HistorialParams {
  page?: number;
  size?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  producto_id?: number;
  numero_lote?: string;
  orden_campo?: string;
  orden_direccion?: string;
}

export interface EstadisticasPorProducto {
  producto_id: number;
  producto_codigo: string;
  producto_nombre: string;
  total_lotes: number;
  total_litros: number;
  total_pallets: number;
}

export interface EstadisticasGenerales {
  general: {
    total_lotes: number;
    total_litros: number;
    total_pallets: number;
    total_parciales: number;
  };
  por_producto: EstadisticasPorProducto[];
  filtros: {
    fecha_desde: string | null;
    fecha_hasta: string | null;
  };
}

// Funciones para Usuarios (Admin)
export const usersApi = {
  list: async (params?: UsersListParams): Promise<User[]> => {
    const response = await api.get<User[]>("/users", { params });
    return response.data;
  },

  get: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  create: async (data: UserAdminCreate): Promise<User> => {
    const response = await api.post<User>("/users", data);
    return response.data;
  },

  update: async (id: number, data: UserAdminUpdate): Promise<User> => {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  resetPassword: async (id: number, data: UserResetPassword): Promise<{ message: string }> => {
    const response = await api.put<{ message: string }>(`/users/${id}/reset-password`, data);
    return response.data;
  },

  toggleActive: async (id: number): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/toggle-active`);
    return response.data;
  },

  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>("/users/roles");
    return response.data;
  },
};

// Funciones para Historial
export const historialApi = {
  get: async (params?: HistorialParams): Promise<HistorialResponse> => {
    const response = await api.get<HistorialResponse>("/historial", { params });
    return response.data;
  },

  exportarCSV: async (params?: HistorialParams): Promise<Blob> => {
    const response = await api.get("/historial/exportar/csv", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  getEstadisticas: async (params?: { fecha_desde?: string; fecha_hasta?: string }): Promise<EstadisticasGenerales> => {
    const response = await api.get<EstadisticasGenerales>("/historial/estadisticas", { params });
    return response.data;
  },
};

export default api;
