# Verification Report

**Change**: mf-reservas-booking
**Version**: N/A (openspec, no semantic version field)
**Mode**: Strict TDD (test runner: `pnpm -r test` desde `frontend/`)

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 36 (10 fases) |
| Tasks complete | 36 |
| Tasks incomplete | 0 |

Todas las tareas de `tasks.md` están marcadas `[x]`. No hay tareas core ni de limpieza pendientes.

---

## Build & Tests Execution

**Build**: PASSED — `pnpm -r build` desde `frontend/`, exit 0, 4 apps (shell, mf-administracion, mf-reportes, mf-reservas) compiladas sin error.

**Typecheck**: PASSED — `pnpm --filter mf-reservas typecheck` (`tsc --noEmit`), exit 0, 0 errores.

**Tests**: PASSED — `pnpm -r test` desde `frontend/`, exit 0.

| App | Test files | Tests |
|---|---|---|
| shell | 11 | 65 passed |
| mf-administracion | 1 | 6 passed |
| mf-reportes | 1 | 6 passed |
| mf-reservas | 12 | 67 passed |
| **Total** | **25** | **144 passed / 0 failed / 0 skipped** |

Los stack traces de `Error: caído` / `Error forzado desde RemoteHealthCard` visibles en el output son intencionales (tests de `ErrorBoundary` que fuerzan el error) — no son fallos reales; el conteo final de cada suite confirma 100% verde.

**Coverage**: no disponible (no hay tooling de coverage configurado en el repo) — no bloqueante, `rules.verify.coverage_threshold` no está seteado en `openspec/config.yaml`.

---

## Scope Check (git status/diff)

`git status --porcelain` NO muestra ningún cambio en `backend/`, `apigateway/`, ni `frontend/apps/shell/`. Todo el diff de trabajo vive dentro de `frontend/apps/mf-reservas/` (+ `openspec/`, `docs/`, `.atl/`, `CLAUDE.md` como artefactos de proceso). Confirmado: el scope de la change se respetó.

---

## Spec Compliance Matrix (muestreo verificado línea por línea, no solo por nombre)

| Requirement | Scenario | Test | Result |
|---|---|---|---|
| Ver disponibilidad | Grilla muestra libres y ocupados | `DisponibilidadPage.test.tsx > "muestra la grilla..."` | COMPLIANT — verificado contra `BloquesGrid.tsx`: renderiza `data-estado` tal cual devuelve el adapter |
| Ver disponibilidad | Cancha sin horario ese día → grilla vacía sin error | `DisponibilidadPage.test.tsx > "cancha sin horario..."` | COMPLIANT — `BloquesGrid` retorna `data-testid="bloques-grid-vacia"` cuando `bloques.length === 0`, test confirma explícitamente `queryByRole("alert")` ausente |
| Manejo de errores al reservar | 400 → detail verbatim + refetch disponibilidad | `NuevaReservaPage.test.tsx > "400 al crear..."` | COMPLIANT — test cuenta llamadas reales a `/disponibilidad` (1→2) y verifica limpieza de selección, no solo el mensaje |
| Manejo de errores al reservar | 403/404/422 → mensaje propio, sin refetch | `NuevaReservaPage.test.tsx` (3 tests) | COMPLIANT — cada test confirma `disponibilidadCalls` permanece en 1 |
| Cancelar reserva (RN-04) | Bloqueada por bloque ya iniciado (reloj congelado) | `MisReservasPage.test.tsx > "RN-04: ...ya inició"` | COMPLIANT — usa `vi.setSystemTime`, delega en `canCancel` real de `domain/rules.ts` (no un mock) |
| Cancelar reserva | Bloqueada por estado ≠ Confirmada | `MisReservasPage.test.tsx > "RN-04: ...no es Confirmada"` | COMPLIANT |
| Badges de estado (RN-08) | Badge por estado (3 estados) | `MisReservasPage.test.tsx > "muestra el badge..."` | COMPLIANT — incluye `Finalizada` |
| Límite de reservas activas (RN-06) | Contador visible, no bloqueante | `NuevaReservaPage.test.tsx > "contador RN-06..."` | COMPLIANT — verifica botón habilitado explícitamente |
| Mapeo de shape crudo a DTO | reservasApi mapea ReservaResponse | `mappers.test.ts > toReserva` | COMPLIANT — incluye descarte de timestamps y `estado` desconocido → `null` |
| Mapeo de errores por status | 400 con code unknown → refetch por status, no por code | `errors.test.ts > "400 (incl. code 'unknown')..."` | COMPLIANT — fabrica `ApiError` con `code:"unknown"` a propósito |
| Mapeo de errores por status | 403/404 mensaje propio | `errors.test.ts` (2 tests) | COMPLIANT |
| Mapeo de errores por status | 422 aplanado | `errors.test.ts > "422..."` | COMPLIANT |
| Mapeo de errores por status | network/server retry | `errors.test.ts` (2 tests: 5xx, network) | COMPLIANT |

