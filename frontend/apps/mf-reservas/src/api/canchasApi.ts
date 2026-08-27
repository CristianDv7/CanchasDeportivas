// Único archivo que conoce los paths reales de ms-canchas (design.md §1).
import { apiClient } from "shell/apiClient";
import type { Cancha } from "./dto";
import { toCancha } from "./mappers";
import type { CanchaRaw } from "./raw";

export const canchasApi = {
  /** Fetcher compatible con `useResource<Cancha[]>`: `(signal) => Promise<T>`. */
  async list(signal?: AbortSignal): Promise<Cancha[]> {
    const raw = await apiClient.get<CanchaRaw[]>("/canchas", { service: "canchas", signal });
    return raw.map(toCancha);
  },
};
