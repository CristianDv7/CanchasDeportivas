// RED (tasks.md 2.4): las 8 filas de ADR-10 — `status` es el ÚNICO
// discriminador (nunca `code` ni el texto de `detail`) para decidir la
// acción de UI.
import { describe, expect, it } from "vitest";
import type { ApiError, ApiErrorCode, HttpMethod } from "shell/apiClient";
import { isApiError, mapApiError } from "./errors";

function fakeApiError(input: { status: number; code: ApiErrorCode; detail: string }): ApiError {
  class ApiErrorImpl extends Error implements ApiError {
    readonly name = "ApiError" as const;
    readonly status: number;
    readonly code: ApiErrorCode;
    readonly detail: string;
    readonly body: unknown = null;
    readonly method: HttpMethod = "GET";
    readonly url: string = "/canchas";

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
  it("400: detail verbatim + action refetch", () => {
    const error = fakeApiError({
      status: 400,
      code: "unknown",
      detail: "Ya existe una cancha con ese nombre",
    });
    expect(mapApiError(error)).toEqual({
      message: "Ya existe una cancha con ese nombre",
      action: "refetch",
      status: 400,
    });
  });

  it("403: mensaje fijo, ignora detail (no ramifica por texto)", () => {
    const error = fakeApiError({ status: 403, code: "forbidden", detail: "irrelevante" });
    const result = mapApiError(error);
    expect(result.action).toBe("none");
    expect(result.status).toBe(403);
    expect(result.message).not.toBe("irrelevante");
    expect(result.message).toMatch(/permisos/i);
  });

  it("404: mensaje propio + action refetch", () => {
    const error = fakeApiError({ status: 404, code: "not_found", detail: "irrelevante" });
    const result = mapApiError(error);
    expect(result.action).toBe("refetch");
    expect(result.status).toBe(404);
    expect(result.message).not.toBe("irrelevante");
  });

  it("422: detail ya aplanado por apiClient, sin acción", () => {
    const error = fakeApiError({ status: 422, code: "validation", detail: "hora_fin: campo inválido" });
    expect(mapApiError(error)).toEqual({
      message: "hora_fin: campo inválido",
      action: "none",
      status: 422,
    });
  });

  it("401: sesión expirada, sin acción propia", () => {
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
    const error = fakeApiError({ status: 0, code: "network", detail: "No se pudo conectar." });
    expect(mapApiError(error).action).toBe("retry");
  });

  it("status 0 + code aborted: retry", () => {
    const error = fakeApiError({ status: 0, code: "aborted", detail: "cancelada" });
    expect(mapApiError(error).action).toBe("retry");
  });

  it("no-ApiError: mensaje genérico, sin inventar semántica HTTP", () => {
    const result = mapApiError(new TypeError("boom"));
    expect(result).toEqual({ message: "Ocurrió un error inesperado.", action: "none", status: 0 });
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
