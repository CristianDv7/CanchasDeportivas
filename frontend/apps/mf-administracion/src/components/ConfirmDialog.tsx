// design.md §5 — base del diálogo de confirmación (título, mensaje,
// confirmar/cancelar), sin lógica de negocio propia: quien decide el
// contenido de `mensaje` y si `confirmarDeshabilitado` es la feature que lo
// usa (p. ej. InactivarCanchaDialog, ADR-03).
import type { ReactNode } from "react";
import "./ConfirmDialog.css";

export interface ConfirmDialogProps {
  readonly titulo: string;
  readonly mensaje: ReactNode;
  readonly onConfirmar: () => void;
  readonly onCancelar: () => void;
  readonly confirmarDeshabilitado?: boolean;
  readonly confirmarLabel?: string;
}

export function ConfirmDialog({
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
  confirmarDeshabilitado = false,
  confirmarLabel = "Confirmar",
}: ConfirmDialogProps) {
  return (
    <div role="dialog" aria-modal="true" aria-label={titulo} className="mfa-confirm-dialog">
      <div className="mfa-confirm-dialog-panel">
        <h3 className="mfa-confirm-dialog-title">{titulo}</h3>
        <div className="mfa-confirm-dialog-mensaje">{mensaje}</div>
        <div className="mfa-confirm-dialog-actions">
          <button type="button" className="mfa-confirm-dialog-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="mfa-confirm-dialog-confirmar"
            onClick={onConfirmar}
            disabled={confirmarDeshabilitado}
          >
            {confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
