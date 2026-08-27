// Superficie federada 'shell/session' (design.md §5.2). Solo agrega
// exports: la lógica vive en session.ts, store.ts, useSession.ts, mirror.ts.
export type { LogoutReason, LoginResponse, Rol, Session, SessionStatus, SessionUser } from "./types";
export { normalizeRol, mapLoginResponse } from "./types";
export type { SessionSnapshot, SessionStore } from "./store";
export { getOrCreateSessionStore } from "./store";
export { getSession, subscribeSession, useSession } from "./useSession";
