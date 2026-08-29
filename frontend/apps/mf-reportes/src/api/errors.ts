// mapApiError — design.md §2/ADR-05: `status` es el ÚNICO discriminador
// (nunca el texto de `detail`) para decidir la acción de UI. Rama 502 propia
// separada del `>=500` genérico: el 502 de ms-reportes es un fan-out que
// falló contra otro microservicio, no un 500 propio.
import type { ApiError } from "shell/apiClient";

export type ErrorAction = "retry" | "none";

export interface UiError {
  readonly message: string; // texto mostrable al usuario
  readonly action: ErrorAction;
  readonly status: number; // 0 si no hubo respuesta HTTP
}

/**
 * Duck-typing, NO instanceof: bajo Module Federation la clase `ApiError`
 * puede venir de otra instancia del módulo `shell/apiClient`.
 */
export function isApiError(e: unknown): e is ApiError {
  return e instanceof Error && e.name === "ApiError";
}

export function mapApiError(error: unknown): UiError {
  if (!isApiError(error)) {
    return { message: "Ocurrió un error inesperado.", action: "none", status: 0 };
  }

  const { status, detail } = error;

  if (status === 400) {
    // Rango de fechas inválido que pasó a pesar de la validación
    // client-side: no hay ninguna otra lista que resincronizar, el botón
    // "Actualizar" ya es la vía de corrección (ADR-05).
    return { message: detail, action: "none", status };
  }

  if (status === 502) {
    // Fan-out de ms-reportes contra canchas/reservas que falló — no
    // inventamos cuál de los dos cayó (el backend no lo distingue).
    return {
      message: "No se pudieron obtener los datos de canchas o reservas para armar el reporte",
      action: "retry",
      status,
    };
  }

  if (status >= 500 || (status === 0 && (error.code === "network" || error.code === "aborted"))) {
    return {
      message: "El servidor no pudo procesar la solicitud. Probá de nuevo.",
      action: "retry",
      status,
    };
  }

  return { message: "Ocurrió un error inesperado.", action: "none", status };
}
