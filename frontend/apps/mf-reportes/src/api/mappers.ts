// Funciones puras, testeables sin red (design.md §2/§5). Único lugar que
// traduce snake_case → camelCase para los 2 endpoints de ms-reportes.
import type { OcupacionCancha, ReservasPeriodo } from "./dto";
import type { OcupacionCanchaRaw, ReservasPeriodoRaw } from "./raw";

export function toOcupacionCancha(raw: OcupacionCanchaRaw): OcupacionCancha {
  return {
    canchaId: raw.cancha_id,
    cancha: raw.cancha,
    reservas: raw.reservas,
  };
}

export function toReservasPeriodo(raw: ReservasPeriodoRaw): ReservasPeriodo {
  return {
    fechaInicio: raw.fecha_inicio,
    fechaFin: raw.fecha_fin,
    totalReservas: raw.total_reservas,
  };
}
