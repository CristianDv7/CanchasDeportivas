import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterPage } from "./RegisterPage";
import { getOrCreateSessionStore } from "../session/store";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={["/registro"]}>
      <Routes>
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/login" element={<p>Login Home</p>} />
        <Route path="/reservas" element={<p>Reservas Home</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function completarFormulario(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { password?: string; confirmar?: string } = {},
) {
  await user.type(screen.getByLabelText(/^nombre$/i), "Nueva");
  await user.type(screen.getByLabelText(/^apellido$/i), "Cuenta");
  await user.type(screen.getByLabelText(/^email$/i), "nueva@test.com");
  await user.type(screen.getByLabelText(/^contraseña$/i), overrides.password ?? "secreta1");
  await user.type(
    screen.getByLabelText(/confirmar contraseña/i),
    overrides.confirmar ?? overrides.password ?? "secreta1",
  );
}

describe("RegisterPage", () => {
  beforeEach(() => {
    getOrCreateSessionStore().clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("alta exitosa: crea la cuenta, autologuea y navega a /reservas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url: string) => {
        // "usuarios" es el nombre del servicio: aparece también en
        // /auth/login. Distinguir por el recurso final, no con includes().
        if (url.endsWith("/usuarios")) {
          return jsonResponse({
            id: 5,
            nombre: "Nueva",
            apellido: "Cuenta",
            email: "nueva@test.com",
            telefono: null,
            rol_id: 1,
            activo: true,
          });
        }
        return jsonResponse({
          access_token: "tok",
          token_type: "bearer",
          usuario_id: 5,
          nombre: "Nueva",
          email: "nueva@test.com",
          rol: "usuario",
        });
      }),
    );
    renderRegisterPage();
    const user = userEvent.setup();

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByText("Reservas Home")).toBeInTheDocument();
  });

  it("contraseñas que no coinciden: muestra error y NO llama al backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderRegisterPage();
    const user = userEvent.setup();

    await completarFormulario(user, { password: "secreta1", confirmar: "otra-cosa" });
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/no coinciden/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("email duplicado: muestra el detail real del backend, sin navegar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "El email ya está registrado" }, 400)),
    );
    renderRegisterPage();
    const user = userEvent.setup();

    await completarFormulario(user);
    await user.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("El email ya está registrado");
    expect(screen.queryByText("Reservas Home")).not.toBeInTheDocument();
  });

  it("link a /login está presente", async () => {
    vi.stubGlobal("fetch", vi.fn());
    renderRegisterPage();

    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
