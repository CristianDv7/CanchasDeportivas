// Funciones puras (sin React, sin imports de api/*Api) — design.md §5.
// RN-04: cancelar habilitado ⇔ Confirmada y bloque no iniciado, SIN
// excepción por rol admin (ADR-04). ADR-03: impacto informativo de
// inactivar una cancha. ADR-06: validación de rango horario.
import type { EstadoReserva, IsoDate, IsoTime, Reserva } from "../api/dto";

/**
 * "2026-08-28" + "10:00:00" → epoch ms interpretando el par como UTC.
 *
 * GOTCHA DELIBERADO, copiado textual de `mf-reservas/src/domain/rules.ts`
 * (ADR-02): NO "corregir" esto a hora local. El backend compara
 * `datetime.combine(fecha, hora_inicio)` (naive) contra `now(utc)`
 * (`reserva_service.py:226-239`), así que el cliente debe interpretar el par
 * fecha+hora como UTC o el botón y el 400 real discreparían según el
 * timezone del admin. Si el backend corrige su timezone, este archivo Y
 * `mf-reservas/src/domain/rules.ts` son los dos únicos a tocar (trigger de
 * extracción a `packages/shared`, ADR-02).
 */
export function toUtcMillis(fecha: IsoDate, hora: IsoTime): number {
  const year = Number(fecha.slice(0, 4));
  const month = Number(fecha.slice(5, 7));
  const day = Number(fecha.slice(8, 10));
  const hours = Number(hora.slice(0, 2));
  const minutes = Number(hora.slice(3, 5));
  const seconds = Number(hora.slice(6, 8) || "0");
  return Date.UTC(year, month - 1, day, hours, minutes, seconds);
}

/** El bloque ya arrancó. `<=` a propósito: arrancar exacto YA cuenta como iniciada. */
export function hasStarted(
  r: { fecha: IsoDate; horaInicio: IsoTime },
  nowMs: number = Date.now(),
): boolean {
  return toUtcMillis(r.fecha, r.horaInicio) <= nowMs;
}

/**
 * RN-04 sin bypass para admin (ADR-04): habilitado ⇔ `estado === "Confirmada"`
 * Y el bloque no inició. `estado === null` ⇒ false (privilegio mínimo).
 */
export function canCancel(r: Reserva, nowMs: number = Date.now()): boolean {
  if (r.estado !== "Confirmada") return false;
  return !hasStarted(r, nowMs);
}

/**
 * ADR-03: cuenta reservas `Confirmada` de `canchaId` que todavía no
 * iniciaron — el número que el diálogo de inactivación muestra como
 * advertencia informada (nunca bloqueo).
 */
export function contarAfectadasPorInactivar(
  reservas: readonly Reserva[],
  canchaId: number,
  nowMs: number = Date.now(),
): number {
  return reservas.filter(
    (r) => r.canchaId === canchaId && r.estado === "Confirmada" && !hasStarted(r, nowMs),
  ).length;
}

/** ADR-06: espeja el `model_validator`/`CheckConstraint` del backend. */
export function validarHorario(horaInicio: IsoTime, horaFin: IsoTime): boolean {
  return horaInicio < horaFin;
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
