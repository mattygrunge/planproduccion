import { useState, useEffect } from "react";
import { usersApi } from "../../api/api";
import type { User, Role, UserAdminCreate, UserAdminUpdate } from "../../api/api";
import { useAuth } from "../../hooks/useAuth";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Key,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import "./AdminPages.css";
import "./Usuarios.css";

const Usuarios = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "reset-password">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [formData, setFormData] = useState<UserAdminCreate>({
    email: "",
    username: "",
    password: "",
    full_name: "",
    role_id: 1,
    is_active: true,
  });
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Message states
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, rolesData] = await Promise.all([
        usersApi.list(),
        usersApi.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage({ type: "error", text: "Error al cargar los datos" });
    } finally {
      setLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(search.toLowerCase()));
    
    const matchesActive =
      filterActive === "all" ||
      (filterActive === "active" && user.is_active) ||
      (filterActive === "inactive" && !user.is_active);
    
    const matchesRole =
      filterRole === "all" || user.role_id === parseInt(filterRole);
    
    return matchesSearch && matchesActive && matchesRole;
  });

  // Open create modal
  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      email: "",
      username: "",
      password: "",
      full_name: "",
      role_id: roles.length > 0 ? roles[0].id : 1,
      is_active: true,
    });
    setFormError(null);
    setFormSuccess(null);
    setShowPassword(false);
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      email: user.email,
      username: user.username,
      password: "",
      full_name: user.full_name || "",
      role_id: user.role_id,
      is_active: user.is_active,
    });
    setFormError(null);
    setFormSuccess(null);
    setShowModal(true);
  };

  // Open reset password modal
  const openResetPasswordModal = (user: User) => {
    setModalMode("reset-password");
    setSelectedUser(user);
    setNewPassword("");
    setFormError(null);
    setFormSuccess(null);
    setShowPassword(false);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setFormError(null);
    setFormSuccess(null);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      if (modalMode === "create") {
        await usersApi.create(formData);
        setFormSuccess("Usuario creado correctamente");
        setTimeout(() => {
          closeModal();
          loadData();
        }, 1500);
      } else if (modalMode === "edit" && selectedUser) {
        const updateData: UserAdminUpdate = {
          email: formData.email,
          username: formData.username,
          full_name: formData.full_name,
          role_id: formData.role_id,
          is_active: formData.is_active,
        };
        await usersApi.update(selectedUser.id, updateData);
        setFormSuccess("Usuario actualizado correctamente");
        setTimeout(() => {
          closeModal();
          loadData();
        }, 1500);
      } else if (modalMode === "reset-password" && selectedUser) {
        await usersApi.resetPassword(selectedUser.id, { new_password: newPassword });
        setFormSuccess("Contraseña restablecida correctamente");
        setTimeout(() => {
          closeModal();
        }, 1500);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setFormError(err.response?.data?.detail || "Error al procesar la solicitud");
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle user active status
  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.id) {
      setMessage({ type: "error", text: "No puedes desactivar tu propia cuenta" });
      return;
    }

    try {
      await usersApi.toggleActive(user.id);
      setMessage({
        type: "success",
        text: user.is_active ? "Usuario desactivado" : "Usuario activado",
      });
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Error al cambiar estado del usuario",
      });
    }
  };

  // Delete user
  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      setMessage({ type: "error", text: "No puedes eliminar tu propia cuenta" });
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar al usuario "${user.username}"?`)) {
      return;
    }

    try {
      await usersApi.delete(user.id);
      setMessage({ type: "success", text: "Usuario eliminado correctamente" });
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setMessage({
        type: "error",
        text: err.response?.data?.detail || "Error al eliminar usuario",
      });
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="admin-page usuarios-page">
      <div className="page-header">
        <div className="header-title">
          <Users size={28} />
          <h1>Gestión de Usuarios</h1>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="filters-bar filters-inline">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="filter-select"
        >
          <option value="all">Todos los roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Cargando usuarios...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p>No se encontraron usuarios</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={!user.is_active ? "inactive-row" : ""}>
                  <td>
                    <span className="username">{user.username}</span>
                    {user.id === currentUser?.id && (
                      <span className="you-badge">Tú</span>
                    )}
                  </td>
                  <td>{user.full_name || "-"}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role_name.toLowerCase()}`}>
                      {user.role_name}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? "active" : "inactive"}`}>
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="action-btn edit"
                        onClick={() => openEditModal(user)}
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn password"
                        onClick={() => openResetPasswordModal(user)}
                        title="Restablecer contraseña"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        className={`action-btn ${user.is_active ? "deactivate" : "activate"}`}
                        onClick={() => handleToggleActive(user)}
                        title={user.is_active ? "Desactivar" : "Activar"}
                        disabled={user.id === currentUser?.id}
                      >
                        {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(user)}
                        title="Eliminar"
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "create" && "Nuevo Usuario"}
                {modalMode === "edit" && "Editar Usuario"}
                {modalMode === "reset-password" && "Restablecer Contraseña"}
              </h2>
              <button className="close-btn" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {formError && (
                <div className="form-message error">
                  <AlertCircle size={18} />
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="form-message success">
                  <CheckCircle size={18} />
                  {formSuccess}
                </div>
              )}

              {modalMode === "reset-password" ? (
                <div className="form-group">
                  <label>Nueva Contraseña</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Usuario *</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({ ...formData, username: e.target.value })
                        }
                        placeholder="nombre_usuario"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="email@ejemplo.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="Nombre y apellido"
                    />
                  </div>

                  {modalMode === "create" && (
                    <div className="form-group">
                      <label>Contraseña *</label>
                      <div className="password-input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({ ...formData, password: e.target.value })
                          }
                          placeholder="Mínimo 6 caracteres"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rol *</label>
                      <select
                        value={formData.role_id}
                        onChange={(e) =>
                          setFormData({ ...formData, role_id: parseInt(e.target.value) })
                        }
                        disabled={modalMode === "edit" && selectedUser?.id === currentUser?.id}
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Estado</label>
                      <select
                        value={formData.is_active ? "active" : "inactive"}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.value === "active" })
                        }
                        disabled={modalMode === "edit" && selectedUser?.id === currentUser?.id}
                      >
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={formLoading}>
                  {formLoading
                    ? "Procesando..."
                    : modalMode === "create"
                    ? "Crear Usuario"
                    : modalMode === "edit"
                    ? "Guardar Cambios"
                    : "Restablecer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
