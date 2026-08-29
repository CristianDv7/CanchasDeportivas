// Único archivo que conoce el path real de `GET /reservas/` en vista total
// (design.md §1, ADR-07): enrichment vía `Promise.allSettled` con
// criticidad asimétrica — reservas es crítica, canchas y usuarios son
// decorativas.
import { apiClient } from "shell/apiClient";
import { canchasApi } from "./canchasApi";
import { buildReservasAdmin, toReserva } from "./mappers";
import type { ReservaAdmin } from "./dto";
import type { ReservaRaw } from "./raw";
import { usuariosApi } from "./usuariosApi";

function settled<T>(result: PromiseSettledResult<T[]>, fallback: T[]): T[] {
  return result.status === "fulfilled" ? result.value : fallback;
}

export const reservasAdminApi = {
  /**
   * Fan-out en paralelo (ADR-07): solo la de reservas es fatal. `allSettled`
   * NUNCA rechaza: el re-throw es explícito y propaga el `ApiError` original
   * para que `mapApiError` (errors.ts) lo clasifique. Si se olvidara el
   * re-throw, un backend caído se vería como "0 reservas".
   */
  async listPanel(signal?: AbortSignal): Promise<ReservaAdmin[]> {
    const [r, c, u] = await Promise.allSettled([
      apiClient.get<ReservaRaw[]>("/reservas/", { service: "reservas", signal }),
      canchasApi.list(signal),
      usuariosApi.list(signal),
    ]);

    if (r.status === "rejected") throw r.reason;

    return buildReservasAdmin(r.value.map(toReserva), settled(c, []), settled(u, []));
  },

  /** Compatible con `useAction(reservasAdminApi.cancelar)`: un solo arg (id). */
  async cancelar(id: number, signal?: AbortSignal) {
    const raw = await apiClient.patch<ReservaRaw>(`/reservas/${id}/cancelar`, undefined, {
      service: "reservas",
      signal,
    });
    return toReserva(raw);
  },
};
