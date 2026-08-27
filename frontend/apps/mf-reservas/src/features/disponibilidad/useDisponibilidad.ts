// design.md §4/§7: envuelve `useResource` + `reservasApi.getDisponibilidad`
// (contrato PROPUESTO, aislado en el adapter — ver reservasApi.ts). Instancia
// propia por pantalla, sin caché compartida (design.md §4 "Decisión: sin
// caché compartida entre pantallas").
import { reservasApi } from "../../api";
import type { Disponibilidad, IsoDate } from "../../api";
import { useResource } from "../../hooks/useResource";
import type { Resource } from "../../hooks/useResource";

/**
 * `enabled` es `false` hasta que el usuario elige cancha Y fecha (spec.md
 * "Ver disponibilidad"): sin ambos valores no hay nada que consultar y no
 * debe dispararse ningún request.
 */
export function useDisponibilidad(
  canchaId: number | null,
  fecha: IsoDate | null,
): Resource<Disponibilidad> {
  return useResource<Disponibilidad>(
    (signal) => {
      if (canchaId === null || fecha === null) {
        // No debería ejecutarse nunca: `enabled` es false en ese caso.
        return Promise.reject(new Error("useDisponibilidad: canchaId y fecha son requeridos"));
      }
      return reservasApi.getDisponibilidad(canchaId, fecha, signal);
    },
    [canchaId, fecha],
    { enabled: canchaId !== null && fecha !== null },
  );
}
