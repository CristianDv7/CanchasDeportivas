// Segundo nivel de guard (ADR-08), anidado dentro de <RequireAuth/>: asume
// que ya hay sesión. Rol desconocido ⇒ hasRole() false ⇒ bloqueado (ADR-06).
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../session/useSession";
import type { Rol } from "../session/types";

export function RequireRole({ rol }: { rol: Rol }) {
  const { hasRole } = useSession();

  if (!hasRole(rol)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return <Outlet />;
}
