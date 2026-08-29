# Proposal: mf-reportes — dashboard de reportes admin-only

## Intent

`mf-reportes` es el último remote que sigue montando `RemoteHealthCard`: un `rol=administrador` entra a `/reportes` y encuentra una tarjeta de diagnóstico en vez de datos. Es también el único bloque del frontend que **no** tiene regla de negocio propia (RN-01..RN-08 ya viven en `mf-reservas` y `mf-administracion`): su valor es de **explotación**, cerrar la fase 5 del orden sugerido de la guía y darle al admin lectura agregada sobre lo que el resto del sistema produce.

No hay dependencia bloqueante: `ms-reportes` ya expone los 2 endpoints que necesitamos y la exploración confirmó que el **shell no requiere ningún cambio** (`ServiceName` ya incluye `"reportes"`, `/reportes/*` ya está bajo `RequireRole rol="administrador"` con test, remote y proxy ya declarados). Change 100% dentro de `frontend/apps/mf-reportes/`. Éxito = un admin abre `/reportes`, ve ocupación por cancha y total de reservas de un período que él elige, contra el backend real.

## Scope

### In Scope

- **Panel de ocupación por cancha**: `GET /reportes/ocupacion/canchas` → tabla con barra proporcional CSS.
- **Panel de reservas por período**: `GET /reportes/reservas/periodo?fecha_inicio&fecha_fin` con selector de rango (2 inputs `type="date"`), rango por defecto precargado y validación client-side del rango.
- Capa adapter `src/api/` sobre `shell/apiClient` para el servicio `reportes` (paths, DTOs, mapeo de errores, incluida la rama **502**).
- `domain/rules.ts`: validación pura del rango de fechas + formateo de porcentajes.
- `hooks/useResource` (copia, ver Decisión 2) y reemplazo del placeholder `RemoteHealthCard`.
- MSW + tests bajo TDD estricto (`pnpm -r test`).
- Delta de spec: retiro de los requisitos de `RemoteHealthCard` en `frontend-remote-modules` (ya no aplica a ningún remote).

### Out of Scope

- Cualquier cambio en `backend/` o `apigateway/` — regla dura del proyecto. El 502 opaco **no se arregla desde acá** (a lo sumo se documenta).
- Cambios en `frontend/apps/shell/` — verificado en exploración: cero necesarios.
- Librería de gráficos (recharts/chart.js), export a CSV/PDF, impresión.
- Reportes que `ms-reportes` no expone (ingresos, ranking de usuarios, ocupación por franja horaria).
- Extraer `packages/shared` en el workspace (ver Decisión 2).
- Auto-refresh / polling / WebSockets.

## Capabilities

### New Capabilities

- `mf-reportes-dashboard`: los 2 paneles de reporte, selector de rango, estados vacío/cero/error y visualización proporcional.
- `mf-reportes-backend-adapter`: paths, DTOs y mapeo de errores contra `ms-reportes`, incluida la semántica del 502 del agregador.

### Modified Capabilities

- `frontend-remote-modules`: los 3 requisitos de `RemoteHealthCard` (identidad, origen federado, trigger de error) quedan sin destinatario — `mf-reportes` era el último placeholder. Se retiran. El aislamiento por `ErrorBoundary` **no se pierde**: ya está especificado y testeado en `frontend-shell-host` ("Per-Remote Error Boundary"), independiente de la tarjeta.

## Approach

| # | Decisión | Rationale |
|---|----------|-----------|
| 1 | **Sin router interno**: una sola vista con 2 paneles apilados, montada por la ruta `/reportes/*` del shell. | Son 2 reportes de solo lectura que el admin quiere ver juntos; un router interno agrega navegación sin información nueva. Divergencia deliberada respecto de `mf-administracion` (allá eran 2 ABM independientes). **Trigger de revisión**: si aparece un tercer reporte o se pide deep-link del rango, se introduce router + query params. |
| 2 | **Tercera copia de `useResource` + `errors.ts`; NO se extrae `packages/shared`.** Se **retira** el trigger de extracción de `mf-administracion` (ADR-02 nombraba a `mf-reportes` como tercer consumidor). | Ese trigger apuntaba a `rules.ts` (RN-04, `toUtcMillis`/`canCancel`) y **`mf-reportes` no consume nada de eso**: no cancela ni compara instantes, solo valida un rango de fechas. Además `mf-reportes` es el ÚLTIMO remote: no hay cuarto consumidor, la extracción no amortiza tocar `pnpm-workspace.yaml`, 4 `tsconfig`, 4 builds y el `shared` de MF. **Nuevo trigger, más honesto**: extraer cuando el API Gateway de Wilson obligue a cambiar la capa HTTP en las 3 apps a la vez. |
| 3 | **502 con rama propia y mensaje honesto**, antes del genérico `>=500`: "No se pudieron obtener los datos de canchas o reservas para armar el reporte", `action: "retry"`. | El backend **no sabe** cuál upstream falló (`except Exception → 502` opaco). Nombrar la disyunción real (canchas *o* reservas) le dice al admin dónde mirar sin inventar un detalle que el backend no tiene. El resto de los 5xx mantiene el mensaje genérico. |
| 4 | **Validación de rango client-side ANTES del request** (`fecha_inicio <= fecha_fin`, función pura), y **aun así** se mapea y muestra el `detail` del 400 del backend. | Evita un round-trip garantizado a fallar y da feedback inmediato; pero el cliente no es la autoridad de validación — defensa en profundidad, mismo criterio que `mf-reservas`. |
| 5 | **Tabla como fuente de verdad, barra CSS proporcional decorativa** (`width: %`, `aria-hidden`). Cero dependencias nuevas de UI. | Mantiene la convención de cero-deps-UI del monorepo y evita el riesgo de singleton federado de una lib de gráficos. La tabla ya es accesible por sí sola; la barra solo agrega lectura rápida. |
| 6 | **Cero ≠ vacío.** Se distingue "no hay canchas cargadas" (estado vacío) de "hay canchas con 0 reservas" (dato válido, se renderiza la fila con barra en 0). | En un reporte el cero **es información**: colapsarlo a "sin datos" oculta justamente la señal que el admin busca (canchas ociosas). |
| 7 | **Rango por defecto precargado** (últimos 30 días) y refetch manual con botón "Actualizar". Sin polling. | Un dashboard debe informar al abrirse, no exigir 2 inputs antes de mostrar nada. Y no hay requisito de tiempo real: pollear un agregador que hace fan-out a 2 microservicios multiplica carga sin beneficio. |

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `frontend/apps/mf-reportes/src/api/` | New | `raw.ts`, `dto.ts`, `mappers.ts`, `reportesApi.ts`, `errors.ts`, `index.ts`. |
| `frontend/apps/mf-reportes/src/domain/rules.ts` | New | Validación de rango, rango por defecto, cálculo de proporción. Funciones puras. |
| `frontend/apps/mf-reportes/src/features/ocupacion/` | New | Tabla + barra proporcional, estados vacío/cero/error. |
| `frontend/apps/mf-reportes/src/features/periodo/` | New | Selector de rango + total, validación y error 400 verbatim. |
| `frontend/apps/mf-reportes/src/hooks/useResource.ts` | New | Copia con comentario cruzado (Decisión 2). |
| `frontend/apps/mf-reportes/src/App.tsx` | Modified | Dashboard de 2 paneles en lugar del placeholder. |
| `frontend/apps/mf-reportes/src/RemoteHealthCard.tsx` | Removed | Placeholder (y su test). |
| `frontend/apps/mf-reportes/{package.json,setupTests.ts}` | Modified | `msw` + `setupServer`. |
| `openspec/specs/frontend-remote-modules/spec.md` | Modified | Delta: se retiran los 3 requisitos de `RemoteHealthCard`. |
| `frontend/apps/shell/**`, `backend/**`, `apigateway/**` | **Sin cambios** | Tocarlos exige justificación explícita en `sdd-design`. |

