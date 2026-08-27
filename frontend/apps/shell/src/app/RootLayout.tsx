// Layout persistente del shell (design.md §1, frontend-shell-host spec
// "Host Layout"): nav + outlet. Solo cambia el outlet al navegar.
import { NavLink, Outlet } from "react-router-dom";
import { useSession } from "../session/useSession";

export function RootLayout() {
  const { user, hasRole, logout } = useSession();

  return (
    <div>
      <header>
        <nav aria-label="Navegación principal">
          <NavLink to="/reservas">Reservas</NavLink>
          {hasRole("administrador") && (
            <>
              <NavLink to="/administracion">Administración</NavLink>
              <NavLink to="/reportes">Reportes</NavLink>
            </>
          )}
        </nav>
        {user && (
          <div>
            <span>{user.email}</span>
            <button type="button" onClick={() => logout("user")}>
              Cerrar sesión
            </button>
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
