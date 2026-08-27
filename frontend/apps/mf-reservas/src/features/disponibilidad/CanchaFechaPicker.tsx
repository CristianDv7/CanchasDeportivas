// Selector de cancha (poblado desde `canchasApi.list`) + fecha. Componente
// controlado: no guarda estado propio, delega en `DisponibilidadPage`
// (design.md §7).
import type { Cancha, IsoDate } from "../../api";

export interface CanchaFechaPickerProps {
  readonly canchas: readonly Cancha[];
  readonly canchaId: number | null;
  readonly fecha: IsoDate | null;
  readonly onCanchaChange: (canchaId: number) => void;
  readonly onFechaChange: (fecha: IsoDate) => void;
}

export function CanchaFechaPicker({
  canchas,
  canchaId,
  fecha,
  onCanchaChange,
  onFechaChange,
}: CanchaFechaPickerProps) {
  return (
    <div>
      <label htmlFor="disponibilidad-cancha">Cancha</label>
      <select
        id="disponibilidad-cancha"
        data-testid="cancha-select"
        value={canchaId ?? ""}
        onChange={(event) => onCanchaChange(Number(event.target.value))}
      >
        <option value="" disabled>
          Elegí una cancha
        </option>
        {canchas.map((cancha) => (
          <option key={cancha.id} value={cancha.id}>
            {cancha.nombre}
          </option>
        ))}
      </select>

      <label htmlFor="disponibilidad-fecha">Fecha</label>
      <input
        id="disponibilidad-fecha"
        type="date"
        data-testid="fecha-input"
        value={fecha ?? ""}
        onChange={(event) => onFechaChange(event.target.value)}
      />
    </div>
  );
}
