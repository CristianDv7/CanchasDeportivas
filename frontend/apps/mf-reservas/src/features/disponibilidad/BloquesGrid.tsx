// spec.md "Ver disponibilidad": renderiza los bloques devueltos por el
// adapter tal cual (`libre`/`ocupado`), sin inferir ocupación de otra
// fuente. Cancha sin horario ese día ⇒ `bloques` vacío ⇒ mensaje vacío, sin
// error (design.md §7, requirement "Cancha sin horario de atención ese día").
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
      <div className="mfr-bloques-grid-header">
        <span>Horario</span>
        <span>Estado</span>
      </div>
      {bloques.map((bloque) => (
        <div
          key={`${bloque.horaInicio}-${bloque.horaFin}`}
          data-testid="bloque"
          data-estado={bloque.estado}
          className="mfr-bloque"
        >
          <span className="mfr-bloque-hora">
            {bloque.horaInicio.slice(0, 5)}–{bloque.horaFin.slice(0, 5)}
          </span>
          <span className="mfr-bloque-estado">
            <span className="mfr-dot" aria-hidden="true" />
            {bloque.estado}
          </span>
        </div>
      ))}
    </div>
  );
}
