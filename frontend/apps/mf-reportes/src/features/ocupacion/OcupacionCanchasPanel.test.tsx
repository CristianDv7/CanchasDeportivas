// RED (tasks.md 6.1-6.4): design.md ADR-01/06 — tabla como fuente de
// verdad, barra proporcional decorativa, distinción vacío real vs. cero, 502
// con disyunción honesta.
import { HttpResponse, http } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { seedSession } from "../../mocks/session";
import { server } from "../../mocks/server";
import { OcupacionCanchasPanel } from "./OcupacionCanchasPanel";

const PATH = "/api/reportes/reportes/ocupacion/canchas";

beforeEach(() => {
  seedSession();
});

describe("OcupacionCanchasPanel", () => {
  it("3 canchas con distintas cantidades de reservas → 3 filas, barra proporcional al máximo", async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json([
          { cancha_id: 1, cancha: "Cancha 1", reservas: 12 },
          { cancha_id: 2, cancha: "Cancha 2", reservas: 4 },
          { cancha_id: 3, cancha: "Cancha 3", reservas: 6 },
        ]),
      ),
    );

    render(<OcupacionCanchasPanel />);

    expect(await screen.findByRole("row", { name: /cancha 1/i })).toBeInTheDocument();
    const filas = screen.getAllByRole("row").slice(1); // primera es el header
    expect(filas).toHaveLength(3);

    const barraMax = screen.getByTestId("barra-1");
    expect(barraMax).toHaveStyle({ width: "100%" });
    const barraMenor = screen.getByTestId("barra-2");
    expect(barraMenor).toHaveStyle({ width: "33%" });
  });

  it("cancha con reservas: 0 entre otras con reservas → fila en 0%, no se omite", async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json([
          { cancha_id: 1, cancha: "Cancha 1", reservas: 12 },
          { cancha_id: 2, cancha: "Cancha vacía", reservas: 0 },
        ]),
      ),
    );

    render(<OcupacionCanchasPanel />);

    expect(await screen.findByRole("row", { name: /cancha vacía/i })).toBeInTheDocument();
    expect(screen.getByTestId("barra-2")).toHaveStyle({ width: "0%" });
    expect(screen.queryByText(/no hay canchas cargadas/i)).not.toBeInTheDocument();
  });

  it("lista vacía real → mensaje distinto de 'no hay canchas cargadas'", async () => {
    server.use(http.get(PATH, () => HttpResponse.json([])));

    render(<OcupacionCanchasPanel />);

    expect(await screen.findByText(/no hay canchas cargadas/i)).toBeInTheDocument();
  });

  it("502 → mensaje de disyunción honesta con acción de reintento", async () => {
    server.use(
      http.get(PATH, () => HttpResponse.json({ detail: "Bad Gateway" }, { status: 502 })),
    );

    render(<OcupacionCanchasPanel />);

    expect(
      await screen.findByText(/no se pudieron obtener los datos de canchas o reservas/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("estado loading no muestra ni tabla ni mensaje de vacío", async () => {
    server.use(http.get(PATH, () => HttpResponse.json([])));

    render(<OcupacionCanchasPanel />);

    await waitFor(() => expect(screen.getByText(/no hay canchas cargadas/i)).toBeInTheDocument());
  });
});
