import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";
import Sectores from "./pages/admin/Sectores";
import Lineas from "./pages/admin/Lineas";
import Productos from "./pages/admin/Productos";
import Clientes from "./pages/admin/Clientes";
import EstadosLinea from "./pages/admin/EstadosLinea";
import Lotes from "./pages/admin/Lotes";
import Auditoria from "./pages/admin/Auditoria";
import Historial from "./pages/Historial";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta de login */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas protegidas */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Timeline - accesible para usuarios autenticados */}
          <Route
            path="/timeline"
            element={
              <ProtectedRoute>
                <Timeline />
              </ProtectedRoute>
            }
          />
          
          {/* Historial - accesible para usuarios autenticados */}
          <Route
            path="/historial"
            element={
              <ProtectedRoute>
                <Historial />
              </ProtectedRoute>
            }
          />
          
          {/* Rutas de administración (solo admin) */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/sectores" element={<Sectores />} />
              <Route path="/admin/lineas" element={<Lineas />} />
              <Route path="/admin/productos" element={<Productos />} />
              <Route path="/admin/clientes" element={<Clientes />} />
              <Route path="/admin/estados-linea" element={<EstadosLinea />} />
              <Route path="/admin/lotes" element={<Lotes />} />
              <Route path="/admin/auditoria" element={<Auditoria />} />
            </Route>
          </Route>
          
          {/* Redirigir raíz al dashboard (que a su vez redirige al login si no está autenticado) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Cualquier otra ruta redirige al dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
