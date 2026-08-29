# Proposal: mf-reservas — flujo real de reservas

## Intent

`mf-reservas` hoy solo monta `RemoteHealthCard` (probe a `/mias`, path inexistente). Falta la app real: ver disponibilidad, reservar y gestionar reservas propias. Éxito = un usuario `rol=usuario` completa el ciclo consultar → reservar → cancelar, sin tocar el shell.

**Dependencia pendiente, fuera de nuestro control**: `GET /reservas/disponibilidad` NO existe todavía en `ms-reservas` — es el bloqueante real, y `backend/` es el bloque de Cristian, no lo tocamos nosotros. Se armó y probó un spike (revertido) que confirma que el endpoint es viable con el contrato de abajo; la propuesta formal para Cristian queda en `docs/propuestas/ms-reservas-endpoint-disponibilidad.md`. Esta change puede avanzar en paralelo (specs/design/tasks, implementación con MSW mockeando ese contrato), pero el criterio de éxito "contra el backend real" queda bloqueado hasta que Cristian lo implemente o decida no hacerlo.

## Scope

### In Scope
- Pantalla **Disponibilidad**: cancha + fecha → grilla de bloques `libre|ocupado` (`GET /reservas/disponibilidad`).
- Pantalla **Nueva reserva**: `POST /reservas/` con `usuario_id` de `shell/session`; re-consulta disponibilidad ante cualquier 400.
- Pantalla **Mis reservas**: `GET /reservas/` + `PATCH /reservas/{id}/cancelar`, badge por estado (incluye `Finalizada`).
- Capa adapter `src/api/` — único punto que conoce paths y shapes crudos del backend.
- Reemplazo del placeholder `RemoteHealthCard`.
- MSW + tests (TDD estricto, `pnpm -r test`).

### Out of Scope
- `mf-administracion`, `mf-reportes`, gateway (`apigateway/` vacío), cualquier cambio de backend.
- Cambios en `shell/` — no hacen falta: `session.user.id` ya es el `usuario_id` numérico y `apiClient` ya resuelve host/auth.
- TanStack Query, paginación, filtros server-side (el backend no los expone).

## Capabilities

### New Capabilities
- `mf-reservas-booking`: flujo de usuario de las 3 pantallas y espejado client-side de RN-04/RN-06.
- `mf-reservas-backend-adapter`: paths, DTOs propios, mapeo de errores y aislamiento frente al gateway futuro.

### Modified Capabilities
- None.

## Approach

