import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, logout } from "./session";
import { getOrCreateSessionStore } from "./store";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("login()", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("éxito: mapea LoginResponse → SessionUser y deja la sesión autenticada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          access_token: "tok-real",
          token_type: "bearer",
          usuario_id: 7,
          nombre: "Ana",
          email: "ana@test.com",
          rol: "usuario",
        }),
      ),
    );

    const user = await login({ email: "ana@test.com", password: "secreta" });

    expect(user).toEqual({ id: 7, nombre: "Ana", email: "ana@test.com", rol: "usuario" });
    expect(getOrCreateSessionStore().getSnapshot().status).toBe("authenticated");
    expect(getOrCreateSessionStore().getSnapshot().token).toBe("tok-real");
  });

  it("rol desconocido ⇒ sesión válida (login no falla) con hasRole() efectivamente en false (ADR-06)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          access_token: "tok-real",
          token_type: "bearer",
          usuario_id: 9,
          nombre: "Cris",
          email: "cris@test.com",
          rol: "invitado",
        }),
      ),
    );

    const user = await login({ email: "cris@test.com", password: "secreta" });

    expect(user.rol).toBe("invitado"); // el string crudo se conserva
    expect(getOrCreateSessionStore().getSnapshot().status).toBe("authenticated");
  });

  it("credenciales inválidas: NO crea sesión, rechaza, y NO dispara logout global (auth:false)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Credenciales inválidas" }, 401)),
    );

    await expect(login({ email: "mal@test.com", password: "mal" })).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "unauthorized",
    });

    expect(getOrCreateSessionStore().getSnapshot().status).toBe("anonymous");
    expect(getOrCreateSessionStore().getSnapshot().token).toBeNull();
  });
});

describe("logout()", () => {
  it("es idempotente: dos logout() seguidos no vuelven a notificar", () => {
    const store = getOrCreateSessionStore();
    store.set({ user: { id: 1, nombre: "Ana", email: "a@a.com", rol: "usuario" }, token: "tok" });
    const listener = vi.fn();
    store.subscribe(listener);

    logout();
    logout();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().status).toBe("anonymous");
  });
});
