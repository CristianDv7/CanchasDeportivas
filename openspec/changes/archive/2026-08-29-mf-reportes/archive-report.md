# Archive Report: mf-reportes

**Change Name**: mf-reportes
**Archive Date**: 2026-08-29
**Artifact Store Mode**: hybrid (openspec files + Engram, project: CanchasDeportivas)
**Status**: ARCHIVED — Change complete and closed

---

## Executive Summary

Change `mf-reportes` (admin-only reports dashboard: ocupación por cancha + reservas por período) has completed the full SDD cycle — proposal → explore → spec → design → tasks → apply → verify → archive — with `sdd-verify` returning PASS WITH WARNINGS (0 CRITICAL issues in the actual code; the 2 CRITICAL findings were process-artifact hygiene, both corrected by the orchestrator before this archive ran). Code is pushed to `main` (commit `1504e2c`). Two new capability specs and one spec delta have been synced to `openspec/specs/`, and the full change folder has been copied to the archive directory.

---

## Traceability — Engram Observation IDs

| Artifact | Engram Topic Key | Observation ID | Notes |
|---|---|---|---|
| Proposal | `sdd/mf-reportes/proposal` | #106 | |
| Spec | `sdd/mf-reportes/spec` | #108 | |
| Design | `sdd/mf-reportes/design` | #109 | |
| Tasks | `sdd/mf-reportes/tasks` | #110 | Engram mirror still shows 0/38 `[ ]` (saved before the post-verify correction); the on-disk `tasks.md` is the corrected source of truth (38/38 `[x]`) and is what was archived. Not re-synced to Engram in this phase — flagged below as a minor risk. |
| Verify Report | `sdd/mf-reportes/verify-report` | #112 | |
| Apply Progress | `sdd/mf-reportes/apply-progress` | #113 | Saved by the orchestrator after verify, before archive — corrects the missing apply-progress CRITICAL finding. |
| This Archive Report | `sdd/mf-reportes/archive-report` | (saved by this phase) | |

---

## Implementation Summary

### Capabilities Delivered

1. **mf-reportes-dashboard**: Admin-only 2-panel dashboard, no internal router:
   - **Ocupación por cancha**: table + proportional CSS bar (relative to set max, `NaN`/`Infinity` guarded when all values are 0); distinguishes "no canchas cargadas" (real empty state) from a cancha with `reservas: 0` (valid data, rendered as a 0%-width row).
   - **Reservas por período**: 2 `type="date"` inputs with draft/applied state split, default range preloaded (last 30 days, auto-fetched on mount without `enabled` gating), manual "Actualizar" refetch (no polling), client-side range validation (`fecha_inicio <= fecha_fin`) blocking the round-trip before it happens.

2. **mf-reportes-backend-adapter**: Isolated adapter layer in `src/api/`:
   - Shape mapping: snake_case raw responses → camelCase DTOs (`OcupacionCancha[]`, `ReservasPeriodo`), `reservas: 0` preserved, never filtered.
   - Error mapping by `status` only: dedicated 502 branch ("No se pudieron obtener los datos de canchas o reservas para armar el reporte", `action:"retry"`) kept separate from the generic `>=500` branch; 400 shows backend `detail` verbatim with `action:"none"`.
   - All backend paths/raw shapes contained in `src/api/raw.ts`, never imported outside `src/api/` (verified by search, task 8.3).

### Modified Capability

- **frontend-remote-modules**: the 3 `RemoteHealthCard` requirements (identity display, federation origin display, simulated error trigger) were retired — `mf-reportes` was the last remote still mounting the placeholder. Per-remote `ErrorBoundary` isolation is unaffected; it remains specified and tested independently under `frontend-shell-host`.

### Files Created/Modified (within `frontend/apps/mf-reportes/` only)

| Path | Action |
|---|---|
| `src/api/{raw,dto,mappers,reportesApi,errors,index}.ts` | Create |
| `src/domain/rules.ts` | Create (`isValidFecha`, `validarRangoFechas`, `rangoPorDefecto`, `calcularMaxReservas`, `calcularProporcion`) |
| `src/hooks/useResource.ts` | Create (third copy, cross-referenced comment; no `useAction` — both endpoints are GET) |
| `src/components/ErrorBanner.tsx` | Create |
| `src/features/ocupacion/OcupacionCanchasPanel.tsx` | Create |
| `src/features/periodo/{ReservasPeriodoPanel,RangoFechasPicker,useReservasPeriodo}.tsx/.ts` | Create |
| `src/mocks/{handlers,server,session,fixtures}.ts` | Create (MSW) |
| `src/App.tsx` | Modify — replaces `RemoteHealthCard` with the 2 stacked panels, no `<Routes>` |
| `src/RemoteHealthCard.{tsx,css,test.tsx}` | Delete |
| `package.json`, `setupTests.ts`, `vitest.config.ts` | Modify (`msw` devDependency, server lifecycle, jsdom URL) |
| `openspec/specs/frontend-remote-modules/spec.md` | Modify (delta applied directly during apply phase, task 8.4) |

