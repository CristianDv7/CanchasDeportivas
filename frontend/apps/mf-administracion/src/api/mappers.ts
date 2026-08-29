// Funciones puras, testeables sin red (design.md §2). Único lugar que
// traduce snake_case → camelCase y decide qué campos crudos se descartan.
import type {
  Cancha,
  CanchaInput,
  Deporte,
  EstadoReserva,
  HorarioAtencion,
  HorarioInput,
  Reserva,
  ReservaAdmin,
  Usuario,
} from "./dto";
import type {
  CanchaRaw,
  DeporteRaw,
  HorarioAtencionRaw,
  ReservaRaw,
  UsuarioRaw,
} from "./raw";

const ESTADOS_RESERVA: readonly EstadoReserva[] = ["Confirmada", "Cancelada", "Finalizada"];

/**
 * Mismo patrón que `normalizeRol` del shell (ADR-06, frontend-shell) y que
 * `normalizeEstado` de `mf-reservas`: un valor desconocido nunca throwea, se
 * vuelve `null` ⇒ privilegio mínimo (sin acciones habilitadas). `estadoRaw`
 * conserva el valor crudo para poder mostrarlo igual en pantalla.
 */
export function normalizeEstado(raw: string): EstadoReserva | null {
  return (ESTADOS_RESERVA as readonly string[]).includes(raw) ? (raw as EstadoReserva) : null;
}

export function toCancha(raw: CanchaRaw): Cancha {
  // created_at/updated_at se descartan a propósito: ninguna pantalla los usa.
  return {
    id: raw.id,
    nombre: raw.nombre,
    deporteId: raw.deporte_id,
    activa: raw.activo,
  };
}

export function toDeporte(raw: DeporteRaw): Deporte {
  return {
    id: raw.id,
    nombre: raw.nombre,
    descripcion: raw.descripcion,
    activo: raw.activo,
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

export function toReserva(raw: ReservaRaw): Reserva {
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

export function toUsuario(raw: UsuarioRaw): Usuario {
  // telefono/rol_id se descartan a propósito: ninguna pantalla los usa.
  return {
    id: raw.id,
    nombre: raw.nombre,
    apellido: raw.apellido,
    email: raw.email,
    activo: raw.activo,
  };
}

// --- Bodies de escritura — asimetría deliberada create/update (design.md §2) ---

/** `CanchaCreate` NO acepta `activo` (una cancha nace activa por default). */
export function toCanchaCreateBody(input: CanchaInput): { nombre: string; deporte_id: number } {
  return { nombre: input.nombre, deporte_id: input.deporteId };
}

/** `CanchaUpdate` SÍ acepta `activo` (ADR-05: reactivar vía PUT {activo:true}). */
export function toCanchaUpdateBody(
  input: CanchaInput,
  activo?: boolean,
): { nombre?: string; deporte_id?: number; activo?: boolean } {
  const body: { nombre?: string; deporte_id?: number; activo?: boolean } = {
    nombre: input.nombre,
    deporte_id: input.deporteId,
  };
  if (activo !== undefined) body.activo = activo;
  return body;
}

export function toHorarioCreateBody(input: HorarioInput): {
  cancha_id: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
} {
  return {
    cancha_id: input.canchaId,
    dia_semana: input.diaSemana,
    hora_inicio: input.horaInicio,
    hora_fin: input.horaFin,
  };
}

/**
 * ADR-06: NUNCA manda `dia_semana` — `update` no revalida el duplicado
 * `(cancha_id, dia_semana)` que sí valida `create`, y el `UniqueConstraint`
 * sale como `IntegrityError` sin envolver ⇒ 500. La UI evita el path
 * estructuralmente: editar un horario existente solo cambia horas.
 */
export function toHorarioUpdateBody(input: HorarioInput): { hora_inicio: string; hora_fin: string } {
  return { hora_inicio: input.horaInicio, hora_fin: input.horaFin };
}

/**
 * Join client-side (ADR-08): dos `Map` por id, O(n+m). Fallback
 * `Cancha #{id}` / `Usuario #{id}` cuando falta la entrada (degradación de
 * ADR-07 — una fuente de enrichment caída no debe tumbar el panel).
 */
export function buildReservasAdmin(
  reservas: readonly Reserva[],
  canchas: readonly Cancha[],
  usuarios: readonly Usuario[],
): ReservaAdmin[] {
  const canchasPorId = new Map(canchas.map((c) => [c.id, c]));
  const usuariosPorId = new Map(usuarios.map((u) => [u.id, u]));

  return reservas.map((r) => {
    const cancha = canchasPorId.get(r.canchaId);
    const usuario = usuariosPorId.get(r.usuarioId);
    return {
      ...r,
      canchaLabel: cancha ? cancha.nombre : `Cancha #${r.canchaId}`,
      usuarioLabel: usuario ? `${usuario.nombre} ${usuario.apellido}` : `Usuario #${r.usuarioId}`,
    };
  });
}
