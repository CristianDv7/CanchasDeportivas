// RED (tasks.md 7.3): design.md §5 — diálogo base (título, mensaje,
// confirmar/cancelar), sin lógica de negocio propia (esa vive en
// InactivarCanchaDialog, Phase 8). `message` acepta ReactNode para poder
// mostrar la advertencia de ADR-03 (conteo + link).
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("muestra título y mensaje dentro de un role=dialog", () => {
    render(
      <ConfirmDialog
        titulo="Inactivar cancha"
        mensaje="¿Confirmás la inactivación?"
        onConfirmar={() => {}}
        onCancelar={() => {}}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("Inactivar cancha");
    expect(dialog).toHaveTextContent("¿Confirmás la inactivación?");
  });

  it("invoca onConfirmar al click en Confirmar", async () => {
    const onConfirmar = vi.fn();
    render(
      <ConfirmDialog
        titulo="Inactivar cancha"
        mensaje="¿Confirmás?"
        onConfirmar={onConfirmar}
        onCancelar={() => {}}
      />,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    expect(onConfirmar).toHaveBeenCalledOnce();
  });

  it("invoca onCancelar al click en Cancelar", async () => {
    const onCancelar = vi.fn();
    render(
      <ConfirmDialog
        titulo="Inactivar cancha"
        mensaje="¿Confirmás?"
        onConfirmar={() => {}}
        onCancelar={onCancelar}
      />,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onCancelar).toHaveBeenCalledOnce();
  });

  it("acepta ReactNode como mensaje (ADR-03: advertencia con conteo/link)", () => {
    render(
      <ConfirmDialog
        titulo="Inactivar cancha"
        mensaje={<p data-testid="advertencia-custom">3 reservas confirmadas a futuro</p>}
        onConfirmar={() => {}}
        onCancelar={() => {}}
      />,
    );

    expect(screen.getByTestId("advertencia-custom")).toHaveTextContent("3 reservas confirmadas a futuro");
  });

  it("confirmarDeshabilitado desactiva el botón Confirmar", () => {
    render(
      <ConfirmDialog
        titulo="t"
        mensaje="m"
        onConfirmar={() => {}}
        onCancelar={() => {}}
        confirmarDeshabilitado
      />,
    );

    expect(screen.getByRole("button", { name: /confirmar/i })).toBeDisabled();
  });
});
