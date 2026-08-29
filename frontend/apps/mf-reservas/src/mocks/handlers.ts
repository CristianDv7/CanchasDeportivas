// Handlers MSW en el espacio de URL del BROWSER (design.md §9): interceptan
// `fetch` ANTES del proxy del dev server, así que se mockea
// `/api/{service}/**`, nunca `http://localhost:8003/**`. Paths reales:
// design.md §1.
import { HttpResponse, http } from "msw";
import {
  canchasRaw,
  deportesRaw,
  disponibilidadReservasRaw,
  horariosAtencionRaw,
  reservasRaw,
} from "./fixtures";

export const handlers = [
  http.get("/api/canchas/canchas", () => HttpResponse.json(canchasRaw)),

  http.get("/api/canchas/deportes", () => HttpResponse.json(deportesRaw)),

  http.get("/api/reservas/reservas/", () => HttpResponse.json(reservasRaw)),

  // Contrato REAL: `list[HorarioAtencionResponse]` filtrado por `cancha_id`.
  http.get("/api/canchas/horarios-atencion", ({ request }) => {
    const canchaId = new URL(request.url).searchParams.get("cancha_id");
    return HttpResponse.json(horariosAtencionRaw.filter((h) => String(h.cancha_id) === canchaId));
  }),

  // Contrato REAL: `list[ReservaResponse]` (Confirmada) filtrado por
  // `cancha_id`+`fecha` — ya NO es la grilla armada del contrato propuesto.
  http.get("/api/reservas/reservas/disponibilidad", ({ request }) => {
    const url = new URL(request.url);
    const canchaId = url.searchParams.get("cancha_id");
    const fecha = url.searchParams.get("fecha");
    return HttpResponse.json(
      disponibilidadReservasRaw.filter(
        (r) => String(r.cancha_id) === canchaId && r.fecha === fecha,
      ),
    );
  }),

  http.post("/api/reservas/reservas/", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 99,
        usuario_id: body.usuario_id,
        cancha_id: body.cancha_id,
        fecha: body.fecha,
        hora_inicio: body.hora_inicio,
        hora_fin: body.hora_fin,
        estado: "Confirmada",
        created_at: "2026-08-26T00:00:00",
        updated_at: "2026-08-26T00:00:00",
      },
      { status: 201 },
    );
  }),

  http.patch("/api/reservas/reservas/:id/cancelar", ({ params }) => {
    const reserva = reservasRaw.find((r) => String(r.id) === params.id);
    return HttpResponse.json({ ...(reserva ?? reservasRaw[0]), estado: "Cancelada" });
  }),
];

/**
 * Escenarios de error como factories, para `server.use(errorScenarios.x())`
 * por test (design.md §9/§10). No forman parte del set de handlers por
 * default: cada test los activa explícitamente y `afterEach(() =>
 * server.resetHandlers())` los limpia.
 */
export const errorScenarios = {
  crear400: (detail: string) =>
    http.post("/api/reservas/reservas/", () => HttpResponse.json({ detail }, { status: 400 })),

  cancelar403: () =>
    http.patch("/api/reservas/reservas/:id/cancelar", () =>
      HttpResponse.json({ detail: "No autorizado." }, { status: 403 }),
    ),

  notFound404: () =>
    http.patch("/api/reservas/reservas/:id/cancelar", () =>
      HttpResponse.json({ detail: "No encontrada." }, { status: 404 }),
    ),

  unprocessable422: () =>
    http.post("/api/reservas/reservas/", () =>
      HttpResponse.json(
        { detail: [{ loc: ["body", "fecha"], msg: "campo inválido", type: "value_error" }] },
        { status: 422 },
      ),
    ),

  networkDown: () => http.get("/api/canchas/canchas", () => HttpResponse.error()),
};
