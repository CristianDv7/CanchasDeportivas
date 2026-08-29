// Bug real (2026-08-28): App.tsx montaba las 3 rutas internas (index/nueva/
// mias) pero no exponía NINGÚN link para navegar entre ellas — el shell solo
// linkea a "/reservas" (el índice). "Nueva reserva" y "Mis reservas" solo
// eran alcanzables tipeando la URL a mano, invisibles para un usuario real.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { seedSession } from "./mocks/session";

beforeEach(() => {
  seedSession();
});

describe("App — navegación interna de mf-reservas", () => {
  it("expone links a Disponibilidad, Nueva reserva y Mis reservas", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /disponibilidad/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nueva reserva/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mis reservas/i })).toBeInTheDocument();
  });

  it("el link 'Mis reservas' navega a MisReservasPage", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: /mis reservas/i }));

    expect(await screen.findByRole("heading", { name: /mis reservas/i })).toBeInTheDocument();
  });

  it("el link 'Nueva reserva' navega a NuevaReservaPage", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("link", { name: /nueva reserva/i }));

    expect(await screen.findByRole("heading", { name: /nueva reserva/i })).toBeInTheDocument();
  });
});
