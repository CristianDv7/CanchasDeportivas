// RED (tasks.md 2.3): las 9 filas de la tabla de `mapApiError` — design.md
// §3. `status` es el ÚNICO discriminador (nunca `code` ni el texto de
// `detail`), por eso el caso 400 se fabrica con `code:"unknown"` a propósito.
import { describe, expect, it } from "vitest";
import type { ApiError, ApiErrorCode, HttpMethod } from "shell/apiClient";
import { isApiError, mapApiError } from "./errors";

function fakeApiError(input: {
  status: number;
  code: ApiErrorCode;
  detail: string;
}): ApiError {
  class ApiErrorImpl extends Error implements ApiError {
    readonly name = "ApiError" as const;
    readonly status: number;
    readonly code: ApiErrorCode;
    readonly detail: string;
    readonly body: unknown = null;
    readonly method: HttpMethod = "GET";
    readonly url: string = "/reservas/";

    constructor(status: number, code: ApiErrorCode, detail: string) {
      super(detail);
      this.status = status;
      this.code = code;
      this.detail = detail;
    }
  }
  return new ApiErrorImpl(input.status, input.code, input.detail);
}

describe("mapApiError", () => {
  it("400 (incl. code 'unknown'): detail verbatim + refetch-disponibilidad", () => {
    const error = fakeApiError({
      status: 400,
      code: "unknown",
      detail: "Ya existe una reserva para ese bloque.",
    });
    expect(mapApiError(error)).toEqual({
      message: "Ya existe una reserva para ese bloque.",
      action: "refetch-disponibilidad",
      status: 400,
    });
  });

  it("403: mensaje propio, ignora el detail del backend", () => {
    const error = fakeApiError({ status: 403, code: "forbidden", detail: "irrelevante" });
    const result = mapApiError(error);
    expect(result.action).toBe("none");
    expect(result.status).toBe(403);
    expect(result.message).not.toBe("irrelevante");
  });

  it("404: mensaje propio, ignora el detail del backend", () => {
    const error = fakeApiError({ status: 404, code: "not_found", detail: "irrelevante" });
    const result = mapApiError(error);
    expect(result.action).toBe("none");
    expect(result.status).toBe(404);
    expect(result.message).not.toBe("irrelevante");
  });

  it("422: detail ya aplanado por apiClient", () => {
    const error = fakeApiError({
      status: 422,
      code: "validation",
      detail: "fecha: campo inválido",
    });
    expect(mapApiError(error)).toEqual({
      message: "fecha: campo inválido",
      action: "none",
      status: 422,
    });
  });

  it("401: sesión expirada, sin acción de navegación propia", () => {
    const error = fakeApiError({ status: 401, code: "unauthorized", detail: "irrelevante" });
    const result = mapApiError(error);
    expect(result.action).toBe("none");
    expect(result.status).toBe(401);
  });

  it("5xx: mensaje genérico con retry", () => {
    const error = fakeApiError({ status: 503, code: "server", detail: "irrelevante" });
    const result = mapApiError(error);
    expect(result.action).toBe("retry");
    expect(result.status).toBe(503);
  });

  it("status 0 + code network: retry", () => {
    const error = fakeApiError({
      status: 0,
      code: "network",
      detail: "No se pudo conectar con el servidor.",
    });
    const result = mapApiError(error);
    expect(result.action).toBe("retry");
    expect(result.status).toBe(0);
  });

  it("status 0 + code aborted: retry", () => {
    const error = fakeApiError({ status: 0, code: "aborted", detail: "La solicitud fue cancelada." });
    const result = mapApiError(error);
    expect(result.action).toBe("retry");
    expect(result.status).toBe(0);
  });

  it("no-ApiError: mensaje genérico, sin inventar semántica HTTP", () => {
    const result = mapApiError(new TypeError("boom"));
    expect(result).toEqual({
      message: "Ocurrió un error inesperado.",
      action: "none",
      status: 0,
    });
  });
});

describe("isApiError", () => {
  it("duck-typing por name, no instanceof", () => {
    const error = fakeApiError({ status: 400, code: "unknown", detail: "x" });
    expect(isApiError(error)).toBe(true);
    expect(isApiError(new Error("no soy ApiError"))).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });
});
