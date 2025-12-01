import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./AdminLayout.css";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: "/admin/sectores", label: "Sectores", icon: "🏭" },
    { path: "/admin/lineas", label: "Líneas", icon: "🔗" },
    { path: "/admin/productos", label: "Productos", icon: "📦" },
    { path: "/admin/clientes", label: "Clientes", icon: "👥" },
  ];

  const operacionesItems = [
    { path: "/admin/estados-linea", label: "Estados de Línea", icon: "📊" },
    { path: "/admin/lotes", label: "Lotes", icon: "📋" },
  ];

  const seguridadItems = [
    { path: "/admin/auditoria", label: "Auditoría", icon: "🔍" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="admin-layout">
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <h2>📋 Plan Producción</h2>
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3>Dashboard</h3>
            <Link
              to="/dashboard"
              className={`nav-item ${location.pathname === "/dashboard" ? "active" : ""}`}
            >
              <span className="icon">🏠</span>
              <span className="label">Inicio</span>
            </Link>
          </div>

          <div className="nav-section">
            <h3>Administración</h3>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <h3>Operaciones</h3>
            {operacionesItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="nav-section">
            <h3>Seguridad</h3>
            {seguridadItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
              >
                <span className="icon">{item.icon}</span>
                <span className="label">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.full_name || user?.username}</span>
            <span className="user-role">{user?.role_name}</span>
          </div>
          <button className="logout-btn" onClick={logout}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
