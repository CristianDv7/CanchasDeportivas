// spec.md "Crear reserva" — design.md §7. Componente controlado (mismo
// patrón que `CanchaFechaPicker`): no guarda estado propio, la selección de
// bloque vive en `NuevaReservaPage` porque debe poder limpiarse desde afuera
// tras un 400 (design.md §6, "selección limpiada").
import type { BloqueDisponibilidad } from "../../api";
import "./ReservaForm.css";

export interface ReservaFormProps {
  readonly bloques: readonly BloqueDisponibilidad[];
  readonly seleccionado: BloqueDisponibilidad | null;
  readonly pending: boolean;
  readonly onSeleccionar: (bloque: BloqueDisponibilidad) => void;
  readonly onConfirmar: () => void;
}

export function ReservaForm({
  bloques,
  seleccionado,
  pending,
  onSeleccionar,
  onConfirmar,
}: ReservaFormProps) {
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
                disabled={bloque.estado !== "libre"}
                checked={
                  seleccionado !== null &&
                  seleccionado.horaInicio === bloque.horaInicio &&
                  seleccionado.horaFin === bloque.horaFin
                }
                onChange={() => onSeleccionar(bloque)}
              />
              {bloque.horaInicio.slice(0, 5)}–{bloque.horaFin.slice(0, 5)} · {bloque.estado}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="mfr-reserva-submit" disabled={seleccionado === null || pending}>
        Confirmar reserva
      </button>
    </form>
  );
}
