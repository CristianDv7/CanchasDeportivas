// Fetching propio sin TanStack Query (design.md §4, ADR-02: tercera copia de
// mf-reservas/mf-administracion, comentario cruzado — proposal Decisión 2).
// Sin `useAction`: los 2 endpoints de este remote son `GET`, no hay
// mutaciones.
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
 * deps del efecto: si entrara, una lambda inline re-dispararía el fetch en
 * cada render — es el footgun principal del hook.
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

  const refetch = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
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
