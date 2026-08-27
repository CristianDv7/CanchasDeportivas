import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    // Fija el origin de jsdom en vez de depender del default implícito de
    // Vitest (design.md §9): MSW intercepta `fetch` relativo a
    // `window.location`, así que el origin debe quedar explícito y estable
    // en vez de heredar cualquier default que cambie entre versiones.
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3001/",
      },
    },
    globals: true,
    setupFiles: ["./setupTests.ts"],
  },
  resolve: {
    alias: {
      // Vitest no corre bajo el runtime de Module Federation: `import
      // 'shell/session'` no resuelve sin esto (design.md §10, "gotcha de
      // Vitest + MF"). Apunta directo a los fuentes del shell — sin esto la
      // suite de tests de este remote queda bloqueada desde la Fase 2.
      "shell/session": path.resolve(dirname, "../shell/src/session"),
      "shell/apiClient": path.resolve(dirname, "../shell/src/http"),
    },
  },
});
