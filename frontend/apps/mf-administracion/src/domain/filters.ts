// Filtrado client-side puro (design.md §5/ADR-09). El backend ya ordena por
// (fecha, hora_inicio) ascendente: esta función NUNCA reordena, solo filtra
// — respetar el orden del servidor evita una segunda fuente de verdad.
import type { EstadoReserva, IsoDate, ReservaAdmin } from "../api/dto";
import { hasStarted } from "./rules";

export interface FiltrosReservas {
  readonly fecha?: IsoDate;
  readonly canchaId?: number;
  readonly estado?: EstadoReserva;
  /** Default `true`: por RN-04 solo es cancelable lo que no inició. */
  readonly soloProximas?: boolean;
}

export function filtrarReservas(
  reservas: readonly ReservaAdmin[],
  filtros: FiltrosReservas,
  nowMs: number = Date.now(),
): ReservaAdmin[] {
  const soloProximas = filtros.soloProximas ?? true;

  return reservas.filter((r) => {
    if (filtros.fecha !== undefined && r.fecha !== filtros.fecha) return false;
    if (filtros.canchaId !== undefined && r.canchaId !== filtros.canchaId) return false;
    if (filtros.estado !== undefined && r.estado !== filtros.estado) return false;
    if (soloProximas && hasStarted(r, nowMs)) return false;
    return true;
  });
}
