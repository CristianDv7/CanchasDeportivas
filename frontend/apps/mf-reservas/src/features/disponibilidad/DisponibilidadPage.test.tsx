// RED (tasks.md 6.1): spec.md "Ver disponibilidad" + design.md §4/§7. Cubre
// selección de cancha+fecha, grilla libre/ocupado vía el adapter
// (`reservasApi.getDisponibilidad` — contrato PROPUESTO, mockeado con MSW) y
// el estado de error (ErrorBanner) cuando la consulta falla.
import { HttpResponse, http } from "msw";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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
      http.get("/api/reservas/reservas/disponibilidad", () =>
        HttpResponse.json({ cancha_id: 2, fecha: "2026-08-01", bloques: [] }),
      ),
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
});
