# Exploration: mf-reportes (dashboard de reportes admin-only)

## Current State

**Backend `ms-reportes`** (ya implementado, no tocar): 2 endpoints admin-only.
- `GET /reportes/ocupacion/canchas` → `list[{cancha_id, cancha, reservas}]`
- `GET /reportes/reservas/periodo?fecha_inicio&fecha_fin` → `{fecha_inicio, fecha_fin, total_reservas}`, 400 si `fecha_inicio > fecha_fin`

Es un agregador puro (sin DB): pega a ms-canchas y ms-reservas con el token del admin, cuenta reservas no-Canceladas. El `except Exception → 502` en `app/api/reportes.py` es **totalmente opaco**: no distingue cuál microservicio upstream falló ni por qué — siempre el mismo mensaje genérico. No es bloqueante, pero limita el detalle de error que el frontend puede mostrar.

**Shell — hallazgo clave, invierte la hipótesis inicial**: el shell YA está 100% listo para "reportes", cero cambios necesarios:
- `frontend/apps/shell/src/http/types.ts:5` — `ServiceName` ya incluye `"reportes"`.
- `frontend/apps/shell/src/http/client.ts` — `baseUrlFor` es genérico, no necesita wiring por servicio.
- `frontend/apps/shell/src/app/AppRouter.tsx:60-68` — `/reportes/*` ya está anidada bajo `RequireRole rol="administrador"`.
- `frontend/apps/shell/src/app/AppRouter.test.tsx:51` — ya existe un test que cubre ese guard.
- `frontend/apps/shell/rsbuild.config.ts` — remote `mf_reportes` y proxy `/api/reportes` ya declarados.

**mf-reportes**: confirmado 100% placeholder (solo `RemoteHealthCard`, sin `api/`, `domain/`, `hooks/`, `features/`).

## Affected Areas

Todo dentro de `frontend/apps/mf-reportes/src/`: `api/{raw,dto,mappers,reportesApi,errors,index}.ts`, `domain/rules.ts` (validación de rango de fechas), `hooks/{useResource,useAction}.ts` (copiados de mf-administracion, mismo patrón ADR-02), `features/` (2 paneles), `App.tsx`, `mocks/`.

## Approaches (UI)

1. **Tabla + barra CSS proporcional, sin librería de gráficos, date-range nativo** — cero deps nuevas, reutiliza patrones probados (`CanchaFechaPicker`/`ReservasFiltros`). Effort: Low. **Recomendado.**
2. **Agregar recharts/chart.js** — más pulido visualmente pero rompe la convención de cero-deps-UI del monorepo, riesgo de shared-singleton en MF. Effort: Medium-High.
3. **Solo texto/lista** — mínimo esfuerzo pero no transmite "dashboard". Effort: Very Low.

## Recommendation

Opción 1: consistente con `mf-reservas`/`mf-administracion`, sin dependencias nuevas ni riesgo de bundle federado.

## Risks

- 502 opaco en ms-reportes (no distingue servicio que falló).
- `httpx.AsyncClient()` sin timeout explícito en `http_client.py` (mitigado por el timeout de 15s del `apiClient` del shell).
- Validación de rango de fechas es lógica nueva en frontend (no hay precedente de date-range de 2 inputs en otros remotes, solo fecha única).
- Riesgo general bajo: shell no requiere cambios y ya está testeado; backend estable.

## Ready for Proposal

Sí, sin gaps bloqueantes.
