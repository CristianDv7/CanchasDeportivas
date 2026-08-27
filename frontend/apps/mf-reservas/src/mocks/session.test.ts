// Prueba el gotcha crítico documentado en design.md §9 ("Sesión"): sin
// `seedSession()`, `apiClient` corta el request ANTES de que MSW lo vea.
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { apiClient } from "shell/apiClient";
import { server } from "./server";
import { clearSession, seedSession } from "./session";

beforeEach(() => {
  clearSession();
  server.use(http.get("/api/reservas/ping", () => HttpResponse.json({ pong: true })));
});

describe("seedSession", () => {
  it("sin sesión, apiClient corta el request antes de que MSW lo vea", async () => {
    await expect(apiClient.get("/ping", { service: "reservas" })).rejects.toMatchObject({
      status: 0,
      code: "unauthorized",
    });
  });

  it("con seedSession(), el request llega a MSW y se resuelve", async () => {
    seedSession();

    const body = await apiClient.get("/ping", { service: "reservas" });

    expect(body).toEqual({ pong: true });
  });
});
