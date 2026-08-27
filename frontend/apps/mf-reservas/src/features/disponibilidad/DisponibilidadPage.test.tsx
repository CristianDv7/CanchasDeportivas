// RED (tasks.md 6.1): spec.md "Ver disponibilidad" + design.md §4/§7. Cubre
// selección de cancha+fecha, grilla libre/ocupado vía el adapter
// (`reservasApi.getDisponibilidad` — contrato REAL: `horarios-atencion` +
// `list[ReservaResponse]` de `reservas/disponibilidad`, mockeados con MSW) y
// el estado de error (ErrorBanner) cuando la consulta falla.
import { HttpResponse, http } from "msw";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { reservasApi } from "../../api";
import { seedSession } from "../../mocks/session";
import { server } from "../../mocks/server";
import { DisponibilidadPage } from "./DisponibilidadPage";

beforeEach(() => {
  seedSession();
});

async function esperarCanchasCargadas() {
  await waitFor(() =>
    expect(screen.getByTestId("cancha-select").children.length).toBeGreaterThan(1),
  );
}

describe("DisponibilidadPage", () => {
  it("muestra la grilla con bloques libres y ocupados según el adapter", async () => {
    render(<DisponibilidadPage />);
    const user = userEvent.setup();

    await esperarCanchasCargadas();
    await user.selectOptions(screen.getByTestId("cancha-select"), "1");
    fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "2026-08-28" } });

    const bloques = await screen.findAllByTestId("bloque");
    expect(bloques).toHaveLength(3);
    expect(bloques[0]).toHaveAttribute("data-estado", "libre");
    expect(bloques[1]).toHaveAttribute("data-estado", "libre");
    expect(bloques[2]).toHaveAttribute("data-estado", "ocupado");
  });

  it("cancha sin horario de atención ese día: grilla vacía sin error", async () => {
    server.use(
      http.get("/api/canchas/horarios-atencion", () => HttpResponse.json([])),
      http.get("/api/reservas/reservas/disponibilidad", () => HttpResponse.json([])),
    );

    render(<DisponibilidadPage />);
    const user = userEvent.setup();

    await esperarCanchasCargadas();
    await user.selectOptions(screen.getByTestId("cancha-select"), "2");
    fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "2026-08-01" } });

    expect(await screen.findByTestId("bloques-grid-vacia")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bloque")).not.toBeInTheDocument();
  });

  it("error del servidor al consultar disponibilidad: muestra ErrorBanner con Reintentar", async () => {
    server.use(
      http.get("/api/reservas/reservas/disponibilidad", () =>
        HttpResponse.json({ detail: "Error interno" }, { status: 500 }),
      ),
    );

    render(<DisponibilidadPage />);
    const user = userEvent.setup();

    await esperarCanchasCargadas();
    await user.selectOptions(screen.getByTestId("cancha-select"), "1");
    fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "2026-08-28" } });

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent(/no pudo procesar/i);
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("CONTRATO: usuario_id de terceros (real en list[ReservaResponse]) nunca llega al Disponibilidad del adapter", async () => {
    server.use(
      http.get("/api/reservas/reservas/disponibilidad", () =>
        HttpResponse.json([
          {
            id: 999,
            usuario_id: 424242,
            cancha_id: 1,
            fecha: "2026-08-28",
            hora_inicio: "10:00:00",
            hora_fin: "11:00:00",
            estado: "Confirmada",
            created_at: "2026-08-20T00:00:00",
            updated_at: "2026-08-20T00:00:00",
          },
        ]),
      ),
    );

    seedSession();
    const disponibilidad = await reservasApi.getDisponibilidad(1, "2026-08-28");

    const serializado = JSON.stringify(disponibilidad);
    expect(serializado).not.toMatch(/usuario_id|usuarioId|424242/);
    expect(disponibilidad.bloques.find((b) => b.horaInicio === "10:00:00")?.estado).toBe(
      "ocupado",
    );
  });
});
