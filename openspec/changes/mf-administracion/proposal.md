# Proposal: mf-administracion — panel de administración (RN-07 + RN-03 admin)

## Intent

`mf-administracion` hoy solo monta `RemoteHealthCard`: el rol `administrador` puede loguearse, el shell lo deja pasar por `/administracion/*`, y no encuentra nada que administrar. Las dos reglas de negocio que la rúbrica le asigna a este remote —**RN-07** (solo el admin crea/edita/inactiva canchas y define horario de atención) y la **mitad admin de RN-03** (el admin cancela cualquier reserva)— no tienen representación en la UI.

A diferencia de `mf-reservas-booking`, **no hay dependencia bloqueante**: Cristian ya expuso todo lo necesario (`POST/PUT /canchas`, `PATCH /canchas/{id}/inactivar`, `POST/PUT /horarios-atencion`, `GET /reservas/` con vista total para admin, `PATCH /reservas/{id}/cancelar` con `es_administrador`). Esta change es 100% frontend. Éxito = un `rol=administrador` da de alta una cancha, le define horario, la inactiva, y cancela la reserva de OTRO usuario, todo contra el backend real.

## Scope

### In Scope
- Router interno del remote: `/administracion/canchas` y `/administracion/reservas` (`react-router-dom` ya está en `package.json`, sin usar).
- **Canchas (RN-07)**: listado, alta, edición e inactivación (`PATCH .../inactivar` — soft delete, no hay borrado duro), con selector de deporte (`GET /deportes`).
- **Horarios de atención (RN-07)**: alta/edición del horario por cancha.
- **Reservas (RN-03/RN-04)**: listado global de TODAS las reservas con enrichment de nombre de cancha y de usuario, filtros client-side (fecha, cancha, estado) y cancelación de cualquier reserva.
- Capa adapter `src/api/` sobre `shell/apiClient` para los 3 servicios (`canchas`, `reservas`, `usuarios`).
- Reemplazo del placeholder `RemoteHealthCard`.
- MSW + tests bajo TDD estricto (`pnpm -r test`).
- Nota técnica a Cristian en `docs/propuestas/` por el gap de auth en `deportes.py` (documento, cero código backend).

### Out of Scope
- Cualquier cambio en `backend/` o `apigateway/` — regla dura del proyecto.
- Cambios en `frontend/apps/shell/` — el guard `RequireRole` y `apiClient` ya cubren todo lo necesario.
- `mf-reportes`, ABM de usuarios, ABM de deportes (fuera de la letra de RN-07).
- Paginación/filtros server-side (el backend no los expone), TanStack Query.
- Extraer un paquete compartido `packages/*` en el workspace (ver Decisión 2).

## Capabilities

### New Capabilities
- `mf-administracion-canchas`: ABM de canchas + horarios de atención, espejo de RN-07 en UI.
- `mf-administracion-reservas`: panel global de reservas, enrichment y cancelación admin (RN-03) con RN-04 vigente.
- `mf-administracion-backend-adapter`: paths, DTOs y mapeo de errores contra `ms-canchas`/`ms-reservas`/`ms-usuarios`.

### Modified Capabilities
- `frontend-remote-modules`: el requisito "los 3 remotes MUST renderizar `RemoteHealthCard`" queda acotado a los remotes que siguen siendo placeholder. `mf-reservas` ya lo removió sin actualizar el spec (deuda de la change anterior); esta change lo deja consistente: solo `mf-reportes` mantiene la obligación.

## Approach

