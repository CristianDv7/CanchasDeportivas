// Helper de tests: siembra el SessionStore federado ANTES de disparar un
// request (design.md §7, "Sesión" — gotcha crítico, copiado de
// mf-administracion/mf-reservas).
//
// `apiClient.request()` llama `store.authorizeRequest(init)`; si devuelve
// `null` (sin token), corta con `ApiError{status:0, code:"unauthorized"}`
// ANTES de invocar `fetch`. MSW nunca llega a ver ese request: el test
// fallaría por "no hay sesión activa", no por el motivo que se está probando.
//
// El rol default acá es "administrador" (no "usuario"): el dashboard es
// admin-only, el shell solo monta este remote bajo
// RequireRole rol="administrador".
import { getOrCreateSessionStore } from "shell/session";
import type { SessionUser } from "shell/session";

const DEFAULT_USER: SessionUser = {
  id: 1,
  nombre: "Admin de test",
  email: "admin@test.local",
  rol: "administrador",
};

/**
 * Autentica el SessionStore singleton para que `apiClient` autorice
 * requests. Llamar en cada test (o en un `beforeEach`) que ejercite
 * `reportesApi` a través de MSW.
 */
export function seedSession(overrides: Partial<SessionUser> = {}): SessionUser {
  const user: SessionUser = { ...DEFAULT_USER, ...overrides };
  getOrCreateSessionStore().set({ user, token: "test-token" });
  return user;
}

/** Vuelve el store a anónimo — útil para probar el guard de "sin sesión". */
export function clearSession(): void {
  getOrCreateSessionStore().clear();
}