| # | Decisión | Rationale |
|---|----------|-----------|
| 1 | **Adapter en `src/api/`**: `reservasApi.ts`, `canchasApi.ts`, `dto.ts` (`Reserva`, `BloqueHorario`, `Cancha`, `Disponibilidad` en camelCase), `errors.ts`. Consume `shell/apiClient` (transporte) y traduce shape. | `apiClient` desacopla host/puerto pero **no** forma de datos. El adapter es el único archivo a tocar cuando Wilson defina el gateway. |
| 2 | **Fechas/horas como strings** (`YYYY-MM-DD`, `HH:mm:ss`) en los DTOs. Comparaciones vía helper que interpreta **UTC** (`Date.UTC`), espejando `datetime.combine(...) <= now(UTC)` del backend. | Meter `Date` en el DTO invita bugs de timezone silenciosos: el backend trata los naive datetimes como UTC. |
| 3 | **Errores: `detail` para mostrar, `code`/`status` para decidir.** Nunca ramificar por texto. `mapApiError(error) → {message, action}`: 400 → `detail` verbatim + refetch de disponibilidad; 403/404 → mensaje propio; 422 → `detail` (ya aplanado); `network`/`server` → genérico con reintento. | Parsear español es frágil **solo cuando controla flujo**; mostrarlo es gratis y da mejor UX que "Error 400". Y no hace falta distinguir solapamiento vs. límite: ante cualquier 400 la acción correcta es la misma (refrescar + mostrar el motivo del backend). Ojo: `apiClient` mapea 400 → `code: "unknown"`; el discriminador confiable es `status`. |
| 4 | **Sin TanStack Query**: hook propio `useResource` (~40 LOC) + refetch explícito post-mutación. | 4 endpoints, 3 pantallas, cero cache compartida entre remotes. Bajo Module Federation, compartir un `QueryClient` exige declararlo `singleton` en el shell **y** en los 3 remotes → tocar `shell/` (fuera de alcance) por un beneficio nulo a esta escala. Se reevalúa si `mf-reportes` necesita cache cruzada. Cierra la decisión abierta de `frontend-shell`. |
| 5 | **MSW** como devDependency de `mf-reservas`. | ~10 casos de error a cubrir (400 ×4 variantes, 403, 404, 422, network, timeout). Mockear `fetch` a mano obliga a fabricar `Response` en cada test y **saltea el `apiClient` real**, que es justo la pieza de la que depende el adapter. MSW intercepta a nivel red: los tests ejercitan el camino real. |
| 6 | **RN-04 espejo duro / RN-06 solo informativo.** Cancelar se deshabilita si `estado !== "Confirmada"` o el bloque ya inició (calculable con datos que el cliente ya tiene). El límite de activas se muestra como contador, **no** bloquea el submit. | `MAX_RESERVAS_ACTIVAS` es env del backend, no expuesto por ningún endpoint: hardcodear 3 crea un gate que puede bloquear reservas legítimas si el env cambia. Regla: espejar solo lo que el cliente puede computar; lo demás lo decide el 400. |

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `frontend/apps/mf-reservas/src/api/` | New | Adapter: paths, DTOs, `mapApiError`. |
| `frontend/apps/mf-reservas/src/domain/rules.ts` | New | RN-04 (`hasStarted`), estado→label/color, contador RN-06. Funciones puras. |
| `frontend/apps/mf-reservas/src/features/{disponibilidad,nueva-reserva,mis-reservas}/` | New | Pantallas + hooks. |
| `frontend/apps/mf-reservas/src/hooks/useResource.ts` | New | Fetching genérico (loading/error/refetch). |
| `frontend/apps/mf-reservas/src/App.tsx` | Modified | Monta las pantallas en lugar del placeholder. |
| `frontend/apps/mf-reservas/src/RemoteHealthCard.tsx` | Removed | Placeholder con path inexistente. |
| `frontend/apps/mf-reservas/{package.json,setupTests.ts}` | Modified | `msw` + `setupServer`. |
| `frontend/apps/shell/**` | **Sin cambios** | Regla de la change. Tocarlo exige justificación explícita en `sdd-design`. |

## Risks

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Carrera entre `GET disponibilidad` y `POST` (RN-02) | Media | El POST es la verdad; ante 400 se refetchea y se repinta la grilla. |
| `finalizar_reserva` sin trigger: `Finalizada` puede no aparecer nunca | Alta | Soportarlo visualmente sin depender de que ocurra. No se cablea backend. |
| Gateway indefinido cambia paths/shape | Media | Contenido en `src/api/`; la UI no se entera. |
| `MAX_RESERVAS_ACTIVAS` no observable desde el cliente | Alta | Decisión 6: informativo, no bloqueante. |
| MSW v2 rompe el setup Vitest/jsdom de los otros remotes | Baja | devDep scoped a `mf-reservas`; validar con `pnpm -r test` antes de seguir. |

## Rollback Plan

Todo el cambio vive dentro de `frontend/apps/mf-reservas/` (+ su `package.json`). Rollback = `git revert` de los commits de la change y `pnpm install`; vuelve el placeholder y el resto del monorepo queda intacto porque el shell no se toca. Si el remote falla ya en runtime, el `ErrorBoundary` por remote (`frontend-shell-host`) aísla la caída: shell y los otros 2 remotes siguen usables sin rollback. No hace falta feature flag.

## Dependencies

- `ms-reservas` y `ms-canchas` corriendo; proxy `/api/*` del shell configurado.
- `msw` (nueva devDependency).
- Usuario seed con `rol=usuario` y una cancha con `horarios-atencion` cargados.

## Success Criteria

- [ ] Un `rol=usuario` completa consultar disponibilidad → reservar → cancelar contra el backend real.
- [ ] La grilla refleja `libre|ocupado` del endpoint real y nunca muestra datos de terceros.
- [ ] Todo path/shape del backend aparece únicamente dentro de `src/api/`.
- [ ] Cancelar está deshabilitado para reservas iniciadas o no `Confirmada`, con test de reloj congelado.
- [ ] 400/403/404/422/network cubiertos con MSW y mensaje accionable.
- [ ] `pnpm -r test` y `pnpm -r build` verdes; `frontend/apps/shell/` sin diff.