**Compliance summary**: 13/13 escenarios muestreados COMPLIANT (muestreo representativo de las ~19 escenarios totales de ambas specs; el resto sigue el mismo patrón de test-por-escenario 1:1 verificado en `tasks.md`).

---

## Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|---|---|---|
| Ver disponibilidad | Implemented | `reservasApi.getDisponibilidad` aislado, mockeado con MSW |
| Crear reserva | Implemented | `usuario_id` viene de `session.user.id` vía `toReservaCreateBody`, nunca del form |
| Manejo de errores | Implemented | `mapApiError` cubre las 9 filas de la tabla (incluye 401/5xx/network/aborted, superset de lo pedido por spec) |
| Cancelar reserva RN-03/04/05 | Implemented | `canCancel` puro, `ReservaRow` delega 100% en él |
| Badges de estado RN-08 | Implemented | `estadoBadge`/`EstadoBadge.tsx`, incluye `Finalizada` sin dato real que la produzca (documentado) |
| Límite RN-06 informativo | Implemented | `contarActivas`, no bloquea submit |
| Mapeo shape→DTO | Implemented | `mappers.ts`, 1:1 con design.md §2 |
| Mapeo errores por status | Implemented | `errors.ts`, 1:1 con design.md §3 |

---

## Coherence (Design)

| Decision | Followed? | Notes |
|---|---|---|
| Adapter aislado en `src/api/` | Yes | `raw.ts` no se importa fuera de `src/api/` (verificado con búsqueda exhaustiva, ver Layer Rule abajo) |
| Fechas/horas como strings + `Date.UTC` explícito | Yes | `toUtcMillis` en `domain/rules.ts`, comentario "GOTCHA DELIBERADO" presente |
| `mapApiError` decide por `status`, no `code`/`detail` | Yes | Test dedicado con `code:"unknown"` en 400 |
| Sin TanStack Query — `useResource`/`useAction` propios | Yes | Firmas y semántica (`AbortController`, `fetcherRef`, `version`) idénticas a design.md §4 |
| MSW como devDependency scoped a `mf-reservas` | Yes | `pnpm -r test` corre las 4 apps sin que MSW afecte shell/mf-administracion/mf-reportes |
| RN-04 espejo duro / RN-06 informativo | Yes | `canCancel` bloquea submit vía UI de cancelar; RN-06 solo contador, botón crear queda habilitado |
| Endpoint `getDisponibilidad` aislado a propósito (plan B diferido) | Yes | Sin `getHorariosAtencion` implementado — consistente con la decisión explícita de NO escribir "código que probablemente se tira" |

### Layer Rule (`api/raw.ts` no se importa fuera de `src/api/`)

