// Alta pública de usuario (POST /usuarios de ms-usuarios, sin auth) + autologin.
// Mismo layout que LoginPage (reusa LoginPage.css): a diferencia del login, acá
// SÍ se muestra el detail real del backend (p. ej. "El email ya está
// registrado") — no hay nada que ocultar como con las credenciales de login.
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { ApiError } from "../http/types";
import { useSession } from "../session/useSession";
import "./LoginPage.css";

export function RegisterPage() {
  const { register } = useSession();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setFormError(null);

    if (password !== confirmarPassword) {
      setFormError("Las contraseñas no coinciden");
      return;
    }

    setPending(true);
    try {
      await register({ nombre, apellido, email, password });
      navigate("/reservas", { replace: true });
    } catch (err) {
      setFormError((err as ApiError).detail ?? "No se pudo crear la cuenta");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="shell-login-screen">
      <form onSubmit={handleSubmit} aria-label="Crear cuenta" className="shell-login-card">
        <h1 className="shell-login-title">Crear cuenta</h1>

        <div className="shell-login-field">
          <label htmlFor="register-nombre">Nombre</label>
          <input
            id="register-nombre"
            name="nombre"
            type="text"
            autoComplete="given-name"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            required
          />
        </div>

        <div className="shell-login-field">
          <label htmlFor="register-apellido">Apellido</label>
          <input
            id="register-apellido"
            name="apellido"
            type="text"
            autoComplete="family-name"
            value={apellido}
            onChange={(event) => setApellido(event.target.value)}
            required
          />
        </div>

        <div className="shell-login-field">
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="shell-login-field">
          <label htmlFor="register-password">Contraseña</label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <div className="shell-login-field">
          <label htmlFor="register-confirmar-password">Confirmar contraseña</label>
          <input
            id="register-confirmar-password"
            name="confirmarPassword"
            type="password"
            autoComplete="new-password"
            value={confirmarPassword}
            onChange={(event) => setConfirmarPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit" className="shell-login-submit" disabled={pending}>
          Crear cuenta
        </button>

        {formError && (
          <p role="alert" className="shell-login-error">
            {formError}
          </p>
        )}

        <Link to="/login" className="shell-login-link">
          Ya tengo cuenta — Iniciar sesión
        </Link>
      </form>
    </div>
  );
}
