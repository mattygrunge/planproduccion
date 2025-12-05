import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Download, Smartphone } from "lucide-react";
import { authApi } from "../api/api";
import { useAuth } from "../hooks/useAuth";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { IOSInstallModal } from "../components/InstallPWA";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { canInstall, install, isIOSDevice, isInstalled, showIOSInstallGuide } = usePWAInstall();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      await login(response.access_token);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setError(axiosError.response?.data?.detail || "Error al iniciar sesión");
      } else {
        setError("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo AGROFACIL */}
        <div className="login-logo">
          <img 
            src="/assets/logos/header_normal.PNG" 
            alt="AGROFACIL"
          />
        </div>
        <h2>Sistema de Gestión de Planta</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.5} />
                ) : (
                  <Eye size={18} strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Mantener sesión iniciada</span>
            </label>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-button">
            {loading ? "Iniciando sesión..." : "Ingresar"}
          </button>
        </form>
        
        {/* Botón de instalación PWA */}
        {!isInstalled && (canInstall || isIOSDevice) && (
          <div className="pwa-install-section">
            <button 
              type="button"
              className="pwa-login-install-btn"
              onClick={canInstall ? install : showIOSInstallGuide}
            >
              {isIOSDevice ? (
                <Smartphone size={18} strokeWidth={1.5} />
              ) : (
                <Download size={18} strokeWidth={1.5} />
              )}
              <span>Instalar NexxaPlus</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Modal de instrucciones iOS */}
      <IOSInstallModal />
    </div>
  );
}
