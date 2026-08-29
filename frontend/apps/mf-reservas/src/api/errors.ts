// mapApiError — design.md §3: `status` es el ÚNICO discriminador (nunca
// `code` ni el texto de `detail`) para decidir la acción de UI.
import type { ApiError } from "shell/apiClient";

export type ErrorAction = "refetch-disponibilidad" | "retry" | "none";

export interface UiError {
  readonly message: string; // texto mostrable al usuario
  readonly action: ErrorAction;
  readonly status: number; // 0 si no hubo respuesta HTTP
}

/**
 * Duck-typing, NO instanceof: bajo Module Federation la clase `ApiError`
 * puede venir de otra instancia del módulo `shell/apiClient` y `instanceof`
 * daría `false` aunque el objeto sea, en los hechos, un `ApiError`.
 */
export function isApiError(e: unknown): e is ApiError {
  return e instanceof Error && e.name === "ApiError";
}

export function mapApiError(error: unknown): UiError {
  if (!isApiError(error)) {
    // Bug de JS, no un error HTTP: no inventar semántica de status/red.
    return { message: "Ocurrió un error inesperado.", action: "none", status: 0 };
  }

  const { status, detail } = error;

  if (status === 400) {
    // El backend manda RN-01/02/06 en español en `detail`. `code` es
    // "unknown" en 400 ⇒ inutilizable como discriminador; se ramifica por
    // `status`, no por `code` ni por el texto.
    return { message: detail, action: "refetch-disponibilidad", status };
  }

  if (status === 403) {
    return { message: "No tenés permiso para operar sobre esta reserva.", action: "none", status };
  }

  if (status === 404) {
    return { message: "La reserva o la cancha ya no existe.", action: "none", status };
  }

  if (status === 422) {
    // NO mostrar `detail` tal cual: a diferencia de 400 (donde el backend
    // manda español curado para el usuario), un 422 puede ser el mensaje
    // interno de validación de FastAPI/Pydantic ("Input should be a valid
    // integer, unable to parse string as an integer") — texto de
    // implementación en inglés, nunca pensado para mostrarse. Bug real
    // (2026-08-28): un año de 5 dígitos en el date picker lo disparó.
    return { message: "La fecha ingresada no es válida.", action: "none", status };
  }

  if (status === 401) {
    // El shell ya disparó el logout global (apiClient.onUnauthorized);
    // mf-reservas no navega.
    return { message: "Tu sesión expiró.", action: "none", status };
  }

  if (status >= 500) {
    return {
      message: "El servidor no pudo procesar la solicitud. Probá de nuevo.",
      action: "retry",
      status,
    };
  }

  if (status === 0 && error.code === "network") {
    return { message: "No se pudo conectar con el servidor.", action: "retry", status };
  }

  if (status === 0 && error.code === "aborted") {
    return { message: "La solicitud tardó demasiado.", action: "retry", status };
  }

  // Combinación no cubierta por la tabla (design.md §3) — fallback seguro.
  return { message: "Ocurrió un error inesperado.", action: "none", status };
}
