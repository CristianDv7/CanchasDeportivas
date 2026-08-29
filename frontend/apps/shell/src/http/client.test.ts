import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "./client";
import { createMemorySessionStore } from "../session/store";
import { createNullMirror } from "../session/mirror";
import type { SessionUser } from "../session/types";

const user: SessionUser = { id: 1, nombre: "Ana", email: "ana@test.com", rol: "usuario" };
const config = { apiBase: "/api" };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createApiClient — autorización", () => {
  it("inyecta Authorization cuando hay sesión (auth !== false)", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createApiClient({ fetchImpl, store, config });

    await client.get("/mias", { service: "reservas" });

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok-abc");
  });

  it("sin sesión y auth !== false: NO hace el request, rechaza ApiError{status:0, code:'unauthorized'}", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    const fetchImpl = vi.fn();
    const client = createApiClient({ fetchImpl, store, config });

    await expect(client.get("/mias", { service: "reservas" })).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "unauthorized",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("auth === false: no toca credenciales, se manda el request igual sin sesión", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    const client = createApiClient({ fetchImpl, store, config });

    await client.post("/auth/login", { email: "a@a.com", password: "x" }, { service: "usuarios", auth: false });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect(headers.has("Authorization")).toBe(false);
  });

  it("baseUrlFor(service) resuelve al prefijo same-origin del proxy", () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    const client = createApiClient({ fetchImpl: vi.fn(), store, config });

    expect(client.baseUrlFor("usuarios")).toBe("/api/usuarios");
  });
});

describe("createApiClient — mapeo de errores", () => {
  it("401 en request autenticado: clear() + emitUnauthorized una sola vez (once-guard) + rechaza code:'unauthorized'", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ detail: "Token expirado" }, 401));
    const client = createApiClient({ fetchImpl, store, config });
    const onUnauthorized = vi.fn();
    client.onUnauthorized(onUnauthorized);

    const results = await Promise.allSettled([
      client.get("/mias", { service: "reservas" }),
      client.get("/otras", { service: "reservas" }),
    ]);

    for (const result of results) {
      expect(result.status).toBe("rejected");
      if (result.status === "rejected") {
        expect(result.reason).toMatchObject({ name: "ApiError", status: 401, code: "unauthorized" });
      }
    }
    expect(store.getSnapshot().status).toBe("anonymous");
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("401 con auth:false (login) NO dispara logout global ni onUnauthorized", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ detail: "Credenciales inválidas" }, 401));
    const client = createApiClient({ fetchImpl, store, config });
    const onUnauthorized = vi.fn();
    client.onUnauthorized(onUnauthorized);

    await expect(
      client.post("/auth/login", { email: "a@a.com", password: "bad" }, { service: "usuarios", auth: false }),
    ).rejects.toMatchObject({ code: "unauthorized", status: 401 });

    expect(onUnauthorized).not.toHaveBeenCalled();
    expect(store.getSnapshot().status).not.toBe("anonymous");
  });

  it("el once-guard se resetea cuando el store vuelve a status 'authenticated' (nuevo login)", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ detail: "expirado" }, 401));
    const client = createApiClient({ fetchImpl, store, config });
    const onUnauthorized = vi.fn();
    client.onUnauthorized(onUnauthorized);

    await expect(client.get("/mias", { service: "reservas" })).rejects.toBeTruthy();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);

    store.set({ user, token: "tok-nuevo" });
    await expect(client.get("/mias", { service: "reservas" })).rejects.toBeTruthy();
    expect(onUnauthorized).toHaveBeenCalledTimes(2);
  });

  it("403 NO cierra sesión, rechaza code:'forbidden'", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ detail: "Sin permiso" }, 403));
    const client = createApiClient({ fetchImpl, store, config });

    await expect(client.get("/admin", { service: "canchas" })).rejects.toMatchObject({
      code: "forbidden",
      status: 403,
    });
    expect(store.getSnapshot().status).toBe("authenticated");
  });

  it("422 de FastAPI aplana detail[] a un string legible en .detail y conserva el array en .body", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const detailArray = [{ loc: ["body", "email"], msg: "email inválido", type: "value_error" }];
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ detail: detailArray }, 422));
    const client = createApiClient({ fetchImpl, store, config });

    let caught: unknown;
    try {
      await client.post("/reservas", { foo: "bar" }, { service: "reservas" });
    } catch (err) {
      caught = err;
    }

    expect(caught).toMatchObject({ code: "validation", status: 422 });
    expect((caught as { detail: string }).detail).toContain("email inválido");
    expect((caught as { body: unknown }).body).toMatchObject({ detail: detailArray });
  });

  it("422 con ValueError de un model_validator pela el prefijo 'Value error, ' de Pydantic", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const detailArray = [
      {
        loc: ["body"],
        msg: "Value error, La hora de inicio debe ser menor que la hora de fin",
        type: "value_error",
      },
    ];
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ detail: detailArray }, 422));
    const client = createApiClient({ fetchImpl, store, config });

    let caught: unknown;
    try {
      await client.post("/horarios", { foo: "bar" }, { service: "canchas" });
    } catch (err) {
      caught = err;
    }

    expect((caught as { detail: string }).detail).toBe(
      "La hora de inicio debe ser menor que la hora de fin",
    );
  });

  it("204 / body vacío resuelve undefined sin intentar JSON.parse", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    const client = createApiClient({ fetchImpl, store, config });

    await expect(client.delete("/reservas/1", { service: "reservas" })).resolves.toBeUndefined();
  });

  it("Content-Type no JSON resuelve el texto crudo como T", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("hola texto plano", { status: 200, headers: { "Content-Type": "text/plain" } }),
    );
    const client = createApiClient({ fetchImpl, store, config });

    await expect(client.get<string>("/ping", { service: "reservas" })).resolves.toBe("hola texto plano");
  });

  it("red caída / CORS produce ApiError{status:0, code:'network'}, nunca un TypeError desnudo", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-abc" });
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const client = createApiClient({ fetchImpl, store, config });

    await expect(client.get("/mias", { service: "reservas" })).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
      code: "network",
    });
  });

  it("el token nunca aparece en .url ni en el mensaje del error", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-secreto-nunca-visible" });
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ detail: "Sin permiso" }, 403));
    const client = createApiClient({ fetchImpl, store, config });

    let caught: unknown;
    try {
      await client.get("/admin", { service: "canchas" });
    } catch (err) {
      caught = err;
    }

    const apiError = caught as { url: string; message: string; detail: string };
    expect(apiError.url).not.toContain("tok-secreto-nunca-visible");
    expect(apiError.message).not.toContain("tok-secreto-nunca-visible");
    expect(apiError.detail).not.toContain("tok-secreto-nunca-visible");
  });
});
