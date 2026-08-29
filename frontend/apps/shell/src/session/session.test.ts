import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, logout, register } from "./session";
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

describe("register()", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("éxito: POST /usuarios con rol_id fijo en 1 (usuario), luego autologin deja la sesión autenticada", async () => {
    const calls: Array<{ url: string; body: unknown }> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        calls.push({ url, body });
        // OJO: el servicio se llama "usuarios" y aparece en TODAS las URLs de
        // ms-usuarios (incluida /auth/login) — hay que distinguir por el
        // recurso final, no con un includes() suelto.
        if (url.endsWith("/usuarios")) {
          return jsonResponse({
            id: 5,
            nombre: body.nombre,
            apellido: body.apellido,
            email: body.email,
            telefono: null,
            rol_id: body.rol_id,
            activo: true,
          });
        }
        // /auth/login solo manda {email, password} — el nombre viene del
        // POST /usuarios anterior en esta misma secuencia (autologin).
        return jsonResponse({
          access_token: "tok-nuevo",
          token_type: "bearer",
          usuario_id: 5,
          nombre: "Nueva",
          email: body.email,
          rol: "usuario",
        });
      }),
    );

    const user = await register({
      nombre: "Nueva",
      apellido: "Cuenta",
      email: "nueva@test.com",
      password: "secreta1",
    });

    expect(user).toEqual({ id: 5, nombre: "Nueva", email: "nueva@test.com", rol: "usuario" });
    expect(getOrCreateSessionStore().getSnapshot().status).toBe("authenticated");
    // La única fuente del rol es ROL_USUARIO_ID (1) — nunca algo pasado por el caller.
    expect(calls[0]?.body).toMatchObject({ rol_id: 1 });
  });

  it("email duplicado: NO crea sesión y propaga el detail real del backend (400)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "El email ya está registrado" }, 400)),
    );

    await expect(
      register({ nombre: "X", apellido: "Y", email: "dup@test.com", password: "secreta1" }),
    ).rejects.toMatchObject({ name: "ApiError", status: 400, detail: "El email ya está registrado" });

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
