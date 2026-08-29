// design.md §4 (diagrama de secuencia login + route guard).
import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../session/useSession";
import "./LoginPage.css";

interface LocationState {
  from?: { pathname: string };
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
      await login({ email, password });
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? "/reservas", { replace: true });
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
      </form>
    </div>
  );
}
