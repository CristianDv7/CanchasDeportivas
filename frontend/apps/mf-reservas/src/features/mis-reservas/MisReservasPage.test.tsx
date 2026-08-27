// RED (tasks.md 8.1-8.3): spec.md "Cancelar reserva (RN-03/RN-04/RN-05)" +
// "Badges de estado (RN-08)" — design.md §4/§5/§7. Cubre: badge por estado
// (Confirmada/Cancelada/Finalizada), cancelación exitosa con actualización
// de la lista (refetch) y el botón Cancelar deshabilitado por RN-04 (bloque
// ya iniciado, reloj congelado con `vi.setSystemTime` — design.md §5 tabla
// "Nivel de test") y por estado ≠ Confirmada.
import { HttpResponse, http } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reservaRaw } from "../../mocks/fixtures";
import { seedSession } from "../../mocks/session";
import { server } from "../../mocks/server";
import { MisReservasPage } from "./MisReservasPage";

// Ancla de reloj para todo el archivo: anterior a las fechas de los fixtures
// locales de este test (2026-07-xx), así ninguna reserva aparece "iniciada"
// salvo que un test la mueva explícitamente (design.md §5).
beforeEach(() => {
  seedSession();
  vi.setSystemTime(new Date("2026-06-15T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

function mockListaMias(reservas: readonly ReturnType<typeof reservaRaw>[]) {
  server.use(http.get("/api/reservas/reservas/", () => HttpResponse.json(reservas)));
}

describe("MisReservasPage", () => {
  it("muestra el badge correspondiente a cada estado (8.1)", async () => {
    mockListaMias([
      reservaRaw({ id: 1, estado: "Confirmada", fecha: "2026-07-01" }),
      reservaRaw({ id: 2, estado: "Cancelada", fecha: "2026-07-02" }),
      reservaRaw({ id: 3, estado: "Finalizada", fecha: "2026-05-01" }),
    ]);

    render(<MisReservasPage />);

    const badges = await screen.findAllByTestId("estado-badge");
    expect(badges).toHaveLength(3);
    expect(badges[0]).toHaveTextContent("Confirmada");
    expect(badges[1]).toHaveTextContent("Cancelada");
    expect(badges[2]).toHaveTextContent("Finalizada");
  });

  it("cancelación exitosa: la reserva pasa a Cancelada y la lista se actualiza (8.2)", async () => {
    let listCalls = 0;
    server.use(
      http.get("/api/reservas/reservas/", () => {
        listCalls += 1;
        const estado = listCalls === 1 ? "Confirmada" : "Cancelada";
        return HttpResponse.json([reservaRaw({ id: 10, estado })]);
      }),
      http.patch("/api/reservas/reservas/:id/cancelar", () =>
        HttpResponse.json(reservaRaw({ id: 10, estado: "Cancelada" })),
      ),
    );

    render(<MisReservasPage />);
    const user = userEvent.setup();

    expect(await screen.findByTestId("estado-badge")).toHaveTextContent("Confirmada");

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(listCalls).toBe(2));
    await waitFor(() => expect(screen.getByTestId("estado-badge")).toHaveTextContent("Cancelada"));
  });

  it("RN-04: botón Cancelar deshabilitado cuando el bloque ya inició (8.3)", async () => {
    mockListaMias([
      reservaRaw({ id: 20, estado: "Confirmada", fecha: "2026-07-01", hora_inicio: "10:00:00" }),
    ]);
    // El bloque de 2026-07-01T10:00:00Z ya arrancó respecto a este reloj.
    vi.setSystemTime(new Date("2026-07-01T11:00:00Z"));

    render(<MisReservasPage />);

    const boton = await screen.findByRole("button", { name: /cancelar/i });
    expect(boton).toBeDisabled();
  });

  it("RN-04: botón Cancelar deshabilitado cuando el estado no es Confirmada (8.3)", async () => {
    mockListaMias([reservaRaw({ id: 30, estado: "Cancelada", fecha: "2026-07-05" })]);

    render(<MisReservasPage />);

    const boton = await screen.findByRole("button", { name: /cancelar/i });
    expect(boton).toBeDisabled();
  });
});
