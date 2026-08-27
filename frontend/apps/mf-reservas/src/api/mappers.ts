// Funciones puras, testeables sin red (design.md §2). Único lugar que
// traduce snake_case → camelCase y decide qué campos crudos se descartan.
import type {
  BloqueDisponibilidad,
  Cancha,
  Disponibilidad,
  EstadoBloque,
  EstadoReserva,
  HorarioAtencion,
  IsoDate,
  NuevaReservaInput,
  Reserva,
} from "./dto";
import type { CanchaRaw, HorarioAtencionRaw, ReservaRaw } from "./raw";

const ESTADOS_RESERVA: readonly EstadoReserva[] = ["Confirmada", "Cancelada", "Finalizada"];

/**
 * Mismo patrón que `normalizeRol` del shell (ADR-06, frontend-shell):
 * un valor desconocido nunca throwea, se vuelve `null` ⇒ privilegio mínimo
 * (sin acciones habilitadas). `estadoRaw` conserva el valor crudo para poder
 * mostrarlo igual en pantalla.
 */
export function normalizeEstado(raw: string): EstadoReserva | null {
  return (ESTADOS_RESERVA as readonly string[]).includes(raw) ? (raw as EstadoReserva) : null;
}

/** Fail-safe: cualquier estado que no sea exactamente "libre" se trata como
 * "ocupado" — nunca ofrecer como libre un bloque cuyo estado no se entiende. */
function normalizeEstadoBloque(raw: string): EstadoBloque {
  return raw === "libre" ? "libre" : "ocupado";
}

export function toReserva(raw: ReservaRaw): Reserva {
  // created_at/updated_at se descartan a propósito: ninguna pantalla los usa.
  return {
    id: raw.id,
    usuarioId: raw.usuario_id,
    canchaId: raw.cancha_id,
    fecha: raw.fecha,
    horaInicio: raw.hora_inicio,
    horaFin: raw.hora_fin,
    estado: normalizeEstado(raw.estado),
    estadoRaw: raw.estado,
  };
}

export function toCancha(raw: CanchaRaw): Cancha {
  return {
    id: raw.id,
    nombre: raw.nombre,
    deporteId: raw.deporte_id,
    activa: raw.activo,
  };
}

export function toHorarioAtencion(raw: HorarioAtencionRaw): HorarioAtencion {
  return {
    id: raw.id,
    canchaId: raw.cancha_id,
    diaSemana: raw.dia_semana,
    horaInicio: raw.hora_inicio,
    horaFin: raw.hora_fin,
    activo: raw.activo,
  };
}

/**
 * ISO weekday (1=lunes..7=domingo) de `fecha`, parseado por posición fija
 * con `Date.UTC` — mismo criterio anti-timezone que `toUtcMillis` en
 * `domain/rules.ts` (design.md §12): evita que `new Date("YYYY-MM-DD")` se
 * interprete en hora local y corra el día según el timezone del usuario.
 */
function isoDiaSemana(fecha: IsoDate): number {
  const year = Number(fecha.slice(0, 4));
  const month = Number(fecha.slice(5, 7));
  const day = Number(fecha.slice(8, 10));
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=domingo..6=sábado
  return utcDay === 0 ? 7 : utcDay;
}

/** "HH:mm:ss" → minutos desde medianoche. Mismo parseo por posición fija que
 * `toUtcMillis` (domain/rules.ts), sin componente de fecha porque acá solo
 * comparamos horas dentro del mismo día. */
function horaAMinutos(hora: string): number {
  const hours = Number(hora.slice(0, 2));
  const minutes = Number(hora.slice(3, 5));
  return hours * 60 + minutes;
}

function minutosAHora(minutos: number): string {
  const hours = String(Math.floor(minutos / 60)).padStart(2, "0");
  const mins = String(minutos % 60).padStart(2, "0");
  return `${hours}:${mins}:00`;
}

/** Dos rangos [inicio,fin) se cruzan ⇔ empiezan antes de que el otro termine. */
function seSolapan(aInicio: number, aFin: number, bInicio: number, bFin: number): boolean {
  return aInicio < bFin && bInicio < aFin;
}

/**
 * Arma la grilla de disponibilidad que YA NO devuelve el backend armada
 * (design.md §1/§7, contrato real reemplaza al propuesto): genera bloques de
 * 1h dentro de los horarios de atención activos del día de `fecha`, y los
 * marca "ocupado" si se solapan con alguna reserva Confirmada de la lista
 * real. Nunca copia `usuarioId` (ni ningún otro campo de `Reserva`) al
 * resultado — el descarte es activo, no un efecto secundario del shape.
 */
export function buildDisponibilidad(
  canchaId: number,
  fecha: IsoDate,
  horarios: readonly HorarioAtencion[],
  reservas: readonly Reserva[],
): Disponibilidad {
  const diaSemana = isoDiaSemana(fecha);
  const horariosDelDia = horarios.filter((h) => h.diaSemana === diaSemana && h.activo);

  const bloques: BloqueDisponibilidad[] = [];
  for (const horario of horariosDelDia) {
    const inicio = horaAMinutos(horario.horaInicio);
    const fin = horaAMinutos(horario.horaFin);
    for (let cursor = inicio; cursor + 60 <= fin; cursor += 60) {
      const bloqueInicio = cursor;
      const bloqueFin = cursor + 60;
      const ocupado = reservas.some((r) =>
        seSolapan(bloqueInicio, bloqueFin, horaAMinutos(r.horaInicio), horaAMinutos(r.horaFin)),
      );
      bloques.push({
        horaInicio: minutosAHora(bloqueInicio),
        horaFin: minutosAHora(bloqueFin),
        estado: normalizeEstadoBloque(ocupado ? "ocupado" : "libre"),
      });
    }
  }

  bloques.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  return { canchaId, fecha, bloques };
}

/**
 * `usuarioId` MUST venir de `session.user.id` en el caller (RN-03: el
 * backend responde 403 si no coincide), nunca de un campo del formulario.
 */
export function toReservaCreateBody(
  input: NuevaReservaInput,
  usuarioId: number,
): {
  usuario_id: number;
  cancha_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
} {
  return {
    usuario_id: usuarioId,
    cancha_id: input.canchaId,
    fecha: input.fecha,
    hora_inicio: input.horaInicio,
    hora_fin: input.horaFin,
  };
}
