// Suspense + ErrorBoundary por remote (design.md §3 nota 4). Un remoteEntry
// caído es un rejection de la promesa del lazy → lo captura este boundary,
// que muestra "<name> no disponible" con botón Reintentar. El shell y los
// otros remotes siguen vivos (frontend-shell-host spec, "Per-Remote Error
// Boundary").
import {
  Component,
  Suspense,
  lazy,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import "./RemoteBoundary.css";

export interface RemoteBoundaryProps {
  /** Nombre visible del remote, p.ej. 'mf-reservas'. */
  name: string;
  /** Factory equivalente a `() => import('mf_reservas/App')`. */
  loader: () => Promise<{ default: ComponentType }>;
}

interface ErrorBoundaryProps {
  name: string;
  onRetry: () => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class RemoteErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error(`[RemoteBoundary:${this.props.name}] error al montar el remote`, error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert" className="shell-remote-error">
          <p>{this.props.name} no disponible.</p>
          <button type="button" className="shell-remote-retry" onClick={this.props.onRetry}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function RemoteBoundary({ name, loader }: RemoteBoundaryProps) {
  // Cambiar `retryToken` remonta el ErrorBoundary (vía `key`) y fuerza a
  // `useMemo` a crear un `React.lazy()` nuevo, así "Reintentar" vuelve a
  // invocar el loader en vez de reusar la promesa cacheada/rechazada.
  const [retryToken, setRetryToken] = useState(0);
  const LazyRemote = useMemo(() => lazy(loader), [loader, retryToken]);

  return (
    <RemoteErrorBoundary key={retryToken} name={name} onRetry={() => setRetryToken((t) => t + 1)}>
      <Suspense fallback={<p className="shell-remote-loading">Cargando {name}…</p>}>
        <LazyRemote />
      </Suspense>
    </RemoteErrorBoundary>
  );
}
