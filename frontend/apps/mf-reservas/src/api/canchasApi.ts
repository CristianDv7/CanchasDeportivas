// Único archivo que conoce los paths reales de ms-canchas (design.md §1).
import { apiClient } from "shell/apiClient";
import type { Cancha, HorarioAtencion } from "./dto";
import { toCancha, toHorarioAtencion } from "./mappers";
import type { CanchaRaw, HorarioAtencionRaw } from "./raw";

export const canchasApi = {
  /** Fetcher compatible con `useResource<Cancha[]>`: `(signal) => Promise<T>`. */
  async list(signal?: AbortSignal): Promise<Cancha[]> {
    const raw = await apiClient.get<CanchaRaw[]>("/canchas", { service: "canchas", signal });
    return raw.map(toCancha);
  },

  /**
   * `GET /horarios-atencion` (sin auth, ms-canchas): usado por
   * `reservasApi.getDisponibilidad` para armar la grilla que el backend real
   * ya no arma (contrato real reemplaza al propuesto — design.md §1/§7).
   */
  async getHorariosAtencion(canchaId: number, signal?: AbortSignal): Promise<HorarioAtencion[]> {
    const raw = await apiClient.get<HorarioAtencionRaw[]>("/horarios-atencion", {
      service: "canchas",
      query: { cancha_id: canchaId },
      signal,
    });
    return raw.map(toHorarioAtencion);
  },
};
