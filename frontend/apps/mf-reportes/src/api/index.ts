// Barrel: ÚNICA superficie que `features/`/`hooks/` pueden importar de
// `src/api/` (design.md §1). `raw.ts` NO se re-exporta acá a propósito — es
// privado del módulo (regla dura del desacople del gateway).
export { reportesApi } from "./reportesApi";
export type { IsoDate, OcupacionCancha, ReservasPeriodo } from "./dto";
export { isApiError, mapApiError } from "./errors";
export type { ErrorAction, UiError } from "./errors";
