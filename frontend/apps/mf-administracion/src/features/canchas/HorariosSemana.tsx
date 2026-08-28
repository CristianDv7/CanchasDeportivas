// design.md ADR-06 — grilla semanal de 7 filas fijas (lunes→domingo).
// Fila vacía ⇒ "Definir" (POST, único lugar que manda `dia_semana`). Fila
// con horario ⇒ "Editar horas" (PUT solo horas, NUNCA `dia_semana`): la
// grilla hace estructuralmente imposible el duplicado que el backend no
// revalida en `update`.
import { useState } from "react";
import { horariosApi } from "../../api/horariosApi";
import type { HorarioAtencion, HorarioInput } from "../../api/dto";
import { ErrorBanner } from "../../components/ErrorBanner";
import { validarHorario } from "../../domain/rules";
import { useAction } from "../../hooks/useAction";
import { useResource } from "../../hooks/useResource";
import "./HorariosSemana.css";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export interface HorariosSemanaProps {
  readonly canchaId: number;
}

export function HorariosSemana({ canchaId }: HorariosSemanaProps) {
  const horarios = useResource((signal) => horariosApi.listPorCancha(canchaId, signal), [canchaId]);
  const [diaEnEdicion, setDiaEnEdicion] = useState<number | null>(null);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("20:00");
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const crearHorario = useAction((input: HorarioInput) => horariosApi.crear(input));
  const editarHorario = useAction(({ id, input }: { id: number; input: HorarioInput }) =>
    horariosApi.editarHoras(id, input),
  );

  const porDia = new Map((horarios.data ?? []).map((h) => [h.diaSemana, h]));

  function abrirEdicion(dia: number, existente?: HorarioAtencion) {
    setDiaEnEdicion(dia);
    setHoraInicio(existente ? existente.horaInicio.slice(0, 5) : "08:00");
    setHoraFin(existente ? existente.horaFin.slice(0, 5) : "20:00");
    setErrorLocal(null);
    crearHorario.reset();
    editarHorario.reset();
  }

  async function guardar(dia: number, existente?: HorarioAtencion) {
    const inicio = `${horaInicio}:00`;
    const fin = `${horaFin}:00`;

    // Hint no bloqueante (espeja el model_validator del backend, ADR-06):
    // se muestra la advertencia pero el submit SIEMPRE llega al backend —
    // el 422 real es la fuente de verdad que el admin ve (spec.md "Edición
    // de horario con rango inválido").
    setErrorLocal(validarHorario(inicio, fin) ? null : "La hora de inicio debe ser anterior a la hora de fin.");

    const input: HorarioInput = { canchaId, diaSemana: dia, horaInicio: inicio, horaFin: fin };

    const resultado = existente
      ? await editarHorario.run({ id: existente.id, input })
      : await crearHorario.run(input);

    if (resultado === null) return; // error ya mapeado; el horario anterior no se pierde.

    setDiaEnEdicion(null);
    horarios.refetch();
  }

  return (
    <div className="mfa-horarios-semana" data-testid={`horarios-cancha-${canchaId}`}>
      {horarios.error && <ErrorBanner error={horarios.error} onRetry={horarios.refetch} />}
      {crearHorario.error && <ErrorBanner error={crearHorario.error} />}
      {editarHorario.error && <ErrorBanner error={editarHorario.error} />}
      {errorLocal && <p data-testid="horario-hint-invalido">{errorLocal}</p>}

      <ul className="mfa-horarios-lista">
        {DIAS.map((nombre, index) => {
          const dia = index + 1;
          const existente = porDia.get(dia);
          const enEdicion = diaEnEdicion === dia;

          return (
            <li key={dia} data-testid={`horario-fila-${dia}`} className="mfa-horarios-fila">
              <span className="mfa-horarios-dia">{nombre}</span>

              {existente && !enEdicion && (
                <span data-testid={`horario-rango-${dia}`}>
                  {existente.horaInicio.slice(0, 5)}–{existente.horaFin.slice(0, 5)}
                </span>
              )}

              {enEdicion ? (
                <>
                  <label>
                    Hora inicio {nombre}
                    <input
                      aria-label={`Hora inicio ${nombre}`}
                      type="time"
                      value={horaInicio}
                      onChange={(event) => setHoraInicio(event.target.value)}
                    />
                  </label>
                  <label>
                    Hora fin {nombre}
                    <input
                      aria-label={`Hora fin ${nombre}`}
                      type="time"
                      value={horaFin}
                      onChange={(event) => setHoraFin(event.target.value)}
                    />
                  </label>
                  <button type="button" onClick={() => guardar(dia, existente)}>
                    Guardar
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => abrirEdicion(dia, existente)}>
                  {existente ? "Editar horas" : "Definir"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
