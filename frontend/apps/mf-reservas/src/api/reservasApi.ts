// Único archivo que conoce los paths reales de ms-reservas (design.md §1).
// `getDisponibilidad` vive aislada a propósito: el contrato real
// `GET /reservas/disponibilidad` está PROPUESTO, no implementado todavía por
// Cristian (docs/propuestas/ms-reservas-endpoint-disponibilidad.md). Sin
// test unitario propio — se cubre con integración vía MSW mockeando el
// contrato propuesto (design.md §7 "Decisión: el endpoint pendiente...").
// Si el contrato cambia o se descarta (plan B), el único cuerpo a tocar es
// el de esta función.
import { apiClient } from "shell/apiClient";
import type { Disponibilidad, IsoDate, NuevaReservaInput, Reserva } from "./dto";
import { toDisponibilidad, toReserva, toReservaCreateBody } from "./mappers";
import type { DisponibilidadRaw, ReservaRaw } from "./raw";

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

  // ⚠️ Contrato propuesto, no implementado por el backend (design.md §1/§7).
  async getDisponibilidad(
    canchaId: number,
    fecha: IsoDate,
    signal?: AbortSignal,
  ): Promise<Disponibilidad> {
    const raw = await apiClient.get<DisponibilidadRaw>("/reservas/disponibilidad", {
      service: "reservas",
      query: { cancha_id: canchaId, fecha },
      signal,
    });
    return toDisponibilidad(raw);
  },
};
