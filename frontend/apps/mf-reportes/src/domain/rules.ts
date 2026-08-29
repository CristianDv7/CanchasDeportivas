// Funciones puras (sin React, sin imports de api/*Api) — design.md §2/§5.
import type { IsoDate } from "../api/dto";

/**
 * Bug real (2026-08-28), copiado TEXTUAL de `mf-reservas/src/domain/rules.ts`
 * (ADR-07): `input[type=date]` NO impide vía teclado un año de más de 4
 * dígitos (ej. "92026-02-08") — ese string llega tal cual hasta el backend,
 * que responde 422 con un mensaje interno de Pydantic en inglés mostrado sin
 * filtrar al usuario. Acá hay el doble de superficie (2 inputs en vez de 1)
 * para el mismo bug. Formato estricto YYYY-MM-DD (año de EXACTAMENTE 4
 * dígitos) + validación de calendario real vía `Date`, no solo la forma del
 * string.
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

/**
 * ADR-02: compara los dos strings ISO LEXICOGRÁFICAMENTE
 * (`fechaInicio <= fechaFin`), sin `Date`/`toUtcMillis`. Acá se comparan dos
 * fechas de CALENDARIO entre sí (nunca contra "ahora"): con "YYYY-MM-DD" el
 * orden lexicográfico de string ES el orden cronológico, parsear a epoch
 * solo reintroduciría el gotcha de timezone sin necesidad.
 */
export function validarRangoFechas(fechaInicio: IsoDate, fechaFin: IsoDate): boolean {
  return fechaInicio <= fechaFin;
}

function formatIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * ADR-04: últimos 30 días, calculados con getters de fecha LOCAL (no UTC) —
 * es un "hoy" percibido por el admin, no un instante a comparar contra el
 * backend. `hoy` se inyecta para poder testear sin `Date.now()` real.
 */
export function rangoPorDefecto(hoy: Date = new Date()): { fechaInicio: IsoDate; fechaFin: IsoDate } {
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 30);
  return { fechaInicio: formatIsoDate(inicio), fechaFin: formatIsoDate(hoy) };
}

/** ADR-01: el máximo del conjunto de reservas por cancha. Set vacío ⇒ 0. */
export function calcularMaxReservas(reservasPorCancha: readonly number[]): number {
  if (reservasPorCancha.length === 0) return 0;
  return Math.max(...reservasPorCancha);
}

/**
 * ADR-01: `%` relativo al máximo del set (nunca a un valor fijo). Guard
 * explícito contra `NaN`/`Infinity`: `maxReservas <= 0` (set vacío o todas
 * en 0, ej. temporada baja) ⇒ 0% para todas, en vez de mentir con 100%.
 */
export function calcularProporcion(reservas: number, maxReservas: number): number {
  if (maxReservas <= 0) return 0;
  return Math.round((reservas / maxReservas) * 100);
}
