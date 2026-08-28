// design.md ADR-03 — advertencia informada, NUNCA bloqueo. Carga
// `GET /reservas/` (vía reservasAdminApi.listPanel, ya disponible) y cuenta
// con `contarAfectadasPorInactivar`. Si la verificación falla, el botón
// Inactivar sigue habilitado: un fallo de lectura no puede vetar una
// operación de escritura legítima.
import type { ReactNode } from "react";
import { reservasAdminApi } from "../../api";
import type { Cancha } from "../../api";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { contarAfectadasPorInactivar } from "../../domain/rules";
import { useResource } from "../../hooks/useResource";

export interface InactivarCanchaDialogProps {
  readonly cancha: Cancha;
  readonly onConfirmar: () => void;
  readonly onCancelar: () => void;
  readonly pendiente: boolean;
}

export function InactivarCanchaDialog({
  cancha,
  onConfirmar,
  onCancelar,
  pendiente,
}: InactivarCanchaDialogProps) {
  const panel = useResource(reservasAdminApi.listPanel, []);

  const conteo = panel.data ? contarAfectadasPorInactivar(panel.data, cancha.id) : null;

  let mensaje: ReactNode;
  if (panel.error) {
    mensaje = (
      <p data-testid="inactivar-verificacion-error">
        No se pudo verificar si hay reservas afectadas.
      </p>
    );
  } else if (conteo !== null && conteo > 0) {
    mensaje = (
      <p data-testid="inactivar-advertencia">
        Esta cancha tiene {conteo} reservas confirmadas a futuro. Inactivarla impide nuevas
        reservas pero no cancela las existentes. Revisá el{" "}
        <a href={`/administracion/reservas?cancha=${cancha.id}`}>panel de reservas</a> si querés
        cancelarlas.
      </p>
    );
  } else {
    mensaje = <p>¿Confirmás la inactivación de &quot;{cancha.nombre}&quot;?</p>;
  }

  return (
    <ConfirmDialog
      titulo={`Inactivar ${cancha.nombre}`}
      mensaje={mensaje}
      confirmarLabel="Inactivar"
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
      confirmarDeshabilitado={pendiente}
    />
  );
}
