// RED (tasks.md 8.1-8.8): spec.md mf-administracion-canchas — design.md
// §6 (Phase 8). Alta/edición/inactivación/reactivación de canchas y
// horarios de atención (grilla de 7 filas, ADR-06).
import { HttpResponse, http } from "msw";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canchaRaw, canchasRaw } from "../../mocks/fixtures";
import { errorScenarios } from "../../mocks/handlers";
import { seedSession } from "../../mocks/session";
import { server } from "../../mocks/server";
import { CanchasPage } from "./CanchasPage";

// Ancla de reloj: anterior a la fecha de la reserva id:10 (2026-08-28) de las
// fixtures, así "inactivación con reservas futuras" cuenta como afectada de
// forma determinística sin depender del reloj real del entorno.
beforeEach(() => {
  seedSession();
  vi.setSystemTime(new Date("2026-06-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

async function elegirDeporte(nombre: string) {
  const select = await screen.findByLabelText(/deporte/i);
  await userEvent.selectOptions(select, screen.getByRole("option", { name: nombre }));
}

describe("CanchasPage — listado", () => {
  it("lista canchas activas e inactivas con indicador visual", async () => {
    render(<CanchasPage />);

    const filas = await screen.findAllByTestId(/^cancha-row-/);
    expect(filas).toHaveLength(3);
    expect(within(screen.getByTestId("cancha-row-1")).getByTestId("cancha-estado-1")).toHaveTextContent(
      "Activa",
    );
    expect(within(screen.getByTestId("cancha-row-3")).getByTestId("cancha-estado-3")).toHaveTextContent(
      "Inactiva",
    );
  });
});

describe("CanchasPage — alta (8.1/8.2)", () => {
  it("alta exitosa refetchea el listado (8.1)", async () => {
    let listCalls = 0;
    server.use(
      http.get("/api/canchas/canchas", () => {
        listCalls += 1;
        if (listCalls === 1) return HttpResponse.json(canchasRaw);
        return HttpResponse.json([
          ...canchasRaw,
          canchaRaw({ id: 99, nombre: "Cancha Nueva", deporte_id: 1 }),
        ]);
      }),
    );

    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    await userEvent.click(screen.getByRole("button", { name: /nueva cancha/i }));
    await userEvent.type(screen.getByLabelText(/^nombre$/i), "Cancha Nueva");
    await elegirDeporte("Fútbol");
    await userEvent.click(screen.getByRole("button", { name: /crear cancha/i }));

    await waitFor(() => expect(screen.getAllByTestId(/^cancha-row-/)).toHaveLength(4));
    expect(screen.getByText("Cancha Nueva")).toBeInTheDocument();
  });

  it("alta con 400 nombre duplicado: detail verbatim, sin refetch (8.2)", async () => {
    server.use(errorScenarios.canchaNombreDuplicado());
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    await userEvent.click(screen.getByRole("button", { name: /nueva cancha/i }));
    await userEvent.type(screen.getByLabelText(/^nombre$/i), "Cancha 1 - Fútbol 5");
    await elegirDeporte("Fútbol");
    await userEvent.click(screen.getByRole("button", { name: /crear cancha/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe una cancha con ese nombre");
    expect(screen.getAllByTestId(/^cancha-row-/)).toHaveLength(3);
  });
});

describe("CanchasPage — edición (8.3)", () => {
  it("bug real: el form de edición indica qué cancha se está editando (no se confunde con 'Nueva cancha')", async () => {
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    await userEvent.click(
      within(screen.getByTestId("cancha-row-2")).getByRole("button", { name: /^editar$/i }),
    );

    expect(screen.getByTestId("cancha-form-titulo")).toHaveTextContent(
      "Editando: Cancha 2 - Paddle",
    );
  });

  it("edición exitosa refetchea el listado", async () => {
    let listCalls = 0;
    server.use(
      http.get("/api/canchas/canchas", () => {
        listCalls += 1;
        if (listCalls === 1) return HttpResponse.json(canchasRaw);
        return HttpResponse.json([
          canchaRaw({ id: 1, nombre: "Cancha 1 renombrada", deporte_id: 1 }),
          ...canchasRaw.slice(1),
        ]);
      }),
    );

    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    await userEvent.click(within(screen.getByTestId("cancha-row-1")).getByRole("button", { name: /^editar$/i }));
    const nombreInput = screen.getByLabelText(/^nombre$/i);
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, "Cancha 1 renombrada");
    await userEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    await waitFor(() => expect(screen.getByText("Cancha 1 renombrada")).toBeInTheDocument());
  });

  it("edición sobre cancha eliminada (404): mensaje propio + refetch", async () => {
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    server.use(errorScenarios.notFound404("put", "/api/canchas/canchas/:id"));

    await userEvent.click(within(screen.getByTestId("cancha-row-1")).getByRole("button", { name: /^editar$/i }));
    await userEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El recurso ya no existe.");
    // El 404 dispara refetch (ADR-10): confirmamos que el listado se volvió a pedir
    // dejando de estar en modo edición (el form se cierra tras el error 404).
    await waitFor(() => expect(screen.queryByRole("button", { name: /guardar cambios/i })).not.toBeInTheDocument());
  });

  it("edición con 400 nombre duplicado: mensaje visible, form abierto y sin perder lo tipeado (fix WARNING-2)", async () => {
    server.use(errorScenarios.canchaNombreDuplicado("put", "/api/canchas/canchas/:id"));
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    await userEvent.click(within(screen.getByTestId("cancha-row-1")).getByRole("button", { name: /^editar$/i }));
    const nombreInput = screen.getByLabelText(/^nombre$/i);
    await userEvent.clear(nombreInput);
    await userEvent.type(nombreInput, "Cancha 2 - Paddle");
    await userEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe una cancha con ese nombre");
    // A diferencia del 404, un 400 (nombre duplicado) NO refetchea ni cierra el
    // form: el admin debe poder corregir el nombre sin perder lo tipeado.
    const guardarCambios = screen.getByRole("button", { name: /guardar cambios/i });
    expect(guardarCambios).toBeInTheDocument();
    expect(screen.getByLabelText(/^nombre$/i)).toHaveValue("Cancha 2 - Paddle");
  });
});

describe("CanchasPage — inactivación (8.4/8.5)", () => {
  it("inactivación sin reservas futuras confirmadas: refetch directo", async () => {
    let listCalls = 0;
    server.use(
      http.get("/api/canchas/canchas", () => {
        listCalls += 1;
        if (listCalls === 1) return HttpResponse.json(canchasRaw);
        return HttpResponse.json([
          canchasRaw[0],
          canchaRaw({ id: 2, nombre: "Cancha 2 - Paddle", deporte_id: 2, activo: false }),
          canchasRaw[2],
        ]);
      }),
    );

    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    // Cancha 2 no tiene reservas en las fixtures.
    await userEvent.click(within(screen.getByTestId("cancha-row-2")).getByRole("button", { name: /inactivar/i }));

    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(within(dialog).queryByTestId("inactivar-advertencia")).not.toBeInTheDocument());
    await userEvent.click(within(dialog).getByRole("button", { name: /^inactivar$/i }));

    await waitFor(() =>
      expect(within(screen.getByTestId("cancha-row-2")).getByTestId("cancha-estado-2")).toHaveTextContent(
        "Inactiva",
      ),
    );
  });

  it("inactivación con reservas futuras Confirmada: muestra advertencia con conteo y link", async () => {
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    // Cancha 1 tiene la reserva id:10 Confirmada a futuro (fixtures).
    await userEvent.click(within(screen.getByTestId("cancha-row-1")).getByRole("button", { name: /inactivar/i }));

    const advertencia = await screen.findByTestId("inactivar-advertencia");
    expect(advertencia).toHaveTextContent("1");
    expect(within(advertencia).getByRole("link")).toHaveAttribute(
      "href",
      "/administracion/reservas?cancha=1",
    );
  });

  it("si GET /reservas/ del diálogo falla, el botón Inactivar sigue habilitado (ADR-03)", async () => {
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    server.use(errorScenarios.reservasDown());

    await userEvent.click(within(screen.getByTestId("cancha-row-1")).getByRole("button", { name: /inactivar/i }));

    const dialog = await screen.findByRole("dialog");
    await screen.findByTestId("inactivar-verificacion-error");
    expect(within(dialog).getByRole("button", { name: /^inactivar$/i })).toBeEnabled();
  });
});

describe("CanchasPage — reactivación (8.6)", () => {
  it("reactivar cambia el badge a Activa (PUT con activo:true)", async () => {
    let listCalls = 0;
    server.use(
      http.get("/api/canchas/canchas", () => {
        listCalls += 1;
        if (listCalls === 1) return HttpResponse.json(canchasRaw);
        return HttpResponse.json([
          ...canchasRaw.slice(0, 2),
          canchaRaw({ id: 3, nombre: "Cancha 3 - Tenis", deporte_id: 3, activo: true }),
        ]);
      }),
    );

    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    await userEvent.click(within(screen.getByTestId("cancha-row-3")).getByRole("button", { name: /reactivar/i }));

    await waitFor(() =>
      expect(within(screen.getByTestId("cancha-row-3")).getByTestId("cancha-estado-3")).toHaveTextContent(
        "Activa",
      ),
    );
  });
});

describe("CanchasPage — 403 en escritura (8.7)", () => {
  it("403 al crear cancha: mensaje propio, sin refetch", async () => {
    server.use(errorScenarios.forbidden403("post", "/api/canchas/canchas"));
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    await userEvent.click(screen.getByRole("button", { name: /nueva cancha/i }));
    await userEvent.type(screen.getByLabelText(/^nombre$/i), "Cancha X");
    await elegirDeporte("Fútbol");
    await userEvent.click(screen.getByRole("button", { name: /crear cancha/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no tenés permisos/i);
    expect(screen.getAllByTestId(/^cancha-row-/)).toHaveLength(3);
  });
});

describe("CanchasPage — horarios de atención (8.8, ADR-06)", () => {
  it("muestra 7 filas fijas (lunes→domingo) para la cancha", async () => {
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    const horarios = await screen.findByTestId("horarios-cancha-1");
    expect(within(horarios).getAllByTestId(/^horario-fila-/)).toHaveLength(7);
  });

  it('fila vacía ⇒ botón "Definir" manda POST con dia_semana', async () => {
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    const horarios = await screen.findByTestId("horarios-cancha-1");
    // día 1 (lunes) no tiene horario en las fixtures para cancha 1.
    const filaLunes = within(horarios).getByTestId("horario-fila-1");
    await userEvent.click(within(filaLunes).getByRole("button", { name: /definir/i }));

    let bodyEnviado: unknown = null;
    server.use(
      http.post("/api/canchas/horarios-atencion", async ({ request }) => {
        bodyEnviado = await request.json();
        return HttpResponse.json(
          { id: 77, cancha_id: 1, dia_semana: 1, hora_inicio: "08:00:00", hora_fin: "20:00:00", activo: true },
          { status: 201 },
        );
      }),
    );

    await userEvent.click(within(filaLunes).getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(bodyEnviado).toMatchObject({ dia_semana: 1 }));
  });

  it('fila con horario ⇒ "Editar horas" manda PUT SIN dia_semana (ADR-06)', async () => {
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    const horarios = await screen.findByTestId("horarios-cancha-1");
    // día 5 (viernes) SÍ tiene horario para cancha 1 en las fixtures.
    const filaViernes = within(horarios).getByTestId("horario-fila-5");
    await userEvent.click(within(filaViernes).getByRole("button", { name: /editar horas/i }));

    let bodyEnviado: Record<string, unknown> | null = null;
    server.use(
      http.put("/api/canchas/horarios-atencion/:id", async ({ request, params }) => {
        bodyEnviado = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: Number(params.id),
          cancha_id: 1,
          dia_semana: 5,
          hora_inicio: bodyEnviado.hora_inicio,
          hora_fin: bodyEnviado.hora_fin,
          activo: true,
        });
      }),
    );

    await userEvent.click(within(filaViernes).getByRole("button", { name: /guardar/i }));

    await waitFor(() => expect(bodyEnviado).not.toBeNull());
    expect(bodyEnviado).not.toHaveProperty("dia_semana");
    expect(bodyEnviado).not.toHaveProperty("cancha_id");
  });

  it("rango inválido (422): detail aplanado, horario anterior no se pierde", async () => {
    render(<CanchasPage />);
    await screen.findAllByTestId(/^cancha-row-/);

    const horarios = await screen.findByTestId("horarios-cancha-1");
    const filaViernes = within(horarios).getByTestId("horario-fila-5");
    await userEvent.click(within(filaViernes).getByRole("button", { name: /editar horas/i }));

    server.use(errorScenarios.horarioRangoInvalido422());

    const horaFinInput = within(filaViernes).getByLabelText(/hora fin/i);
    await userEvent.clear(horaFinInput);
    await userEvent.type(horaFinInput, "07:00");
    await userEvent.click(within(filaViernes).getByRole("button", { name: /guardar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/hora_fin/i);
    // El horario anterior sigue disponible: el listado no se refetcheó a un
    // estado vacío ni se perdió (la fila conserva la posibilidad de reintentar).
    expect(within(filaViernes).getByRole("button", { name: /guardar/i })).toBeInTheDocument();
  });
});
