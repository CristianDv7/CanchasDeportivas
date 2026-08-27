// Superficie pública de sesión (design.md §5.2, ADR-04): useSyncExternalStore
// en vez de React Context, para que un remote pueda llamar useSession() desde
// cualquier profundidad del árbol sin depender de un Provider del shell.
import { useMemo, useSyncExternalStore } from "react";
import { login, logout } from "./session";
import { getOrCreateSessionStore } from "./store";
import type { SessionSnapshot } from "./store";
import { normalizeRol } from "./types";
import type { Rol, Session } from "./types";

const store = getOrCreateSessionStore();

function buildHasRole(snapshot: SessionSnapshot): (...roles: Rol[]) => boolean {
  return (...roles: Rol[]): boolean => {
    if (roles.length === 0) return snapshot.status === "authenticated";
    const rol = snapshot.user ? normalizeRol(snapshot.user.rol) : null;
    return rol !== null && roles.includes(rol);
  };
}

function buildSession(snapshot: SessionSnapshot): Session {
  return {
    user: snapshot.user,
    rol: snapshot.user ? normalizeRol(snapshot.user.rol) : null,
    token: snapshot.token,
    isAuthenticated: snapshot.status === "authenticated",
    status: snapshot.status,
    error: snapshot.error,
    login,
    logout,
    hasRole: buildHasRole(snapshot),
  };
}

/** Hook React. Re-renderiza al consumidor ante cualquier cambio de sesión. */
export function useSession(): Session {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => buildSession(snapshot), [snapshot]);
}

/** Lectura síncrona fuera de React (apiClient, handlers, tests). */
export function getSession(): Session {
  return buildSession(store.getSnapshot());
}

/** Suscripción imperativa. Devuelve unsubscribe. */
export function subscribeSession(listener: () => void): () => void {
  return store.subscribe(listener);
}
