// spec.md "Ver disponibilidad": renderiza los bloques devueltos por el
// adapter tal cual (`libre`/`ocupado`), sin inferir ocupación de otra
// fuente. Cancha sin horario ese día ⇒ `bloques` vacío ⇒ mensaje vacío, sin
// error (design.md §7, requirement "Cancha sin horario de atención ese día").
import type { BloqueDisponibilidad } from "../../api";

export interface BloquesGridProps {
  readonly bloques: readonly BloqueDisponibilidad[];
}

export function BloquesGrid({ bloques }: BloquesGridProps) {
  if (bloques.length === 0) {
    return <p data-testid="bloques-grid-vacia">No hay bloques disponibles para esta fecha.</p>;
  }

  return (
    <ul data-testid="bloques-grid">
      {bloques.map((bloque) => (
        <li
          key={`${bloque.horaInicio}-${bloque.horaFin}`}
          data-testid="bloque"
          data-estado={bloque.estado}
        >
          {bloque.horaInicio.slice(0, 5)}–{bloque.horaFin.slice(0, 5)} · {bloque.estado}
        </li>
      ))}
    </ul>
  );
}
