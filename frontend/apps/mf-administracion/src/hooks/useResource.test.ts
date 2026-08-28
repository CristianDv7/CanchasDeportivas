// RED (tasks.md 6.1): design.md §4 (ADR-02, copia de mf-reservas). Requiere
// seedSession() admin (gotcha crítico de design.md §7): sin sesión,
// apiClient corta el request ANTES de que MSW lo vea.
import { HttpResponse, delay, http } from "msw";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { canchasApi } from "../api/canchasApi";
import { deportesApi } from "../api/deportesApi";
import { seedSession } from "../mocks/session";
import { server } from "../mocks/server";
import { useResource } from "./useResource";

beforeEach(() => {
  seedSession();
});

describe("useResource", () => {
  it("enabled:false → status idle, nunca dispara el fetcher", () => {
    const fetcher = vi.fn(canchasApi.list);

    const { result } = renderHook(() => useResource(fetcher, [], { enabled: false }));

    expect(result.current.status).toBe("idle");
    expect(result.current.data).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("refetch() conserva `data` mientras vuelve a cargar (no parpadea)", async () => {
    const { result } = renderHook(() => useResource(deportesApi.list, []));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).not.toBeNull();
    const primeraData = result.current.data;

    server.use(
      http.get("/api/canchas/deportes", async () => {
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
      http.get("/api/canchas/canchas", async () => {
        calls += 1;
        if (calls === 1) {
          await delay(50);
          return HttpResponse.json([
            { id: 1, nombre: "vieja", deporte_id: 1, activo: true, created_at: "", updated_at: "" },
          ]);
        }
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

    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(result.current.data).toEqual([{ id: 2, nombre: "nueva", deporteId: 1, activa: true }]);
  });
});
