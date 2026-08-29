// spec.md "Cancelar reserva (RN-03/RN-04/RN-05)" + "Badges de estado (RN-08)"
// — design.md §5/§7. Presentacional puro: no decide si debe llamarse a la
// API, solo si el botón se muestra habilitado (delega 100% en `canCancel` de
// `domain/rules.ts`, RN-04). El botón siempre se renderiza (nunca se oculta):
// "deshabilitado u oculto" del spec se resuelve con `disabled` en ambos casos
// (bloque ya iniciado o estado ≠ Confirmada) — más simple de testear y
// consistente en los dos escenarios.
import type { Reserva } from "../../api";
import { EstadoBadge } from "../../components/EstadoBadge";
import { canCancel } from "../../domain/rules";
import "./ReservaRow.css";

export interface ReservaRowProps {
  readonly reserva: Reserva;
  readonly pending: boolean;
  readonly onCancelar: (id: number) => void;
}

export function ReservaRow({ reserva, pending, onCancelar }: ReservaRowProps) {
  const habilitado = canCancel(reserva) && !pending;

  return (
    <li data-testid="reserva-row" className="mfr-reserva-row">
      <span className="mfr-reserva-row-fecha">
        {reserva.fecha} {reserva.horaInicio.slice(0, 5)}–{reserva.horaFin.slice(0, 5)}
      </span>
      <EstadoBadge estado={reserva.estado} />
      <button
        type="button"
        className="mfr-reserva-cancelar"
        disabled={!habilitado}
        onClick={() => onCancelar(reserva.id)}
      >
        Cancelar
      </button>
    </li>
  );
}
