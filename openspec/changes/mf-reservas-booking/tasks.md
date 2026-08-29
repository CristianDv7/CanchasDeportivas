# Tasks: mf-reservas — flujo real de reservas

TDD estricto. RED = test que falla; GREEN = implementación mínima que lo pasa. Todo dentro de `frontend/apps/mf-reservas/`.

## Phase 1: Infraestructura (MSW + spike bloqueante)

- [x] 1.1 Agregar `msw` como devDependency en `package.json` de `mf-reservas`.
- [x] 1.2 **[BLOQUEANTE]** Spike: 1 test mínimo con `setupServer` (MSW v2) bajo jsdom para validar `Request/Response/TransformStream/BroadcastChannel`. Si falla, resolver (custom `environment` o polyfills) ANTES de 1.3+. **Resultado: pasó directo, sin polyfills** (`src/mocks/spike.test.ts`).
- [x] 1.3 Ajustar `vitest.config.ts`: solo `environmentOptions.jsdom.url`. No tocar `resolve.alias`.
- [x] 1.4 Crear `src/mocks/session.ts` con `seedSession()` (siembra `shell/session` — sin esto `apiClient` corta antes de que MSW vea el request). Verificado con test dedicado (`src/mocks/session.test.ts`).
- [x] 1.5 Actualizar `setupTests.ts`: `server.listen({onUnhandledRequest:"error"})` en `beforeAll`, `resetHandlers` en `afterEach`, `close` en `afterAll`.
- [x] 1.6 Crear `src/mocks/fixtures.ts` + `src/mocks/handlers.ts` (5 endpoints, espacio de URL `/api/{service}/**`) + `errorScenarios` (400×variantes, 403, 404, 422, network).

## Phase 2: Adapter — DTOs, mappers, errores (Req. mf-reservas-backend-adapter)

- [x] 2.1 RED `src/api/mappers.test.ts`: `toReserva`/`toCancha`/`toDisponibilidad`, `estado` desconocido → `null`, descarte de `created_at`/`updated_at`.
- [x] 2.2 GREEN: crear `src/api/raw.ts`, `src/api/dto.ts`, `src/api/mappers.ts` (incl. `toReservaCreateBody`, `normalizeEstado`).
- [x] 2.3 RED `src/api/errors.test.ts`: las 9 filas de la tabla de `mapApiError` (incl. `status:400,code:"unknown"` y no-`ApiError`).
- [x] 2.4 GREEN: crear `src/api/errors.ts` (`UiError`, `ErrorAction`, `isApiError` duck-typing, `mapApiError`).
- [x] 2.5 Crear `src/api/reservasApi.ts` (`listMias`, `crear`, `cancelar`, `getDisponibilidad` **aislado** en su propia función — hoy mockeada con MSW, contrato pendiente de Cristian).
- [x] 2.6 Crear `src/api/canchasApi.ts` (`list`) y `src/api/index.ts` (barrel, única superficie que importan `features/`).

## Phase 3: Reglas de dominio — RN-04/RN-06 (Req. Cancelar reserva, Límite informativo)

- [x] 3.1 RED `src/domain/rules.test.ts`: `canCancel` con epoch explícito (antes/exacto/después de iniciar), `estado≠Confirmada`, `estado:null`.
- [x] 3.2 GREEN: crear `src/domain/rules.ts` (`toUtcMillis`, `hasStarted`, `canCancel`, `contarActivas`, `estadoBadge`). Comentario obligatorio: replica bug-for-bug el timezone UTC del backend, no "corregir".

## Phase 4: Hooks de fetching

- [x] 4.1 RED `src/hooks/useResource.test.ts` (requiere `seedSession()` primero): `enabled:false`→idle, `refetch` conserva `data`, abort en cambio de `deps`. Usa MSW.
- [x] 4.2 GREEN: crear `src/hooks/useResource.ts`.
- [x] 4.3 RED `src/hooks/useAction.test.ts`: `run()` nunca throwea, devuelve `null` en error.
- [x] 4.4 GREEN: crear `src/hooks/useAction.ts`.

## Phase 5: Componentes compartidos

- [x] 5.1 RED+GREEN `src/components/ErrorBanner.tsx`: muestra `message`, botón Reintentar solo si `action==="retry"`.
- [x] 5.2 RED+GREEN `src/components/EstadoBadge.tsx`: label/tono por `estado` (incl. `Finalizada`).

## Phase 6: Feature Disponibilidad (Req. Ver disponibilidad)

- [x] 6.1 RED `DisponibilidadPage.test.tsx`: grilla libre/ocupado; cancha sin horario ese día → grilla vacía sin error.
- [x] 6.2 GREEN: `features/disponibilidad/useDisponibilidad.ts`, `BloquesGrid.tsx`, `CanchaFechaPicker.tsx`, `DisponibilidadPage.tsx`.

## Phase 7: Feature Nueva reserva (Req. Crear reserva, Manejo de errores, RN-06)

- [x] 7.1 RED: reserva exitosa (bloque libre → `estado=Confirmada`).
- [x] 7.2 RED: 400 (cualquier variante) → `detail` verbatim + refetch de disponibilidad (secuencia RN-02).
- [x] 7.3 RED: 403/404/422 → mensaje propio del adapter, sin refetch.
- [x] 7.4 RED: contador RN-06 visible, submit no bloqueado por él.
- [x] 7.5 GREEN: `features/nueva-reserva/ReservaForm.tsx`, `NuevaReservaPage.tsx` (`useAction` + `useDisponibilidad` propio + `useResource(reservasApi.listMias)`).

## Phase 8: Feature Mis reservas (Req. Cancelar reserva, Badges de estado)

- [x] 8.1 RED: badge por estado (`Confirmada`/`Cancelada`/`Finalizada`).
- [x] 8.2 RED: cancelación exitosa → lista se actualiza.
- [x] 8.3 RED: RN-04 — botón deshabilitado con `vi.setSystemTime` (bloque ya iniciado) y con `estado≠Confirmada`.
- [x] 8.4 GREEN: `features/mis-reservas/ReservaRow.tsx`, `MisReservasPage.tsx`.

## Phase 9: Integración y limpieza

- [x] 9.1 Reemplazar placeholder en `App.tsx`: sub-router relativo (`index`→Disponibilidad, `nueva`→Nueva reserva, `mias`→Mis reservas).
- [x] 9.2 Eliminar `RemoteHealthCard.tsx` y su test.
- [x] 9.3 Verificar (búsqueda) que `src/api/raw.ts` no se importa fuera de `src/api/`. **Encontrada 1 violación** (`MisReservasPage.test.tsx` importaba `ReservaRaw` directo) — corregida moviendo el factory `reservaRaw()` a `mocks/fixtures.ts` con un tipo derivado estructuralmente (`(typeof reservasRaw)[number]`), sin import cruzado a `api/`.

## Phase 10: Verificación global

- [x] 10.1 Correr `pnpm -r test` desde `frontend/`: todo verde, shell/mf-administracion/mf-reportes intactos. **144/144 tests verdes** (shell 65, mf-administracion 6, mf-reportes 6, mf-reservas 67), 4 apps del workspace, exit code 0.
- [x] 10.2 Correr `pnpm -r build`; confirmar sin diff en `frontend/apps/shell/`. Build limpio (exit 0) en las 4 apps; `git status`/`git diff --stat` sobre `frontend/apps/shell/src` sin salida (cero diff). También corrido `pnpm --filter mf-reservas typecheck` (0 errores) como verificación adicional no listada explícitamente pero solicitada para este batch.
