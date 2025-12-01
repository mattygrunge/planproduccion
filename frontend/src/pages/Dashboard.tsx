import { useAuth } from "../hooks/useAuth";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();

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

          <div className="phase-info">
            <p>🚧 <strong>Fase 1 completada</strong></p>
            <p>Este es un dashboard vacío de prueba. Las funcionalidades se agregarán en las próximas fases.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
