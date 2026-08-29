# Tasks: mf-administracion — panel de administración (RN-07 + RN-03 admin)

TDD estricto. RED = test que falla; GREEN = implementación mínima que lo pasa. Todo dentro de `frontend/apps/mf-administracion/`.

## Phase 1: Infraestructura (MSW)

- [x] 1.1 Agregar `msw@2.15.0` como devDependency en `package.json` (misma versión que `mf-reservas`; sin spike, ya validado).
- [x] 1.2 Ajustar `vitest.config.ts`: solo agregar `environmentOptions.jsdom.url: "http://localhost:3002/"`. No tocar `resolve.alias`.
- [x] 1.3 Crear `src/mocks/session.ts` con `seedSession({ rol: "administrador" })` (rol admin, no el default `usuario` de la copia).
- [x] 1.4 Actualizar `setupTests.ts`: ciclo de vida `setupServer` (`onUnhandledRequest:"error"` en `listen`, `resetHandlers` en `afterEach`, `close` en `afterAll`) — copiar de `mf-reservas/setupTests.ts`.
- [x] 1.5 Crear `src/mocks/fixtures.ts` + `src/mocks/handlers.ts`: 5 endpoints (`/api/canchas/canchas`, `/api/canchas/deportes`, `/api/canchas/horarios-atencion`, `/api/reservas/reservas/`, `/api/usuarios/usuarios`) + `errorScenarios` (400 dup nombre, 403, 404, 422, 500, network, `reservasDown()`).

## Phase 2: Adapter — DTOs, mappers, errores (Req. mf-administracion-backend-adapter)

- [x] 2.1 RED `src/api/mappers.test.ts`: mapeo de los 5 recursos (`toCancha`/`toDeporte`/`toHorarioAtencion`/`toReserva`/`toUsuario`); `estado` desconocido → `null`; descarte de `created_at`/`updated_at`/`telefono`/`rol_id`.
- [x] 2.2 RED (mismo archivo): asimetría de bodies — `toCanchaCreateBody` (sin `activo`) vs. `toCanchaUpdateBody` (con `activo?`); `toHorarioCreateBody` (con `dia_semana`) vs. `toHorarioUpdateBody` (**sin** `dia_semana`, ADR-06).
- [x] 2.3 GREEN: crear `src/api/raw.ts`, `src/api/dto.ts`, `src/api/mappers.ts` (incl. `normalizeEstado`).
- [x] 2.4 RED `src/api/errors.test.ts`: las 8 filas de ADR-10 (incl. no-`ApiError`, 403 fijo ignorando `detail`).
- [x] 2.5 GREEN: crear `src/api/errors.ts` (`UiError`, `ErrorAction`, `isApiError` duck-typing, `mapApiError`).
- [x] 2.6 Crear `src/api/canchasApi.ts` (`list`/`crear`/`editar`/`inactivar`/`reactivar`), `src/api/deportesApi.ts` (`list`), `src/api/horariosApi.ts` (`listPorCancha`/`crear`/`editarHoras`). Sin tests unitarios propios — se cubren en Phase 8 (integración).

## Phase 3: Adapter — reservasAdminApi + enrichment (Req. mf-administracion-backend-adapter, mf-administracion-reservas)

- [x] 3.1 RED `src/api/mappers.test.ts` (buildReservasAdmin): join OK; `canchas=[]` → `canchaLabel:"Cancha #7"`; `usuarios=[]` → `usuarioLabel:"Usuario #3"`; ambos vacíos.
- [x] 3.2 GREEN: agregar `buildReservasAdmin(reservas, canchas, usuarios)` a `src/api/mappers.ts` (dos `Map` por id, ADR-08).
- [x] 3.3 RED `src/api/reservasAdminApi.test.ts` (MSW): 3 handlers OK → `ReservaAdmin[]` enriquecido; `GET /usuarios` 403 → panel degradado (`Usuario #3`) pero operativo; `GET /reservas/` 500 → `throw` propagado (ADR-07, re-throw explícito de `r.reason`).
- [x] 3.4 GREEN: crear `src/api/reservasAdminApi.ts` (`listPanel` con `Promise.allSettled`; `cancelar`).
- [x] 3.5 Crear `src/api/usuariosApi.ts` (`list`) y `src/api/index.ts` (barrel único que importan `features/`).

## Phase 4: Reglas de dominio (Req. RN-04 sin bypass, Inactivación con advertencia, Horario con rango inválido)

- [x] 4.1 RED `src/domain/rules.test.ts`: `canCancel` con epoch explícito (antes/**exacto**/después de iniciar), `estado≠Confirmada`, `estado:null` → `false`. Sin excepción por rol admin (ADR-04).
- [x] 4.2 RED (mismo archivo): `contarAfectadasPorInactivar` — cuenta solo `Confirmada` + futuras + de esa cancha; ignora canceladas, pasadas y de otras canchas (ADR-03).
- [x] 4.3 RED (mismo archivo): `validarHorario` — `horaInicio >= horaFin` ⇒ inválido (espeja `model_validator`, ADR-06).
- [x] 4.4 GREEN: crear `src/domain/rules.ts` (`toUtcMillis`, `hasStarted`, `canCancel`, `estadoBadge`, `contarAfectadasPorInactivar`, `validarHorario`). Comentario cruzado a `mf-reservas/src/domain/rules.ts` (ADR-02: bug de timezone UTC replicado a propósito).

## Phase 5: Filtros (Req. Filtros client-side con contador)

