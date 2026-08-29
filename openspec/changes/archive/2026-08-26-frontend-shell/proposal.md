# Proposal: frontend-shell — esqueleto shell + 3 microfrontends

## Intent

`frontend/` está en cero y es el bloque más atrasado del proyecto, mientras el backend ya expone auth real. Necesitamos el esqueleto de Fase 1: un shell React que autentique contra `ms-usuarios`, enrute por rol y monte 3 remotes vía Module Federation. Éxito = un dev solo levanta 4 apps, hace login real y navega protegido por rol, con la integración MF demostrable en una demo interna.

## Scope

### In Scope

- Monorepo `frontend/` con **pnpm workspaces**, Rsbuild + Module Federation 2.0, TypeScript, Vitest + Testing Library (TDD estricto).
- Shell: layout global, routing top-level, `ErrorBoundary` por remote, `shared: { singleton: true }` para React/ReactDOM/react-router.
- Auth real contra `POST /auth/login` de `ms-usuarios` (URL por env var), sesión y `rol`.
- Route guards por rol: `/reservas` para todos; `/administracion` y `/reportes` solo `administrador`.
- `api-client` + `session` **expuestos como módulos federados del shell**, con interceptor `Authorization` resuelto una sola vez.
- 3 remotes con placeholder demostrable (ver Approach), cargados desde `localhost:3001-3003`.

### Out of Scope

- Flujos de negocio (RN-01..RN-08), CRUDs, dashboards → fases 3-5.
- API Gateway (no existe) y cualquier cambio en `backend/` o `apigateway/`.
- MSW (el login es real desde día 1; MSW solo se evaluará para tests), Playwright E2E, `packages/`, deploy/CI, refresh tokens.

## Capabilities

### New Capabilities

- `frontend-shell-host`: host MF, layout, routing top-level, aislamiento de fallos por remote.
- `frontend-auth-session`: login real, sesión, storage del JWT, api-client federado, guards por rol.
- `frontend-remote-modules`: los 3 remotes, su registro/carga MF y el placeholder verificable.

### Modified Capabilities

- None.

## Approach

**Decisiones que la exploración dejó abiertas:**

| # | Decisión | Rationale |
|---|----------|-----------|
| 1 | **pnpm workspaces** | `node_modules` estricto evita phantom deps y copias fantasma de React — la causa clásica de crashes MF; `pnpm -r --parallel dev` levanta las 4 apps sin `concurrently`. |
| 2 | **api-client + session como módulo federado del shell** (no `packages/`) | La sesión debe ser **una sola instancia en runtime**; un paquete build-time daría 4 copias del estado de auth. Además, cambiar el interceptor no obliga a rebuildear los 3 remotes. Tipos vía type sharing de MF 2.0. |
| 3 | **Token en memoria (fuente de verdad) + espejo en `sessionStorage`**, detrás de una interfaz `SessionStore` | `httpOnly` es imposible sin `Set-Cookie` del backend, que no controlamos. `sessionStorage` sobrevive el reload pero muere con la pestaña (menor ventana que `localStorage` en máquinas de laboratorio). Todo acceso al token pasa por **un solo módulo** → migrar a cookie cuando exista el gateway toca un archivo. |
| 4 | **Placeholder = `RemoteHealthCard`, no "Hello World"** | Cada remote renderiza: nombre del remote, build id, origen desde el que fue federado, y usuario+rol leídos del `session` del shell. Incluye botón "forzar error" que demuestra el `ErrorBoundary`. Opcionalmente, un GET autenticado de solo lectura a su microservicio, degradable a "no conectado" sin romper la pantalla. |

El guard usa el `rol` del `LoginResponse` (no decodifica el JWT): es UX, la autoridad sigue siendo el RBAC server-side de `ms-reservas`.

**Demo verificable**: login `usuario` → ve `/reservas`, es bloqueado en `/administracion`; login `administrador` → ve los 3 remotes, cada uno probando su propia carga por MF y la sesión compartida.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json` | New | Raíz del workspace |
| `frontend/apps/shell/` | New | Host MF, layout, routing, auth, guards, api-client federado |
| `frontend/apps/mf-reservas/` | New | Remote + `RemoteHealthCard` |
| `frontend/apps/mf-administracion/` | New | Remote (solo admin) + `RemoteHealthCard` |
| `frontend/apps/mf-reportes/` | New | Remote (solo admin) + `RemoteHealthCard` |
| `openspec/config.yaml` | Modified | `frontend.status`, `test_command`, `build_command` |
| `backend/`, `apigateway/` | None | Solo consumo HTTP |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| XSS expone el token en `sessionStorage` | Med | Superficie mínima, sin `dangerouslySetInnerHTML`, token nunca logueado; migración a cookie aislada en `SessionStore` |
| Dependencia circular shell↔remotes (remotes consumen módulos del shell) | Med | Superficie expuesta mínima y estable (`apiClient`, `useSession`); federación bidireccional soportada en MF 2.0 |
| HMR cross-remote inestable | Med | Validar en `sdd-design`; fallback: reload manual del shell, no bloquea Fase 1 |
| Contrato del gateway divergirá de las URLs directas a microservicios | High | URLs por env var y un solo `apiClient` → cutover = cambiar baseURL |
| Combo Rsbuild + MF 2.0 nuevo, poca comunidad | Med | Alcance MF simple (1 host, 3 remotes estáticos) |
| pnpm no disponible en el entorno académico | Low | Sin deps internas cruzadas día 1 → migrar a npm workspaces sin tocar código fuente |

## Rollback Plan

- **Todo el trabajo vive en `feature/frontend-shell`**; `main` sigue verde porque `frontend/` hoy está vacío — el rollback total es no mergear la rama (borrar `frontend/`, cero impacto en backend).
- **Rollback de pnpm → npm**: borrar `pnpm-lock.yaml`/`pnpm-workspace.yaml`, declarar `workspaces` en el `package.json` raíz, `npm install`. Sin cambios de código (no usamos protocolo `workspace:`).
- **Rollback de Rsbuild → Webpack 5**: los `rsbuild.config.ts` son 4 archivos aislados; `src/` no importa nada del bundler salvo `import.meta`/env, encapsulado en un `config.ts` por app.
- **Rollback de api-client federado → paquete local**: mover el módulo a `packages/api-client` y cambiar los imports de `shell/apiClient` a `@cd/api-client`; requiere reintroducir un único `SessionProvider` por remote.

## Dependencies

- `ms-usuarios` corriendo local con `POST /auth/login` y usuarios seedeados de ambos roles.
- Node 20+ y pnpm (via `corepack enable`).

## Success Criteria

- [ ] `pnpm -r --parallel dev` levanta shell:3000 + 3 remotes (3001-3003) sin errores de MF.
- [ ] Login real contra `ms-usuarios` persiste la sesión a través de un reload de página.
- [ ] Un `usuario` es redirigido al intentar `/administracion` y `/reportes`; un `administrador` accede a los 3.
- [ ] Cada remote muestra su `RemoteHealthCard` con nombre, origen federado y usuario+rol del shell.
- [ ] Forzar un error en un remote no tumba el shell ni los otros remotes.
- [ ] Suite Vitest verde en las 4 apps, escrita con TDD estricto.
