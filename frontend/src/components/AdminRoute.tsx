import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface AdminRouteProps {
  children?: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh" 
      }}>
        Cargando...
      </div>
    );
  }

  // Si no hay usuario, redirigir al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no es admin, redirigir al dashboard con mensaje
  if (user.role_name !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Si tiene children, renderizarlos. Si no, usar Outlet
  return children ? <>{children}</> : <Outlet />;
};

export default AdminRoute;
