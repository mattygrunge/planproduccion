import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Home,
  Calendar,
  History,
  Factory,
  Link as LinkIcon,
  Package,
  Users,
  BarChart3,
  ClipboardList,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/admin/sectores", label: "Sectores", icon: Factory },
    { path: "/admin/lineas", label: "Líneas", icon: LinkIcon },
    { path: "/admin/productos", label: "Productos", icon: Package },
    { path: "/admin/clientes", label: "Clientes", icon: Users },
  ];

  const operacionesItems = [
    { path: "/admin/estados-linea", label: "Estados de Línea", icon: BarChart3 },
    { path: "/admin/lotes", label: "Lotes", icon: ClipboardList },
  ];

  const seguridadItems = [
    { path: "/admin/auditoria", label: "Auditoría", icon: Shield },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="admin-layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        {/* Header del Sidebar con Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            {sidebarOpen ? (
              <img 
                src="/assets/logos/logotipo_white.PNG" 
                alt="AGROFACIL"
                className="logo-full"
              />
            ) : (
              <img 
                src="/assets/logos/logo_white.PNG" 
                alt="AGROFACIL"
                className="logo-icon"
              />
            )}
          </div>
        </div>
        
        {/* Toggle Button */}
        <button
          className="toggle-btn sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? "Contraer menú" : "Expandir menú"}
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>

        {/* Navegación */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-section-title">Dashboard</h3>
            <Link
              to="/dashboard"
              className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
            >
              <Home className="icon" size={20} strokeWidth={1.5} />
              <span className="label">Inicio</span>
            </Link>
            <Link
              to="/timeline"
              className={`nav-item ${location.pathname === "/timeline" ? "active" : ""}`}
            >
              <Calendar className="icon" size={20} strokeWidth={1.5} />
              <span className="label">Timeline</span>
            </Link>
            <Link
              to="/historial"
              className={`nav-item ${location.pathname === "/historial" ? "active" : ""}`}
            >
              <History className="icon" size={20} strokeWidth={1.5} />
              <span className="label">Historial</span>
            </Link>
          </div>

          <div className="nav-section">
            <h3 className="nav-section-title">Administración</h3>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                >
                  <IconComponent className="icon" size={20} strokeWidth={1.5} />
                  <span className="label">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="nav-section">
            <h3 className="nav-section-title">Operaciones</h3>
            {operacionesItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                >
                  <IconComponent className="icon" size={20} strokeWidth={1.5} />
                  <span className="label">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="nav-section">
            <h3 className="nav-section-title">Seguridad</h3>
            {seguridadItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                >
                  <IconComponent className="icon" size={20} strokeWidth={1.5} />
                  <span className="label">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer del Sidebar */}
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.full_name || user?.username}</span>
            <span className="user-role">{user?.role_name}</span>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} strokeWidth={1.5} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