| # | Decisión | Rationale |
|---|----------|-----------|
| 1 | **Un remote, router interno, dos features** (`features/canchas`, `features/reservas`) con `src/api/` compartido. | El MF ya expone un único `./App`; un segundo remote implicaría puerto, `rsbuild.config.ts`, entrada en `AppRouter.tsx` y `.env` nuevos para cero beneficio, y rompería la convención de 4 apps del CLAUDE.md. |
| 2 | **Duplicar** `toUtcMillis`/`hasStarted`/`canCancel` y `useResource`/`useAction` desde `mf-reservas`, **no** extraer `packages/shared`. Cada copia lleva un comentario cruzado apuntando a la otra. | Extraer hoy obliga a tocar `pnpm-workspace.yaml`, 4 `tsconfig` y los builds de 4 apps por ~60 LOC de funciones puras. **Trigger explícito de extracción**: cuando aparezca el tercer consumidor (`mf-reportes`) o cuando el backend corrija su manejo de timezone. |
| 3 | **RN-04 sin bypass admin.** `canCancel` se aplica idéntico que en `mf-reservas`: el botón se deshabilita si la reserva ya inició o no está `Confirmada`, aunque el usuario sea admin. | El `cancelar()` del backend aplica RN-04 igual para admin. Habilitar el botón "porque es admin" produciría un 400 garantizado y enseñaría una regla falsa. |
| 4 | **Enrichment por join client-side**: `reservas` + `canchas` + `usuarios` en paralelo, `Map` por id, degradación parcial (si falla `GET /usuarios` se muestra `usuario_id` crudo, el panel no se cae). | El backend no expone un endpoint enriquecido y no lo vamos a pedir por algo resoluble en el cliente. La degradación evita que un 403 en usuarios bloquee la cancelación, que es la función crítica. |
| 5 | **Escrituras optimistas: no.** Toda mutación (`crear`/`editar`/`inactivar`/`cancelar`) refetchea la lista afectada. | Mismo criterio que `mf-reservas`: la respuesta del backend es la única verdad; con volúmenes de este proyecto el refetch es imperceptible y elimina toda una clase de bugs de estado divergente. |
| 6 | **Errores: `status` decide, `detail` se muestra.** Se reusa el criterio de `mapApiError`: 403 → "no tenés permisos" (no debería pasar tras el guard, pero se cubre), 404 → recurso eliminado + refetch, 400/422 → `detail` verbatim, network → genérico con reintento. | Ramificar por texto en español es frágil; mostrarlo es gratis y da mejor UX que "Error 400". |
| 7 | **Filtrado client-side con contador visible.** `GET /reservas/` devuelve todo sin paginar; la UI filtra en memoria y muestra "N de M reservas". | Contención honesta del límite del backend: el admin ve el volumen real y sabe que está filtrando localmente. Si el dataset crece, el reemplazo es un query param, contenido en `src/api/`. |

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `frontend/apps/mf-administracion/src/api/` | New | `raw.ts`, `dto.ts`, `mappers.ts`, `canchasApi.ts`, `horariosApi.ts`, `reservasAdminApi.ts`, `usuariosApi.ts`, `errors.ts`. |
| `frontend/apps/mf-administracion/src/domain/rules.ts` | New | RN-04 (`hasStarted`/`canCancel`), badges de estado, validaciones de horario. Funciones puras. |
| `frontend/apps/mf-administracion/src/features/canchas/` | New | Listado, formulario alta/edición, inactivación, horarios. |
| `frontend/apps/mf-administracion/src/features/reservas/` | New | Listado global, filtros, cancelación admin. |
| `frontend/apps/mf-administracion/src/hooks/` | New | `useResource`, `useAction`. |
| `frontend/apps/mf-administracion/src/App.tsx` | Modified | Router interno en lugar del placeholder. |
| `frontend/apps/mf-administracion/src/RemoteHealthCard.tsx` | Removed | Placeholder. |
| `frontend/apps/mf-administracion/{package.json,setupTests.ts}` | Modified | `msw` + `setupServer`. |
| `openspec/specs/frontend-remote-modules/spec.md` | Modified | Delta: el placeholder ya solo aplica a `mf-reportes`. |
| `frontend/apps/shell/**`, `backend/**`, `apigateway/**` | **Sin cambios** | Tocarlos exige justificación explícita en `sdd-design`. |

## Risks

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Drift entre las dos copias de `rules.ts` (sobre todo el gotcha de timezone UTC) | Media | Comentario cruzado en ambos archivos + trigger de extracción documentado (Decisión 2) + test de reloj congelado en las dos apps. |
| Fan-out de 3 requests por vista de reservas | Media | Paralelo + degradación parcial (Decisión 4); volumen universitario, no hay presión de performance. |
| `GET /reservas/` sin paginar crece y degrada la tabla | Baja | Filtrado client-side + contador; el salto a query params queda contenido en `src/api/`. |
| Inactivar una cancha con reservas futuras confirmadas: comportamiento del backend no verificado | Media | Verificar en `sdd-design` leyendo `ms-canchas`; si no hay cascada, advertir en la UI antes de confirmar. No se cambia backend. |
| `deportes.py` sin auth permite alta de deportes sin token | Baja | Fuera de alcance funcional; se documenta como nota a Cristian, no se mitiga desde el cliente. |
| MSW nueva devDep rompe el setup Vitest/jsdom de los otros remotes | Baja | Scoped a `mf-administracion`; validar `pnpm -r test` antes de seguir (mismo precedente que `mf-reservas`). |

## Rollback Plan

Todo el cambio vive dentro de `frontend/apps/mf-administracion/` (+ su `package.json`) y el delta de spec. Rollback = `git revert` de los commits de la change y `pnpm install`; vuelve el placeholder y el resto del monorepo queda intacto porque no se toca ni el shell ni los otros remotes. Si el remote rompe en runtime, el `ErrorBoundary` por remote del shell aísla la caída: shell y los otros 2 remotes siguen usables sin necesidad de rollback. No hace falta feature flag.

## Dependencies

- `ms-canchas`, `ms-reservas` y `ms-usuarios` corriendo; proxy `/api/*` del shell configurado.
- `msw` (nueva devDependency de `mf-administracion`).
- Datos seed: un usuario `rol=administrador`, al menos un usuario `rol=usuario` con reservas confirmadas a futuro (para probar RN-03 de punta a punta) y al menos un deporte cargado.

## Success Criteria

- [ ] Un `rol=administrador` crea una cancha, le define horario de atención, la edita y la inactiva contra el backend real.
- [ ] El mismo admin cancela una reserva que pertenece a OTRO usuario, y la reserva pasa a `Cancelada`.
- [ ] Cancelar está deshabilitado para reservas ya iniciadas o no `Confirmada` **también para el admin**, con test de reloj congelado.
- [ ] Un `rol=usuario` que navega a `/administracion/*` sigue cayendo en `/acceso-denegado` (guard del shell intacto).
- [ ] Todo path/shape del backend aparece únicamente dentro de `src/api/`.
- [ ] La vista de reservas sigue siendo operativa (cancelación incluida) aunque `GET /usuarios` falle.
- [ ] `pnpm -r test` y `pnpm -r build` verdes; `frontend/apps/shell/`, `backend/` y `apigateway/` sin diff.
