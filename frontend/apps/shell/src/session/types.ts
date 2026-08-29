// Tipos de la superficie federada 'shell/session' (design.md §5.2).
// Puros tipos: sin lógica, no requieren test dedicado.
import type { ApiError } from "../http/types";

export type Rol = "usuario" | "administrador";

export interface SessionUser {
  readonly id: number; // ← LoginResponse.usuario_id
  readonly nombre: string;
  readonly email: string;
  /** Valor crudo del backend. Puede no ser un Rol conocido (ADR-06). */
  readonly rol: string;
}

export type SessionStatus =
  | "idle" // hydrate() en curso — los guards DEBEN esperar, no redirigir
  | "authenticating" // login en vuelo
  | "authenticated"
  | "anonymous";

export type LogoutReason = "user" | "expired" | "invalid_session";

export interface Session {
  readonly user: SessionUser | null;
  /** Rol normalizado. null si es desconocido o no hay sesión ⇒ privilegio mínimo. */
  readonly rol: Rol | null;
  /**
   * Escape hatch (descargas, SSE, WebSocket). Los remotes NO deben usarlo
   * para requests HTTP: para eso está apiClient, que ya lo inyecta.
   * Desaparece (pasa a ser siempre null) cuando migremos a cookie httpOnly.
   */
  readonly token: string | null;
  readonly isAuthenticated: boolean;
  readonly status: SessionStatus;
  /** Error del último login, para el formulario. Se limpia al reintentar. */
  readonly error: ApiError | null;

  login(credentials: { email: string; password: string }): Promise<SessionUser>;
  register(input: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
  }): Promise<SessionUser>;
  logout(reason?: LogoutReason): void;
  /** OR lógico. hasRole() sin args ⇔ isAuthenticated. */
  hasRole(...roles: Rol[]): boolean;
}

/** Shape de `POST /auth/login` de ms-usuarios (backend/ms-usuarios/app/schemas/auth.py). */
export interface LoginResponse {
  readonly access_token: string;
  readonly token_type: string;
  readonly usuario_id: number;
  readonly nombre: string;
  readonly email: string;
  readonly rol: string;
}

const KNOWN_ROLES: readonly Rol[] = ["usuario", "administrador"];

/** ADR-06: rol desconocido ⇒ null (privilegio mínimo), nunca lanza. */
export function normalizeRol(rol: string): Rol | null {
  return (KNOWN_ROLES as readonly string[]).includes(rol) ? (rol as Rol) : null;
}

export function mapLoginResponse(response: LoginResponse): SessionUser {
  return {
    id: response.usuario_id,
    nombre: response.nombre,
    email: response.email,
    rol: response.rol,
  };
}
