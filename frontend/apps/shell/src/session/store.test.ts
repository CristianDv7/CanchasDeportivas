import { describe, expect, it, vi } from "vitest";
import { createMemorySessionStore, getOrCreateSessionStore } from "./store";
import { createNullMirror } from "./mirror";
import type { SessionMirror, PersistedSession } from "./mirror";
import type { SessionUser } from "./types";

const user: SessionUser = { id: 1, nombre: "Ana", email: "ana@test.com", rol: "usuario" };

describe("createMemorySessionStore", () => {
  it("getSnapshot() devuelve una referencia estable si nada cambió", () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });

    const a = store.getSnapshot();
    const b = store.getSnapshot();

    expect(a).toBe(b);
  });

  it("getSnapshot() cambia de referencia después de set()", () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    const before = store.getSnapshot();

    store.set({ user, token: "tok-1" });

    expect(store.getSnapshot()).not.toBe(before);
    expect(store.getSnapshot().user).toEqual(user);
    expect(store.getSnapshot().token).toBe("tok-1");
    expect(store.getSnapshot().status).toBe("authenticated");
  });

  it("hydrate() restaura desde el mirror si hay una sesión persistida", async () => {
    const persisted: PersistedSession = { v: 1, token: "tok-2", user };
    const mirror: SessionMirror = {
      read: () => persisted,
      write: vi.fn(),
      clear: vi.fn(),
    };
    const store = createMemorySessionStore({ mirror });

    const snapshot = await store.hydrate();

    expect(snapshot.status).toBe("authenticated");
    expect(snapshot.user).toEqual(user);
    expect(snapshot.token).toBe("tok-2");
    expect(store.getSnapshot()).toBe(snapshot);
  });

  it("hydrate() sin sesión persistida deja status='anonymous'", async () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });

    const snapshot = await store.hydrate();

    expect(snapshot.status).toBe("anonymous");
    expect(snapshot.user).toBeNull();
    expect(snapshot.token).toBeNull();
  });

  it("set() escribe en el espejo", () => {
    const mirror: SessionMirror = {
      read: () => null,
      write: vi.fn(),
      clear: vi.fn(),
    };
    const store = createMemorySessionStore({ mirror });

    store.set({ user, token: "tok-3" });

    expect(mirror.write).toHaveBeenCalledWith({ v: 1, token: "tok-3", user });
  });

  it("clear() borra memoria y espejo, deja status='anonymous'", () => {
    const mirror: SessionMirror = {
      read: () => null,
      write: vi.fn(),
      clear: vi.fn(),
    };
    const store = createMemorySessionStore({ mirror });
    store.set({ user, token: "tok-4" });

    store.clear();

    expect(mirror.clear).toHaveBeenCalledTimes(1);
    const snapshot = store.getSnapshot();
    expect(snapshot.status).toBe("anonymous");
    expect(snapshot.user).toBeNull();
    expect(snapshot.token).toBeNull();
  });

  it("notifica a los subscribers en cada cambio", () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    const listener = vi.fn();
    store.subscribe(listener);

    store.set({ user, token: "tok-5" });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("subscribe() devuelve un unsubscribe que corta las notificaciones", () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.set({ user, token: "tok-6" });

    expect(listener).not.toHaveBeenCalled();
  });

  it("setStatus() actualiza status y error sin tocar user/token", () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });

    store.setStatus("authenticating");

    expect(store.getSnapshot().status).toBe("authenticating");
    expect(store.getSnapshot().user).toBeNull();
  });

  it("authorizeRequest() con sesión inyecta Authorization: Bearer <token>", () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });
    store.set({ user, token: "tok-7" });

    const init = store.authorizeRequest({ method: "GET" });

    expect(init).not.toBeNull();
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok-7");
  });

  it("authorizeRequest() sin sesión devuelve null", () => {
    const store = createMemorySessionStore({ mirror: createNullMirror() });

    expect(store.authorizeRequest({ method: "GET" })).toBeNull();
  });
});

describe("getOrCreateSessionStore (singleton)", () => {
  it("devuelve la misma instancia entre llamadas", () => {
    const a = getOrCreateSessionStore();
    const b = getOrCreateSessionStore();

    expect(a).toBe(b);
  });

  it("sobrevive a una re-evaluación simulada del módulo (Symbol.for global)", async () => {
    const first = getOrCreateSessionStore();
    // Simula un segundo "container" de Module Federation reimportando el
    // módulo bajo una ruta distinta: usamos vi.resetModules() + reimport.
    vi.resetModules();
    const reimported = await import("./store");
    const second = reimported.getOrCreateSessionStore();

    expect(second).toBe(first);
  });
});
