# Exploration: frontend-shell

Change: `frontend-shell` — shell React + Module Federation y 3 remotes (mf-reservas, mf-administracion, mf-reportes) para el monorepo canchasdeportivas.

## Contexto

`frontend/` está vacío (solo un readme.md vacío), greenfield total. Backend (4 microservicios FastAPI: ms-usuarios, ms-canchas, ms-reservas, ms-reportes) ya está bastante avanzado; `apigateway/` está vacío (readme.md vacío, sin código). Auth es JWT vía ms-usuarios (`POST /auth/login` devuelve `{access_token, token_type, usuario_id, nombre, email, rol}`), roles seedeados son `usuario` y `administrador` (`backend/database/init/05-seed-roles.sql`). `ms-reservas` ya implementa RBAC server-side basado en `current_user["rol"]`.

## Current State

`frontend/` no tiene código, sin package.json, sin workspaces. `openspec/config.yaml` ya asume React 18 + Module Federation (Webpack 5 o Rsbuild) como contexto previo y marca `frontend.status: not_scaffolded`, sugiriendo Vitest + Testing Library (a confirmar). `apigateway/` está completamente vacío — no hay contrato de API Gateway definido todavía. Backend expone JWT con campo `rol` (usuario|administrador) usado para RBAC en cada microservicio (ver `ms-reservas/app/api/reservas.py`: admin ve todo, usuario ve solo lo propio).

## Affected Areas

- `frontend/` — directorio completo a scaffoldear desde cero (shell + 3 remotes)
- `backend/ms-usuarios/app/schemas/auth.py` — contrato de login que el shell debe consumir/mockear (`LoginResponse`)
- `backend/ms-reservas/app/api/reservas.py` — referencia de lógica RBAC que el shell debe replicar en el guard de rutas (no debe duplicarse en cada remote)
- `apigateway/readme.md` — vacío, ningún contrato de gateway existe aún; los remotes NO pueden depender de su forma real todavía

## Approaches

### 1. Webpack 5 + @module-federation/enhanced

El enfoque "clásico", más años de ejemplos y Stack Overflow.

- **Pros**: máxima documentación acumulada, más ejemplos de edge cases resueltos en comunidad, sigue siendo la base histórica de Module Federation.
- **Cons**: dev server y HMR notablemente más lentos (cold start ~5s, HMR/rebuild cientos de ms a segundos en apps medianas); requiere más configuración manual (loaders, devServer, resolve) sin un framework wrapper.
- **Effort**: Medium-High (más boilerplate para 4 apps corriendo en paralelo)

### 2. Rsbuild (Rspack) + Module Federation 2.0 — recomendado

- **Pros**: Rspack ofrece 5-10x más velocidad de build/HMR que Webpack en apps React medianas/grandes (cold start ~1s vs ~5s, HMR <500ms vs 3-5s en apps grandes); Rsbuild da experiencia "batteries-included" con menos configuración manual que Webpack puro; Module Federation 2.0 (estable desde feb 2026) trae type sharing entre host/remotes; compatible con la mayoría de plugins de webpack si hace falta migrar algo puntual.
- **Cons**: combinación Rsbuild + MF2.0 es más nueva — menos historial de foros/Stack Overflow para edge cases raros; para un dev solo, sin equipo de soporte, un bug no documentado puede costar más tiempo relativo.
- **Effort**: Low-Medium (menos configuración por app, 4 apps a levantar en pocas semanas favorece la opción con menor fricción de arranque)

## Recommendation

**Rsbuild + Module Federation 2.0** para este caso puntual: una sola persona, pocas semanas, 4 apps corriendo en paralelo en dev. La velocidad de arranque/HMR de Rspack importa proporcionalmente más cuando sos el único debuggeando 4 procesos simultáneos, y el ahorro de boilerplate reduce superficie de error de configuración. El riesgo real (menos documentación para edge cases) se mitiga porque el alcance de MF acá es simple: 1 host + 3 remotes estáticos, sin dynamic remotes complejos ni multi-versión de shared deps entre equipos distintos.

## Estructura de carpetas propuesta (dentro de `frontend/`)

```
frontend/
├── package.json (root, workspaces: pnpm o npm)
├── pnpm-workspace.yaml (si pnpm)
├── tsconfig.base.json
├── apps/
│   ├── shell/
│   │   ├── rsbuild.config.ts
│   │   ├── src/
│   │   │   ├── app/        (routing top-level, layout, providers)
│   │   │   ├── auth/       (login screen, token storage, route guards por rol)
│   │   │   ├── shared/     (api-client base expuesto como federated module, design tokens)
│   │   │   └── remotes.d.ts (type declarations de módulos federados)
│   │   └── mocks/          (handlers MSW simulando ms-usuarios/gateway)
│   ├── mf-reservas/
│   ├── mf-administracion/
│   └── mf-reportes/
└── packages/   (NO crear todavía — solo si aparece duplicación real de UI compartida; YAGNI día 1)
```

