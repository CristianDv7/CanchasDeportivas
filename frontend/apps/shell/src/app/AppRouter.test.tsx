import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRouter } from "./AppRouter";
import { getOrCreateSessionStore } from "../session/store";
import type { SessionUser } from "../session/types";

const usuario: SessionUser = { id: 1, nombre: "Ana", email: "ana@test.com", rol: "usuario" };
const administrador: SessionUser = { id: 2, nombre: "Beto", email: "beto@test.com", rol: "administrador" };

const fakeLoaders = {
  reservas: vi.fn().mockResolvedValue({ default: () => <p>mf-reservas mounted</p> }),
  administracion: vi.fn().mockResolvedValue({ default: () => <p>mf-administracion mounted</p> }),
  reportes: vi.fn().mockResolvedValue({ default: () => <p>mf-reportes mounted</p> }),
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRouter remoteLoaders={fakeLoaders} />
    </MemoryRouter>,
  );
}

describe("AppRouter", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
  });

  it("'/' redirige a /reservas", async () => {
    getOrCreateSessionStore().set({ user: usuario, token: "tok" });
    renderAt("/");

    expect(await screen.findByText("mf-reservas mounted")).toBeInTheDocument();
  });

  it("/reservas monta el remote mf-reservas para cualquier rol autenticado", async () => {
    getOrCreateSessionStore().set({ user: usuario, token: "tok" });
    renderAt("/reservas");

    expect(await screen.findByText("mf-reservas mounted")).toBeInTheDocument();
  });

  it("usuario sin rol administrador es bloqueado en /administracion", async () => {
    getOrCreateSessionStore().set({ user: usuario, token: "tok" });
    renderAt("/administracion");

    expect(await screen.findByText(/acceso denegado/i)).toBeInTheDocument();
  });

  it("administrador monta mf-administracion y mf-reportes", async () => {
    getOrCreateSessionStore().set({ user: administrador, token: "tok" });
    renderAt("/administracion");
    expect(await screen.findByText("mf-administracion mounted")).toBeInTheDocument();
  });

  it("ruta desconocida muestra un 404 en vez de pantalla en blanco", () => {
    renderAt("/esto-no-existe");

    expect(screen.getByText(/no encontrada|404/i)).toBeInTheDocument();
  });

  it("/login con sesión activa redirige a /reservas", async () => {
    getOrCreateSessionStore().set({ user: usuario, token: "tok" });
    renderAt("/login");

    expect(await screen.findByText("mf-reservas mounted")).toBeInTheDocument();
  });

  it("sin sesión, /login muestra el formulario", () => {
    renderAt("/login");

    expect(screen.getByRole("form", { name: /iniciar sesión/i })).toBeInTheDocument();
  });
});