### Out of Scope (Confirmed Unchanged)

`frontend/apps/shell/`, `backend/`, `apigateway/` — zero diff confirmed by `git diff --stat cd1087e 1504e2c` (37 files touched, all under `frontend/apps/mf-reportes/` + `frontend/pnpm-lock.yaml`).

---

## Verification & Build Status

**Overall Result**: PASS WITH WARNINGS (0 CRITICAL in code; process-artifact CRITICALs resolved pre-archive)

- **Build**: PASSED — `pnpm -r build`, exit 0, all 4 apps
- **Typecheck**: PASSED — `pnpm --filter mf-reportes typecheck`, 0 errors
- **Tests**: PASSED — 293/293 (shell 65, mf-reservas 85, mf-administracion 99, mf-reportes 44)
- **Spec Compliance**: 15/16 scenarios fully compliant, 1/16 partial (no direct `App.tsx` render test asserting both panels mount together — low severity, each panel individually tested, `App.tsx` itself trivial and source-verified)
- **Design Coherence**: all 7 ADRs (ADR-01..07) followed 1:1, verified against real source
- **Correctness**: all 8 structural checks (502 branch isolation, cero≠vacío, pure date validation, division-by-zero guard, router-less App.tsx, RemoteHealthCard removal, delta applied, scope confinement) implemented and verified against actual code

### Issues Found & Resolution

**CRITICAL (both resolved before this archive ran)**:
1. `tasks.md` had 0/38 boxes checked at verify time despite complete implementation → corrected to 38/38 `[x]` by the orchestrator; confirmed on disk in this phase.
2. No `sdd/mf-reportes/apply-progress` existed in Engram → saved by the orchestrator as observation #113 before archive.

**WARNING (not blocking, documented for future work)**:
1. No literal `<App />` render test asserting both panel titles appear together — recommend adding a trivial integration test in a future small change if this remote is revisited.
2. Pre-existing MF DTS `tsc --listFilesOnly` rootDir build warning in `mf-administracion`/`mf-reservas` (not `mf-reportes`, not introduced by this change).

**SUGGESTION**: no dedicated `reportesApi.ts` integration test isolated from the panels — deliberately deferred to Phase 6/7 coverage per tasks.md 2.6, a pre-accepted tradeoff.

---

## Specs Synced to Main Repository

### 1. `openspec/specs/mf-reportes-dashboard/spec.md` — Created (new spec)

4 requirements / 11 scenarios: Panel de ocupación por cancha, Panel de reservas por período, Validación de rango de fechas antes del request, Vista única sin router interno.

### 2. `openspec/specs/mf-reportes-backend-adapter/spec.md` — Created (new spec)

3 requirements / 6 scenarios: Mapeo de ocupación por cancha a DTO, Mapeo de reservas por período a DTO, Mapeo de errores por status con rama propia para 502.

### 3. `openspec/specs/frontend-remote-modules/spec.md` — Delta merged (already applied during apply, task 8.4; confirmed during this archive)

3 requirements REMOVED (RemoteHealthCard Identity Display, Federation Origin Display, Simulated Error Trigger). The live main spec's Purpose section now reads: "All 3 have replaced the `RemoteHealthCard` placeholder with real features... No remote renders `RemoteHealthCard` anymore." Verified no residual reference to the placeholder remains in the main spec.

---

## Archive Structure

**Source**: `openspec/changes/mf-reportes/`
**Destination**: `openspec/changes/archive/2026-08-29-mf-reportes/`

```
openspec/changes/archive/2026-08-29-mf-reportes/
├── proposal.md
├── exploration.md
├── design.md
├── tasks.md (38/38 complete)
├── verify-report.md (PASS WITH WARNINGS, process CRITICALs resolved)
├── specs/
│   ├── mf-reportes-dashboard/spec.md
│   ├── mf-reportes-backend-adapter/spec.md
│   └── frontend-remote-modules/spec.md (delta, already applied to main)
└── archive-report.md (this file)
```

