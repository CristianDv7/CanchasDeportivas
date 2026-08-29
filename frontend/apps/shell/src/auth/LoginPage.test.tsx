import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";
import { getOrCreateSessionStore } from "../session/store";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderLoginPage(initialEntries: Array<string | { pathname: string; state?: unknown }> = ["/login"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reservas" element={<p>Reservas Home</p>} />
        <Route path="/administracion" element={<p>Administracion Home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submit válido navega a /reservas por default", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          access_token: "tok",
          token_type: "bearer",
          usuario_id: 1,
          nombre: "Ana",
          email: "ana@test.com",
          rol: "usuario",
        }),
      ),
    );
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "ana@test.com");
    await user.type(screen.getByLabelText(/contraseña/i), "secreta");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(await screen.findByText("Reservas Home")).toBeInTheDocument();
  });

  it("submit válido navega a state.from si viene de un redirect de guard", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          access_token: "tok",
          token_type: "bearer",
          usuario_id: 2,
          nombre: "Beto",
          email: "beto@test.com",
          rol: "administrador",
        }),
      ),
    );
    renderLoginPage([{ pathname: "/login", state: { from: { pathname: "/administracion" } } }]);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "beto@test.com");
    await user.type(screen.getByLabelText(/contraseña/i), "secreta");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(await screen.findByText("Administracion Home")).toBeInTheDocument();
  });

  it("submit inválido muestra error sin navegar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Credenciales inválidas" }, 401)),
    );
    renderLoginPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "mal@test.com");
    await user.type(screen.getByLabelText(/contraseña/i), "mal");
    await user.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/credenciales inválidas/i);
    await waitFor(() => expect(screen.queryByText("Reservas Home")).not.toBeInTheDocument());
  });

  it("link a /registro está presente", () => {
    renderLoginPage();

    expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute(
      "href",
      "/registro",
    );
  });
});
