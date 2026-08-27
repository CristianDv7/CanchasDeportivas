import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession, getSession, subscribeSession } from "./useSession";
import { getOrCreateSessionStore } from "./store";
import type { SessionUser } from "./types";

const user: SessionUser = { id: 1, nombre: "Ana", email: "ana@test.com", rol: "usuario" };
const admin: SessionUser = { id: 2, nombre: "Beto", email: "beto@test.com", rol: "administrador" };

describe("useSession", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
  });

  it("refleja cambios del store en vivo", () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.isAuthenticated).toBe(false);

    act(() => {
      getOrCreateSessionStore().set({ user, token: "tok" });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
    expect(result.current.token).toBe("tok");
  });

  it("hasRole() hace OR lógico entre los roles pasados", () => {
    const { result } = renderHook(() => useSession());

    act(() => {
      getOrCreateSessionStore().set({ user: admin, token: "tok" });
    });

    expect(result.current.hasRole("usuario", "administrador")).toBe(true);
    expect(result.current.hasRole("usuario")).toBe(false);
    expect(result.current.hasRole("administrador")).toBe(true);
  });

  it("hasRole() sin argumentos equivale a isAuthenticated", () => {
    const { result } = renderHook(() => useSession());
    expect(result.current.hasRole()).toBe(false);

    act(() => {
      getOrCreateSessionStore().set({ user, token: "tok" });
    });

    expect(result.current.hasRole()).toBe(true);
  });

  it("rol desconocido ⇒ sesión válida pero hasRole() false para cualquier rol conocido", () => {
    const { result } = renderHook(() => useSession());

    act(() => {
      getOrCreateSessionStore().set({ user: { ...user, rol: "invitado" }, token: "tok" });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.rol).toBeNull();
    expect(result.current.hasRole("usuario", "administrador")).toBe(false);
  });

  it("getSession() lee de forma síncrona fuera de React", () => {
    getOrCreateSessionStore().set({ user, token: "tok" });

    expect(getSession().isAuthenticated).toBe(true);
    expect(getSession().user).toEqual(user);
  });

  it("subscribeSession() notifica cambios y devuelve un unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeSession(listener);

    getOrCreateSessionStore().set({ user, token: "tok" });
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    listener.mockClear();
    getOrCreateSessionStore().clear();
    expect(listener).not.toHaveBeenCalled();
  });
});
