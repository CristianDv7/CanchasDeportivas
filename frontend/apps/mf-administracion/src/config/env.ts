/** Ver apps/mf-reservas/src/config/env.ts — mismo patrón por remote. */
export interface RemoteEnv {
  readonly remoteName: string;
  readonly origin: string;
  readonly buildId: string;
}

const FALLBACK_ORIGIN = "http://localhost:3002";

function readRemoteEnv(): RemoteEnv {
  // OJO: acceso literal `import.meta.env.PUBLIC_X` — ver mf-reservas/config/env.ts.
  const isTest = import.meta.env.VITEST === "true";
  const origin =
    import.meta.env.PUBLIC_MF_ADMINISTRACION_URL ?? (isTest ? FALLBACK_ORIGIN : undefined);

  if (!origin) {
    throw new Error(
      '[config/env] Falta "PUBLIC_MF_ADMINISTRACION_URL". Copiá frontend/.env.example a frontend/.env.',
    );
  }

  return {
    remoteName: "mf-administracion",
    origin,
    buildId: import.meta.env.PUBLIC_BUILD_ID ?? "dev",
  };
}

export const env: RemoteEnv = readRemoteEnv();
