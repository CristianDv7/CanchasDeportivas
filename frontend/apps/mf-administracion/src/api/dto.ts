// DTOs propios (camelCase) que consumen features/ y domain/ — design.md §2.
// Nunca conocen paths ni shapes del backend; eso vive en raw.ts/mappers.ts.
export type IsoDate = string; // "YYYY-MM-DD"
export type IsoTime = string; // "HH:mm:ss"
export type EstadoReserva = "Confirmada" | "Cancelada" | "Finalizada";

export interface Cancha {
  readonly id: number;
  readonly nombre: string;
  readonly deporteId: number;
  readonly activa: boolean;
}

export interface Deporte {
  readonly id: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly activo: boolean;
}

export interface HorarioAtencion {
  readonly id: number;
  readonly canchaId: number;
  readonly diaSemana: number; // ISO 1-7 (1=lunes)
  readonly horaInicio: IsoTime;
  readonly horaFin: IsoTime;
  readonly activo: boolean;
}

export interface Reserva {
  readonly id: number;
  readonly usuarioId: number;
  readonly canchaId: number;
  readonly fecha: IsoDate;
  readonly horaInicio: IsoTime;
  readonly horaFin: IsoTime;
  /** null ⇒ estado no reconocido: sin acciones (privilegio mínimo). */
  readonly estado: EstadoReserva | null;
  /** Valor crudo, solo para mostrar cuando `estado` es null. */
  readonly estadoRaw: string;
}

export interface Usuario {
  readonly id: number;
  readonly nombre: string;
  readonly apellido: string;
  readonly email: string;
  readonly activo: boolean;
}

/** DTO de VISTA: resultado del join client-side (ADR-08). */
export interface ReservaAdmin extends Reserva {
  readonly canchaLabel: string; // "Cancha Central" | "Cancha #7" si degradó
  readonly usuarioLabel: string; // "Ana Pérez" | "Usuario #3" si degradó
}

export interface CanchaInput {
  readonly nombre: string;
  readonly deporteId: number;
}

export interface HorarioInput {
  readonly canchaId: number;
  readonly diaSemana: number;
  readonly horaInicio: IsoTime;
  readonly horaFin: IsoTime;
}
