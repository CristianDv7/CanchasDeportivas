# Tasks: mf-reportes — dashboard de reportes admin-only

TDD estricto. RED = test que falla; GREEN = implementación mínima que lo pasa. Todo dentro de `frontend/apps/mf-reportes/`.

## Phase 1: Infraestructura (MSW)

- [x] 1.1 Agregar `msw@2.15.0` como devDependency en `package.json` (misma versión que `mf-reservas`/`mf-administracion`; sin spike, ya validado 2 veces).
- [x] 1.2 Ajustar `vitest.config.ts`: agregar `environmentOptions.jsdom.url: "http://localhost:3003/"` (puerto real de `rsbuild.config.ts`). No tocar `resolve.alias`.
- [x] 1.3 Actualizar `setupTests.ts`: ciclo de vida `setupServer` (`onUnhandledRequest:"error"` en `listen`, `resetHandlers` en `afterEach`, `close` en `afterAll`) — copiar de `mf-administracion/setupTests.ts`.
- [x] 1.4 Crear `src/mocks/session.ts` con `seedSession({ rol: "administrador" })` (dashboard es admin-only, no hay rol default `usuario`).
- [x] 1.5 Crear `src/mocks/fixtures.ts` + `src/mocks/handlers.ts`: 2 endpoints (`GET /api/reportes/ocupacion/canchas`, `GET /api/reportes/reservas/periodo`) + `errorScenarios` (400 rango inválido, 502 agregador, 500 genérico, network).

## Phase 2: Adapter — DTOs, mappers, errores (Req. mf-reportes-backend-adapter)

- [x] 2.1 RED `src/api/mappers.test.ts`: `toOcupacionCancha` mapea `cancha_id/cancha/reservas` → `canchaId/cancha/reservas`, camelCase, sin campos extra; entrada con `reservas: 0` se preserva (no se filtra).
- [x] 2.2 RED (mismo archivo): `toReservasPeriodo` mapea `fecha_inicio/fecha_fin/total_reservas` → `fechaInicio/fechaFin/totalReservas`.
- [x] 2.3 GREEN: crear `src/api/raw.ts` (`OcupacionCanchaRaw`, `ReservasPeriodoRaw`), `src/api/dto.ts` (`IsoDate`, `OcupacionCancha`, `ReservasPeriodo`, `readonly`), `src/api/mappers.ts`.
- [x] 2.4 RED `src/api/errors.test.ts`: 400 → `detail` verbatim + `action:"none"`; 502 → mensaje de disyunción honesta ("canchas o reservas") + `action:"retry"`, en rama separada del `>=500` genérico; network/otros `>=500` → mensaje genérico + `action:"retry"`.
- [x] 2.5 GREEN: crear `src/api/errors.ts` (`UiError`, `ErrorAction`, `isApiError` duck-typing, `mapApiError` — decide solo por `status`, ADR-05).
- [x] 2.6 Crear `src/api/reportesApi.ts` (`ocupacionCanchas(signal)`, `reservasPeriodo(fechaInicio, fechaFin, signal)` — `apiClient.get` con `service:"reportes"`) y `src/api/index.ts` (barrel; `raw.ts` no se re-exporta). Sin test unitario propio — se cubre en Phase 6/7 (integración MSW).

## Phase 3: Reglas de dominio (Req. Validación de rango de fechas antes del request)

- [x] 3.1 RED `src/domain/rules.test.ts`: `isValidFecha` (copiar los mismos casos que `mf-reservas/domain/rules.test.ts` — guard contra años de 5 dígitos vía teclado, ADR-07).
- [x] 3.2 RED (mismo archivo): `validarRangoFechas` — igual (`true`), invertido (`false`), normal (`true`); comparación lexicográfica de strings ISO, sin `Date`/`toUtcMillis` (ADR-02).
- [x] 3.3 RED (mismo archivo): `rangoPorDefecto(hoy)` con `hoy` inyectado (sin `Date.now()` real) — devuelve últimos 30 días con getters de fecha local (ADR-04).
- [x] 3.4 RED (mismo archivo): `calcularMaxReservas` (set vacío ⇒ 0); `calcularProporcion` (`maxReservas<=0` ⇒ 0% para todas, guard `NaN`/`Infinity`; caso normal; redondeo, ADR-01).
- [x] 3.5 GREEN: crear `src/domain/rules.ts` (`isValidFecha`, `validarRangoFechas`, `rangoPorDefecto`, `calcularMaxReservas`, `calcularProporcion`). Comentario cruzado a `mf-reservas/domain/rules.ts` (`isValidFecha` copiado textual).

