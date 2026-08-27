// RED (tasks.md 4.3): design.md §4. `run()` nunca throwea — captura,
// mapea con `mapApiError` y devuelve `null`, para que el `onSubmit` de la
// UI sea lineal (`if (creada === null) return;`) sin try/catch propio.
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ApiError, ApiErrorCode, HttpMethod } from "shell/apiClient";
import { useAction } from "./useAction";

function fakeApiError(input: { status: number; code: ApiErrorCode; detail: string }): ApiError {
  class ApiErrorImpl extends Error implements ApiError {
    readonly name = "ApiError" as const;
    readonly status: number;
    readonly code: ApiErrorCode;
    readonly detail: string;
    readonly body: unknown = null;
    readonly method: HttpMethod = "POST";
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

describe("useAction", () => {
  it("run() exitoso: devuelve el resultado, sin error, pending vuelve a false", async () => {
    const fn = async (args: { id: number }) => ({ ok: true, id: args.id });
    const { result } = renderHook(() => useAction(fn));

    let devuelto: { ok: boolean; id: number } | null = null;
    await act(async () => {
      devuelto = await result.current.run({ id: 1 });
    });

    expect(devuelto).toEqual({ ok: true, id: 1 });
    expect(result.current.error).toBeNull();
    expect(result.current.pending).toBe(false);
  });

  it("run() nunca throwea: en error, devuelve null y expone `error` mapeado", async () => {
    const error = fakeApiError({
      status: 403,
      code: "forbidden",
      detail: "irrelevante para la UI",
    });
    const fn = async () => {
      throw error;
    };
    const { result } = renderHook(() => useAction(fn));

    let devuelto: unknown = "sin-asignar";
    await expect(
      act(async () => {
        devuelto = await result.current.run(undefined);
      }),
    ).resolves.not.toThrow();

    expect(devuelto).toBeNull();
    expect(result.current.pending).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.status).toBe(403);
    expect(result.current.error?.action).toBe("none");
  });

  it("pending es true mientras la promesa está en vuelo", async () => {
    let resolver!: () => void;
    const fn = () =>
      new Promise<void>((resolve) => {
        resolver = resolve;
      });
    const { result } = renderHook(() => useAction(fn));

    let runPromise!: Promise<void | null>;
    act(() => {
      runPromise = result.current.run(undefined);
    });

    expect(result.current.pending).toBe(true);

    await act(async () => {
      resolver();
      await runPromise;
    });

    expect(result.current.pending).toBe(false);
  });

  it("reset() limpia el error", async () => {
    const fn = async () => {
      throw fakeApiError({ status: 404, code: "not_found", detail: "x" });
    };
    const { result } = renderHook(() => useAction(fn));

    await act(async () => {
      await result.current.run(undefined);
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    await waitFor(() => expect(result.current.error).toBeNull());
  });
});
