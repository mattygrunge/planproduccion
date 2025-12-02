import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Calendar,
  History,
  Factory,
  Link2,
  Package,
  Users,
  Activity,
  User,
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role_name === "admin";

  return (
    <div className="dashboard-page">
      {/* Header compacto con logo y título */}
      <header className="dashboard-header">
        <div className="header-left">
          <img 
            src="/assets/logos/header_normal.PNG" 
            alt="AGROFACIL" 
            className="header-logo"
          />
        </div>
        <div className="header-center">
          <h1>Sistema de Gestión de Planta</h1>
        </div>
        <div className="header-right">
          <div className="user-badge">
            <User className="user-icon" size={18} strokeWidth={2} />
            <span className="user-name">{user?.full_name || user?.username}</span>
            <span className="user-role">{user?.role_name}</span>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="dashboard-content">
        {/* Bienvenida compacta */}
        <div className="welcome-section">
          <LayoutDashboard className="welcome-icon" size={24} strokeWidth={1.5} />
          <div className="welcome-text">
            <span className="welcome-greeting">Bienvenido, {user?.full_name || user?.username}</span>
            <span className="welcome-sub">Panel de control del sistema</span>
          </div>
        </div>

        {/* Grid de paneles */}
        <div className="dashboard-grid">
          {/* Vista de Producción */}
          <section className="dashboard-panel production-panel">
            <div className="panel-header">
              <Activity className="panel-icon" size={20} strokeWidth={1.5} />
              <h2>Vista de Producción</h2>
            </div>
            <p className="panel-description">Monitoreo en tiempo real y análisis histórico</p>
            
            <div className="panel-links">
              <Link to="/timeline" className="panel-link">
                <Calendar className="link-icon" size={22} strokeWidth={1.5} />
                <div className="link-content">
                  <strong>Timeline</strong>
                  <small>Estado de líneas en tiempo real</small>
                </div>
              </Link>
              
              <Link to="/historial" className="panel-link">
                <History className="link-icon" size={22} strokeWidth={1.5} />
                <div className="link-content">
                  <strong>Historial</strong>
                  <small>Consultar datos históricos</small>
                </div>
              </Link>
            </div>
          </section>

          {/* Panel de Administración */}
          {isAdmin && (
            <section className="dashboard-panel admin-panel">
              <div className="panel-header">
                <Factory className="panel-icon" size={20} strokeWidth={1.5} />
                <h2>Administración</h2>
              </div>
              <p className="panel-description">Gestión de datos maestros del sistema</p>
              
              <div className="panel-links">
                <Link to="/admin/sectores" className="panel-link">
                  <Factory className="link-icon" size={22} strokeWidth={1.5} />
                  <div className="link-content">
                    <strong>Sectores</strong>
                    <small>Áreas de producción</small>
                  </div>
                </Link>
                
                <Link to="/admin/lineas" className="panel-link">
                  <Link2 className="link-icon" size={22} strokeWidth={1.5} />
                  <div className="link-content">
                    <strong>Líneas</strong>
                    <small>Líneas de producción</small>
                  </div>
                </Link>
                
                <Link to="/admin/productos" className="panel-link">
                  <Package className="link-icon" size={22} strokeWidth={1.5} />
                  <div className="link-content">
                    <strong>Productos</strong>
                    <small>Catálogo de productos</small>
                  </div>
                </Link>
                
                <Link to="/admin/clientes" className="panel-link">
                  <Users className="link-icon" size={22} strokeWidth={1.5} />
                  <div className="link-content">
                    <strong>Clientes</strong>
                    <small>Base de clientes</small>
                  </div>
                </Link>
                
                <Link to="/admin/estados-linea" className="panel-link">
                  <Activity className="link-icon" size={22} strokeWidth={1.5} />
                  <div className="link-content">
                    <strong>Estados</strong>
                    <small>Estados de línea</small>
                  </div>
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer gris */}
      <footer className="dashboard-footer">
        <div className="footer-content">
          <span>AGROFACIL © 2025 - Sistema de Gestión de Planta</span>
          <span className="footer-separator">|</span>
          <span>Versión 1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
