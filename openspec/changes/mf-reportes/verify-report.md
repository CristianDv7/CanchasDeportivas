# Verification Report

**Change**: mf-reportes
**Version**: N/A
**Mode**: Strict TDD

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 38 |
| Tasks complete | 0 (checkbox state) / 38 (actual code state) |
| Tasks incomplete | 38 (checkbox state, all `[ ]`) |

**CRITICAL discrepancy**: `openspec/changes/mf-reportes/tasks.md` (and its Engram mirror `sdd/mf-reportes/tasks`, saved 2026-08-29 03:49:12) has **all 38 checkboxes still `[ ]`**, despite every file the task list describes existing in commit `1504e2c` and every corresponding test passing. The implementation is functionally complete but the task-tracking artifact was never updated to reflect it. Additionally, no `sdd/mf-reportes/apply-progress` observation exists in Engram at all — `sdd-apply` never persisted a progress artifact for this change, breaking the read contract `sdd-verify` is supposed to rely on (I fell back to reading tasks.md + source directly).

---

### Build & Tests Execution

**Build**: ✅ Passed (`pnpm -r build`, exit 0, all 4 apps built; the `tsc --listFilesOnly` rootDir warning in mf-administracion/mf-reservas is pre-existing MF DTS tooling noise, not introduced by this change and not present for mf-reportes)

**Tests**: ✅ 293 passed / 0 failed / 0 skipped (`pnpm -r test`, exit 0)
- shell: 65 passed (11 files)
- mf-reservas: 85 passed (14 files)
- mf-administracion: 99 passed (13 files)
- mf-reportes: 44 passed (8 files)

**Typecheck**: ✅ `pnpm --filter mf-reportes typecheck` → `tsc --noEmit`, exit 0, 0 errors

**Coverage**: Not available (no coverage tool configured in this workspace) — Not available

---

### Spec Compliance Matrix

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Panel de ocupación por cancha | Ocupación con datos | `OcupacionCanchasPanel.test.tsx > "3 canchas con distintas cantidades de reservas → 3 filas, barra proporcional al máximo"` | ✅ COMPLIANT |
| Panel de ocupación por cancha | Cancha con 0 reservas se distingue del estado vacío | `OcupacionCanchasPanel.test.tsx > "cancha con reservas: 0 entre otras con reservas → fila en 0%, no se omite"` | ✅ COMPLIANT |
| Panel de ocupación por cancha | Estado vacío real | `OcupacionCanchasPanel.test.tsx > "lista vacía real → mensaje distinto de 'no hay canchas cargadas'"` | ✅ COMPLIANT |
| Panel de ocupación por cancha | Error 502 en ocupación | `OcupacionCanchasPanel.test.tsx > "502 → mensaje de disyunción honesta con acción de reintento"` | ✅ COMPLIANT |
| Panel de reservas por período | Total del rango por defecto al abrir | `ReservasPeriodoPanel.test.tsx > "al montar, dispara la consulta con el rango por defecto y muestra el total"` | ✅ COMPLIANT |
| Panel de reservas por período | Refetch manual con nuevo rango válido | `ReservasPeriodoPanel.test.tsx > "click en Actualizar con rango válido dispara un único fetch con el rango aplicado"` | ✅ COMPLIANT |
| Panel de reservas por período | Error 400 verbatim | `ReservasPeriodoPanel.test.tsx > "400 muestra el detail verbatim, sin reintento automático"` | ✅ COMPLIANT |
| Panel de reservas por período | Error 502 en período | `ReservasPeriodoPanel.test.tsx > "502 muestra el mismo mensaje de disyunción honesta con acción de reintento"` | ✅ COMPLIANT |
| Validación de rango de fechas | Rango inválido bloquea el request | `ReservasPeriodoPanel.test.tsx > "botón Actualizar deshabilitado cuando el rango en draft es inválido"` + `rules.test.ts > "rango invertido ⇒ false"` | ✅ COMPLIANT |
| Validación de rango de fechas | Rango válido no se bloquea | `rules.test.ts > "rango normal (fechaInicio < fechaFin) ⇒ true"` + `ReservasPeriodoPanel.test.tsx` (habilitado por defecto) | ✅ COMPLIANT |
| Vista única sin router interno | Ambos paneles visibles en una sola navegación | `App.tsx` (source read) — no automated render test exercises `App.tsx` directly, only its 2 children individually | ⚠️ PARTIAL |
| Mapeo de ocupación por cancha a DTO | Mapeo exitoso + reservas:0 preservado | `mappers.test.ts` (2.1) | ✅ COMPLIANT |
| Mapeo de reservas por período a DTO | Mapeo exitoso | `mappers.test.ts` (2.2) | ✅ COMPLIANT |
| Mapeo de errores por status | 400 con detail verbatim | `errors.test.ts > "400: detail verbatim + action none"` | ✅ COMPLIANT |
| Mapeo de errores por status | 502 con mensaje de disyunción honesta | `errors.test.ts > "502: mensaje de disyunción honesta + action retry, distinto del genérico >=500"` | ✅ COMPLIANT |
| Mapeo de errores por status | network/otros 5xx con reintento genérico | `errors.test.ts > ">=500 distinto de 502..."` + `"status 0 + code network..."` | ✅ COMPLIANT |

**Compliance summary**: 15/16 scenarios fully compliant, 1/16 partial (no direct `App.tsx` render test — low severity, covered transitively).

---

### Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| 502 opaco (rama separada del `>=500` genérico) | ✅ Implemented | `api/errors.ts` L37-45 has a standalone `if (status === 502)` branch before the generic `if (status >= 500 ...)` at L47, distinct message, never reuses genérico text |
| Cero ≠ vacío | ✅ Implemented | `OcupacionCanchasPanel.tsx` renders the empty message only on `status==="success" && data.length===0` (L22-24); the `data.length > 0` branch (L26) always renders every row including `reservas:0`, bar included at `0%` |
| Validación de rango de fechas pura, sin reloj real | ✅ Implemented | `domain/rules.ts::validarRangoFechas` is a pure lexicographic string comparison, no `Date`/`Date.now()`; `rangoPorDefecto` takes `hoy` as an injectable parameter, tests (`rules.test.ts` L44-53) construct fixed `Date` objects, no real clock touched |
| División por cero en la barra proporcional | ✅ Implemented | `calcularProporcion` guards `maxReservas <= 0 → 0` (L71) before dividing; covered by `rules.test.ts` L67-71 |
| Vista única sin router interno | ✅ Implemented | `App.tsx` mounts both panels directly, no `<Routes>`/`<Router>` import; comment explicitly documents why no sub-nav fix (`cd1087e`) applies here |
| `RemoteHealthCard` deleted | ✅ Implemented | `fd RemoteHealthCard frontend/apps/mf-reportes` returns no results; `.tsx/.css/.test.tsx` all removed in commit `1504e2c` (diffstat shows 3 deletions, 0 insertions) |
| `frontend-remote-modules` delta applied | ✅ Implemented | Live `openspec/specs/frontend-remote-modules/spec.md` no longer requires `RemoteHealthCard` for any remote; delta file present at `openspec/changes/mf-reportes/specs/frontend-remote-modules/spec.md` |
| Scope confined to `frontend/` | ✅ Implemented | `git diff --stat cd1087e 1504e2c` shows only files under `frontend/apps/mf-reportes/` + `frontend/pnpm-lock.yaml` (37 files, 1416(+)/238(-)) — no `backend/`/`apigateway/` touched |

---

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| ADR-01 (barra relativa al máximo, guard NaN/Infinity) | ✅ Yes | `calcularMaxReservas`/`calcularProporcion` exactly as specified |
| ADR-02 (comparación lexicográfica de fechas, sin `toUtcMillis`) | ✅ Yes | `validarRangoFechas` is a plain string `<=` comparison |
| ADR-03 (draft/aplicado, botón "Actualizar", sin auto-fetch por tecleo) | ✅ Yes | Confirmed by `ReservasPeriodoPanel.test.tsx` "click en Actualizar... dispara un único fetch" — typing alone does not increment `calls` |
| ADR-04 (`rangoPorDefecto` sin `enabled`, dispara al montar) | ✅ Yes | `ReservasPeriodoPanel.test.tsx` "al montar, dispara la consulta con el rango por defecto" |
| ADR-05 (502 propio, 400→`action:"none"`) | ✅ Yes | `errors.ts` matches table exactly |
| ADR-06 (3-state empty/zero/populated in Ocupación) | ✅ Yes | `OcupacionCanchasPanel.tsx` |
| ADR-07 (`isValidFecha` copied verbatim from mf-reservas, applied to both inputs) | ✅ Yes | `domain/rules.ts` comment cross-references mf-reservas; used in `RangoFechasPicker.tsx` per design |
| File Changes table (design.md §4) | ✅ Yes | All listed files created/modified/deleted exactly as planned; no extra untracked deviation inside `mf-reportes/` |

---

### Issues Found

**CRITICAL** (must fix before archive):
1. `openspec/changes/mf-reportes/tasks.md` has 0/38 boxes checked despite the implementation being complete and verified working — the task-tracking artifact does not reflect reality. This must be corrected (mark all 38 `[x]`) before archive, since `sdd-archive` and any future audit will read this file as the source of truth for "what was actually done."
2. No `sdd/mf-reportes/apply-progress` artifact exists in Engram. `sdd-apply`'s required write (per `sdd-phase-common.md` Section C and the phase contract table) was skipped entirely for this change — there is no persisted record of batch-by-batch apply progress, only the final tasks.md snapshot (itself unchecked) and the git commit. This breaks continuity if this change needed a resumed/partial apply in the future, and breaks the `sdd-verify` read contract, which expects to read apply-progress as one of its 3 required inputs.

**WARNING** (should fix):
1. No test directly renders `App.tsx` to assert both panels appear together in one navigation (Requirement "Vista única sin router interno", scenario "Ambos paneles visibles en una sola navegación"). Coverage is only indirect (each panel is tested in isolation, and `App.tsx` is trivial/inspectable by reading), but a literal render of `<App />` asserting both `h2` titles present would close this gap with near-zero cost.
2. Pre-existing MF DTS `tsc --listFilesOnly` rootDir warning appears in `mf-administracion`/`mf-reservas` builds (not `mf-reportes`) — not introduced by this change, but worth flagging since it was visible in the same `pnpm -r build` run this verification relied on.

**SUGGESTION** (nice to have):
1. `mappers.test.ts`/`reportesApi.ts` have no dedicated integration test hitting the real `reportesApi.ocupacionCanchas`/`reservasPeriodo` functions in isolation from the panels (tasks.md 2.6 explicitly deferred this to Phase 6/7 integration coverage, which is honored — this is a pre-accepted design tradeoff, not a new finding, listed here only for completeness).

---

### Verdict
**PASS WITH WARNINGS**

The implementation is behaviorally correct, fully tested (293/293 passing), typechecks and builds cleanly, and matches every spec scenario and every sensitive design decision (502 branch, zero≠empty, pure date validation, division-by-zero guard, router-less App.tsx, RemoteHealthCard removal, scope confined to `frontend/`) verified against real source code — not assumptions. The only blockers to a clean PASS are process-artifact hygiene: `tasks.md` was never checked off and no `apply-progress` was persisted to Engram, both of which must be corrected before `sdd-archive` runs, so the audit trail matches what was actually shipped.
