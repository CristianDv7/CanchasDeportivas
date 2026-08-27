/**
 * Único punto de mf-reservas que lee `import.meta.env` (design.md §1, misma
 * regla de layering que en el shell: nada fuera de config/env.ts toca APIs
 * del bundler). `PUBLIC_MF_RESERVAS_URL` es, desde la perspectiva del propio
 * remote, "el origen en el que me estoy sirviendo" — la misma variable que
 * el shell usa para saber dónde pedirme el remoteEntry (frontend/.env.example).
 */
export interface RemoteEnv {
  readonly remoteName: string;
  readonly origin: string;
  readonly buildId: string;
}

const FALLBACK_ORIGIN = "http://localhost:3001";

function readRemoteEnv(): RemoteEnv {
  // OJO: acceso literal `import.meta.env.PUBLIC_X` (no un alias tipo
  // `const raw = import.meta.env`) — `source.define` de Rsbuild reemplaza por
  // sustitución textual/AST de esa expresión exacta en build; un alias
  // indirecto nunca matchea y queda `undefined` en runtime real.
  const isTest = import.meta.env.VITEST === "true";
  const origin =
    import.meta.env.PUBLIC_MF_RESERVAS_URL ?? (isTest ? FALLBACK_ORIGIN : undefined);

  if (!origin) {
    throw new Error(
      '[config/env] Falta "PUBLIC_MF_RESERVAS_URL". Copiá frontend/.env.example a frontend/.env.',
    );
  }

  return {
    remoteName: "mf-reservas",
    origin,
    buildId: import.meta.env.PUBLIC_BUILD_ID ?? "dev",
  };
}

export const env: RemoteEnv = readRemoteEnv();
