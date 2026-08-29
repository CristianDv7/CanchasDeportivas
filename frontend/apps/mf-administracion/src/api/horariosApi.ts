// Único archivo que conoce los paths reales de `horarios-atencion`
// (design.md §1, ADR-06). `editarHoras` NUNCA manda `dia_semana` — ver
// `toHorarioUpdateBody` en mappers.ts.
import { apiClient } from "shell/apiClient";
import type { HorarioAtencion, HorarioInput } from "./dto";
import { toHorarioAtencion, toHorarioCreateBody, toHorarioUpdateBody } from "./mappers";
import type { HorarioAtencionRaw } from "./raw";

export const horariosApi = {
  async listPorCancha(canchaId: number, signal?: AbortSignal): Promise<HorarioAtencion[]> {
    const raw = await apiClient.get<HorarioAtencionRaw[]>("/horarios-atencion", {
      service: "canchas",
      query: { cancha_id: canchaId },
      signal,
    });
    return raw.map(toHorarioAtencion);
  },

  /** Único lugar donde se manda `dia_semana`: alta de una fila vacía de la grilla. */
  async crear(input: HorarioInput, signal?: AbortSignal): Promise<HorarioAtencion> {
    const body = toHorarioCreateBody(input);
    const raw = await apiClient.post<HorarioAtencionRaw>("/horarios-atencion", body, {
      service: "canchas",
      signal,
    });
    return toHorarioAtencion(raw);
  },

  /** ADR-06: edición de un horario existente, solo horas — nunca `dia_semana`. */
  async editarHoras(id: number, input: HorarioInput, signal?: AbortSignal): Promise<HorarioAtencion> {
    const body = toHorarioUpdateBody(input);
    const raw = await apiClient.put<HorarioAtencionRaw>(`/horarios-atencion/${id}`, body, {
      service: "canchas",
      signal,
    });
    return toHorarioAtencion(raw);
  },
};
