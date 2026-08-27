// Fallback manual de tipos (design.md §5.3, task 2.4.6): si el `dts` de MF
// 2.0 (`consumeTypes`) falla en generar `@mf-types/shell/*`, `tsc` necesita
// esto para resolver `import ... from 'shell/session'` / 'shell/apiClient'.
// Reapunta a los fuentes reales del shell dentro del monorepo: los tipos son
// 100% estructurales, así que no se pierde nada salvo la sincronización
// automática (misma ruta relativa que usa vitest.config.ts para el alias).
declare module "shell/session" {
  export type {
    LogoutReason,
    LoginResponse,
    Rol,
    Session,
    SessionStatus,
    SessionUser,
    SessionSnapshot,
    SessionStore,
  } from "../../shell/src/session";
  export {
    normalizeRol,
    mapLoginResponse,
    getOrCreateSessionStore,
    getSession,
    subscribeSession,
    useSession,
  } from "../../shell/src/session";
}

declare module "shell/apiClient" {
  export type {
    ApiClient,
    ApiClientConfig,
    ApiError,
    ApiErrorCode,
    CreateApiClientDeps,
    HttpMethod,
    RequestOptions,
    ServiceName,
  } from "../../shell/src/http";
  export { apiClient, createApiClient, onUnauthorized } from "../../shell/src/http";
}
