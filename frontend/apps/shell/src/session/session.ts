// login()/logout() (design.md §4, §5.2, ADR-06, ADR-07 — task 2.3.2).
// Vive separado de store.ts para no crear un ciclo: este archivo importa
// ../http (que a su vez importa session/store.ts para el wiring del
// singleton), store.ts nunca importa hacia acá.
import { apiClient } from "../http";
import type { ApiError } from "../http/types";
import { getOrCreateSessionStore } from "./store";
import { mapLoginResponse } from "./types";
import type { LoginResponse, LogoutReason, SessionUser } from "./types";

const store = getOrCreateSessionStore();

export async function login(credentials: { email: string; password: string }): Promise<SessionUser> {
  store.setStatus("authenticating");
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials, {
      service: "usuarios",
      auth: false,
    });
    const user = mapLoginResponse(response);
    store.set({ user, token: response.access_token });
    return user;
  } catch (err) {
    // auth:false ⇒ este 401 es un error de formulario, no expiración: no
    // dispara logout global (eso ya lo garantiza apiClient, ver client.ts).
    store.setStatus("anonymous", err as ApiError);
    throw err;
  }
}

export function logout(_reason: LogoutReason = "user"): void {
  const snapshot = store.getSnapshot();
  // Idempotente (design.md §5.2): dos logout() seguidos no deben notificar
  // ni escribir el espejo dos veces.
  if (snapshot.status !== "authenticated" && snapshot.token === null) return;
  store.clear();
}
