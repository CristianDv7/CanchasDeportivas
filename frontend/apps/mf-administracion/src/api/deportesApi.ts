// Único archivo que conoce el path real de `GET /deportes` (design.md §1).
// Usado por el selector del formulario de alta de cancha (Phase 8).
import { apiClient } from "shell/apiClient";
import type { Deporte } from "./dto";
import { toDeporte } from "./mappers";
import type { DeporteRaw } from "./raw";

export const deportesApi = {
  async list(signal?: AbortSignal): Promise<Deporte[]> {
    const raw = await apiClient.get<DeporteRaw[]>("/deportes", { service: "canchas", signal });
    return raw.map(toDeporte);
  },
};
