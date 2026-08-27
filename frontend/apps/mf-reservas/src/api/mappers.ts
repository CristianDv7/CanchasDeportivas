// Funciones puras, testeables sin red (design.md §2). Único lugar que
// traduce snake_case → camelCase y decide qué campos crudos se descartan.
import type {
  BloqueDisponibilidad,
  Cancha,
  Disponibilidad,
  EstadoBloque,
  EstadoReserva,
  NuevaReservaInput,
  Reserva,
} from "./dto";
import type { BloqueRaw, CanchaRaw, DisponibilidadRaw, ReservaRaw } from "./raw";

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

function toBloqueDisponibilidad(raw: BloqueRaw): BloqueDisponibilidad {
  return {
    horaInicio: raw.hora_inicio,
    horaFin: raw.hora_fin,
    estado: normalizeEstadoBloque(raw.estado),
  };
}

export function toDisponibilidad(raw: DisponibilidadRaw): Disponibilidad {
  return {
    canchaId: raw.cancha_id,
    fecha: raw.fecha,
    bloques: raw.bloques.map(toBloqueDisponibilidad),
  };
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
