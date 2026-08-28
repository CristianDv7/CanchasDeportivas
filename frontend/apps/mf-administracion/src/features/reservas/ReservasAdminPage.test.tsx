// RED (tasks.md 9.1-9.6): spec.md mf-administracion-reservas — design.md
// §4/§6 (Phase 9). Panel global de reservas: enrichment, degradación,
// filtros con contador, cancelación RN-03 y RN-04 sin bypass admin, badges.
import { HttpResponse, http } from "msw";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorScenarios } from "../../mocks/handlers";
import { seedSession } from "../../mocks/session";
import { server } from "../../mocks/server";
import { ReservasAdminPage } from "./ReservasAdminPage";

// Ancla de reloj: anterior a las fechas de las fixtures/overrides de este
// archivo, así ninguna reserva aparece "iniciada" salvo que un test la mueva
// explícitamente (mismo criterio que mf-reservas).
beforeEach(() => {
  seedSession();
  vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ReservasAdminPage — listado enriquecido (9.1)", () => {
  it("cada fila muestra nombre de cancha y usuario, no solo ids", async () => {
    render(<ReservasAdminPage />);

    const filas = await screen.findAllByTestId("reserva-admin-row");
    expect(filas.length).toBeGreaterThan(0);
    expect(within(filas[0]!).getByTestId("reserva-cancha-label")).not.toHaveTextContent(/^Cancha #/);
    expect(within(filas[0]!).getByTestId("reserva-usuario-label")).not.toHaveTextContent(/^Usuario #/);
  });
});

describe("ReservasAdminPage — degradación (9.2)", () => {
  it("GET /usuarios falla ⇒ usuario_id crudo, panel operable y cancelación disponible", async () => {
    server.use(errorScenarios.usuariosDown());

    render(<ReservasAdminPage />);

    const filas = await screen.findAllByTestId("reserva-admin-row");
    expect(within(filas[0]!).getByTestId("reserva-usuario-label")).toHaveTextContent(/^Usuario #/);
    // La cancha sigue resuelta: solo usuarios degradó.
    expect(within(filas[0]!).getByTestId("reserva-cancha-label")).not.toHaveTextContent(/^Cancha #/);
  });
});

describe("ReservasAdminPage — filtros con contador (9.3)", () => {
  it("filtrar por estado actualiza el contador N de M", async () => {
    render(<ReservasAdminPage />);
    await screen.findAllByTestId("reserva-admin-row");

    // "Solo próximas" está activo por default (ADR-09): lo desactivamos para
    // que el total incluya el histórico completo de las fixtures (3).
    await userEvent.click(screen.getByLabelText(/solo próximas/i));
    await waitFor(() => expect(screen.getByTestId("reservas-contador")).toHaveTextContent("3 de 3"));

    await userEvent.selectOptions(screen.getByLabelText(/^estado$/i), "Cancelada");

    await waitFor(() => expect(screen.getByTestId("reservas-contador")).toHaveTextContent("1 de 3"));
    const filas = screen.getAllByTestId("reserva-admin-row");
    expect(filas).toHaveLength(1);
  });
});

describe("ReservasAdminPage — cancelación RN-03", () => {
  it("admin cancela reserva de OTRO usuario: pasa a Cancelada y refetchea (9.4)", async () => {
    let listCalls = 0;
    server.use(
      http.get("/api/reservas/reservas/", () => {
        listCalls += 1;
        const estado = listCalls === 1 ? "Confirmada" : "Cancelada";
        return HttpResponse.json([
          {
            id: 50,
            usuario_id: 99, // distinto del admin de sesión (id:1, mocks/session.ts)
            cancha_id: 1,
            fecha: "2026-09-01",
            hora_inicio: "10:00:00",
            hora_fin: "11:00:00",
            estado,
            created_at: "2026-08-01T00:00:00",
            updated_at: "2026-08-01T00:00:00",
          },
        ]);
      }),
      http.patch("/api/reservas/reservas/:id/cancelar", () =>
        HttpResponse.json({
          id: 50,
          usuario_id: 99,
          cancha_id: 1,
          fecha: "2026-09-01",
          hora_inicio: "10:00:00",
          hora_fin: "11:00:00",
          estado: "Cancelada",
          created_at: "2026-08-01T00:00:00",
          updated_at: "2026-08-28T00:00:00",
        }),
      ),
    );

    render(<ReservasAdminPage />);
    const fila = await screen.findByTestId("reserva-admin-row");
    expect(within(fila).getByTestId("estado-badge")).toHaveTextContent("Confirmada");

    await userEvent.click(within(fila).getByRole("button", { name: /cancelar/i }));

    await waitFor(() => expect(listCalls).toBe(2));
    await waitFor(() =>
      expect(within(screen.getByTestId("reserva-admin-row")).getByTestId("estado-badge")).toHaveTextContent(
        "Cancelada",
      ),
    );
  });
});

describe("ReservasAdminPage — RN-04 sin bypass para admin (9.5)", () => {
  it("botón Cancelar deshabilitado si la reserva ya inició, aunque el rol sea admin", async () => {
    server.use(
      http.get("/api/reservas/reservas/", () =>
        HttpResponse.json([
          {
            id: 60,
            usuario_id: 2,
            cancha_id: 1,
            fecha: "2026-07-01",
            hora_inicio: "10:00:00",
            hora_fin: "11:00:00",
            estado: "Confirmada",
            created_at: "2026-06-01T00:00:00",
            updated_at: "2026-06-01T00:00:00",
          },
        ]),
      ),
    );
    vi.setSystemTime(new Date("2026-07-01T11:00:00Z")); // el bloque ya arrancó

    render(<ReservasAdminPage />);

    // ADR-09: "solo próximas" (default) oculta lo ya iniciado — apagamos el
    // toggle para poder ver la fila y verificar el botón deshabilitado
    // (RN-04 es sobre `canCancel`, no sobre el filtro de visibilidad).
    await waitFor(() => expect(screen.getByTestId("reservas-contador")).toHaveTextContent("0 de 1"));
    await userEvent.click(screen.getByLabelText(/solo próximas/i));

    const boton = await screen.findByRole("button", { name: /cancelar/i });
    expect(boton).toBeDisabled();
  });

  it("botón Cancelar deshabilitado si el estado no es Confirmada, aunque el rol sea admin", async () => {
    server.use(
      http.get("/api/reservas/reservas/", () =>
        HttpResponse.json([
          {
            id: 61,
            usuario_id: 2,
            cancha_id: 1,
            fecha: "2026-09-01",
            hora_inicio: "10:00:00",
            hora_fin: "11:00:00",
            estado: "Finalizada",
            created_at: "2026-06-01T00:00:00",
            updated_at: "2026-06-01T00:00:00",
          },
        ]),
      ),
    );

    render(<ReservasAdminPage />);

    const boton = await screen.findByRole("button", { name: /cancelar/i });
    expect(boton).toBeDisabled();
  });
});

describe("ReservasAdminPage — badges por estado (9.6, RN-08)", () => {
  it("muestra el badge correspondiente a cada estado en el panel global", async () => {
    // "Solo próximas" es default: forzamos reloj anterior a TODAS las fechas
    // de las fixtures (incluida la Finalizada de 2026-08-01) para que las 3
    // aparezcan sin tocar el toggle.
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    render(<ReservasAdminPage />);

    const badges = await screen.findAllByTestId("estado-badge");
    expect(badges.length).toBe(3);
    const labels = badges.map((b) => b.textContent);
    expect(labels).toEqual(expect.arrayContaining(["Confirmada", "Finalizada", "Cancelada"]));
  });
});
