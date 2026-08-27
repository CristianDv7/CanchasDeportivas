// Ver apps/mf-reservas/src/remotes.d.ts — mismo fallback (design.md §5.3).
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
