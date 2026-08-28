// Único archivo que conoce el path real de `GET /usuarios` (design.md §1,
// ms-usuarios, admin-only). Fuente decorativa del enrichment (ADR-07).
import { apiClient } from "shell/apiClient";
import type { Usuario } from "./dto";
import { toUsuario } from "./mappers";
import type { UsuarioRaw } from "./raw";

export const usuariosApi = {
  async list(signal?: AbortSignal): Promise<Usuario[]> {
    const raw = await apiClient.get<UsuarioRaw[]>("/usuarios", { service: "usuarios", signal });
    return raw.map(toUsuario);
  },
};
