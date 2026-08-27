import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./setupTests.ts"],
  },
  resolve: {
    alias: {
      // Simétrico al alias 'shell/*' que usan los remotes (design.md §10):
      // Vitest no corre bajo el runtime de MF, así que
      // `import('mf_reservas/App')` en AppRouter.tsx no resuelve sin esto.
      // Solo se ejercita en el DEFAULT_LOADERS; los tests inyectan sus
      // propios loaders fake vía `remoteLoaders`.
      "mf_reservas/App": path.resolve(dirname, "../mf-reservas/src/App"),
      "mf_administracion/App": path.resolve(dirname, "../mf-administracion/src/App"),
      "mf_reportes/App": path.resolve(dirname, "../mf-reportes/src/App"),
    },
  },
});
