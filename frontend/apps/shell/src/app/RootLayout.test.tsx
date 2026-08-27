import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { RootLayout } from "./RootLayout";
import { getOrCreateSessionStore } from "../session/store";
import type { SessionUser } from "../session/types";

const administrador: SessionUser = { id: 1, nombre: "Beto", email: "beto@test.com", rol: "administrador" };

function renderApp(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/reservas" element={<p>Reservas Content</p>} />
          <Route path="/administracion" element={<p>Administracion Content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("RootLayout", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
    getOrCreateSessionStore().set({ user: administrador, token: "tok" });
  });

  it("mantiene la navegación montada al navegar entre rutas permitidas", async () => {
    renderApp(["/reservas"]);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("Reservas Content")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: /administración/i }));

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.getByText("Administracion Content")).toBeInTheDocument();
    expect(screen.queryByText("Reservas Content")).not.toBeInTheDocument();
  });

  it("muestra el email del usuario autenticado en la nav", () => {
    renderApp(["/reservas"]);

    expect(screen.getByText(administrador.email)).toBeInTheDocument();
  });
});
