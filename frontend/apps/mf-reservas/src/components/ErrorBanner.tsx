// design.md §3 — consumo de `mapApiError`: renderiza `message` y muestra
// "Reintentar" únicamente cuando `action === "retry"`. Ningún componente
// ramifica por `status` ni por el texto de `message` (eso ya lo decidió
// `mapApiError`); este componente es puro renderizado condicionado por
// `action`. Mismo patrón `role="alert"` que `RemoteBoundary`/`LoginPage` del shell.
import type { UiError } from "../api/errors";

export interface ErrorBannerProps {
  readonly error: UiError;
  /** Requerido solo cuando `error.action === "retry"`; ignorado en otro caso. */
  readonly onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  return (
    <div role="alert">
      <p>{error.message}</p>
      {error.action === "retry" && (
        <button type="button" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
