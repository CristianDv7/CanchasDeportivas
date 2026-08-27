// Barrel: ÚNICA superficie que `features/` puede importar de `src/api/`
// (design.md §1). `raw.ts` NO se re-exporta acá a propósito — es privado del
// módulo (regla dura del desacople del gateway).
export { canchasApi } from "./canchasApi";
export type {
  Cancha,
  Disponibilidad,
  BloqueDisponibilidad,
  EstadoBloque,
  EstadoReserva,
  IsoDate,
  IsoTime,
  NuevaReservaInput,
  Reserva,
} from "./dto";
export { isApiError, mapApiError } from "./errors";
export type { ErrorAction, UiError } from "./errors";
export { reservasApi } from "./reservasApi";
