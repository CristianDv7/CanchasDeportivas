// Único archivo que conoce los paths reales de ms-reportes (design.md §1).
// Sin test unitario propio: se cubre en Phase 6/7 (integración vía MSW,
// features/ocupacion y features/periodo).
import { apiClient } from "shell/apiClient";
import type { OcupacionCancha, ReservasPeriodo } from "./dto";
import { toOcupacionCancha, toReservasPeriodo } from "./mappers";
import type { OcupacionCanchaRaw, ReservasPeriodoRaw } from "./raw";

export const reportesApi = {
  /** Fetcher compatible con `useResource<OcupacionCancha[]>`: `(signal) => Promise<T>`. */
  async ocupacionCanchas(signal?: AbortSignal): Promise<OcupacionCancha[]> {
    const raw = await apiClient.get<OcupacionCanchaRaw[]>("/reportes/ocupacion/canchas", {
      service: "reportes",
      signal,
    });
    return raw.map(toOcupacionCancha);
  },

  async reservasPeriodo(
    fechaInicio: string,
    fechaFin: string,
    signal?: AbortSignal,
  ): Promise<ReservasPeriodo> {
    const raw = await apiClient.get<ReservasPeriodoRaw>("/reportes/reservas/periodo", {
      service: "reportes",
      query: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
      signal,
    });
    return toReservasPeriodo(raw);
  },
};
