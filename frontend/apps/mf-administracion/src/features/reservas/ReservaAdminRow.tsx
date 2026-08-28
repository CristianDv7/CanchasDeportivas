// spec.md "Cancelación de cualquier reserva (RN-03 admin)" + "RN-04 sin
// bypass" + "Badges de estado (RN-08)" — design.md §4/§7. Presentacional
// puro: delega 100% en `canCancel` (mismo criterio para admin que para
// usuario final, ADR-04). Mismo patrón que ReservaRow de mf-reservas.
import type { ReservaAdmin } from "../../api";
import { EstadoBadge } from "../../components/EstadoBadge";
import { canCancel } from "../../domain/rules";
import "./ReservaAdminRow.css";

export interface ReservaAdminRowProps {
  readonly reserva: ReservaAdmin;
  readonly pending: boolean;
  readonly onCancelar: (id: number) => void;
}

export function ReservaAdminRow({ reserva, pending, onCancelar }: ReservaAdminRowProps) {
  const habilitado = canCancel(reserva) && !pending;

  return (
    <li data-testid="reserva-admin-row" className="mfa-reserva-admin-row">
      <span data-testid="reserva-cancha-label">{reserva.canchaLabel}</span>
      <span data-testid="reserva-usuario-label">{reserva.usuarioLabel}</span>
      <span className="mfa-reserva-admin-fecha">
        {reserva.fecha} {reserva.horaInicio.slice(0, 5)}–{reserva.horaFin.slice(0, 5)}
      </span>
      <EstadoBadge estado={reserva.estado} />
      <button
        type="button"
        className="mfa-reserva-admin-cancelar"
        disabled={!habilitado}
        onClick={() => onCancelar(reserva.id)}
      >
        Cancelar
      </button>
    </li>
  );
}
