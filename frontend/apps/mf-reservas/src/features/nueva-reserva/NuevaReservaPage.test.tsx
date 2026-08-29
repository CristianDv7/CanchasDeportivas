// RED (tasks.md 7.1-7.4): spec.md "Crear reserva" + "Manejo de errores al
// reservar" + "Límite de reservas activas (RN-06)" — design.md §4/§6/§7.
// Cubre: creación exitosa, 400 (detail verbatim + refetch de disponibilidad +
// selección limpiada, secuencia RN-02 de design.md §6), 403/404/422 (mensaje
// propio, sin refetch) y el contador RN-06 (visible, no bloqueante).
import { HttpResponse, http } from "msw";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { disponibilidadReservasRaw } from "../../mocks/fixtures";
import { errorScenarios } from "../../mocks/handlers";
import { seedSession } from "../../mocks/session";
import { server } from "../../mocks/server";
import { NuevaReservaPage } from "./NuevaReservaPage";

// Ancla de reloj para todo el archivo: anterior a la fecha 2026-08-28 usada
// en los fixtures de este test, así ningún bloque aparece "pasado" (mismo
// criterio que MisReservasPage.test.tsx para RN-04/hasStarted).
beforeEach(() => {
  seedSession();
  vi.setSystemTime(new Date("2026-08-27T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
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

  it("bug real (2026-08-29): la confirmación de éxito dice qué cancha/fecha/horario quedó reservado, no solo 'confirmada'", async () => {
    // Antes solo decía "Reserva confirmada." sin más — si el usuario se
    // equivocaba de cancha al reservar, no se daba cuenta hasta ir a "Mis
    // reservas" por separado.
    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    const radio = await elegirCanchaFechaYBloqueLibre(user);
    await user.click(radio);
    await user.click(screen.getByRole("button", { name: /confirmar reserva/i }));

    const mensaje = await screen.findByTestId("reserva-exito");
    expect(mensaje).toHaveTextContent("Cancha 1 - Fútbol 5");
    expect(mensaje).toHaveTextContent("2026-08-28");
    expect(mensaje).toHaveTextContent("08:00");
  });

  it("400 al crear: muestra el detail verbatim y refetchea disponibilidad, limpiando la selección (7.2)", async () => {
    let disponibilidadCalls = 0;
    server.use(
      http.get("/api/reservas/reservas/disponibilidad", () => {
        disponibilidadCalls += 1;
        return HttpResponse.json(disponibilidadReservasRaw);
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
        return HttpResponse.json(disponibilidadReservasRaw);
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
        return HttpResponse.json(disponibilidadReservasRaw);
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

  it("422 al crear: muestra mensaje genérico (no el detail crudo del backend), sin refetch de disponibilidad (7.3)", async () => {
    let disponibilidadCalls = 0;
    server.use(
      http.get("/api/reservas/reservas/disponibilidad", () => {
        disponibilidadCalls += 1;
        return HttpResponse.json(disponibilidadReservasRaw);
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
    expect(banner).toHaveTextContent("La fecha ingresada no es válida.");

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

  it("bug real (2026-08-29): un bloque cuya hora de inicio ya pasó no es reservable (deshabilitado, 'pasado')", async () => {
    // 08:00 ya inició (08:30 > 08:00), 09:00 sigue libre y futuro, 10:00 está
    // ocupado por disponibilidadReservasRaw — las tres etiquetas en una sola
    // fecha (design.md §12 hasStarted, mismo criterio que RN-04 en cancelar).
    vi.setSystemTime(new Date("2026-08-28T08:30:00Z"));

    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    await esperarCanchasCargadas();
    await user.selectOptions(screen.getByTestId("cancha-select"), "1");
    fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "2026-08-28" } });

    const radios = await screen.findAllByTestId("bloque-radio");
    expect(radios).toHaveLength(3);

    const [pasado, libre, ocupado] = radios as [HTMLElement, HTMLElement, HTMLElement];
    expect(screen.getByText(/08:00–09:00 · pasado/)).toBeInTheDocument();
    expect(pasado).toBeDisabled();
    expect(screen.getByText(/09:00–10:00 · libre/)).toBeInTheDocument();
    expect(libre).toBeEnabled();
    expect(screen.getByText(/10:00–11:00 · ocupado/)).toBeInTheDocument();
    expect(ocupado).toBeDisabled();

    // El botón nunca se habilita para el bloque pasado, ni siquiera intentando
    // seleccionarlo (disabled bloquea el click real del usuario).
    await user.click(pasado);
    expect(screen.getByRole("button", { name: /confirmar reserva/i })).toBeDisabled();
  });

  it("bug real: cancha+fecha elegidas sin horarios distingue 'sin horarios' de 'elegí cancha y fecha'", async () => {
    render(<NuevaReservaPage />);
    const user = userEvent.setup();

    // Antes de elegir nada: mensaje genérico.
    expect(screen.getByTestId("reserva-form-vacio")).toHaveTextContent(
      "Elegí una cancha y fecha para ver horarios.",
    );

    // Cancha 1 solo tiene horario definido para viernes (dia_semana 5); el
    // 2026-08-24 es lunes ⇒ grilla vacía por falta de horario, no por falta
    // de selección.
    await esperarCanchasCargadas();
    await user.selectOptions(screen.getByTestId("cancha-select"), "1");
    fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "2026-08-24" } });

    await waitFor(() =>
      expect(screen.getByTestId("reserva-form-vacio")).toHaveTextContent(
        "No hay horarios disponibles para esta cancha en esta fecha.",
      ),
    );
  });
});
