// design.md §4 (diagrama de secuencia login + route guard).
import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../session/useSession";
import { normalizeRol } from "../session/types";
import "./LoginPage.css";

interface LocationState {
  from?: { pathname: string };
}

/** Rutas restringidas a "administrador" (ver AppRouter). Duplicado a propósito:
 * es la única forma de saber, antes de navegar, si state.from le sirve al rol
 * recién logueado — RequireRole igual bloquea si esto se desincroniza. */
const ADMIN_ONLY_PREFIXES = ["/administracion", "/reportes"];

function resolveLoginTarget(fromPathname: string | undefined, rol: string): string {
  if (!fromPathname) return "/reservas";
  const isAdminOnly = ADMIN_ONLY_PREFIXES.some((prefix) => fromPathname.startsWith(prefix));
  if (isAdminOnly && normalizeRol(rol) !== "administrador") return "/reservas";
  return fromPathname;
}

export function LoginPage() {
  const { login, status } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    try {
      const user = await login({ email, password });
      const state = location.state as LocationState | null;
      navigate(resolveLoginTarget(state?.from?.pathname, user.rol), { replace: true });
    } catch {
      // No filtrar si el email existe (design.md §4).
      setFormError("Credenciales inválidas");
    }
  }

  return (
    <div className="shell-login-screen">
      <form onSubmit={handleSubmit} aria-label="Iniciar sesión" className="shell-login-card">
        <h1 className="shell-login-title">Iniciar sesión</h1>

        <div className="shell-login-field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="shell-login-field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" className="shell-login-submit" disabled={status === "authenticating"}>
          Ingresar
        </button>

        {formError && (
          <p role="alert" className="shell-login-error">
            {formError}
          </p>
        )}

        <Link to="/registro" className="shell-login-link">
          No tengo cuenta — Crear cuenta
        </Link>
      </form>
    </div>
  );
}