- [x] 5.1 RED `src/domain/filters.test.ts`: filtro por `fecha`/`canchaId`/`estado`; toggle "solo próximas" (default activo); contador N de M; **no reordena** el array de entrada (ADR-09).
- [x] 5.2 GREEN: crear `src/domain/filters.ts` (`filtrarReservas`).

## Phase 6: Hooks (copia de `mf-reservas`, ADR-02)

- [x] 6.1 RED `src/hooks/useResource.test.ts` (requiere `seedSession()` admin): `enabled:false` → idle; `refetch` conserva `data`; abort en cambio de `deps`.
- [x] 6.2 GREEN: crear `src/hooks/useResource.ts`.
- [x] 6.3 RED `src/hooks/useAction.test.ts`: `run()` nunca throwea, devuelve `null` en error.
- [x] 6.4 GREEN: crear `src/hooks/useAction.ts`.

## Phase 7: Componentes compartidos

- [x] 7.1 RED+GREEN `src/components/ErrorBanner.tsx`: `message` + botón Reintentar solo si `action==="retry"`.
- [x] 7.2 RED+GREEN `src/components/EstadoBadge.tsx`: label/tono por `estado` (incl. `Finalizada`, RN-08).
- [x] 7.3 RED+GREEN `src/components/ConfirmDialog.tsx`: diálogo base (título, mensaje, confirmar/cancelar), sin lógica de negocio propia.

## Phase 8: Feature Canchas (Req. mf-administracion-canchas)

- [x] 8.1 RED: alta exitosa de cancha (selector de deporte desde `GET /deportes`) → refetch del listado.
- [x] 8.2 RED: alta con 400 "nombre duplicado" → `detail` verbatim, sin refetch.
- [x] 8.3 RED: edición exitosa → refetch; edición sobre cancha eliminada (404) → mensaje propio + refetch.
- [x] 8.4 RED: inactivación sin reservas futuras → refetch directo; inactivación con reservas futuras `Confirmada` → `ConfirmDialog` muestra advertencia con conteo y link a `/administracion/reservas?cancha=7`.
- [x] 8.5 RED: si `GET /reservas/` del diálogo falla (`errorScenarios.reservasDown()`), el botón Inactivar **sigue habilitado** (ADR-03).
- [x] 8.6 RED: reactivación (`PUT` con `{activo:true}`) → badge pasa a Activa.
- [x] 8.7 RED: 403 en escritura de cancha u horario → mensaje propio "no tenés permisos", sin refetch.
- [x] 8.8 RED: horarios — 7 filas fijas (lunes→domingo); fila vacía → "Definir" (`POST` con `dia_semana`); fila con horario → "Editar horas" (`PUT` **sin** `dia_semana`, assert sobre el body del request, ADR-06); rango inválido (422) → `detail` aplanado, horario anterior no se pierde.
- [x] 8.9 GREEN: `features/canchas/CanchasPage.tsx`, `CanchaForm.tsx`, `InactivarCanchaDialog.tsx`, `HorariosSemana.tsx`.

## Phase 9: Feature Reservas — panel admin (Req. mf-administracion-reservas)

- [x] 9.1 RED: listado enriquecido con nombre de cancha y usuario por fila.
- [x] 9.2 RED: degradación si falla `GET /usuarios` → `usuario_id` crudo, panel operable, cancelación disponible.
- [x] 9.3 RED: filtro por estado → contador "N de M" refleja el filtrado.
- [x] 9.4 RED: RN-03 — admin cancela reserva de OTRO `usuarioId` → pasa a `Cancelada`, refetch (ADR-11, sin optimismo).
- [x] 9.5 RED: RN-04 — botón Cancelar deshabilitado para reserva ya iniciada (`vi.setSystemTime` en `beforeEach`, `vi.useRealTimers()` en `afterEach`) y para `estado≠Confirmada`, sin excepción por rol admin.
- [x] 9.6 RED: badge por estado (`Confirmada`/`Cancelada`/`Finalizada`) en el panel global (RN-08).
- [x] 9.7 GREEN: `features/reservas/ReservasAdminPage.tsx`, `ReservasFiltros.tsx`, `ReservaAdminRow.tsx`.

## Phase 10: Integración y limpieza

- [x] 10.1 Reemplazar placeholder en `src/App.tsx`: `<Routes>` relativo con `/canchas` y `/reservas` (el shell ya monta `/administracion/*` bajo `RequireRole rol="administrador"`; cero cambios en shell).
- [x] 10.2 Eliminar `src/RemoteHealthCard.{tsx,test.tsx,css}`.
- [x] 10.3 Verificar (búsqueda) que `src/api/raw.ts` no se importa fuera de `src/api/`; corregir cualquier violación (gotcha ya visto en `mf-reservas`: mover factories crudos a `mocks/fixtures.ts`).
- [x] 10.4 Crear `docs/propuestas/ms-canchas-observaciones.md` (4 hallazgos de §10 del design: auth faltante en `/deportes` y `GET /usuarios/{id}`, no-op de `activo` en horarios, 500 sin envolver en duplicado de horario). Documento, cero código backend.
- [x] 10.5 Aplicar delta a `openspec/specs/frontend-remote-modules/spec.md`: el placeholder de `RemoteHealthCard` ya solo aplica a `mf-reportes`.

## Phase 11: Verificación global

- [x] 11.1 Correr `pnpm -r test` desde `frontend/`: todo verde, shell/mf-reservas/mf-reportes intactos.
- [x] 11.2 Correr `pnpm -r build`; confirmar sin diff en `frontend/apps/shell/` (`git status`/`git diff --stat`).
- [x] 11.3 Correr `pnpm --filter mf-administracion typecheck`: 0 errores.
