// Funciones puras (sin React, sin imports de api/*Api) — design.md §5.
// RN-04: puede cancelarse una reserva propia mientras esté Confirmada y su
// bloque no haya iniciado. RN-06: contador informativo, nunca bloqueante
// (el 400 del backend es la única fuente de verdad para el límite).
import type { EstadoReserva, IsoDate, IsoTime, Reserva } from "../api/dto";

/**
 * "2026-08-28" + "10:00:00" → epoch ms interpretando el par como UTC.
 *
 * GOTCHA DELIBERADO — NO "corregir" esto a hora local: el backend compara
 * `datetime.combine(fecha, hora_inicio) <= datetime.now()` con datetimes
 * NAIVE interpretados como UTC (bug o decisión de Cristian, hoy sin
 * confirmar — ver design.md §12). `new Date("2026-08-28T10:00:00")` en JS
 * se parsea en HORA LOCAL, no UTC; si usáramos eso, el botón Cancelar
 * quedaría habilitado/deshabilitado distinto según el timezone del usuario
 * y divergiría del 400 real del backend. Por eso el parseo es manual con
 * `Date.UTC`. Si el backend corrige su timezone, ESTE es el único archivo
 * a tocar.
 */
export function toUtcMillis(fecha: IsoDate, hora: IsoTime): number {
  // Parseo por posición fija (formato siempre "YYYY-MM-DD" / "HH:mm:ss"):
  // evita destructurar un array potencialmente disperso bajo
  // noUncheckedIndexedAccess.
  const year = Number(fecha.slice(0, 4));
  const month = Number(fecha.slice(5, 7));
  const day = Number(fecha.slice(8, 10));
  const hours = Number(hora.slice(0, 2));
  const minutes = Number(hora.slice(3, 5));
  const seconds = Number(hora.slice(6, 8) || "0");
  return Date.UTC(year, month - 1, day, hours, minutes, seconds);
}

/**
 * RN-04: el bloque ya arrancó. `<=` a propósito — arrancar exacto YA cuenta
 * como iniciada (no hay margen de gracia).
 */
export function hasStarted(
  r: { fecha: IsoDate; horaInicio: IsoTime },
  nowMs: number = Date.now(),
): boolean {
  return toUtcMillis(r.fecha, r.horaInicio) <= nowMs;
}

/**
 * Cancelar habilitado ⇔ estado Confirmada Y el bloque no inició.
 * `estado === null` ⇒ false (privilegio mínimo: sin acciones sobre un
 * estado no reconocido, mismo criterio que `normalizeEstado` en mappers.ts).
 */
export function canCancel(r: Reserva, nowMs: number = Date.now()): boolean {
  if (r.estado !== "Confirmada") return false;
  return !hasStarted(r, nowMs);
}

/** RN-06, informativo: cuenta reservas propias en estado Confirmada. */
export function contarActivas(reservas: readonly Reserva[]): number {
  return reservas.filter((r) => r.estado === "Confirmada").length;
}

const BADGES: Record<EstadoReserva, { label: string; tone: string }> = {
  Confirmada: { label: "Confirmada", tone: "success" },
  Cancelada: { label: "Cancelada", tone: "neutral" },
  Finalizada: { label: "Finalizada", tone: "info" },
};

/** estado === null ⇒ estado no reconocido; badge neutro genérico, nunca throwea. */
export function estadoBadge(estado: EstadoReserva | null): { label: string; tone: string } {
  if (estado === null) return { label: "Desconocido", tone: "neutral" };
  return BADGES[estado];
}

/**
 * Bug real (2026-08-28): `input[type=date]` NO impide vía teclado un año de
 * más de 4 dígitos (ej. "92026-02-08") — ese string llega tal cual hasta el
 * backend, que responde 422 con un mensaje interno de Pydantic en inglés
 * mostrado sin filtrar al usuario. Formato estricto YYYY-MM-DD (año de
 * EXACTAMENTE 4 dígitos) + validación de calendario real vía `Date`, no solo
 * la forma del string.
 */
export function isValidFecha(fecha: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (match === null) return false;

  const [, y, m, d] = match as unknown as [string, string, string, string];
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
