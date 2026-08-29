// Mutaciones (POST/PUT/PATCH) — design.md §4 (ADR-02, copia de
// mf-reservas). `run()` nunca throwea: así el `onSubmit` de la UI queda
// lineal (`if (resultado === null) return;`) sin try/catch propio.
import { useCallback, useRef, useState } from "react";
import { mapApiError } from "../api/errors";
import type { UiError } from "../api/errors";

export interface Action<TArgs, TResult> {
  readonly run: (args: TArgs) => Promise<TResult | null>; // null si falló
  readonly pending: boolean;
  readonly error: UiError | null;
  readonly reset: () => void;
}

export function useAction<TArgs, TResult>(
  fn: (args: TArgs) => Promise<TResult>,
): Action<TArgs, TResult> {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<UiError | null>(null);

  const run = useCallback(async (args: TArgs): Promise<TResult | null> => {
    setPending(true);
    setError(null);
    try {
      const result = await fnRef.current(args);
      setPending(false);
      return result;
    } catch (err) {
      setError(mapApiError(err));
      setPending(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { run, pending, error, reset };
}
