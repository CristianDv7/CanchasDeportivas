// RED (tasks.md 7.1-7.4): spec.md "Crear reserva" + "Manejo de errores al
// reservar" + "Límite de reservas activas (RN-06)" — design.md §4/§6/§7.
// Cubre: creación exitosa, 400 (detail verbatim + refetch de disponibilidad +
// selección limpiada, secuencia RN-02 de design.md §6), 403/404/422 (mensaje
// propio, sin refetch) y el contador RN-06 (visible, no bloqueante).
import { HttpResponse, http } from "msw";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { disponibilidadRaw } from "../../mocks/fixtures";
import { errorScenarios } from "../../mocks/handlers";
import { seedSession } from "../../mocks/session";
import { server } from "../../mocks/server";
import { NuevaReservaPage } from "./NuevaReservaPage";

beforeEach(() => {
  seedSession();
});

async function esperarCanchasCargadas() {
  await waitFor(() =>
    expect(screen.getByTestId("cancha-select").children.length).toBeGreaterThan(1),
  );
}

/** `radios[0]` sería `HTMLElement | undefined` bajo `noUncheckedIndexedAccess`. */
function primerRadio(radios: readonly HTMLElement[]): HTMLElement {
  const radio = radios[0];
  if (!radio) throw new Error("No se encontró ningún bloque-radio.");
  return radio;
}

/** Selecciona cancha 1 + fecha 2026-08-28 y devuelve el radio del primer
 * bloque (08:00–09:00, libre según fixtures). */
async function elegirCanchaFechaYBloqueLibre(
  user: ReturnType<typeof userEvent.setup>,
): Promise<HTMLElement> {
  await esperarCanchasCargadas();
  await user.selectOptions(screen.getByTestId("cancha-select"), "1");
  fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "2026-08-28" } });
  const radios = await screen.findAllByTestId("bloque-radio");
  return primerRadio(radios);
}

describe("NuevaReservaPage", () => {
  it("reserva exitosa: bloque libre → estado Confirmada e informa éxito (7.1)", async () => {
    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    const radio = await elegirCanchaFechaYBloqueLibre(user);
    await user.click(radio);
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    expect(await screen.findByTestId("reserva-exito")).toBeInTheDocument();
  });

  it("400 al crear: muestra el detail verbatim y refetchea disponibilidad, limpiando la selección (7.2)", async () => {
    let disponibilidadCalls = 0;
    server.use(
      http.get("/api/reservas/reservas/disponibilidad", () => {
        disponibilidadCalls += 1;
        return HttpResponse.json(disponibilidadRaw);
      }),
      errorScenarios.crear400("Ya existe una reserva para ese horario."),
    );

    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    const radio = await elegirCanchaFechaYBloqueLibre(user);
    await waitFor(() => expect(disponibilidadCalls).toBe(1));

    await user.click(radio);
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("Ya existe una reserva para ese horario.");

    await waitFor(() => expect(disponibilidadCalls).toBe(2));
    await waitFor(() => {
      for (const radio of screen.getAllByTestId("bloque-radio")) {
        expect(radio).not.toBeChecked();
      }
    });
  });

  it("403 al crear: mensaje propio del adapter, sin refetch de disponibilidad (7.3)", async () => {
    let disponibilidadCalls = 0;
    server.use(
      http.get("/api/reservas/reservas/disponibilidad", () => {
        disponibilidadCalls += 1;
        return HttpResponse.json(disponibilidadRaw);
      }),
      http.post("/api/reservas/reservas/", () =>
        HttpResponse.json({ detail: "irrelevante para la UI" }, { status: 403 }),
      ),
    );

    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    const radio = await elegirCanchaFechaYBloqueLibre(user);
    await waitFor(() => expect(disponibilidadCalls).toBe(1));

    await user.click(radio);
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("No tenés permiso para operar sobre esta reserva.");

    // sin refetch: la llamada a disponibilidad no se repite
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(disponibilidadCalls).toBe(1);
  });

  it("404 al crear: mensaje propio del adapter, sin refetch de disponibilidad (7.3)", async () => {
    let disponibilidadCalls = 0;
    server.use(
      http.get("/api/reservas/reservas/disponibilidad", () => {
        disponibilidadCalls += 1;
        return HttpResponse.json(disponibilidadRaw);
      }),
      http.post("/api/reservas/reservas/", () =>
        HttpResponse.json({ detail: "Cancha inexistente." }, { status: 404 }),
      ),
    );

    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    const radio = await elegirCanchaFechaYBloqueLibre(user);
    await waitFor(() => expect(disponibilidadCalls).toBe(1));

    await user.click(radio);
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("La reserva o la cancha ya no existe.");

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(disponibilidadCalls).toBe(1);
  });

  it("422 al crear: muestra el detail ya aplanado, sin refetch de disponibilidad (7.3)", async () => {
    let disponibilidadCalls = 0;
    server.use(
      http.get("/api/reservas/reservas/disponibilidad", () => {
        disponibilidadCalls += 1;
        return HttpResponse.json(disponibilidadRaw);
      }),
      errorScenarios.unprocessable422(),
    );

    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    const radio = await elegirCanchaFechaYBloqueLibre(user);
    await waitFor(() => expect(disponibilidadCalls).toBe(1));

    await user.click(radio);
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    const banner = await screen.findByRole("alert");
    expect(banner).toHaveTextContent("campo inválido");

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(disponibilidadCalls).toBe(1);
  });

  it("contador RN-06 visible y no bloqueante: el botón de crear sigue habilitado (7.4)", async () => {
    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    const radio = await elegirCanchaFechaYBloqueLibre(user);
    await screen.findByTestId("contador-rn06");
    expect(screen.getByTestId("contador-rn06")).toHaveTextContent("1");

    await user.click(radio);
    expect(screen.getByRole("button", { name: /confirmar reserva/i })).toBeEnabled();
  });
});
