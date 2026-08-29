// Handlers MSW en el espacio de URL del BROWSER (design.md §7): interceptan
// `fetch` ANTES del proxy del dev server, así que se mockea
// `/api/{service}/**`, nunca `http://localhost:800x/**`. Paths reales:
// design.md §1/§5.
import { HttpResponse, http } from "msw";
import { ocupacionCanchasRaw, reservasPeriodoRaw } from "./fixtures";

export const handlers = [
  http.get("/api/reportes/reportes/ocupacion/canchas", () => HttpResponse.json(ocupacionCanchasRaw)),

  http.get("/api/reportes/reportes/reservas/periodo", ({ request }) => {
    const url = new URL(request.url);
    const fechaInicio = url.searchParams.get("fecha_inicio") ?? reservasPeriodoRaw.fecha_inicio;
    const fechaFin = url.searchParams.get("fecha_fin") ?? reservasPeriodoRaw.fecha_fin;
    return HttpResponse.json({
      ...reservasPeriodoRaw,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
  }),
];

/**
 * Escenarios de error como factories, para `server.use(errorScenarios.x())`
 * por test (design.md §7/§10, ADR-05). No forman parte del set de handlers
 * por default: cada test los activa explícitamente y
 * `afterEach(() => server.resetHandlers())` los limpia.
 */
export const errorScenarios = {
  rangoInvalido400: (path = "/api/reportes/reportes/reservas/periodo") =>
    http.get(path, () =>
      HttpResponse.json({ detail: "fecha_inicio debe ser anterior o igual a fecha_fin" }, { status: 400 }),
    ),

  agregador502: (path: string) => http.get(path, () => HttpResponse.json({ detail: "Bad Gateway" }, { status: 502 })),

  serverError500: (path: string) => http.get(path, () => HttpResponse.json({ detail: "boom" }, { status: 500 })),

  networkDown: (path: string) => http.get(path, () => HttpResponse.error()),
};
