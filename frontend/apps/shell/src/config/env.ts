/**
 * Único punto del shell que lee `import.meta.env` (design.md §1, regla dura
 * de layering: "nada fuera de config/env.ts lee variables de entorno ni APIs
 * del bundler"). Valida las variables requeridas al boot y falla ruidosamente
 * si falta alguna, en vez de dejar que el error aparezca más tarde como un
 * `undefined@undefined/mf-manifest.json` indescifrable (design.md §7).
 */
export interface ShellEnv {
  /** Base de la API same-origin servida por el proxy del dev server. */
  readonly apiBase: string;
  readonly mfReservasUrl: string;
  readonly mfAdministracionUrl: string;
  readonly mfReportesUrl: string;
  readonly shellUrl: string;
  /** Usado por RemoteHealthCard para detectar bundles viejos/caché. */
  readonly buildId: string;
}

// Bajo Vitest, `import.meta.env` no pasa por `loadEnv()` de Rsbuild (ese
// wiring vive en rsbuild.config.ts, fuera del grafo de Vite/Vitest), así que
// las PUBLIC_* nunca están seteadas en tests. En vez de forzar a cada test a
// stubear env vars, se degrada a los mismos defaults de dev que ya usan los
// `rsbuild.config.ts` como fallback (decisión de Fase 1). `import.meta.env
// .VITEST === 'true'` es el flag oficial de Vitest para detectar este modo.
const VITEST_FALLBACKS: Record<string, string> = {
  PUBLIC_API_BASE: "/api",
  PUBLIC_MF_RESERVAS_URL: "http://localhost:3001",
  PUBLIC_MF_ADMINISTRACION_URL: "http://localhost:3002",
  PUBLIC_MF_REPORTES_URL: "http://localhost:3003",
  PUBLIC_SHELL_URL: "http://localhost:3000",
};

function required(key: string, value: string | undefined, isTest: boolean): string {
  if (value !== undefined && value !== "") return value;

  if (isTest && key in VITEST_FALLBACKS) {
    return VITEST_FALLBACKS[key] as string;
  }

  throw new Error(
    `[config/env] Falta la variable de entorno requerida "${key}". ` +
      "Copiá frontend/.env.example a frontend/.env (o exportala en el " +
      "entorno) antes de levantar el shell.",
  );
}

function readShellEnv(): ShellEnv {
  // OJO: cada acceso de abajo tiene que ser la expresión literal
  // `import.meta.env.PUBLIC_X` (no un alias tipo `const raw = import.meta.env`
  // seguido de `raw.PUBLIC_X`) porque `source.define` de Rsbuild reemplaza por
  // sustitución textual/AST de esa expresión exacta en tiempo de build — un
  // alias indirecto nunca matchea y queda `undefined` en runtime real (solo
  // "funcionaba" bajo Vitest porque ahí `import.meta.env` es un objeto real,
  // no un literal reemplazado).
  const isTest = import.meta.env.VITEST === "true";

  return {
    apiBase: required("PUBLIC_API_BASE", import.meta.env.PUBLIC_API_BASE, isTest),
    mfReservasUrl: required(
      "PUBLIC_MF_RESERVAS_URL",
      import.meta.env.PUBLIC_MF_RESERVAS_URL,
      isTest,
    ),
    mfAdministracionUrl: required(
      "PUBLIC_MF_ADMINISTRACION_URL",
      import.meta.env.PUBLIC_MF_ADMINISTRACION_URL,
      isTest,
    ),
    mfReportesUrl: required(
      "PUBLIC_MF_REPORTES_URL",
      import.meta.env.PUBLIC_MF_REPORTES_URL,
      isTest,
    ),
    shellUrl: required("PUBLIC_SHELL_URL", import.meta.env.PUBLIC_SHELL_URL, isTest),
    // No es crítico para el arranque: si falta, degrada a "dev" en vez de
    // impedir que la app levante (solo se usa para mostrarlo en RemoteHealthCard).
    buildId: import.meta.env.PUBLIC_BUILD_ID ?? "dev",
  };
}

export const env: ShellEnv = readShellEnv();
