# Exploration: mf-administracion (RN-03 mitad admin + RN-07)

## Current State

**Backend (`ms-canchas`, `ms-reservas`, `ms-usuarios`) — no hay gaps que bloqueen esta change.** A diferencia de `mf-reservas-booking` (que sí necesitó una propuesta a Cristian para `/reservas/disponibilidad`), acá Cristian ya implementó todo lo que RN-03 y RN-07 requieren:

- `backend/ms-canchas/app/api/canchas.py` — CRUD completo: `POST /canchas`, `PUT /canchas/{id}`, `PATCH /canchas/{id}/inactivar`, todos con `Depends(require_admin)`. `GET /canchas` y `GET /canchas/{id}` son públicos (sin auth), correcto para que cualquier usuario autenticado consulte canchas.
- `backend/ms-canchas/app/api/horarios_atencion.py` — mismo patrón: `POST`/`PUT` con `require_admin`, `GET` público.
- `backend/ms-reservas/app/api/reservas.py` + `reserva_service.py::cancelar` — RN-03 ya implementado en el service, no en el router: `GET /reservas/` devuelve **todas** si `rol == "administrador"`, solo las propias si no; `cancelar()` recibe `es_administrador` (derivado del JWT) que bypassea el chequeo de dueño, **pero sigue aplicando RN-04** (no cancelar reservas ya iniciadas) igual para admin que para usuario. No hay atajo que rompa esa regla.
- El claim JWT `rol` es literal `"administrador"` en los 3 microservicios y coincide exacto con `Rol` del shell (`frontend/apps/shell/src/session/types.ts`).
- `backend/ms-usuarios/app/api/usuarios.py` — `GET /usuarios` (admin-only) y `GET /usuarios/{id}` ya existen, útiles para enriquecer nombre de usuario en el panel sin pedir nada nuevo a Cristian.

**Gap detectado (no bloqueante, fuera de literal RN-07)**: `backend/ms-canchas/app/api/deportes.py` — `POST`/`PUT` de deportes **no tienen ninguna dependencia de auth** (ni `get_current_user` ni `require_admin`). Cualquiera, incluso sin token, podría crear/editar deportes. RN-07 habla de canchas + horario de atención, no de deportes, así que no bloquea esta change, pero vale la pena avisarle a Cristian.

**Descubrimiento importante que corrige el CLAUDE.md**: la nota "`GET /reservas/disponibilidad` todavía no existe" está **desactualizada** — el endpoint ya está implementado y funcional (`reservas.py` líneas 147-175, `ReservaService.get_disponibilidad`). Pendiente actualizar esa nota del CLAUDE.md.

**Frontend — shell**: cero trabajo pendiente. La ruta `/administracion/*` ya está envuelta en `<RequireRole rol="administrador">` (`frontend/apps/shell/src/app/AppRouter.tsx:60-69`), redirige a `/acceso-denegado` si el usuario no es admin. `apiClient` (`shell/apiClient`) ya soporta `service: "canchas" | "reservas" | "usuarios"` — `mf-administracion` puede pegarle a los 3 sin tocar el shell ni el proxy de dev.

**Frontend — mf-administracion**: 100% placeholder. `src/App.tsx` solo renderiza `RemoteHealthCard`. No existe `src/api/`, no existe `src/domain/`, no hay router interno pese a que `react-router-dom` ya está en `package.json` (sin usar — probablemente scaffoldeado a propósito para rutas anidadas, igual que se hizo en `mf-reservas`).

## Affected Areas

- `frontend/apps/mf-administracion/src/App.tsx` — hoy placeholder, acá va el router interno (`/administracion/canchas`, `/administracion/reservas`).
- `frontend/apps/mf-administracion/src/api/` (no existe) — capa adapter a crear, siguiendo el patrón de `frontend/apps/mf-reservas/src/api/{raw,dto,mappers,canchasApi,reservasApi,index}.ts`.
- `frontend/apps/mf-administracion/src/domain/rules.ts` (no existe) — reglas puras: reutilizar/adaptar `canCancel`/`hasStarted` de `frontend/apps/mf-reservas/src/domain/rules.ts` (RN-04 aplica igual para admin, sin bypass).
- `frontend/apps/mf-administracion/src/hooks/` (no existe) — replicar `useResource`/`useAction` de `mf-reservas` (decisión ya tomada de no usar TanStack Query).
- `backend/ms-canchas`, `backend/ms-reservas`, `backend/ms-usuarios` — solo lectura, ningún cambio (regla dura del proyecto).

## Approaches

1. **Un solo módulo interno con rutas anidadas por dominio** (`/administracion/canchas` y `/administracion/reservas`, cada uno con su propio `feature/` folder pero un único `api/` compartido por recurso: `canchasApi.ts`, `horariosApi.ts`, `reservasAdminApi.ts`, `usuariosApi.ts` para enrichment)
   - Pros: coherente con que MF solo expone un `./App` único (`rsbuild.config.ts` ya declara `exposes: { "./App": ... }`, no hay caso técnico para 2 remotes); reutiliza patrón probado de `mf-reservas`; un solo build/test suite.
   - Cons: el módulo crece en un solo remote; hay que ser disciplinado con la separación por carpetas para no mezclar dominios.
   - Effort: Medium.

2. **Separar en dos remotes MF** (uno para canchas+horarios, otro para reservas-admin)
   - Pros: aislamiento total de bundles, cada uno podría desplegarse independiente.
   - Cons: complejidad de infraestructura (nuevo puerto, nuevo `rsbuild.config.ts`, nueva entrada en `AppRouter.tsx`, nuevo `.env`) para un beneficio que no se necesita en un proyecto universitario de este tamaño; rompe la convención ya fijada de "3 remotes" documentada en el CLAUDE.md del proyecto.
   - Effort: High.

## Recommendation

Opción 1: un solo `mf-administracion` con router interno y dos features (`canchas` con horarios, y `reservas` con listado+cancelar admin), compartiendo capa `api/` y `domain/rules.ts` con el patrón ya validado en `mf-reservas`. No hay justificación técnica para 2 remotes, y agregar uno rompería la convención de 4 apps fijada en el CLAUDE.md del proyecto.

## Risks

- Enrichment de la lista de reservas (mapear `usuario_id`→nombre, `cancha_id`→nombre) requiere 3 llamadas por vista (`reservas`, `canchas`, `usuarios`) — fan-out client-side, aceptable para el volumen de un proyecto universitario, pero documentar la decisión.
- `GET /reservas/` sin filtros/paginación — admin ve TODAS las reservas de TODOS los usuarios de una sola vez; filtrado tendrá que ser client-side en el MVP.
- `deportes.py` sin auth — no bloquea esta change pero es una inconsistencia de seguridad del backend a mencionar (no a arreglar nosotros).
- `ReservaUpdate` (schema con campo `estado`) existe pero no está wireado a ningún endpoint — no asumir que hay una vía genérica de cambiar estado más allá de `PATCH /cancelar`.

## Ready for Proposal

Sí. No hay gaps de backend que bloqueen RN-03/RN-07 (a diferencia de la disponibilidad de `mf-reservas`, que sí requirió propuesta). Se puede pasar directo a `sdd-propose` con la Opción 1 como base.
