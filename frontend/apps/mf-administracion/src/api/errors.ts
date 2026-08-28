// mapApiError — design.md §3/ADR-10: `status` es el ÚNICO discriminador
// (nunca `code` ni el texto de `detail`) para decidir la acción de UI.
// Copia de mf-reservas con divergencia deliberada (ADR-10): acción genérica
// "refetch" en vez de "refetch-disponibilidad" (no hay grilla acá), y 404 SÍ
// dispara refetch (el recurso se pudo borrar desde otra pestaña).
import type { ApiError } from "shell/apiClient";

export type ErrorAction = "refetch" | "retry" | "none";

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
    // El backend manda RN-07 y duplicados en español en `detail`.
    return { message: detail, action: "refetch", status };
  }

  if (status === 403) {
    return {
      message: "No tenés permisos para esta operación de administración.",
      action: "none",
      status,
    };
  }

  if (status === 404) {
    // El recurso se borró desde otra pestaña ⇒ refrescar el listado afectado.
    return { message: "El recurso ya no existe.", action: "refetch", status };
  }

  if (status === 422) {
    // Ya aplanado por apiClient (extractDetail).
    return { message: detail, action: "none", status };
  }

  if (status === 401) {
    // El shell ya hizo logout global (apiClient.onUnauthorized).
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

  return { message: "Ocurrió un error inesperado.", action: "none", status };
}
