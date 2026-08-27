import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";
import { getOrCreateSessionStore } from "../session/store";
import type { SessionUser } from "../session/types";

const usuario: SessionUser = { id: 1, nombre: "Ana", email: "ana@test.com", rol: "usuario" };
const administrador: SessionUser = { id: 2, nombre: "Beto", email: "beto@test.com", rol: "administrador" };

function renderProtected(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<p>Login Page</p>} />
        <Route path="/acceso-denegado" element={<p>Acceso Denegado</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/reservas" element={<p>Reservas Home</p>} />
          <Route element={<RequireRole rol="administrador" />}>
            <Route path="/administracion" element={<p>Administracion Home</p>} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequireAuth / RequireRole", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
  });

  it("status='idle': nunca redirige, muestra BootSplash", () => {
    // Fuerza status idle (estado inicial real antes de hydrate()).
    // getSnapshot() por default en un store recién creado ya es 'idle' salvo
    // que se haya llamado clear()/hydrate() antes; se simula reconstruyendo.
    const store = getOrCreateSessionStore();
    store.setStatus("idle");
    renderProtected(["/reservas"]);

    expect(screen.queryByText("Reservas Home")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it("status='anonymous': redirige a /login", () => {
    renderProtected(["/reservas"]);

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("rol 'usuario' bloqueado en ruta de administrador ⇒ /acceso-denegado", () => {
    getOrCreateSessionStore().set({ user: usuario, token: "tok" });
    renderProtected(["/administracion"]);

    expect(screen.getByText("Acceso Denegado")).toBeInTheDocument();
  });

  it("rol 'administrador' tiene acceso completo", () => {
    getOrCreateSessionStore().set({ user: administrador, token: "tok" });
    renderProtected(["/administracion"]);

    expect(screen.getByText("Administracion Home")).toBeInTheDocument();
  });

  it("rol desconocido queda bloqueado igual que 'usuario'", () => {
    getOrCreateSessionStore().set({ user: { ...usuario, rol: "invitado" }, token: "tok" });
    renderProtected(["/administracion"]);

    expect(screen.getByText("Acceso Denegado")).toBeInTheDocument();
  });

  it("cualquier rol autenticado entra a /reservas", () => {
    getOrCreateSessionStore().set({ user: usuario, token: "tok" });
    renderProtected(["/reservas"]);

    expect(screen.getByText("Reservas Home")).toBeInTheDocument();
  });
});
