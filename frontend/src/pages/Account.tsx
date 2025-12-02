import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/api";
import type { UserProfileUpdate, PasswordChange } from "../api/api";
import {
  User,
  Mail,
  Calendar,
  Shield,
  Key,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import "./Account.css";

const Account = () => {
  const { user, refreshUser } = useAuth();
  
  // Estado para el formulario de perfil
  const [profileForm, setProfileForm] = useState<UserProfileUpdate>({
    username: "",
    email: "",
    full_name: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Estado para el formulario de contraseña
  const [passwordForm, setPasswordForm] = useState<PasswordChange>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Estado para mostrar/ocultar contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cargar datos del usuario al montar
  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || "",
        email: user.email || "",
        full_name: user.full_name || "",
      });
    }
  }, [user]);

  // Manejar cambios en el formulario de perfil
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setProfileMessage(null);
  };

  // Manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordMessage(null);
  };

  // Enviar formulario de perfil
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      await authApi.updateProfile(profileForm);
      setProfileMessage({ type: "success", text: "Perfil actualizado correctamente" });
      
      // Refrescar los datos del usuario en el contexto
      await refreshUser();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setProfileMessage({
        type: "error",
        text: err.response?.data?.detail || "Error al actualizar el perfil",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // Enviar formulario de contraseña
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage(null);

    // Validaciones del lado del cliente
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMessage({ type: "error", text: "Las contraseñas no coinciden" });
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.new_password.length < 6) {
      setPasswordMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" });
      setPasswordLoading(false);
      return;
    }

    try {
      await authApi.changePassword(passwordForm);
      setPasswordMessage({ type: "success", text: "Contraseña actualizada correctamente" });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      setPasswordMessage({
        type: "error",
        text: err.response?.data?.detail || "Error al cambiar la contraseña",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!user) {
    return (
      <div className="account-page">
        <div className="loading-message">Cargando información del usuario...</div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <div className="page-header">
        <h1>
          <User size={28} />
          Mi Cuenta
        </h1>
        <p className="page-description">
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      <div className="account-content">
        {/* Información de la cuenta (solo lectura) */}
        <div className="account-section info-section">
          <h2>
            <Shield size={20} />
            Información de la Cuenta
          </h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Usuario</span>
              <span className="info-value">{user.username}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Rol</span>
              <span className="info-value role-badge">{user.role_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Estado</span>
              <span className={`info-value status-badge ${user.is_active ? "active" : "inactive"}`}>
                {user.is_active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">
                <Calendar size={14} />
                Miembro desde
              </span>
              <span className="info-value">{formatDate(user.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Formulario de perfil */}
        <div className="account-section profile-section">
          <h2>
            <Mail size={20} />
            Información Personal
          </h2>
          <form onSubmit={handleProfileSubmit}>
            {profileMessage && (
              <div className={`message ${profileMessage.type}`}>
                {profileMessage.type === "success" ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                {profileMessage.text}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="username">Nombre de Usuario</label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileForm.username || ""}
                onChange={handleProfileChange}
                placeholder="Tu nombre de usuario"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="full_name">Nombre Completo</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={profileForm.full_name || ""}
                onChange={handleProfileChange}
                placeholder="Tu nombre completo"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileForm.email || ""}
                onChange={handleProfileChange}
                placeholder="tu@email.com"
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={profileLoading}>
              <Save size={18} />
              {profileLoading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </form>
        </div>

        {/* Formulario de cambio de contraseña */}
        <div className="account-section password-section">
          <h2>
            <Key size={20} />
            Cambiar Contraseña
          </h2>
          <form onSubmit={handlePasswordSubmit}>
            {passwordMessage && (
              <div className={`message ${passwordMessage.type}`}>
                {passwordMessage.type === "success" ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                {passwordMessage.text}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="current_password">Contraseña Actual</label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="current_password"
                  name="current_password"
                  value={passwordForm.current_password}
                  onChange={handlePasswordChange}
                  placeholder="Tu contraseña actual"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="new_password">Nueva Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="new_password"
                  name="new_password"
                  value={passwordForm.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirm_password">Confirmar Nueva Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordForm.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Repite la nueva contraseña"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="btn-primary" disabled={passwordLoading}>
              <Key size={18} />
              {passwordLoading ? "Cambiando..." : "Cambiar Contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Account;
