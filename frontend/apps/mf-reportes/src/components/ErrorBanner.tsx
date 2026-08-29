// design.md §3 — consumo de `mapApiError`: renderiza `message` y muestra
// "Reintentar" únicamente cuando `action === "retry"`. Componente puro,
// copia de mf-administracion/mf-reservas/src/components/ErrorBanner.tsx.
import type { UiError } from "../api/errors";
import "./ErrorBanner.css";

export interface ErrorBannerProps {
  readonly error: UiError;
  /** Requerido solo cuando `error.action === "retry"`; ignorado en otro caso. */
  readonly onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  return (
    <div role="alert" className="mfrp-error-banner">
      <p>{error.message}</p>
      {error.action === "retry" && (
        <button type="button" className="mfrp-error-retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
