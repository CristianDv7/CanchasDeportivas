// RED (tasks.md 4.1): design.md §4. Requiere seedSession() (mocks/session.ts
// — gotcha crítico de design.md §9): sin sesión, apiClient corta el request
// ANTES de que MSW lo vea y estos tests fallarían por el motivo equivocado.
// Se ejercita el `apiClient` real vía `reservasApi`/`canchasApi` + MSW, no un
// fetcher fabricado a mano, para probar la integración completa del hook.
import { HttpResponse, delay, http } from "msw";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { canchasApi } from "../api/canchasApi";
import { reservasApi } from "../api/reservasApi";
import { seedSession } from "../mocks/session";
import { server } from "../mocks/server";
import { useResource } from "./useResource";

beforeEach(() => {
  seedSession();
});

describe("useResource", () => {
  it("enabled:false → status idle, nunca dispara el fetcher", () => {
    const fetcher = vi.fn(reservasApi.listMias);

    const { result } = renderHook(() => useResource(fetcher, [], { enabled: false }));

    expect(result.current.status).toBe("idle");
    expect(result.current.data).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refetch() conserva `data` mientras vuelve a cargar (no parpadea)", async () => {
    const { result } = renderHook(() => useResource(reservasApi.listMias, []));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).not.toBeNull();
    const primeraData = result.current.data;

    server.use(
      http.get("/api/reservas/reservas/", async () => {
        await delay(20);
        return HttpResponse.json([]);
      }),
    );

    act(() => {
      result.current.refetch();
    });

    // Mientras la segunda request está en vuelo, `data` sigue siendo la
    // anterior: status "loading" con data !== null (design.md §4, punto 4).
    expect(result.current.status).toBe("loading");
    expect(result.current.data).toBe(primeraData);

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual([]);
  });

  it("abort en cambio de deps: la respuesta vieja no pisa a la nueva", async () => {
    let calls = 0;
    server.use(
      http.get("/api/canchas/canchas", async () => {
        calls += 1;
        if (calls === 1) {
          // Primera request (deps=[1]): deliberadamente lenta.
          await delay(50);
          return HttpResponse.json([
            { id: 1, nombre: "vieja", deporte_id: 1, activo: true, created_at: "", updated_at: "" },
          ]);
        }
        // Segunda request (deps=[2]): resuelve antes que la primera.
        return HttpResponse.json([
          { id: 2, nombre: "nueva", deporte_id: 1, activo: true, created_at: "", updated_at: "" },
        ]);
      }),
    );

    const { result, rerender } = renderHook(
      ({ dep }: { dep: number }) => useResource(canchasApi.list, [dep]),
      { initialProps: { dep: 1 } },
    );

    rerender({ dep: 2 });

    await waitFor(() => expect(result.current.status).toBe("success"));

    // Deja pasar tiempo suficiente para que la request vieja (50ms) hubiera
    // resuelto de no haber sido ignorada/abortada.
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(result.current.data).toEqual([{ id: 2, nombre: "nueva", deporteId: 1, activa: true }]);
  });
});
