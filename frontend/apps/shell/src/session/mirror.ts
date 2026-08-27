// Espejo de persistencia del SessionStore (design.md §6). Memoria = verdad,
// sessionStorage = espejo. Nunca debe tirar la app abajo: JSON corrupto,
// `v` inválido o storage inaccesible degradan en silencio.
import type { SessionUser } from "./types";

export const DEFAULT_MIRROR_KEY = "cd.session.v1";

export interface PersistedSession {
  readonly v: 1; // versión del formato; mismatch ⇒ descartar
  readonly token: string;
  readonly user: SessionUser;
}

export interface SessionMirror {
  read(): PersistedSession | null;
  write(session: PersistedSession): void;
  clear(): void;
}

function isPersistedSession(value: unknown): value is PersistedSession {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return candidate.v === 1 && typeof candidate.token === "string" && typeof candidate.user === "object";
}

/** No-op: usado como degradación silenciosa y en tests. */
export function createNullMirror(): SessionMirror {
  return {
    read: () => null,
    write: () => {
      /* no-op a propósito */
    },
    clear: () => {
      /* no-op a propósito */
    },
  };
}

/**
 * `storage` es inyectable solo para tests (jsdom implementa `sessionStorage`
 * como un Proxy que intercepta cualquier acceso de propiedad como clave de
 * storage, así que no se puede espiar `setItem` con `vi.spyOn`). En runtime
 * real siempre se usa el default `window.sessionStorage`.
 */
export function createSessionStorageMirror(
  key: string = DEFAULT_MIRROR_KEY,
  storage: Storage = window.sessionStorage,
): SessionMirror {
  try {
    // Sonda de disponibilidad real (modo privado / cuota agotada lanzan acá).
    const probeKey = `${key}.__probe__`;
    storage.setItem(probeKey, "1");
    storage.removeItem(probeKey);
  } catch {
    return createNullMirror();
  }

  return {
    read(): PersistedSession | null {
      try {
        const raw = storage.getItem(key);
        if (raw === null) return null;

        const parsed: unknown = JSON.parse(raw);
        if (!isPersistedSession(parsed)) {
          storage.removeItem(key);
          return null;
        }
        return parsed;
      } catch {
        // JSON corrupto, o el storage empezó a fallar recién: nunca throw en boot.
        try {
          storage.removeItem(key);
        } catch {
          /* si ni remover funciona, no hay nada más que hacer */
        }
        return null;
      }
    },
    write(session: PersistedSession): void {
      try {
        storage.setItem(key, JSON.stringify(session));
      } catch {
        /* degradación silenciosa: la app sigue funcionando sin persistencia */
      }
    },
    clear(): void {
      try {
        storage.removeItem(key);
      } catch {
        /* degradación silenciosa */
      }
    },
  };
}
