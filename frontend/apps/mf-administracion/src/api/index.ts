// Barrel: ÚNICA superficie que `features/` puede importar de `src/api/`
// (design.md §1). `raw.ts` NO se re-exporta acá a propósito — es privado del
// módulo (regla dura del desacople del gateway).
export { canchasApi } from "./canchasApi";
export { deportesApi } from "./deportesApi";
export { horariosApi } from "./horariosApi";
export { reservasAdminApi } from "./reservasAdminApi";
export { usuariosApi } from "./usuariosApi";
export type {
  Cancha,
  CanchaInput,
  Deporte,
  EstadoReserva,
  HorarioAtencion,
  HorarioInput,
  IsoDate,
  IsoTime,
  Reserva,
  ReservaAdmin,
  Usuario,
} from "./dto";
export { isApiError, mapApiError } from "./errors";
export type { ErrorAction, UiError } from "./errors";
