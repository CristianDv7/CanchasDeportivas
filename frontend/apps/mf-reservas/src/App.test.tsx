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

describe("App — reservar/cancelar es exclusivo de rol usuario", () => {
  it("admin NO ve los links 'Nueva reserva' ni 'Mis reservas' (solo administra vía mf-administracion)", () => {
    seedSession({ rol: "administrador" });
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /disponibilidad/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /nueva reserva/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /mis reservas/i })).not.toBeInTheDocument();
  });

  it("admin no puede llegar a /mias ni tipeando la URL directo (defensa en profundidad, no solo ocultar el link)", () => {
    seedSession({ rol: "administrador" });
    render(
      <MemoryRouter initialEntries={["/mias"]}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: /mis reservas/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /disponibilidad/i })).toBeInTheDocument();
  });

  it("usuario sí ve los 3 links (comportamiento sin cambios)", () => {
    seedSession({ rol: "usuario" });
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /nueva reserva/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /mis reservas/i })).toBeInTheDocument();
  });
});