Recomendación: pnpm workspaces por eficiencia en monorepo, con npm workspaces como fallback de menor fricción si el entorno académico no permite instalar pnpm. **Decisión abierta para `sdd-propose`.**

## Reparto de responsabilidades shell vs remotes

**Shell posee:**
- Layout global (header/nav/footer) y routing top-level (qué path monta qué remote, vía react-router + lazy loading)
- Auth completo: pantalla de login, guardado de JWT, decodificación de `rol`, route guards (bloquear `/administracion` y `/reportes` a `rol !== "administrador"`, replicando la regla que YA existe server-side en `ms-reservas`)
- Error boundary por remote (que un remote crashee no debe tirar abajo el shell completo)
- `shared` config de Module Federation con React/ReactDOM/react-router como singleton para evitar duplicados en runtime
- Un cliente HTTP base (`@shell/api-client`) expuesto como módulo federado, con el interceptor de Authorization ya resuelto, para que los 3 remotes no reimplementen 3 capas HTTP divergentes

**Cada remote posee:**
- Sus pantallas y lógica de dominio (reservas: flujo de booking; administración: CRUDs; reportes: dashboards)
- Su propio data-fetching (recomendado: TanStack Query, instancia compartida vía shell o local por remote — decisión a cerrar en propose)
- Sus propios tests

**Riesgo de boundary detectado**: si la regla de "solo administrador entra a administracion/reportes" se duplica en cada remote en vez de vivir una sola vez en el route guard del shell, hay riesgo de divergencia/bypass.

## Estrategia de dev local sin backend/gateway

- 4 dev servers en paralelo (`concurrently` o `pnpm -r --parallel dev`): shell:3000, mf-reservas:3001, mf-administracion:3002, mf-reportes:3003
- Remotes registrados en config del shell apuntando a `http://localhost:300X/...` en dev, y a URLs reales/CDN en build de producción (vía env var)
- MSW (Mock Service Worker) para simular las respuestas del futuro API Gateway, usando las formas de datos YA conocidas del backend real (`LoginResponse`, `ReservaResponse`, etc.) para que el mock no diverja del contrato real cuando el gateway exista
- Mismos handlers MSW reusados en tests (Vitest) y en dev server — un solo set de fixtures, dos consumidores
- Nota abierta: HMR cross-remote (el shell recargando en vivo cuando cambia un remote) es históricamente delicado en Module Federation — validar comportamiento real en fase de diseño, no asumir que "funciona solo"

## Testing

Se confirma Vitest + Testing Library como sugiere `openspec/config.yaml` — no hay conflicto real con Rsbuild/Rspack: Vitest es un test runner standalone (no depende de que el bundler de la app sea Vite), es un patrón común incluso en apps Rspack/Webpack. Se agrega:

- `@testing-library/react` + `jest-dom` + `user-event` para componentes
- Un `vitest.config.ts` por workspace (shell + 3 remotes), TDD estricto activo (RED-GREEN-REFACTOR) aplica naturalmente a nivel de hooks/lógica/componentes presentacionales
- Playwright E2E se recomienda **diferir** (no meterlo en semana 1) — recién tiene sentido cuando shell + al menos 1 remote tengan pantallas reales; meterlo día 1 sobre cero código es sobre-ingeniería

## Risks

- Combo Rsbuild + Module Federation 2.0 es relativamente nuevo (estable desde feb 2026) → menos respuestas de comunidad ante bugs raros, relevante para un dev solo sin red de soporte
- `apigateway/` está vacío — el contrato real (rutas, formato de error, envelope de respuesta) no existe; los mocks pueden divergir del gateway real cuando Wilson lo construya, va a requerir una tarea de "integration cutover" después
- Estrategia de guardado del JWT (localStorage vs cookie httpOnly) no resuelta acá — decisión de seguridad para `sdd-propose`/`sdd-design`, no para explore
- Disciplina de `shared: { singleton: true }` en versiones de React/react-router entre shell y 3 remotes debe mantenerse desde el día 1, aunque hoy la misma persona controle las 4 apps
- Decisión pnpm vs npm workspaces queda abierta
- Decisión de si el api-client/auth-context se expone como módulo federado desde el shell o como paquete npm interno (`packages/contracts`) queda abierta — dos approaches viables, no resuelto en esta exploración

## Ready for Proposal

Sí — hay suficiente contexto de backend (contrato de auth, roles, RBAC) y del estado vacío de frontend/apigateway para pasar a `sdd-propose` y tomar las decisiones abiertas (pnpm vs npm, ubicación del api-client compartido, estrategia de storage del JWT).