**Known tooling limitation**: this `sdd-archive` execution had no shell/delete tool available, only Read/Write/Edit/Glob. The archive folder above was created by copying every artifact's full content; the original `openspec/changes/mf-reportes/` folder was **not deleted** (no delete capability in this session). This matches the exact precedent already present in this repo for the two prior archives (`openspec/changes/mf-reservas-booking/` and `openspec/changes/mf-administracion/` both still exist alongside their `archive/2026-08-2{7,8}-...` copies) — this is a pre-existing pattern in this project, not a regression introduced here. Recommend the orchestrator or user manually remove `openspec/changes/mf-reportes/`, `openspec/changes/mf-reservas-booking/`, and `openspec/changes/mf-administracion/` in a follow-up cleanup commit if a single source of truth per change is desired.

---

## Operational Note on the Apply/Push Sequence

The `sdd-apply` sub-agent for this change implemented all 38 tasks correctly but was cut off by a session limit **before** marking `tasks.md` complete and before saving `apply-progress` to Engram — this is the root cause of both CRITICAL findings in the verify report. The user (Brando) committed and pushed the on-disk work directly (commit `1504e2c`, "Subiendo cambios en carpeta frontend") while the sub-agent was still cut off — **the orchestrator did not perform that push**. Content was independently confirmed to be 100% scoped to `frontend/apps/mf-reportes/` + `frontend/pnpm-lock.yaml`, nothing out of scope. The orchestrator then corrected both process gaps (`tasks.md` checkboxes, `apply-progress` save) after an independent re-verification of `pnpm -r test`/`typecheck`/`build`, before requesting this archive.

---

## Success Criteria Check

| Criterion | Status |
|---|---|
| Admin abre `/reportes` y ve ocupación con barras proporcionales, backend real | PASS |
| Admin elige rango, obtiene total; rango inválido bloquea sin round-trip | PASS |
| Cancha con 0 reservas se distingue de "no hay canchas" | PASS |
| 502 produce mensaje de disyunción honesta + retry | PASS |
| `rol=usuario` sigue cayendo en `/acceso-denegado`, sin diff en shell | PASS (shell untouched, guard pre-existing and tested) |
| Todo path/shape del backend solo en `src/api/` | PASS |
| `pnpm -r test`/`build` verdes; sin diff en shell/backend/apigateway | PASS |

---

## Known Gaps (Documented, Non-Blocking)

1. 502 opaco en `ms-reportes` (no distingue qué microservicio upstream falló) — no se puede mitigar más desde frontend; documentado como nota a Cristian si se repite en la demo.
2. Tercera copia de `useResource`/`errors.ts` (no `packages/shared` extraction) — trigger de extracción reubicado a "cuando el Gateway de Wilson obligue a cambiar la capa HTTP en las 3 apps a la vez."
3. Engram mirror `sdd/mf-reportes/tasks` (#110) still reflects the stale 0/38 `[ ]` state saved during apply; the on-disk `tasks.md` (38/38 `[x]`) is authoritative and is what was archived. Not re-synced to Engram in this phase — low-risk, informational only, since the archived file and this report both carry the correct state.

---

## Rollback & Safety

**Rollback Plan**: `git revert` of the change's commits + `pnpm install` (all changes scoped to `mf-reportes/`; shell/backend/apigateway untouched). Per-remote `ErrorBoundary` in the shell isolates any runtime failure in `mf-reportes` from the rest of the system — no rollback needed for that failure mode.

---

## SDD Cycle Complete

All planning, implementation, testing, and verification phases are closed for `mf-reportes`. Delta specs have been merged to main repository specs (`openspec/specs/mf-reportes-dashboard/`, `openspec/specs/mf-reportes-backend-adapter/`, `openspec/specs/frontend-remote-modules/`). No follow-up tasks remain for this change itself.

**Next Change Candidates**: connect the frontend to Wilson's API Gateway once ready, or start a new change for cross-cutting concerns (e.g. `packages/shared` extraction, if/when the Gateway forces a shared HTTP layer change across the 3 remotes).

---

**Archived by**: sdd-archive executor
**Artifact Store**: hybrid (openspec files + Engram)
**Topic Key for Engram**: `sdd/mf-reportes/archive-report`
