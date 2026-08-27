// Tipos de la superficie federada 'shell/apiClient' (design.md §5.1).
// Puros tipos: sin lógica, no requieren test dedicado.

/** Microservicio destino. Resuelve el baseURL; el remote nunca escribe un host. */
export type ServiceName = "usuarios" | "canchas" | "reservas" | "reportes";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiErrorCode =
  | "network" // status 0: server caído, DNS, CORS, offline
  | "aborted" // AbortSignal
  | "unauthorized" // 401
  | "forbidden" // 403
  | "not_found" // 404
  | "conflict" // 409
  | "validation" // 422 (FastAPI)
  | "server" // 5xx
  | "unknown";

/** Único tipo de error que apiClient rechaza. Nunca escapa un TypeError de fetch. */
export interface ApiError extends Error {
  readonly name: "ApiError";
  readonly status: number; // 0 cuando no hubo respuesta HTTP
  readonly code: ApiErrorCode;
  /** Mensaje mostrable. De FastAPI `detail`; si es 422, ya viene aplanado. */
  readonly detail: string;
  /** Body crudo parseado, para casos que necesiten el shape completo. */
  readonly body: unknown;
  readonly method: HttpMethod;
  readonly url: string;
}

export interface RequestOptions {
  /** Query string. `undefined` y `null` se omiten; arrays → repetición de clave. */
  query?: Record<string, string | number | boolean | null | undefined | Array<string | number>>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /**
   * Default true. `false` ⇒ (a) no inyecta credenciales,
   * (b) un 401 NO dispara el logout global. Usar en /auth/login.
   */
  auth?: boolean;
  /** Obligatorio en la práctica: no hay default. */
  service: ServiceName;
  /** ms; default 15000. Vencido ⇒ ApiError code:'aborted'. */
  timeoutMs?: number;
}

/** Igual a RequestOptions pero `service` obligatorio ya viene de arriba. */
export interface ApiClient {
  request<T>(method: HttpMethod, path: string, body: unknown, options: RequestOptions): Promise<T>;

  get<T>(path: string, options: RequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>;
  delete<T>(path: string, options: RequestOptions): Promise<T>;

  /** Introspección para debug/health cards. No usar para armar requests a mano. */
  baseUrlFor(service: ServiceName): string;

  /**
   * Se notifica cuando un request autenticado recibió 401 y la sesión fue limpiada.
   * Lo consume SOLO el shell (para navegar a /login). Devuelve unsubscribe.
   */
  onUnauthorized(listener: (context: { url: string }) => void): () => void;
}
