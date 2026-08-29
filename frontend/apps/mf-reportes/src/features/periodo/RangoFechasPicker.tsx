// Selector del rango de fechas (borrador) — design.md ADR-03/07. Componente
// controlado: no guarda estado propio, delega en `ReservasPeriodoPanel`.
// Filtra con `isValidFecha` en ambos inputs (mismo bug real de teclado que
// mf-reservas/CanchaFechaPicker, el doble de superficie acá).
import type { IsoDate } from "../../api/dto";
import { isValidFecha } from "../../domain/rules";
import "./RangoFechasPicker.css";

export interface RangoFechasPickerProps {
  readonly fechaInicio: IsoDate;
  readonly fechaFin: IsoDate;
  readonly onFechaInicioChange: (fecha: IsoDate) => void;
  readonly onFechaFinChange: (fecha: IsoDate) => void;
}

export function RangoFechasPicker({
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
}: RangoFechasPickerProps) {
  return (
    <div className="mfrp-picker">
      <div className="mfrp-picker-field">
        <label htmlFor="periodo-fecha-inicio">Desde</label>
        <input
          id="periodo-fecha-inicio"
          type="date"
          data-testid="fecha-inicio-input"
          value={fechaInicio}
          onChange={(event) => {
            // Bug real (mf-reservas, 2026-08-28): input[type=date] no impide
            // vía teclado un año fuera de rango — se filtra acá antes de
            // propagar.
            if (isValidFecha(event.target.value)) onFechaInicioChange(event.target.value);
          }}
        />
      </div>

      <div className="mfrp-picker-field">
        <label htmlFor="periodo-fecha-fin">Hasta</label>
        <input
          id="periodo-fecha-fin"
          type="date"
          data-testid="fecha-fin-input"
          value={fechaFin}
          onChange={(event) => {
            if (isValidFecha(event.target.value)) onFechaFinChange(event.target.value);
          }}
        />
      </div>
    </div>
  );
}