## Phase 4: Hooks (copia de `mf-reservas`/`mf-administracion`, sin `useAction`)

- [x] 4.1 RED `src/hooks/useResource.test.ts` (requiere `seedSession()` admin): `enabled:false` → idle; `refetch` conserva `data`; abort en cambio de `deps`.
- [x] 4.2 GREEN: crear `src/hooks/useResource.ts`. Sin `useAction`: los 2 endpoints son `GET`, no hay mutaciones en este remote.

## Phase 5: Componentes compartidos

- [x] 5.1 RED+GREEN `src/components/ErrorBanner.tsx`: `message` + botón Reintentar solo si `action==="retry"` (mismo contrato `UiError` que los otros 2 remotes).

## Phase 6: Feature Ocupación (Req. Panel de ocupación por cancha)

- [x] 6.1 RED: 3 canchas con distintas cantidades de reservas → tabla con 3 filas y barra cuyo ancho es proporcional al máximo del conjunto (ADR-01).
- [x] 6.2 RED: cancha con `reservas: 0` entre otras con reservas → fila con barra en 0%, no se omite ni se confunde con el estado vacío (ADR-06).
- [x] 6.3 RED: lista vacía real (`status==="success" && data.length===0`) → mensaje "no hay canchas cargadas", distinto del caso anterior.
- [x] 6.4 RED: `GET /reportes/ocupacion/canchas` responde 502 → mensaje de disyunción honesta con acción de reintento.
- [x] 6.5 GREEN: crear `src/features/ocupacion/OcupacionCanchasPanel.tsx`. Barra `aria-hidden`, tabla como fuente de verdad.

## Phase 7: Feature Período (Req. Panel de reservas por período)

- [x] 7.1 RED: al montar, se dispara la consulta con `rangoPorDefecto()` (sin `enabled`, ADR-04) y se muestra el `totalReservas` devuelto.
- [x] 7.2 RED `src/features/periodo/RangoFechasPicker.tsx` (test propio): 2 `<input type="date">` controlados escriben a `draft`; filtra valores con `isValidFecha` en ambos inputs (ADR-07).
- [x] 7.3 RED: botón "Actualizar" deshabilitado cuando `!validarRangoFechas(draft)`; no dispara request con rango inválido.
- [x] 7.4 RED: click en "Actualizar" con rango válido copia `draft` al estado aplicado y dispara un único fetch con el rango aplicado (no uno por cada tecleo de fecha, ADR-03).
- [x] 7.5 RED: `GET /reportes/reservas/periodo` responde 400 → se muestra el `detail` verbatim, sin reintento automático (`action:"none"`).
- [x] 7.6 RED: `GET /reportes/reservas/periodo` responde 502 → mismo mensaje de disyunción honesta con acción de reintento que en Ocupación.
- [x] 7.7 GREEN: crear `src/features/periodo/useReservasPeriodo.ts` (envuelve `useResource`, sin `enabled`) y `src/features/periodo/ReservasPeriodoPanel.tsx` (orquesta `RangoFechasPicker` + hook + `ErrorBanner`).

## Phase 8: Integración y limpieza (Req. Vista única sin router interno)

- [x] 8.1 Reemplazar placeholder en `src/App.tsx`: montar `OcupacionCanchasPanel` + `ReservasPeriodoPanel` apilados, sin `<Routes>` propio (Decisión 1 de la propuesta; el shell ya monta `/reportes/*` bajo `RequireRole rol="administrador"`, cero cambios en shell).
- [x] 8.2 Eliminar `src/RemoteHealthCard.{tsx,test.tsx,css}`.
- [x] 8.3 Verificar (búsqueda) que `src/api/raw.ts` no se importa fuera de `src/api/`; corregir cualquier violación (gotcha ya visto en `mf-reservas`: mover factories crudos a `mocks/fixtures.ts`).
- [x] 8.4 Aplicar delta a `openspec/specs/frontend-remote-modules/spec.md`: retirar los 3 requisitos de `RemoteHealthCard` (identidad, origen federado, trigger de error) — `mf-reportes` era el último remote que los tenía pendientes.

## Phase 9: Verificación global

- [x] 9.1 Correr `pnpm -r test` desde `frontend/`: todo verde, shell/mf-reservas/mf-administracion intactos.
- [x] 9.2 Correr `pnpm -r build`; confirmar sin diff en `frontend/apps/shell/`, `backend/`, `apigateway/` (`git status`/`git diff --stat`).
- [x] 9.3 Correr `pnpm --filter mf-reportes typecheck`: 0 errores.
