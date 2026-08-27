// Fetching propio sin TanStack Query (design.md §4). Cada pantalla instancia
// su propio `useResource` — sin caché compartida (decisión de design.md §4).
import { useCallback, useEffect, useRef, useState } from "react";
import { mapApiError } from "../api/errors";
import type { UiError } from "../api/errors";

export type ResourceStatus = "idle" | "loading" | "success" | "error";

export interface Resource<T> {
  readonly data: T | null; // se CONSERVA durante un refetch (no parpadea)
  readonly error: UiError | null;
  readonly status: ResourceStatus;
  readonly refetch: () => void; // identidad estable (useCallback)
}

/**
 * `fetcher` vive en un `ref` actualizado en cada render y NO entra en las
 * deps del efecto: si entrara, una lambda inline (`(signal) => api.x(signal)`)
 * re-dispararía el fetch en cada render — es el footgun principal del hook.
 */
export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  options?: { enabled?: boolean },
): Resource<T> {
  const enabled = options?.enabled ?? true;

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<UiError | null>(null);
  const [status, setStatus] = useState<ResourceStatus>("idle");
  const [version, setVersion] = useState(0);

  // Identidad estable: los consumidores pueden pasarla a effects/handlers sin
  // que dispare renders o efectos extra.
  const refetch = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    // Flag local que distingue "esta ejecución fue reemplazada" de un error
    // real de negocio: un abort disparado por nuestro propio cleanup (cambio
    // de deps o unmount) NUNCA debe pisar el estado con un error de usuario.
    let cancelled = false;

    setStatus("loading");
    setError(null);

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(mapApiError(err));
        setStatus("error");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps es la API
    // pública del hook (design.md §4): longitud fija de primitivos a cargo
    // del caller, se propaga tal cual al array de dependencias del efecto.
  }, [...deps, version, enabled]);

  return { data, error, status, refetch };
}
