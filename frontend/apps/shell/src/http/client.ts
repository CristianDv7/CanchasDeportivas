// apiClient — interceptor de autorización federado (design.md §5.1, ADR-02,
// ADR-03, ADR-07). `fetchImpl`/`store`/`config` inyectados por constructor:
// el singleton exportado en `./index.ts` es solo el wiring (task 2.2.4).
import type { SessionStore } from "../session/store";
import type {
  ApiClient,
  ApiError,
  ApiErrorCode,
  HttpMethod,
  RequestOptions,
  ServiceName,
} from "./types";

export interface ApiClientConfig {
  /** Prefijo same-origin del proxy del dev server, p.ej. '/api'. */
  readonly apiBase: string;
}

export interface CreateApiClientDeps {
  fetchImpl: typeof fetch;
  store: SessionStore;
  config: ApiClientConfig;
}

class ApiErrorImpl extends Error implements ApiError {
  readonly name = "ApiError" as const;
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly detail: string;
  readonly body: unknown;
  readonly method: HttpMethod;
  readonly url: string;

  constructor(input: {
    status: number;
    code: ApiErrorCode;
    detail: string;
    body: unknown;
    method: HttpMethod;
    url: string;
  }) {
    super(input.detail);
    this.status = input.status;
    this.code = input.code;
    this.detail = input.detail;
    this.body = input.body;
    this.method = input.method;
    this.url = input.url;
  }
}

/** Pydantic v2 prefija los ValueError de un @model_validator con "Value error, "
 * — detalle de implementación del backend, no un mensaje pensado para el
 * usuario final. Se pela acá, en el único punto donde se aplana `detail`. */
function stripPydanticValueErrorPrefix(msg: string): string {
  return msg.replace(/^Value error,\s*/, "");
}

function extractDetail(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null || !("detail" in body)) return undefined;

  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return stripPydanticValueErrorPrefix(String((item as { msg: unknown }).msg));
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }

  return undefined;
}

function mapStatusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "validation";
    default:
      return status >= 500 ? "server" : "unknown";
  }
}

async function safeParseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (text === "") return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    return text;
  } catch {
    return null;
  }
}

function appendQuery(url: string, query: RequestOptions["query"]): string {
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item));
    } else {
      params.append(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export function createApiClient(deps: CreateApiClientDeps): ApiClient {
  const { fetchImpl, store, config } = deps;
  const unauthorizedListeners = new Set<(context: { url: string }) => void>();

  // Once-guard (ADR-07): N respuestas 401 paralelas ⇒ 1 solo logout. Se
  // resetea automáticamente cuando el store vuelve a 'authenticated' (nuevo
  // login), sin acoplar apiClient a la lógica de login.
  let unauthorizedGuard = false;
  store.subscribe(() => {
    if (store.getSnapshot().status === "authenticated") unauthorizedGuard = false;
  });

  function baseUrlFor(service: ServiceName): string {
    return `${config.apiBase}/${service}`;
  }

  function emitUnauthorized(url: string): void {
    if (unauthorizedGuard) return;
    unauthorizedGuard = true;
    store.clear();
    for (const listener of unauthorizedListeners) listener({ url });
  }

  async function request<T>(
    method: HttpMethod,
    path: string,
    body: unknown,
    options: RequestOptions,
  ): Promise<T> {
    const { service, auth = true, headers = {}, query, signal, timeoutMs = 15000 } = options;
    const url = appendQuery(`${baseUrlFor(service)}${path}`, query);

    let init: RequestInit = { method, headers: { ...headers } };
    if (body !== undefined) {
      init.headers = { ...init.headers, "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }

    if (auth !== false) {
      const authorized = store.authorizeRequest(init);
      if (authorized === null) {
        throw new ApiErrorImpl({
          status: 0,
          code: "unauthorized",
          detail: "No hay una sesión activa.",
          body: null,
          method,
          url,
        });
      }
      init = authorized;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const forwardExternalAbort = () => controller.abort();
    signal?.addEventListener("abort", forwardExternalAbort);

    let response: Response;
    try {
      response = await fetchImpl(url, { ...init, signal: controller.signal });
    } catch (err) {
      const isAbort = err instanceof Error && err.name === "AbortError";
      throw new ApiErrorImpl({
        status: 0,
        code: isAbort ? "aborted" : "network",
        detail: isAbort ? "La solicitud fue cancelada." : "No se pudo conectar con el servidor.",
        body: null,
        method,
        url,
      });
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", forwardExternalAbort);
    }

    if (response.status === 401) {
      if (auth !== false) emitUnauthorized(url);
      const parsedBody = await safeParseBody(response);
      throw new ApiErrorImpl({
        status: 401,
        code: "unauthorized",
        detail: extractDetail(parsedBody) ?? "No autorizado.",
        body: parsedBody,
        method,
        url,
      });
    }

    if (response.status === 403) {
      const parsedBody = await safeParseBody(response);
      throw new ApiErrorImpl({
        status: 403,
        code: "forbidden",
        detail: extractDetail(parsedBody) ?? "Acceso denegado.",
        body: parsedBody,
        method,
        url,
      });
    }

    if (!response.ok) {
      const parsedBody = await safeParseBody(response);
      const code = mapStatusToCode(response.status);
      throw new ApiErrorImpl({
        status: response.status,
        code,
        detail: extractDetail(parsedBody) ?? `Error ${response.status}.`,
        body: parsedBody,
        method,
        url,
      });
    }

    if (response.status === 204) return undefined as T;

    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    if (text === "") return undefined as T;

    if (contentType.includes("application/json")) {
      return JSON.parse(text) as T;
    }
    return text as unknown as T;
  }

  return {
    request,
    get: (path, options) => request("GET", path, undefined, options),
    post: (path, body, options) => request("POST", path, body, options as RequestOptions),
    put: (path, body, options) => request("PUT", path, body, options as RequestOptions),
    patch: (path, body, options) => request("PATCH", path, body, options as RequestOptions),
    delete: (path, options) => request("DELETE", path, undefined, options),
    baseUrlFor,
    onUnauthorized(listener) {
      unauthorizedListeners.add(listener);
      return () => unauthorizedListeners.delete(listener);
    },
  };
}
