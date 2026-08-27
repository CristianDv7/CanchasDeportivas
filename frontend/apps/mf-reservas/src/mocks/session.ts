// Helper de tests: siembra el SessionStore federado ANTES de disparar un
// request (design.md §9, "Sesión" — gotcha crítico).
//
// `apiClient.request()` llama `store.authorizeRequest(init)`; si devuelve
// `null` (sin token), corta con `ApiError{status:0, code:"unauthorized"}`
// ANTES de invocar `fetch`. MSW nunca llega a ver ese request: el test
// fallaría por "no hay sesión activa", no por el motivo que se está probando.
// `seedSession()` llama al MISMO singleton (`getOrCreateSessionStore`,
// design.md §9 "Aliases") que usa el `apiClient` real bajo test, gracias al
// alias `shell/session` → `../shell/src/session` de `vitest.config.ts`.
import { getOrCreateSessionStore } from "shell/session";
import type { SessionUser } from "shell/session";

const DEFAULT_USER: SessionUser = {
  id: 1,
  nombre: "Usuario de test",
  email: "usuario@test.local",
  rol: "usuario",
};

/**
 * Autentica el SessionStore singleton para que `apiClient` autorice
 * requests. Llamar en cada test (o en un `beforeEach`) que ejercite
 * `reservasApi`/`canchasApi` a través de MSW.
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
