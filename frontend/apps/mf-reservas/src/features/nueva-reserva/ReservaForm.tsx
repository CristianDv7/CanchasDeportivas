// spec.md "Crear reserva" — design.md §7. Componente controlado (mismo
// patrón que `CanchaFechaPicker`): no guarda estado propio, la selección de
// bloque vive en `NuevaReservaPage` porque debe poder limpiarse desde afuera
// tras un 400 (design.md §6, "selección limpiada").
import type { BloqueDisponibilidad, IsoDate } from "../../api";
import { hasStarted } from "../../domain/rules";
import "./ReservaForm.css";

export interface ReservaFormProps {
  readonly fecha: IsoDate | null;
  readonly bloques: readonly BloqueDisponibilidad[];
  readonly seleccionado: BloqueDisponibilidad | null;
  readonly pending: boolean;
  readonly onSeleccionar: (bloque: BloqueDisponibilidad) => void;
  readonly onConfirmar: () => void;
}

export function ReservaForm({
  fecha,
  bloques,
  seleccionado,
  pending,
  onSeleccionar,
  onConfirmar,
}: ReservaFormProps) {
  // Bug real (2026-08-29): un bloque en una fecha/hora ya pasada seguía
  // ofreciéndose como "libre" (buildDisponibilidad solo mira solapamiento
  // con reservas existentes, no el reloj) y el form dejaba confirmarlo. Mismo
  // criterio que RN-04 (canCancel/hasStarted en domain/rules.ts): un bloque
  // ya iniciado nunca es reservable, con o sin fecha=null (bloques vacíos
  // en ese caso, ver early-return abajo).
  function bloqueReservable(bloque: BloqueDisponibilidad): boolean {
    if (bloque.estado !== "libre") return false;
    if (fecha === null) return false;
    return !hasStarted({ fecha, horaInicio: bloque.horaInicio });
  }

  if (bloques.length === 0) {
    return (
      <p data-testid="reserva-form-vacio" className="mfr-reserva-form-vacio">
        Elegí una cancha y fecha para ver horarios.
      </p>
    );
  }

  return (
    <form
      className="mfr-reserva-form"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirmar();
      }}
    >
      <fieldset>
        <legend>Elegí un horario</legend>
        <div className="mfr-reserva-options">
          {bloques.map((bloque) => (
            <label key={`${bloque.horaInicio}-${bloque.horaFin}`} className="mfr-reserva-option">
              <input
                type="radio"
                name="bloque"
                data-testid="bloque-radio"
                disabled={!bloqueReservable(bloque)}
                checked={
                  seleccionado !== null &&
                  seleccionado.horaInicio === bloque.horaInicio &&
                  seleccionado.horaFin === bloque.horaFin
                }
                onChange={() => onSeleccionar(bloque)}
              />
              {bloque.horaInicio.slice(0, 5)}–{bloque.horaFin.slice(0, 5)} ·{" "}
              {bloque.estado === "libre" && !bloqueReservable(bloque) ? "pasado" : bloque.estado}
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="submit"
        className="mfr-reserva-submit"
        disabled={seleccionado === null || pending || !bloqueReservable(seleccionado)}
      >
        Confirmar reserva
      </button>
    </form>
  );
}
