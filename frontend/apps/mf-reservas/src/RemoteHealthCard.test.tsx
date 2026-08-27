import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Component, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RemoteHealthCard } from "./RemoteHealthCard";
import { getOrCreateSessionStore } from "shell/session";
import type { SessionUser } from "shell/session";

const administrador: SessionUser = { id: 5, nombre: "Beto", email: "beto@test.com", rol: "administrador" };

class TestErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return <p>capturado por ErrorBoundary de prueba</p>;
    return this.props.children;
  }
}

describe("RemoteHealthCard (mf-reservas)", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el nombre literal del remote y un build id", () => {
    render(<RemoteHealthCard />);

    expect(screen.getByTestId("remote-name")).toHaveTextContent("mf-reservas");
    expect(screen.getByTestId("build-id")).not.toHaveTextContent("");
  });

  it("muestra el origen federado, no el del shell", () => {
    render(<RemoteHealthCard />);

    expect(screen.getByTestId("remote-origin")).toHaveTextContent("localhost:3001");
  });

  it("refleja el usuario y rol de la sesión del shell", () => {
    getOrCreateSessionStore().set({ user: administrador, token: "tok" });
    render(<RemoteHealthCard />);

    expect(screen.getByTestId("session-user")).toHaveTextContent(administrador.email);
    expect(screen.getByTestId("session-rol")).toHaveTextContent("administrador");
  });

  it("el control 'forzar error' lanza un error dentro del árbol de render", async () => {
    render(
      <TestErrorBoundary>
        <RemoteHealthCard />
      </TestErrorBoundary>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /forzar error/i }));

    expect(await screen.findByText(/capturado por errorboundary de prueba/i)).toBeInTheDocument();
  });

  it("el probe de backend degrada a 'no conectado' sin throw si el microservicio no responde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    getOrCreateSessionStore().set({ user: administrador, token: "tok" });
    render(<RemoteHealthCard />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /probar backend/i }));

    expect(await screen.findByTestId("backend-status")).toHaveTextContent(/no conectado/i);
  });

  it("el probe de backend muestra 'conectado' si el microservicio responde", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } })),
    );
    getOrCreateSessionStore().set({ user: administrador, token: "tok" });
    render(<RemoteHealthCard />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /probar backend/i }));

    await waitFor(() => expect(screen.getByTestId("backend-status")).toHaveTextContent(/conectado/i));
  });
});
