// RED (tasks.md 7.1): design.md §3 — el banner solo renderiza `message` y
// condiciona el botón "Reintentar" a `action === "retry"`.
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { UiError } from "../api/errors";
import { ErrorBanner } from "./ErrorBanner";

describe("ErrorBanner", () => {
  it("muestra el message dentro de un role=alert", () => {
    const error: UiError = { message: "Ya existe una cancha con ese nombre", action: "none", status: 400 };

    render(<ErrorBanner error={error} />);

    expect(screen.getByRole("alert")).toHaveTextContent(error.message);
  });

  it("no muestra el botón Reintentar si action !== 'retry'", () => {
    const error: UiError = {
      message: "No tenés permisos para esta operación de administración.",
      action: "none",
      status: 403,
    };

    render(<ErrorBanner error={error} />);

    expect(screen.queryByRole("button", { name: /reintentar/i })).not.toBeInTheDocument();
  });

  it("muestra el botón Reintentar si action === 'retry' e invoca onRetry al click", async () => {
    const onRetry = vi.fn();
    const error: UiError = {
      message: "El servidor no pudo procesar la solicitud. Probá de nuevo.",
      action: "retry",
      status: 500,
    };
    render(<ErrorBanner error={error} onRetry={onRetry} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
