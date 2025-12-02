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
          
          {/* Rutas protegidas con sidebar */}
          <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Timeline y Historial - accesible para todos los usuarios autenticados */}
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/historial" element={<Historial />} />
            
            {/* Rutas de administración (solo admin) - dentro del layout */}
            <Route path="/admin/sectores" element={<AdminRoute><Sectores /></AdminRoute>} />
            <Route path="/admin/lineas" element={<AdminRoute><Lineas /></AdminRoute>} />
            <Route path="/admin/productos" element={<AdminRoute><Productos /></AdminRoute>} />
            <Route path="/admin/clientes" element={<AdminRoute><Clientes /></AdminRoute>} />
            <Route path="/admin/estados-linea" element={<AdminRoute><EstadosLinea /></AdminRoute>} />
            <Route path="/admin/lotes" element={<AdminRoute><Lotes /></AdminRoute>} />
            <Route path="/admin/auditoria" element={<AdminRoute><Auditoria /></AdminRoute>} />
          </Route>
          
          {/* Redirigir raíz al dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Cualquier otra ruta redirige al dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
