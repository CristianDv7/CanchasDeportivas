// DTOs propios (camelCase) que consumen features/ y domain/ — design.md §2.
// Nunca conocen paths ni shapes del backend; eso vive en raw.ts/mappers.ts.
export type IsoDate = string; // "YYYY-MM-DD"
export type IsoTime = string; // "HH:mm:ss"
export type EstadoReserva = "Confirmada" | "Cancelada" | "Finalizada";
export type EstadoBloque = "libre" | "ocupado";

export interface Reserva {
  readonly id: number;
  readonly usuarioId: number;
  readonly canchaId: number;
  readonly fecha: IsoDate;
  readonly horaInicio: IsoTime;
  readonly horaFin: IsoTime;
  /** null ⇒ estado no reconocido (privilegio mínimo: sin acciones). */
  readonly estado: EstadoReserva | null;
  /** Valor crudo, solo para mostrar cuando `estado` es null. */
  readonly estadoRaw: string;
}

export interface Cancha {
  readonly id: number;
  readonly nombre: string;
  readonly deporteId: number;
  readonly activa: boolean;
}

export interface Deporte {
  readonly id: number;
  readonly nombre: string;
}

export interface HorarioAtencion {
  readonly id: number;
  readonly canchaId: number;
  readonly diaSemana: number; // ISO 1-7 (1=lunes)
  readonly horaInicio: IsoTime;
  readonly horaFin: IsoTime;
  readonly activo: boolean;
}

export interface BloqueDisponibilidad {
  readonly horaInicio: IsoTime;
  readonly horaFin: IsoTime;
  readonly estado: EstadoBloque;
}

export interface Disponibilidad {
  readonly canchaId: number;
  readonly fecha: IsoDate;
  readonly bloques: readonly BloqueDisponibilidad[];
}

export interface NuevaReservaInput {
  readonly canchaId: number;
  readonly fecha: IsoDate;
  readonly horaInicio: IsoTime;
  readonly horaFin: IsoTime;
}
