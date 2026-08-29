// Bug real (2026-08-28): App.tsx montaba "canchas" y "reservas" como rutas
// internas, pero no exponía NINGÚN link entre ellas — el shell solo linkea a
// "/administracion" (el índice, Canchas). El panel de Reservas (cancelación
// admin, RN-03) solo era alcanzable tipeando la URL a mano.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { seedSession } from "./mocks/session";

beforeEach(() => {
  seedSession();
});

describe("App — navegación interna de mf-administracion", () => {
  it("expone links a Canchas y Reservas", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /canchas/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /reservas/i })).toBeInTheDocument();
  });

  it("el link 'Reservas' navega al panel de reservas admin", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: /reservas/i }));

    expect(await screen.findByRole("heading", { name: /reservas/i })).toBeInTheDocument();
  });
});
