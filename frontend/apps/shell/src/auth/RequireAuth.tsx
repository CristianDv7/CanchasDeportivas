// Guard como layout route con <Outlet/> (ADR-08): una ruta nueva dentro del
// grupo queda protegida por construcción, sin HOCs por página.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSession } from "../session/useSession";

export function BootSplash() {
  return <p role="status">Cargando…</p>;
}

export function RequireAuth() {
  const { status, isAuthenticated } = useSession();
  const location = useLocation();

  // status='idle' ⇒ hydrate() en curso: los guards DEBEN esperar, NUNCA
  // redirigir (evita el flash "recargo estando logueado y me tira al login").
  if (status === "idle") {
    return <BootSplash />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
