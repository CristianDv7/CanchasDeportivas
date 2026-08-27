import { afterEach, describe, expect, it, vi } from "vitest";
import { createNullMirror, createSessionStorageMirror } from "./mirror";
import type { PersistedSession } from "./mirror";

const persisted: PersistedSession = {
  v: 1,
  token: "tok-123",
  user: { id: 1, nombre: "Ana", email: "ana@test.com", rol: "usuario" },
};

describe("createSessionStorageMirror", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("write() persiste y read() devuelve el mismo valor", () => {
    const mirror = createSessionStorageMirror("cd.session.v1");

    mirror.write(persisted);

    expect(mirror.read()).toEqual(persisted);
  });

  it("clear() borra el valor persistido", () => {
    const mirror = createSessionStorageMirror("cd.session.v1");
    mirror.write(persisted);

    mirror.clear();

    expect(mirror.read()).toBeNull();
  });

  it("read() con JSON corrupto devuelve null y limpia la clave", () => {
    const mirror = createSessionStorageMirror("cd.session.v1");
    window.sessionStorage.setItem("cd.session.v1", "{not-json");

    expect(mirror.read()).toBeNull();
    expect(window.sessionStorage.getItem("cd.session.v1")).toBeNull();
  });

  it("read() con `v` inválido devuelve null y limpia la clave", () => {
    const mirror = createSessionStorageMirror("cd.session.v1");
    window.sessionStorage.setItem(
      "cd.session.v1",
      JSON.stringify({ ...persisted, v: 2 }),
    );

    expect(mirror.read()).toBeNull();
    expect(window.sessionStorage.getItem("cd.session.v1")).toBeNull();
  });

  it("usa 'cd.session.v1' como key por default", () => {
    const mirror = createSessionStorageMirror();
    mirror.write(persisted);

    expect(window.sessionStorage.getItem("cd.session.v1")).not.toBeNull();
  });

  it("si sessionStorage lanza al construir, degrada en silencio a un mirror no-op (sin throw)", () => {
    // jsdom implementa sessionStorage como un Proxy que intercepta cualquier
    // acceso de propiedad como clave de storage: no se puede espiar
    // `setItem` con vi.spyOn/defineProperty. Se inyecta un doble explícito
    // (parámetro `storage` opcional, default `window.sessionStorage`).
    const throwingStorage: Storage = {
      ...window.sessionStorage,
      getItem: () => {
        throw new DOMException("denegado");
      },
      setItem: () => {
        throw new DOMException("denegado");
      },
      removeItem: () => {
        throw new DOMException("denegado");
      },
      clear: () => {
        throw new DOMException("denegado");
      },
      key: () => null,
      length: 0,
    };

    expect(() =>
      createSessionStorageMirror("cd.session.v1", throwingStorage),
    ).not.toThrow();

    const mirror = createSessionStorageMirror("cd.session.v1", throwingStorage);
    expect(() => mirror.write(persisted)).not.toThrow();
    expect(mirror.read()).toBeNull();
    expect(() => mirror.clear()).not.toThrow();
  });
});

describe("createNullMirror", () => {
  it("read() siempre devuelve null, write()/clear() son no-op y nunca lanzan", () => {
    const mirror = createNullMirror();

    expect(mirror.read()).toBeNull();
    expect(() => mirror.write(persisted)).not.toThrow();
    expect(() => mirror.clear()).not.toThrow();
    expect(mirror.read()).toBeNull();
  });
});
