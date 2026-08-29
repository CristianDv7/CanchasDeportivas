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
// compartido por las 4 apps, en vez de 4 copias divergentes.
const dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(dirname, "../..");

// `parsed`: valores crudos de .env, usados server-side (Node) para
// construir URLs de remotes MF y targets del proxy. `publicVars`: subset
// prefijado `PUBLIC_*`, listo para `source.define` → llega al bundle del
// browser como `import.meta.env.PUBLIC_*` (lo consume únicamente
// src/config/env.ts, ver design.md §1 y §7).
const { parsed, publicVars } = loadEnv({
  cwd: frontendRoot,
  prefixes: ["PUBLIC_"],
});

// Ver openspec/changes/frontend-shell/tasks.md 1.1: ningún ms-* fija puerto
// en código (sin uvicorn.run, sin Dockerfile, sin .env versionado). Se
// adopta el valor provisorio que ya proponía design.md §7: 8001-8004.
const MS_USUARIOS_URL = parsed.MS_USUARIOS_URL ?? "http://localhost:8001";
const MS_CANCHAS_URL = parsed.MS_CANCHAS_URL ?? "http://localhost:8002";
const MS_RESERVAS_URL = parsed.MS_RESERVAS_URL ?? "http://localhost:8003";
const MS_REPORTES_URL = parsed.MS_REPORTES_URL ?? "http://localhost:8004";

const MF_RESERVAS_URL =
  parsed.PUBLIC_MF_RESERVAS_URL ?? "http://localhost:3001";
const MF_ADMINISTRACION_URL =
  parsed.PUBLIC_MF_ADMINISTRACION_URL ?? "http://localhost:3002";
const MF_REPORTES_URL =
  parsed.PUBLIC_MF_REPORTES_URL ?? "http://localhost:3003";

// Idéntico en los 3 remotes (design.md §5.3): "copiar textual, no divergir".
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
      name: "shell",
      filename: "remoteEntry.js",
      // 'loaded-first' (no el default 'version-first'): con singleton:true,
      // 'version-first' obliga al runtime a resolver el manifest de TODOS
      // los remotes declarados antes de montar CUALQUIERA de ellos (para
      // comparar versiones compartidas) — un solo remote caído revienta esa
      // resolución conjunta y tumba rutas que no dependen de él (hallazgo de
      // Fase 3, tasks.md 3.5). 'loaded-first' resuelve bajo demanda: monta
      // cada remote de forma aislada, solo con lo que ya está cargado.
      shareStrategy: "loaded-first",
      exposes: {
        // Los archivos de ./session y ./http se implementan en Fase 2
        // (tasks 2.1-2.2); esta es solo la declaración del contrato MF.
        "./session": "./src/session/index.ts",
        "./apiClient": "./src/http/index.ts",
        "./contract": "./src/shared/contract.ts",
      },
      remotes: {
        mf_reservas: `mf_reservas@${MF_RESERVAS_URL}/mf-manifest.json`,
        mf_administracion: `mf_administracion@${MF_ADMINISTRACION_URL}/mf-manifest.json`,
        mf_reportes: `mf_reportes@${MF_REPORTES_URL}/mf-manifest.json`,
      },
      shared,
      dts: { generateTypes: true, consumeTypes: true },
    }),
  ],
  source: {
    define: publicVars,
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      // Same-origin: ningún ms-* registra CORSMiddleware (design.md ADR-01).
      // Necesario para dev local sin Docker (microservicios sueltos en
      // 8001-8004): en el flujo dockerizado, apigateway/nginx.conf hace este
      // mismo ruteo — los dos proxies conviven, no se pisan.
      "/api/usuarios": {
        target: MS_USUARIOS_URL,
        pathRewrite: { "^/api/usuarios": "" },
      },
      "/api/canchas": {
        target: MS_CANCHAS_URL,
        pathRewrite: { "^/api/canchas": "" },
      },
      "/api/reservas": {
        target: MS_RESERVAS_URL,
        pathRewrite: { "^/api/reservas": "" },
      },
      "/api/reportes": {
        target: MS_REPORTES_URL,
        pathRewrite: { "^/api/reportes": "" },
      },
    },
  },
});
