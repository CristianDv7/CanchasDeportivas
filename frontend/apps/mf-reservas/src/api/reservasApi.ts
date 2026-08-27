// Único archivo que conoce los paths reales de ms-reservas (design.md §1).
// `getDisponibilidad` combina dos fuentes: `canchasApi.getHorariosAtencion`
// (ms-canchas) y el contrato REAL de `GET /reservas/disponibilidad`
// (`list[ReservaResponse]`, ya no la grilla propuesta) — el backend ya no
// arma la grilla, la arma el adapter vía `buildDisponibilidad` (mappers.ts).
// Sin test unitario propio: se cubre con integración vía MSW (contrato real)
// más los tests unitarios de `buildDisponibilidad` en mappers.test.ts.
import { apiClient } from "shell/apiClient";
import { canchasApi } from "./canchasApi";
import type { Disponibilidad, IsoDate, NuevaReservaInput, Reserva } from "./dto";
import { buildDisponibilidad, toReserva, toReservaCreateBody } from "./mappers";
import type { ReservaRaw } from "./raw";

export const reservasApi = {
  /** Fetcher compatible con `useResource<Reserva[]>`: `(signal) => Promise<T>`. */
  async listMias(signal?: AbortSignal): Promise<Reserva[]> {
    const raw = await apiClient.get<ReservaRaw[]>("/reservas/", { service: "reservas", signal });
    return raw.map(toReserva);
  },

  /**
   * `usuarioId` MUST venir de `session.user.id` en el caller (RN-03), nunca
   * de un campo del formulario — ver `toReservaCreateBody` en mappers.ts.
   * El adapter NO traduce errores: `ApiError` se propaga tal cual para que
   * `mapApiError` (errors.ts) decida el mensaje/acción en la capa de UI.
   */
  async crear(input: NuevaReservaInput, usuarioId: number, signal?: AbortSignal): Promise<Reserva> {
    const body = toReservaCreateBody(input, usuarioId);
    const raw = await apiClient.post<ReservaRaw>("/reservas/", body, { service: "reservas", signal });
    return toReserva(raw);
  },

  /** Compatible con `useAction(reservasApi.cancelar)`: un solo arg (id). */
  async cancelar(id: number, signal?: AbortSignal): Promise<Reserva> {
    const raw = await apiClient.patch<ReservaRaw>(`/reservas/${id}/cancelar`, undefined, {
      service: "reservas",
      signal,
    });
    return toReserva(raw);
  },

  async getDisponibilidad(
    canchaId: number,
    fecha: IsoDate,
    signal?: AbortSignal,
  ): Promise<Disponibilidad> {
    // Desacopladas a propósito (Promise.all): ninguna depende del resultado
    // de la otra.
    const [horarios, reservasRaw] = await Promise.all([
      canchasApi.getHorariosAtencion(canchaId, signal),
      apiClient.get<ReservaRaw[]>("/reservas/disponibilidad", {
        service: "reservas",
        query: { cancha_id: canchaId, fecha },
        signal,
      }),
    ]);
    return buildDisponibilidad(canchaId, fecha, horarios, reservasRaw.map(toReserva));
  },
};