Verificado con búsqueda exhaustiva sobre `frontend/apps/mf-reservas/src` excluyendo `api/`:
- Cero imports de `ReservaRaw`/`CanchaRaw`/`BloqueRaw`/`DisponibilidadRaw` fuera de `src/api/`.
- El fix de Fase 9.3 (`MisReservasPage.test.tsx` importaba `ReservaRaw` directo) quedó correctamente resuelto: `mocks/fixtures.ts` ahora deriva `ReservaRawFixture` estructuralmente (`(typeof reservasRaw)[number]`) sin import cruzado.
- Los únicos usos de `shell/apiClient` fuera de `api/` son en archivos de test de infraestructura (`hooks/useAction.test.ts` para el tipo `ApiError`, `mocks/session.test.ts` para probar que `seedSession` hace que `apiClient` vea el request) — no violan la regla de capas de `features/`, que es la que design.md §1 restringe explícitamente.
- No se encontró ninguna otra violación similar en el resto del código.

---

## Issues Found

**CRITICAL** (must fix before archive): None.

**WARNING** (should fix):
1. **Discrepancia en la caracterización del gap conocido (contrato del endpoint pendiente).** El mensaje de invocación de esta verificación afirma que el gap documentado es `GET /horarios-atencion` no implementado. Esto es **incorrecto** respecto a los artefactos reales: `proposal.md`, `design.md` §1/§7/§12 y el código (`reservasApi.getDisponibilidad`) documentan consistentemente que el endpoint real y bloqueante es **`GET /reservas/disponibilidad`** (propuesto a Cristian, no implementado en `ms-reservas`, mockeado con MSW). `GET /horarios-atencion` aparece solo como el **plan B** hipotético (si Cristian no entrega el endpoint propuesto) — nunca fue codificado (no existe `getHorariosAtencion` en `canchasApi.ts`, cero referencias en todo `mf-reservas/src`). Adicionalmente, el escenario de `specs/mf-reservas-backend-adapter/spec.md` ("canchasApi mapea disponibilidad y horarios") menciona ambos endpoints como si el adapter mapeara los dos activamente, cuando en la práctica solo `getDisponibilidad` (`/reservas/disponibilidad`) está implementado; el mapeo de `/horarios-atencion` es una capacidad *potencial* del mapper genérico (`toDisponibilidad` acepta cualquier `DisponibilidadRaw`), no una llamada real. Recomendación: al archivar, ajustar la redacción de ese escenario de spec para reflejar que `/horarios-atencion` es plan B no implementado, evitando que quien lea el spec crea que ambos endpoints están activos hoy.
2. El conteo de tareas mencionado en la invocación (58 tareas) no coincide con `tasks.md` real (36 tareas `[x]` en 10 fases). No afecta el veredicto — 100% de las tareas reales están completas — pero vale la corrección para evitar arrastrar el número incorrecto al archive-report.

**SUGGESTION** (nice to have):
1. Sin coverage tooling configurado — no bloqueante a esta escala (67 tests, TDD estricto ya fuerza cobertura por diseño), pero si el proyecto crece podría valer la pena agregar `@vitest/coverage-v8` para tener una métrica objetiva.
2. El gap de `GET /reservas/disponibilidad` es real, está bien documentado (`proposal.md` §Intent, `design.md` §7/§12, comentarios en `reservasApi.ts`) y NO bloquea el resto de la funcionalidad: la pantalla de Disponibilidad consume `reservasApi.getDisponibilidad` (adapter propio, mockeado), que es una función completamente distinta e independiente de un futuro `GET /horarios-atencion`. Confirmado que no hay confusión de contrato en el código — la única confusión detectada está en la caracterización que llegó en el mensaje de invocación de este verify (ver WARNING #1), no en los artefactos del proyecto.

---

## Verdict

**PASS WITH WARNINGS (no bloqueantes)**

Implementación completa, tests reales ejecutados y verdes (144/144), build y typecheck limpios, capa de aislamiento del adapter respetada, diseño seguido 1:1 en las interfaces clave (DTOs, `mapApiError`, `useResource`/`useAction`, `canCancel`). El único gap real (`GET /reservas/disponibilidad` no implementado en backend) está documentado explícitamente y no bloquea el resto del flujo. Las únicas observaciones son de **caracterización/redacción** (qué endpoint es el gap, y el conteo de tareas), no de código faltante o roto. Listo para `sdd-archive`.
