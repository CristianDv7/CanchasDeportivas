import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RemoteBoundary } from "./RemoteBoundary";

describe("RemoteBoundary", () => {
  it("un remote que rechaza es capturado por su propio ErrorBoundary sin afectar al resto del árbol", async () => {
    const loader = vi.fn().mockRejectedValue(new Error("remoteEntry no disponible"));

    render(
      <div>
        <p>Sibling OK</p>
        <RemoteBoundary name="mf-reservas" loader={loader} />
      </div>,
    );

    expect(await screen.findByText(/mf-reservas no disponible/i)).toBeInTheDocument();
    expect(screen.getByText("Sibling OK")).toBeInTheDocument();
  });

  it("un remote YA montado que lanza en render es capturado por su boundary; el layout y el otro remote siguen vivos", async () => {
    // Distinto del caso de arriba: acá el loader resuelve bien (el remoteEntry
    // cargó), y el error ocurre dentro del árbol de render del remote — que es
    // lo que dispara el botón "forzar error" del RemoteHealthCard.
    const Exploding = () => {
      throw new Error("Error forzado desde RemoteHealthCard (mf-reservas)");
    };
    const roto = vi.fn().mockResolvedValue({ default: Exploding });
    const sano = vi.fn().mockResolvedValue({ default: () => <p>mf-reportes OK</p> });

    render(
      <div>
        <nav>Nav del shell</nav>
        <RemoteBoundary name="mf-reservas" loader={roto} />
        <RemoteBoundary name="mf-reportes" loader={sano} />
      </div>,
    );

    expect(await screen.findByText(/mf-reservas no disponible/i)).toBeInTheDocument();
    expect(await screen.findByText("mf-reportes OK")).toBeInTheDocument();
    expect(screen.getByText("Nav del shell")).toBeInTheDocument();
  });

  it('el botón "Reintentar" remonta el remote invocando el loader de nuevo', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error("caído"))
      .mockResolvedValueOnce({ default: () => <p>Remote OK</p> });

    render(<RemoteBoundary name="mf-reservas" loader={loader} />);

    expect(await screen.findByText(/mf-reservas no disponible/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(await screen.findByText("Remote OK")).toBeInTheDocument();
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
