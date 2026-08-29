// RED (tasks.md 2.4): `mapApiError` decide solo por `status` (ADR-05) — rama
// 502 propia (disyunción honesta) separada del `>=500` genérico; 400 ⇒
// `detail` verbatim con `action:"none"` (no hay grilla que resincronizar).
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
    readonly url: string = "/reportes/reservas/periodo";

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
  it("400: detail verbatim + action none (bloqueado antes del request client-side)", () => {
    const error = fakeApiError({
      status: 400,
      code: "unknown",
      detail: "fecha_inicio debe ser anterior o igual a fecha_fin",
    });
    expect(mapApiError(error)).toEqual({
      message: "fecha_inicio debe ser anterior o igual a fecha_fin",
      action: "none",
      status: 400,
    });
  });

  it("502: mensaje de disyunción honesta + action retry, distinto del genérico >=500", () => {
    const error = fakeApiError({ status: 502, code: "server", detail: "Bad Gateway" });

    const result = mapApiError(error);

    expect(result.action).toBe("retry");
    expect(result.status).toBe(502);
    expect(result.message).toBe(
      "No se pudieron obtener los datos de canchas o reservas para armar el reporte",
    );
    expect(result.message).not.toBe("Bad Gateway");
  });

  it(">=500 distinto de 502: mensaje genérico con retry, distinto del mensaje de 502", () => {
    const error = fakeApiError({ status: 503, code: "server", detail: "irrelevante" });

    const result = mapApiError(error);

    expect(result.action).toBe("retry");
    expect(result.status).toBe(503);
    expect(result.message).not.toBe(
      "No se pudieron obtener los datos de canchas o reservas para armar el reporte",
    );
  });

  it("status 0 + code network: mensaje genérico con retry", () => {
    const error = fakeApiError({ status: 0, code: "network", detail: "No se pudo conectar." });

    const result = mapApiError(error);

    expect(result.action).toBe("retry");
    expect(result.status).toBe(0);
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
