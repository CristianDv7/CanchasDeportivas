// Único archivo que conoce los paths reales de escritura de ms-canchas para
// canchas (design.md §1). Sin test unitario propio: se cubre en Phase 8
// (integración vía MSW, features/canchas).
import { apiClient } from "shell/apiClient";
import type { Cancha, CanchaInput } from "./dto";
import { toCancha, toCanchaCreateBody, toCanchaUpdateBody } from "./mappers";
import type { CanchaRaw } from "./raw";

export const canchasApi = {
  /** Fetcher compatible con `useResource<Cancha[]>`: `(signal) => Promise<T>`. */
  async list(signal?: AbortSignal): Promise<Cancha[]> {
    const raw = await apiClient.get<CanchaRaw[]>("/canchas", { service: "canchas", signal });
    return raw.map(toCancha);
  },

  async crear(input: CanchaInput, signal?: AbortSignal): Promise<Cancha> {
    const body = toCanchaCreateBody(input);
    const raw = await apiClient.post<CanchaRaw>("/canchas", body, { service: "canchas", signal });
    return toCancha(raw);
  },

  async editar(id: number, input: CanchaInput, signal?: AbortSignal): Promise<Cancha> {
    const body = toCanchaUpdateBody(input);
    const raw = await apiClient.put<CanchaRaw>(`/canchas/${id}`, body, {
      service: "canchas",
      signal,
    });
    return toCancha(raw);
  },

  async inactivar(id: number, signal?: AbortSignal): Promise<Cancha> {
    const raw = await apiClient.patch<CanchaRaw>(`/canchas/${id}/inactivar`, undefined, {
      service: "canchas",
      signal,
    });
    return toCancha(raw);
  },

  /** ADR-05: no existe `PATCH /activar`; reactivar es `PUT` con `{activo:true}`. */
  async reactivar(id: number, input: CanchaInput, signal?: AbortSignal): Promise<Cancha> {
    const body = toCanchaUpdateBody(input, true);
    const raw = await apiClient.put<CanchaRaw>(`/canchas/${id}`, body, {
      service: "canchas",
      signal,
    });
    return toCancha(raw);
  },
};
