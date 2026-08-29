// RED (tasks.md 4.1): design.md §4 (ADR-02, copia de mf-administracion,
// tercera copia — proposal Decisión 2). Requiere seedSession() admin: sin
// sesión, apiClient corta el request ANTES de que MSW lo vea.
import { HttpResponse, delay, http } from "msw";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportesApi } from "../api/reportesApi";
import { seedSession } from "../mocks/session";
import { server } from "../mocks/server";
import { useResource } from "./useResource";

beforeEach(() => {
  seedSession();
});

describe("useResource", () => {
  it("enabled:false → status idle, nunca dispara el fetcher", () => {
    const fetcher = vi.fn(reportesApi.ocupacionCanchas);

    const { result } = renderHook(() => useResource(fetcher, [], { enabled: false }));

    expect(result.current.status).toBe("idle");
    expect(result.current.data).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refetch() conserva `data` mientras vuelve a cargar (no parpadea)", async () => {
    const { result } = renderHook(() => useResource(reportesApi.ocupacionCanchas, []));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).not.toBeNull();
    const primeraData = result.current.data;

    server.use(
      http.get("/api/reportes/reportes/ocupacion/canchas", async () => {
        await delay(20);
        return HttpResponse.json([]);
      }),
    );

    act(() => {
      result.current.refetch();
    });

    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBe(primeraData);

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual([]);
  });

  it("abort en cambio de deps: la respuesta vieja no pisa a la nueva", async () => {
    let calls = 0;
    server.use(
      http.get("/api/reportes/reportes/reservas/periodo", async () => {
        calls += 1;
        if (calls === 1) {
          await delay(50);
          return HttpResponse.json({ fecha_inicio: "a", fecha_fin: "b", total_reservas: 1 });
        }
        return HttpResponse.json({ fecha_inicio: "a", fecha_fin: "b", total_reservas: 2 });
      }),
    );

    const { result, rerender } = renderHook(
      ({ dep }: { dep: number }) =>
        useResource(() => reportesApi.reservasPeriodo("2026-01-01", "2026-01-02"), [dep]),
      { initialProps: { dep: 1 } },
    );

    rerender({ dep: 2 });

    await waitFor(() => expect(result.current.status).toBe("success"));

    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(result.current.data).toEqual({
      fechaInicio: "a",
      fechaFin: "b",
      totalReservas: 2,
    });
  });
});
