// RED (tasks.md 7.1, 7.3-7.6): design.md ADR-03/04/05 — autoconsulta al
// montar con rango por defecto (sin `enabled`), botón "Actualizar"
// deshabilitado con rango inválido, un único fetch al click (no por tecleo),
// 400 verbatim sin retry, 502 con disyunción honesta.
import { HttpResponse, http } from "msw";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { seedSession } from "../../mocks/session";
import { server } from "../../mocks/server";
import { ReservasPeriodoPanel } from "./ReservasPeriodoPanel";

const PATH = "/api/reportes/reportes/reservas/periodo";

beforeEach(() => {
  seedSession();
});

describe("ReservasPeriodoPanel", () => {
  it("al montar, dispara la consulta con el rango por defecto y muestra el total", async () => {
    const capturado: { query: URLSearchParams | null } = { query: null };
    server.use(
      http.get(PATH, ({ request }) => {
        capturado.query = new URL(request.url).searchParams;
        return HttpResponse.json({ fecha_inicio: "a", fecha_fin: "b", total_reservas: 37 });
      }),
    );

    render(<ReservasPeriodoPanel />);

    expect(await screen.findByText("37")).toBeInTheDocument();
    expect(capturado.query?.get("fecha_inicio")).not.toBeNull();
    expect(capturado.query?.get("fecha_fin")).not.toBeNull();
  });

  it("botón Actualizar deshabilitado cuando el rango en draft es inválido", async () => {
    server.use(
      http.get(PATH, () => HttpResponse.json({ fecha_inicio: "a", fecha_fin: "b", total_reservas: 0 })),
    );

    render(<ReservasPeriodoPanel />);
    await waitFor(() => expect(screen.getByRole("button", { name: /actualizar/i })).toBeEnabled());

    // fecha_inicio posterior a fecha_fin (default fechaFin=hoy) ⇒ rango
    // inválido. `fireEvent.change` en vez de `user.type`: jsdom no simula
    // bien la escritura char-por-char sobre input[type=date] (mismo criterio
    // que CanchaFechaPicker.test.tsx de mf-reservas).
    fireEvent.change(screen.getByTestId("fecha-inicio-input"), { target: { value: "2099-12-31" } });

    expect(screen.getByRole("button", { name: /actualizar/i })).toBeDisabled();
  });

  it("click en Actualizar con rango válido dispara un único fetch con el rango aplicado", async () => {
    let calls = 0;
    server.use(
      http.get(PATH, () => {
        calls += 1;
        return HttpResponse.json({ fecha_inicio: "2026-01-01", fecha_fin: "2026-01-31", total_reservas: 5 });
      }),
    );
    const user = userEvent.setup();

    render(<ReservasPeriodoPanel />);
    await screen.findByText("5");
    const callsAlMontar = calls;

    fireEvent.change(screen.getByTestId("fecha-inicio-input"), { target: { value: "2026-01-01" } });
    fireEvent.change(screen.getByTestId("fecha-fin-input"), { target: { value: "2026-01-31" } });

    expect(calls).toBe(callsAlMontar); // tipear no dispara fetch (ADR-03)

    await user.click(screen.getByRole("button", { name: /actualizar/i }));

    await waitFor(() => expect(calls).toBe(callsAlMontar + 1));
  });

  it("400 muestra el detail verbatim, sin reintento automático", async () => {
    server.use(
      http.get(PATH, () =>
        HttpResponse.json({ detail: "fecha_inicio debe ser anterior o igual a fecha_fin" }, { status: 400 }),
      ),
    );

    render(<ReservasPeriodoPanel />);

    expect(
      await screen.findByText(/fecha_inicio debe ser anterior o igual a fecha_fin/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it("502 muestra el mismo mensaje de disyunción honesta con acción de reintento", async () => {
    server.use(http.get(PATH, () => HttpResponse.json({ detail: "Bad Gateway" }, { status: 502 })));

    render(<ReservasPeriodoPanel />);

    expect(
      await screen.findByText(/no se pudieron obtener los datos de canchas o reservas/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });
});
