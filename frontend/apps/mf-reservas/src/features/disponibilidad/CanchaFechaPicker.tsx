// Selector de cancha (poblado desde `canchasApi.list`) + fecha. Componente
// controlado: no guarda estado propio, delega en `DisponibilidadPage`
// (design.md §7).
import type { Cancha, Deporte, IsoDate } from "../../api";
import { DeporteIcon } from "../../components/DeporteIcon";
import { isValidFecha } from "../../domain/rules";
import "./CanchaFechaPicker.css";

export interface CanchaFechaPickerProps {
  readonly canchas: readonly Cancha[];
  readonly deportes?: readonly Deporte[];
  readonly canchaId: number | null;
  readonly fecha: IsoDate | null;
  readonly onCanchaChange: (canchaId: number) => void;
  readonly onFechaChange: (fecha: IsoDate) => void;
}

export function CanchaFechaPicker({
  canchas,
  deportes = [],
  canchaId,
  fecha,
  onCanchaChange,
  onFechaChange,
}: CanchaFechaPickerProps) {
  const canchaSeleccionada = canchas.find((c) => c.id === canchaId) ?? null;
  const deporteSeleccionado =
    deportes.find((d) => d.id === canchaSeleccionada?.deporteId)?.nombre ?? null;

  return (
    <div className="mfr-picker">
      <div className="mfr-picker-field">
        <label htmlFor="disponibilidad-cancha">Cancha</label>
        <div className="mfr-picker-cancha-row">
          <DeporteIcon deporte={deporteSeleccionado} />
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
        </div>
      </div>

      <div className="mfr-picker-field">
        <label htmlFor="disponibilidad-fecha">Fecha</label>
        <input
          id="disponibilidad-fecha"
          type="date"
          data-testid="fecha-input"
          value={fecha ?? ""}
          onChange={(event) => {
            // Bug real (2026-08-28): input[type=date] no impide vía teclado
            // un año fuera de rango (ej. 5 dígitos) — se filtra acá antes de
            // propagar, en vez de dejar que llegue a la API.
            if (isValidFecha(event.target.value)) onFechaChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
}
