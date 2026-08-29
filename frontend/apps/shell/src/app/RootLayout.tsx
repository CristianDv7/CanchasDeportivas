// Layout persistente del shell (design.md §1, frontend-shell-host spec
// "Host Layout"): nav + outlet. Solo cambia el outlet al navegar.
import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../session/useSession";
import "./RootLayout.css";

export function RootLayout() {
  const { user, rol, hasRole, logout } = useSession();

  return (
    <div className="shell-shell">
      <header className="shell-header">
        <span className="shell-brand">
          Cancha<strong>Ya</strong>
        </span>
        <nav className="shell-nav" aria-label="Navegación principal">
          <NavLink to="/reservas" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Reservas
          </NavLink>
          {hasRole("administrador") && (
            <>
              <NavLink
                to="/administracion"
                className={({ isActive }) => (isActive ? "active" : undefined)}
              >
                Administración
              </NavLink>
              <NavLink to="/reportes" className={({ isActive }) => (isActive ? "active" : undefined)}>
                Reportes
              </NavLink>
            </>
          )}
        </nav>
        {user && (
          <div className="shell-account">
            <div className="shell-account-info">
              <span className="shell-account-email">{user.email}</span>
              {rol && <span className="shell-account-rol">{rol}</span>}
            </div>
            <button type="button" className="shell-logout" onClick={() => logout("user")}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
