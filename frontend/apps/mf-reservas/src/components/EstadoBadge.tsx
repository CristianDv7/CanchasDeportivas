// design.md §5/§7 — envoltorio de UI puro sobre `domain/rules.estadoBadge`.
// Compartido entre mis-reservas y disponibilidad (§1). No decide lógica de
// negocio propia: si `estadoBadge` cambia (p.ej. nuevo estado), este
// componente no necesita tocarse.
import { estadoBadge } from "../domain/rules";
import type { EstadoReserva } from "../api/dto";
import "./EstadoBadge.css";

export interface EstadoBadgeProps {
  readonly estado: EstadoReserva | null;
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  const { label, tone } = estadoBadge(estado);

  return (
    <span data-testid="estado-badge" data-tone={tone} className="mfr-badge">
      {label}
    </span>
  );
}
