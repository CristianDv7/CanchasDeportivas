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
      // Vitest no corre bajo el runtime de Module Federation (design.md
      // §10). Apunta directo a los fuentes del shell.
      "shell/session": path.resolve(dirname, "../shell/src/session"),
      "shell/apiClient": path.resolve(dirname, "../shell/src/http"),
    },
  },
});
