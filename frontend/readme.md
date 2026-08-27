# frontend — shell + microfrontends (canchasdeportivas)

Workspace pnpm con 4 apps independientes unidas por Module Federation 2.0 (Rsbuild):

| App | Puerto | Rol |
|-----|--------|-----|
| `shell` | 3000 | Host: layout, router, login, `SessionStore`, `apiClient` (federados) |
| `mf-reservas` | 3001 | Remote — reservas |
| `mf-administracion` | 3002 | Remote — administración |
| `mf-reportes` | 3003 | Remote — reportes |

## 1. Levantar el entorno

### Backend (Postgres + ms-usuarios)

Los otros 3 microservicios (`ms-canchas`, `ms-reservas`, `ms-reportes`) los lleva un compañero — **no hace falta que corran** para trabajar en el shell o en `mf-reservas` (el login solo pega contra `ms-usuarios`; los `RemoteHealthCard` de los otros remotes degradan a "no conectado" si su servicio no está arriba, sin romper nada).

```bash
cd backend
docker compose up -d          # Postgres en :5433

cd ms-usuarios
# activar el venv del servicio (según cómo lo tengas armado)
uvicorn app.main:app --port 8001
```

Ningún `ms-*` fija su puerto en código (no hay `uvicorn.run(...)`, `Dockerfile` ni `.env` versionado en el backend), así que el puerto lo decide quien lo levanta. Este proyecto adoptó como convención `ms-usuarios=8001`, `ms-canchas=8002`, `ms-reservas=8003`, `ms-reportes=8004` (ver `design.md` §7 y `tasks.md` 1.1); si tu backend usa otros puertos, ajustalos en `.env`.

### Frontend

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev                # shell:3000, mf-reservas:3001, mf-administracion:3002, mf-reportes:3003
```

Abrir `http://localhost:3000`.

## 2. `.env` — obligatorio

Copiá `frontend/.env.example` a `frontend/.env` **antes** de levantar cualquier app. `config/env.ts` (en el shell y en cada remote) es el único punto que lee `import.meta.env`, valida las variables requeridas al boot y **falla ruidosamente** si falta alguna — es a propósito, para no debuggear en silencio un `undefined` en runtime.
> (verificalo antes: puede que para cuando leas esto ya se haya hecho y el archivo exista).

## 3. Credenciales de prueba (seed)

| Usuario | Password | Rol | Acceso |
|---------|----------|-----|--------|
| `admin@test.com` | `admin123` | administrador | `/reservas`, `/administracion`, `/reportes` |
| `usuario@test.com` | `123456` | usuario | solo `/reservas` |

## 4. Comandos

Todos desde `frontend/`:

```bash
pnpm dev          # las 4 apps en paralelo (Rsbuild dev server)
pnpm test         # equivalente a pnpm -r test — Vitest en las 4 apps
pnpm build        # equivalente a pnpm -r build
pnpm typecheck    # equivalente a pnpm -r typecheck
```

## 5. Límites conocidos de HMR cross-remote

Validado según el plan de `design.md` §8 (tabla de pruebas A-F). Resultado real:

| # | Escenario | Resultado |
|---|-----------|-----------|
| A | Editar un string dentro de un remote (`mf-reservas/src/App.tsx`) | **PASS** — hot update real, estado preservado (contador de `RemoteHealthCard` no se resetea) |
| B | Agregar lógica a un hook de un remote | **PASS** — igual que A |
| C | Editar el header del shell (`RootLayout.tsx`) | Degradación **aceptada**: recompilar el shell puede remontar los remotes y resetear su estado local |
| D | Cambiar la superficie federada del shell (`shell/src/http/index.ts`, `shell/src/session`) | Degradación **aceptada**: los remotes ya cargados pueden quedar con la versión vieja del módulo federado hasta un `F5` manual |
| E | Cambiar `rsbuild.config.ts` de un remote (agregar un `expose`) | Degradación **aceptada**: no hay HMR para cambios de config del bundler — hay que reiniciar ese dev server + `F5` en el shell |
| F | Matar un remote (`Ctrl-C` en `mf-reportes`) y navegar a `/reportes` | **PASS** (ver §6) — el resto de la app sigue funcionando |

**Por qué C/D/E son degradaciones aceptadas, no bugs**: recompilar el shell (C, D) invalida en runtime lo que los remotes federados ya habían cargado desde ese host — el contrato federado (`shell/session`, `shell/apiClient`) vive en el bundle del shell, y un remote no puede "recibir" en caliente un módulo que ya resolvió en su primer render. Cambiar la config de Module Federation de un remote (E) tampoco es hot-swappable porque el manifest (`mf-manifest.json`) que describe qué expone ese remote se genera al levantar el dev server, no en cada guardado. En los tres casos el fallback es un `F5` manual — costo de DX acotado, no bloqueante.

A y B dieron PASS directo, así que **no hizo falta la escalera de fallback** que propone `design.md` §8 (fijar `assetPrefix`/cliente de HMR por puerto, CORS, no-cache del manifest, live reload). No existe un script `pnpm dev:reset` en este repo — no se llegó a necesitarlo.

## 6. Aislamiento de un remote caído (`shareStrategy`)

Los 4 `rsbuild.config.ts` (shell + 3 remotes) declaran `shareStrategy: "loaded-first"` en `pluginModuleFederation({...})`. Sin este ajuste, el runtime de Module Federation 2.0 necesita resolver el manifest de **todos** los remotes declarados para poder inicializar el `shared` scope de cualquiera de ellos — un solo remote caído (manifest inalcanzable) tumbaba la app entera, incluidos los remotes sanos. Con `"loaded-first"` el runtime resuelve `shared` solo con lo que ya está cargado, así que un remote caído queda aislado en su propio `ErrorBoundary` ("… no disponible" + botón Reintentar) sin afectar al resto. Detalle completo del hallazgo y la causa raíz en `openspec/changes/frontend-shell/tasks.md`, tarea 3.5.

## 7. Logout no se propaga entre pestañas

La sesión vive en memoria (fuente de verdad) con un espejo en `sessionStorage` (no `localStorage`). Esto es una decisión de diseño (ADR-03 de `design.md`), no un bug: cada pestaña del mismo origen tiene su propia sesión en memoria, así que cerrar sesión en una pestaña **no** desloguea a otras pestañas abiertas. `sessionStorage` también implica que la sesión no sobrevive al cierre de la pestaña (por diseño).

## 8. Warning no bloqueante al buildear

`pnpm build` (equivalente a `pnpm -r build`) termina con exit 0 en las 4 apps, pero cada una emite:

```
[ Module Federation DTS ] Failed to collect TypeScript dependency files with "tsc --listFilesOnly";
falling back to exposed files only. error TS6059: ... is not under 'rootDir' '.../node_modules/.federation'
```

Es el generador automático de tipos de MF 2.0 degradando a "solo los archivos expuestos". **No falla el build ni afecta el bundle.** El typecheck real (`pnpm typecheck` / `pnpm -r typecheck`) no depende de ese generador: cada app tiene un `remotes.d.ts` escrito a mano con las declaraciones ambient de los módulos federados que consume, y es eso lo que sostiene `tsc` de punta a punta.
