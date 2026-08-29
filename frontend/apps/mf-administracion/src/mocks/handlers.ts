// Handlers MSW en el espacio de URL del BROWSER (design.md §7): interceptan
// `fetch` ANTES del proxy del dev server, así que se mockea
// `/api/{service}/**`, nunca `http://localhost:800x/**`. Paths reales:
// design.md §1.
import { HttpResponse, http } from "msw";
import {
  canchasRaw,
  deportesRaw,
  horariosAtencionRaw,
  reservasRaw,
  usuariosRaw,
} from "./fixtures";

export const handlers = [
  http.get("/api/canchas/canchas", () => HttpResponse.json(canchasRaw)),

  http.post("/api/canchas/canchas", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 99,
        nombre: body.nombre,
        deporte_id: body.deporte_id,
        activo: true,
        created_at: "2026-08-28T00:00:00",
        updated_at: "2026-08-28T00:00:00",
      },
      { status: 201 },
    );
  }),

  http.put("/api/canchas/canchas/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const existente = canchasRaw.find((c) => String(c.id) === params.id) ?? canchasRaw[0];
    return HttpResponse.json({
      ...existente,
      ...body,
      id: Number(params.id),
      updated_at: "2026-08-28T00:00:00",
    });
  }),

  http.patch("/api/canchas/canchas/:id/inactivar", ({ params }) => {
    const existente = canchasRaw.find((c) => String(c.id) === params.id) ?? canchasRaw[0];
    return HttpResponse.json({ ...existente, activo: false, id: Number(params.id) });
  }),

  http.get("/api/canchas/deportes", () => HttpResponse.json(deportesRaw)),

  http.get("/api/canchas/horarios-atencion", ({ request }) => {
    const canchaId = new URL(request.url).searchParams.get("cancha_id");
    return HttpResponse.json(horariosAtencionRaw.filter((h) => String(h.cancha_id) === canchaId));
  }),

  http.post("/api/canchas/horarios-atencion", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 88,
        cancha_id: body.cancha_id,
        dia_semana: body.dia_semana,
        hora_inicio: body.hora_inicio,
        hora_fin: body.hora_fin,
        activo: true,
      },
      { status: 201 },
    );
  }),

  http.put("/api/canchas/horarios-atencion/:id", async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const existente =
      horariosAtencionRaw.find((h) => String(h.id) === params.id) ?? horariosAtencionRaw[0];
    return HttpResponse.json({
      ...existente,
      ...body,
      id: Number(params.id),
    });
  }),

  http.get("/api/reservas/reservas/", () => HttpResponse.json(reservasRaw)),

  http.patch("/api/reservas/reservas/:id/cancelar", ({ params }) => {
    const reserva = reservasRaw.find((r) => String(r.id) === params.id);
    return HttpResponse.json({ ...(reserva ?? reservasRaw[0]), estado: "Cancelada" });
  }),

  http.get("/api/usuarios/usuarios", () => HttpResponse.json(usuariosRaw)),
];

/**
 * Escenarios de error como factories, para `server.use(errorScenarios.x())`
 * por test (design.md §7/§10). No forman parte del set de handlers por
 * default: cada test los activa explícitamente y `afterEach(() =>
 * server.resetHandlers())` los limpia.
 */
export const errorScenarios = {
  canchaNombreDuplicado: (method: "post" | "put" = "post", path = "/api/canchas/canchas") =>
    http[method](path, () =>
      HttpResponse.json({ detail: "Ya existe una cancha con ese nombre" }, { status: 400 }),
    ),

  horarioDiaDuplicado: () =>
    http.post("/api/canchas/horarios-atencion", () =>
      HttpResponse.json(
        { detail: "La cancha ya tiene un horario configurado para ese día" },
        { status: 400 },
      ),
    ),

  forbidden403: (method: "post" | "put" | "patch" = "post", path = "/api/canchas/canchas") =>
    http[method](path, () => HttpResponse.json({ detail: "irrelevante" }, { status: 403 })),

  notFound404: (method: "post" | "put" | "patch" = "put", path = "/api/canchas/canchas/:id") =>
    http[method](path, () =>
      HttpResponse.json({ detail: "El recurso ya no existe." }, { status: 404 }),
    ),

  horarioRangoInvalido422: () =>
    http.put("/api/canchas/horarios-atencion/:id", () =>
      HttpResponse.json(
        { detail: [{ loc: ["body", "hora_fin"], msg: "hora_fin debe ser mayor a hora_inicio", type: "value_error" }] },
        { status: 422 },
      ),
    ),

  serverError500: (path = "/api/canchas/canchas") => http.get(path, () => HttpResponse.json({ detail: "boom" }, { status: 500 })),

  networkDown: (path = "/api/canchas/canchas") => http.get(path, () => HttpResponse.error()),

  /** ADR-07: falla la fuente crítica del panel de reservas → debe propagar. */
  reservasDown: () =>
    http.get("/api/reservas/reservas/", () =>
      HttpResponse.json({ detail: "Servicio de reservas caído." }, { status: 500 }),
    ),

  usuariosDown: () =>
    http.get("/api/usuarios/usuarios", () =>
      HttpResponse.json({ detail: "No tenés permisos." }, { status: 403 }),
    ),
};
