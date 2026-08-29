// Único archivo que conoce el path real de `GET /deportes` (ms-canchas, sin
// auth). Usado solo para el ícono de deporte junto al selector de cancha
// (CanchaFechaPicker) — mismo patrón que mf-administracion/api/deportesApi.
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