## Risks

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| 502 opaco: el admin no sabe qué se rompió realmente | Alta | Decisión 3 (mensaje de disyunción honesta + retry). No se puede mitigar más sin tocar backend; se documenta como nota a Cristian si se repite en la demo. |
| Retirar `RemoteHealthCard` elimina el demo en vivo del `ErrorBoundary` para la defensa final | Media | El requisito sigue cubierto por `frontend-shell-host` + sus tests. **Pregunta abierta para `sdd-design`**: si el equipo quiere el demo en vivo, decidir ahí si se conserva un trigger de error dev-only (costo: ~5 LOC) o se demuestra con el test. |
| Tercera copia de `useResource`/`errors.ts` → drift | Media | Comentario cruzado en las 3 copias + nuevo trigger de extracción documentado (Decisión 2). El drift del 502 es deliberado, no accidental. |
| Sin precedente de date-range de 2 inputs en el monorepo (solo fecha única) | Media | Validación aislada en `domain/rules.ts` como función pura, testeada primero (TDD estricto), independiente de la UI. |
| `httpx.AsyncClient()` sin timeout explícito en `ms-reportes` | Baja | Ya mitigado por el timeout de 15s del `apiClient` del shell → cae en `code: "aborted"` con mensaje y retry. |
| MSW como nueva devDep rompe el setup Vitest/jsdom | Baja | Scoped a `mf-reportes`; validar `pnpm -r test` antes de seguir (mismo precedente que `mf-reservas` y `mf-administracion`). |

## Rollback Plan

Todo el cambio vive dentro de `frontend/apps/mf-reportes/` (+ su `package.json`) y el delta de spec. Rollback = `git revert` de los commits de la change y `pnpm install`; vuelve el placeholder y el resto del monorepo queda intacto porque no se toca ni el shell ni los otros remotes. Si el remote rompe en runtime, el `ErrorBoundary` por remote del shell aísla la caída: shell, `mf-reservas` y `mf-administracion` siguen usables sin necesidad de rollback. No hace falta feature flag.

## Dependencies

- `ms-reportes` (:8004) corriendo, y con él `ms-canchas` y `ms-reservas` (es un agregador puro, sin DB propia); proxy `/api/reportes` del shell ya configurado.
- `msw` (nueva devDependency de `mf-reportes`).
- Datos seed: un usuario `rol=administrador`, al menos 2 canchas y reservas no canceladas en distintas fechas — sin volumen, ambos reportes se ven vacíos y no demuestran nada.

## Success Criteria

- [ ] Un `rol=administrador` abre `/reportes` y ve ocupación por cancha con barras proporcionales, contra el backend real.
- [ ] El mismo admin elige un rango y obtiene el total de reservas del período; con `fecha_inicio > fecha_fin` la UI bloquea el request y explica por qué (sin round-trip).
- [ ] Una cancha con 0 reservas se renderiza como fila con barra en 0, distinguible del estado "no hay canchas".
- [ ] Un 502 de `ms-reportes` produce el mensaje de disyunción honesta + acción de reintento, no un "Error 502" crudo ni un detalle inventado.
- [ ] Un `rol=usuario` que navega a `/reportes` sigue cayendo en `/acceso-denegado` (guard del shell intacto, sin diff en `shell/`).
- [ ] Todo path/shape del backend aparece únicamente dentro de `src/api/`.
- [ ] `pnpm -r test` y `pnpm -r build` verdes; `frontend/apps/shell/`, `backend/` y `apigateway/` sin diff.
