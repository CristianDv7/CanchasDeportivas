// design.md §3 — consumo de `mapApiError`: renderiza `message` y muestra
// "Reintentar" únicamente cuando `action === "retry"`. Componente puro,
// copia de mf-reservas/src/components/ErrorBanner.tsx.
import type { UiError } from "../api/errors";
import "./ErrorBanner.css";

export interface ErrorBannerProps {
  readonly error: UiError;
  /** Requerido solo cuando `error.action === "retry"`; ignorado en otro caso. */
  readonly onRetry?: () => void;
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  return (
    <div role="alert" className="mfa-error-banner">
      <p>{error.message}</p>
      {error.action === "retry" && (
        <button type="button" className="mfa-error-retry" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}
