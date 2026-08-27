import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";

const require = createRequire(import.meta.url);
const pkg = require("./package.json") as {
  dependencies: Record<string, string>;
};

// Un único `.env` en la raíz de frontend/ (frontend/.env.example, task 1.4)
// compartido por las 4 apps.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(dirname, "../..");

const { parsed, publicVars } = loadEnv({
  cwd: frontendRoot,
  prefixes: ["PUBLIC_"],
});
const SHELL_URL = parsed.PUBLIC_SHELL_URL ?? "http://localhost:3000";

// Idéntico al shell y a los otros remotes (design.md §5.3): copiar textual,
// no divergir.
const shared = {
  react: {
    singleton: true,
    requiredVersion: pkg.dependencies.react,
    strictVersion: false,
  },
  "react-dom": {
    singleton: true,
    requiredVersion: pkg.dependencies["react-dom"],
    strictVersion: false,
  },
  "react-router-dom": {
    singleton: true,
    requiredVersion: pkg.dependencies["react-router-dom"],
    strictVersion: false,
  },
};

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation({
      name: "mf_reservas",
      filename: "remoteEntry.js",
      // Ver shell/rsbuild.config.ts: 'loaded-first' evita que un remote
      // caído tumbe la resolución de shared de los demás (tasks.md 3.5).
      shareStrategy: "loaded-first",
      // App.tsx se implementa en Fase 2 (task 2.5.7); esta es solo la
      // declaración del contrato MF.
      exposes: { "./App": "./src/App.tsx" },
      remotes: { shell: `shell@${SHELL_URL}/mf-manifest.json` },
      shared,
      dts: { consumeTypes: true },
    }),
  ],
  source: {
    define: publicVars,
  },
  server: {
    port: 3001,
  },
});
