import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    // Fija el origin de jsdom (design.md §9, tabla MSW, copiado de
    // mf-administracion): MSW intercepta `fetch` relativo a
    // `window.location`, así que el origin debe quedar explícito y estable
    // en vez de heredar cualquier default. Puerto real: rsbuild.config.ts.
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3003/",
      },
    },
    globals: true,
    setupFiles: ["./setupTests.ts"],
  },
  resolve: {
    alias: {
      // Vitest no corre bajo el runtime de Module Federation (design.md
      // §10). Apunta directo a los fuentes del shell.
      "shell/session": path.resolve(dirname, "../shell/src/session"),
      "shell/apiClient": path.resolve(dirname, "../shell/src/http"),
    },
  },
});
