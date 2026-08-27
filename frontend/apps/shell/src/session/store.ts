// SessionStore — memoria = verdad · sessionStorage = espejo (design.md §6).
// `authorizeRequest` es la costura hacia una futura migración a cookie
// httpOnly (ADR-03): apiClient nunca ve el token.
import type { ApiError } from "../http/types";
import { createSessionStorageMirror, type SessionMirror } from "./mirror";
import type { SessionStatus, SessionUser } from "./types";

export interface SessionSnapshot {
  readonly user: SessionUser | null;
  readonly token: string | null; // siempre null en la futura implementación cookie
  readonly status: SessionStatus;
  readonly error: ApiError | null;
}

export interface SessionStore {
  /** DEBE devolver la MISMA referencia si nada cambió (requisito de useSyncExternalStore). */
  getSnapshot(): SessionSnapshot;

  subscribe(listener: () => void): () => void;

  /**
   * Recupera la sesión persistida al boot. Async a propósito: la
   * implementación cookie necesitará GET /auth/me. Hoy resuelve casi
   * inmediato leyendo el espejo. Async desde el día 1 = cero refactor después.
   */
  hydrate(): Promise<SessionSnapshot>;

  set(input: { user: SessionUser; token: string }): void;
  setStatus(status: Exclude<SessionStatus, "authenticated">, error?: ApiError | null): void;
  clear(): void;

  /**
   * ★ LA COSTURA. apiClient NUNCA pide el token: pide que le autoricen el request.
   *   - memory store  → { ...init, headers: { Authorization: `Bearer ${token}` } }
   *   - cookie store  → { ...init, credentials: 'include' }   (sin tocar headers)
   * Devuelve `null` si no hay sesión ⇒ apiClient corta el request antes de salir.
   */
  authorizeRequest(init: RequestInit): RequestInit | null;
}

const IDLE_SNAPSHOT: SessionSnapshot = {
  user: null,
  token: null,
  status: "idle",
  error: null,
};

const ANONYMOUS_SNAPSHOT: SessionSnapshot = {
  user: null,
  token: null,
  status: "anonymous",
  error: null,
};

export function createMemorySessionStore(deps: {
  mirror: SessionMirror;
  now?: () => number;
}): SessionStore {
  const { mirror } = deps;
  let snapshot: SessionSnapshot = IDLE_SNAPSHOT;
  const listeners = new Set<() => void>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  function setSnapshot(next: SessionSnapshot): void {
    snapshot = next;
    notify();
  }

  return {
    getSnapshot(): SessionSnapshot {
      return snapshot;
    },

    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async hydrate(): Promise<SessionSnapshot> {
      const persisted = mirror.read();
      if (persisted === null) {
        setSnapshot(ANONYMOUS_SNAPSHOT);
        return snapshot;
      }

      setSnapshot({
        user: persisted.user,
        token: persisted.token,
        status: "authenticated",
        error: null,
      });
      return snapshot;
    },

    set(input: { user: SessionUser; token: string }): void {
      mirror.write({ v: 1, token: input.token, user: input.user });
      setSnapshot({
        user: input.user,
        token: input.token,
        status: "authenticated",
        error: null,
      });
    },

    setStatus(status: Exclude<SessionStatus, "authenticated">, error: ApiError | null = null): void {
      setSnapshot({ ...snapshot, status, error });
    },

    clear(): void {
      mirror.clear();
      setSnapshot(ANONYMOUS_SNAPSHOT);
    },

    authorizeRequest(init: RequestInit): RequestInit | null {
      if (snapshot.token === null) return null;

      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${snapshot.token}`);
      return { ...init, headers };
    },
  };
}

const STORE_KEY = Symbol.for("canchasdeportivas.session.store.v1");

/**
 * Singleton global (ADR-05): blinda el ciclo shell↔remote. Incluso si el
 * runtime de Module Federation instanciara el container del shell dos
 * veces, el SessionStore sigue siendo uno solo porque vive en el registro
 * global de símbolos, no en el scope del módulo.
 */
export function getOrCreateSessionStore(): SessionStore {
  const g = globalThis as unknown as Record<symbol, SessionStore | undefined>;
  if (!g[STORE_KEY]) {
    g[STORE_KEY] = createMemorySessionStore({ mirror: createSessionStorageMirror() });
  }
  return g[STORE_KEY] as SessionStore;
}
