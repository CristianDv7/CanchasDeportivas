// RED (tasks.md 3.3): design.md §3/ADR-07 — 3 handlers OK → ReservaAdmin[]
// enriquecido; GET /usuarios 403 → panel degradado pero operativo; GET
// /reservas/ 500 → throw propagado (re-throw explícito de `r.reason`).
// Requiere seedSession() admin (gotcha crítico de design.md §7).
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { errorScenarios } from "../mocks/handlers";
import { seedSession } from "../mocks/session";
import { server } from "../mocks/server";
import { reservasAdminApi } from "./reservasAdminApi";

beforeEach(() => {
  seedSession();
});

describe("reservasAdminApi.listPanel", () => {
  it("3 handlers OK ⇒ ReservaAdmin[] enriquecido con nombre de cancha y usuario", async () => {
    const resultado = await reservasAdminApi.listPanel();

    expect(resultado.length).toBeGreaterThan(0);
    const primera = resultado[0]!;
    expect(primera.canchaLabel).not.toMatch(/^Cancha #/);
    expect(primera.usuarioLabel).not.toMatch(/^Usuario #/);
  });

  it("GET /usuarios 403 ⇒ panel degradado (Usuario #N) pero operativo", async () => {
    server.use(errorScenarios.usuariosDown());

    const resultado = await reservasAdminApi.listPanel();

    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.every((r) => r.usuarioLabel.startsWith("Usuario #"))).toBe(true);
    // La cancha sigue resuelta: solo usuarios falló.
    expect(resultado[0]!.canchaLabel).not.toMatch(/^Cancha #/);
  });

  it("GET /reservas/ 500 ⇒ throw propagado (ADR-07, no absorbido por allSettled)", async () => {
    server.use(errorScenarios.reservasDown());

    await expect(reservasAdminApi.listPanel()).rejects.toMatchObject({ name: "ApiError", status: 500 });
  });
});

describe("reservasAdminApi.cancelar", () => {
  it("PATCH /reservas/:id/cancelar devuelve la reserva con estado Cancelada", async () => {
    server.use(
      http.patch("/api/reservas/reservas/:id/cancelar", ({ params }) =>
        HttpResponse.json({
          id: Number(params.id),
          usuario_id: 2,
          cancha_id: 1,
          fecha: "2026-08-28",
          hora_inicio: "10:00:00",
          hora_fin: "11:00:00",
          estado: "Cancelada",
          created_at: "2026-08-20T00:00:00",
          updated_at: "2026-08-28T00:00:00",
        }),
      ),
    );

    const resultado = await reservasAdminApi.cancelar(10);
    expect(resultado.estado).toBe("Cancelada");
  });
});
