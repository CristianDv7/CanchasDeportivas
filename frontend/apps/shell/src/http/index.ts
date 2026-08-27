// Wiring del singleton `apiClient` expuesto vía MF como 'shell/apiClient'
// (design.md §5.1, task 2.2.4). Ningún caller construye su propio
// createApiClient(): todos consumen esta única instancia.
import { env } from "../config/env";
import { getOrCreateSessionStore } from "../session/store";
import { createApiClient } from "./client";

export const apiClient = createApiClient({
  fetchImpl: (input, init) => fetch(input, init),
  store: getOrCreateSessionStore(),
  config: { apiBase: env.apiBase },
});

export const onUnauthorized = apiClient.onUnauthorized;

export type {
  ApiClient,
  ApiError,
  ApiErrorCode,
  HttpMethod,
  RequestOptions,
  ServiceName,
} from "./types";
export { createApiClient } from "./client";
export type { ApiClientConfig, CreateApiClientDeps } from "./client";
