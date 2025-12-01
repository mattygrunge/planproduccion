import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();

  const isAdmin = user?.role_name === "admin";

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Plan Producción</h1>
        <div className="user-info">
          <span className="user-name">
            👤 {user?.full_name || user?.username}
          </span>
          <span className="user-role">{user?.role_name}</span>
          <button onClick={logout} className="logout-button">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>¡Bienvenido al Sistema!</h2>
          <p>Has iniciado sesión correctamente.</p>
          
          <div className="user-details">
            <div className="detail-item">
              <span className="detail-label">Usuario:</span>
              <span className="detail-value">{user?.username}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user?.email}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Rol:</span>
              <span className="detail-value">{user?.role_name}</span>
            </div>
          </div>
        </div>

        {/* Acceso al Timeline y Historial - disponible para todos los usuarios */}
        <div className="main-panel">
          <h3>📊 Vista de Producción</h3>
          <p>Visualiza el estado actual de las líneas de producción y consulta el historial.</p>
          
          <div className="admin-links">
            <Link to="/timeline" className="admin-link timeline-link">
              <span className="admin-link-icon">📊</span>
              <span className="admin-link-text">
                <strong>Timeline de Producción</strong>
                <small>Ver estado de líneas en tiempo real</small>
              </span>
            </Link>
            
            <Link to="/historial" className="admin-link historial-link">
              <span className="admin-link-icon">📈</span>
              <span className="admin-link-text">
                <strong>Historial de Producción</strong>
                <small>Consultar y exportar datos históricos</small>
              </span>
            </Link>
          </div>
        </div>

        {isAdmin && (
          <div className="admin-panel">
            <h3>🔧 Panel de Administración</h3>
            <p>Como administrador, tenés acceso a gestionar los datos maestros del sistema.</p>
            
            <div className="admin-links">
              <Link to="/admin/sectores" className="admin-link">
                <span className="admin-link-icon">🏭</span>
                <span className="admin-link-text">
                  <strong>Sectores</strong>
                  <small>Gestionar sectores de producción</small>
                </span>
              </Link>
              
              <Link to="/admin/lineas" className="admin-link">
                <span className="admin-link-icon">🔗</span>
                <span className="admin-link-text">
                  <strong>Líneas</strong>
                  <small>Gestionar líneas de producción</small>
                </span>
              </Link>
              
              <Link to="/admin/productos" className="admin-link">
                <span className="admin-link-icon">📦</span>
                <span className="admin-link-text">
                  <strong>Productos</strong>
                  <small>Gestionar catálogo de productos</small>
                </span>
              </Link>
              
              <Link to="/admin/clientes" className="admin-link">
                <span className="admin-link-icon">👥</span>
                <span className="admin-link-text">
                  <strong>Clientes</strong>
                  <small>Gestionar base de clientes</small>
                </span>
              </Link>
              
              <Link to="/admin/estados-linea" className="admin-link">
                <span className="admin-link-icon">🔄</span>
                <span className="admin-link-text">
                  <strong>Estados de Línea</strong>
                  <small>Registrar estados de producción</small>
                </span>
              </Link>
            </div>
          </div>
        )}

        {!isAdmin && (
          <div className="phase-info">
            <p>🚧 <strong>Acceso limitado</strong></p>
            <p>Contacta al administrador para obtener más permisos si es necesario.</p>
          </div>
        )}
      </main>
    </div>
  );
}
