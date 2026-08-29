// design.md §4/ADR-04: envuelve `useResource` + `reportesApi.reservasPeriodo`.
// Sin `enabled`: el rango por defecto siempre es válido (hoy-30 <= hoy), así
// que no hay gating — a diferencia de `useDisponibilidad` de mf-reservas.
import { reportesApi } from "../../api/reportesApi";
import type { IsoDate, ReservasPeriodo } from "../../api/dto";
import { useResource } from "../../hooks/useResource";
import type { Resource } from "../../hooks/useResource";

export function useReservasPeriodo(fechaInicio: IsoDate, fechaFin: IsoDate): Resource<ReservasPeriodo> {
  return useResource<ReservasPeriodo>(
    (signal) => reportesApi.reservasPeriodo(fechaInicio, fechaFin, signal),
    [fechaInicio, fechaFin],
  );
}
