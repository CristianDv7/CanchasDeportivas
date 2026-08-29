// spec.md "Ver disponibilidad": renderiza los bloques devueltos por el
// adapter tal cual (`libre`/`ocupado`), sin inferir ocupación de otra
// fuente. Cancha sin horario ese día ⇒ `bloques` vacío ⇒ mensaje vacío, sin
// error (design.md §7, requirement "Cancha sin horario de atención ese día").
// Mismo layout de grilla de tarjetas que ReservaForm (Nueva reserva) —
// unificado a pedido (2026-08-29): antes era una tabla con look propio
// ("pizarra de turnos"), ahora usa el mismo lenguaje visual en toda la
// sección Reservas. No es interactivo (sin radios): es solo lectura.
import type { BloqueDisponibilidad } from "../../api";
import "./BloquesGrid.css";

export interface BloquesGridProps {
  readonly bloques: readonly BloqueDisponibilidad[];
}

export function BloquesGrid({ bloques }: BloquesGridProps) {
  if (bloques.length === 0) {
    return (
      <p data-testid="bloques-grid-vacia" className="mfr-bloques-grid-vacia">
        No hay bloques disponibles para esta fecha.
      </p>
    );
  }

  return (
    <div data-testid="bloques-grid" className="mfr-bloques-grid">
      <span className="mfr-bloques-grid-label">Horarios</span>
      <div className="mfr-bloques-options">
        {bloques.map((bloque) => (
          <div
            key={`${bloque.horaInicio}-${bloque.horaFin}`}
            data-testid="bloque"
            data-estado={bloque.estado}
            className="mfr-bloque"
          >
            {bloque.horaInicio.slice(0, 5)}–{bloque.horaFin.slice(0, 5)} · {bloque.estado}
          </div>
        ))}
      </div>
    </div>
  );
}
