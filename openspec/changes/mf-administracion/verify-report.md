# Verification Report — mf-administracion

**Change**: mf-administracion
**Version**: N/A (frontend-only, no semver)
**Mode**: Strict TDD (verified independently, execution-based)
**Verified by**: sdd-verify (independent run, not trusting sdd-apply's self-report)

---

### Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 53 |
| Tasks complete | 53 |
| Tasks incomplete | 0 |

All 53 tasks across 11 phases in `tasks.md` are marked `[x]`. Cross-checked against actual files on disk (`src/api`, `src/domain`, `src/hooks`, `src/components`, `src/features/{canchas,reservas}`, `src/mocks`) — all exist and match the task descriptions.

---

### Build & Tests Execution (run independently, not copied from apply's report)

**Build**: ✅ Passed (`pnpm -r build`, 4/4 apps — `ready built`)
Pre-existing, unrelated Module Federation DTS warnings on `shell` and `mf-reservas` (`tsc --listFilesOnly` rootDir complaint) — present before this change, not introduced by it, and do not fail the build.

**Tests**: ✅ 241 passed / 0 failed / 0 skipped (`pnpm -r test`)
- `shell`: 65 passed (11 files)
- `mf-reservas`: 74 passed (12 files)
- `mf-reportes`: 6 passed (1 file)
- `mf-administracion`: 96 passed (12 files)

Matches the count `sdd-apply` self-reported (241 total, 96 in mf-administracion) — independently reproduced, not just trusted.

**Typecheck**: ✅ `pnpm --filter mf-administracion typecheck` → 0 errors.

**Coverage**: Not configured with a threshold in this repo — not available/not applicable, no flag raised.

**Scope check**: ✅ `git status`/`git diff --stat` against `backend/` and `apigateway/` → clean, zero changes. `git diff --stat` against `frontend/apps/shell` → clean, zero changes (confirms task 10.1's claim that mounting `mf-administracion` required no shell changes).

---

### Spec Compliance Matrix (behavioral, test-verified)

| Requirement | Scenario | Test | Result |
|-------------|----------|------|--------|
| Listado de canchas | Activas e inactivas con indicador visual | `CanchasPage.test.tsx > lista canchas activas e inactivas...` | ✅ COMPLIANT |
| Alta de cancha | Alta exitosa → refetch | `CanchasPage.test.tsx > alta exitosa refetchea el listado (8.1)` | ✅ COMPLIANT |
| Alta de cancha | Datos inválidos → detail, sin refetch | `CanchasPage.test.tsx > alta con 400 nombre duplicado... (8.2)` | ✅ COMPLIANT (spec dice 422, test cubre 400 — mismo `action: none` en la práctica; ver WARNING-1) |
| Edición de cancha | Edición exitosa → refetch | `CanchasPage.test.tsx > edición exitosa refetchea el listado` | ✅ COMPLIANT |
| Edición de cancha | 404 → mensaje propio + refetch | `CanchasPage.test.tsx > edición sobre cancha eliminada (404)...` | ✅ COMPLIANT |
| Inactivación de cancha | Sin reservas futuras → refetch directo | `CanchasPage.test.tsx > inactivación sin reservas futuras...` | ✅ COMPLIANT |
| Inactivación de cancha | Con reservas futuras Confirmada → advertencia | `CanchasPage.test.tsx > inactivación con reservas futuras Confirmada...` | ✅ COMPLIANT |
| Inactivación de cancha | Falla verificación → botón sigue habilitado (ADR-03) | `CanchasPage.test.tsx > si GET /reservas/ del diálogo falla...` | ✅ COMPLIANT |
| Horario de atención | Alta de horario (7 filas, `dia_semana` en POST) | `CanchasPage.test.tsx > fila vacía ⇒ botón "Definir" manda POST...` | ✅ COMPLIANT |
| Horario de atención | Edición con rango inválido (422) → detail, no se pierde el anterior | `CanchasPage.test.tsx > rango inválido (422)...` | ✅ COMPLIANT |
| Defensa 403 (RN-07) | 403 en escritura → mensaje propio sin refetch | `CanchasPage.test.tsx > 403 al crear cancha...` | ✅ COMPLIANT |
| Listado global de reservas | GET /reservas/ enriquecido con cancha+usuario | `ReservasAdminPage.test.tsx > cada fila muestra nombre de cancha y usuario...` + `reservasAdminApi.test.ts > 3 handlers OK...` | ✅ COMPLIANT |
| Listado global de reservas | Degradación si falla GET /usuarios | `ReservasAdminPage.test.tsx > GET /usuarios falla ⇒ usuario_id crudo...` + `reservasAdminApi.test.ts > GET /usuarios 403 ⇒ panel degradado...` | ✅ COMPLIANT |
| Filtros client-side | Filtro por estado + contador N de M | `ReservasAdminPage.test.tsx > filtrar por estado actualiza el contador...` | ✅ COMPLIANT |
| Cancelación (RN-03 admin) | Admin cancela reserva ajena → Cancelada + refetch | `ReservasAdminPage.test.tsx > admin cancela reserva de OTRO usuario... (9.4)` | ✅ COMPLIANT |
| RN-04 sin bypass | Reserva iniciada → botón deshabilitado, sin excepción admin | `ReservasAdminPage.test.tsx > botón Cancelar deshabilitado si la reserva ya inició... (9.5)` + `rules.test.ts` | ✅ COMPLIANT |
| RN-04 sin bypass | Estado ≠ Confirmada → botón deshabilitado | `ReservasAdminPage.test.tsx > botón Cancelar deshabilitado si el estado no es Confirmada...` | ✅ COMPLIANT |
| Badges de estado (RN-08) | Badge por cada estado en panel global | `ReservasAdminPage.test.tsx > muestra el badge correspondiente a cada estado...` | ✅ COMPLIANT |
| Mapeo de shape crudo a DTO | canchasApi mapea CanchaResponse | `mappers.test.ts` (toCancha, etc.) | ✅ COMPLIANT |
| Enrichment client-side | 3 fuentes disponibles → join por Map | `reservasAdminApi.test.ts > 3 handlers OK...` + `mappers.test.ts (buildReservasAdmin)` | ✅ COMPLIANT |
| Mapeo de errores por status | 404 dispara refetch | `errors.test.ts > 404: mensaje propio + action refetch` | ✅ COMPLIANT |
| Mapeo de errores por status | 403 no ramifica por texto | `errors.test.ts > 403: mensaje fijo, ignora detail...` | ✅ COMPLIANT |
| Mapeo de errores por status | 400/422 → action "ninguna" (tabla del spec) | `errors.test.ts > 400: detail verbatim + action refetch` | ⚠️ PARTIAL — el test y el código real usan `action: "refetch"` para 400, no `"ninguna"` como dice la tabla de `mf-administracion-backend-adapter/spec.md`. Ver CRITICAL/WARNING abajo. |

**Compliance summary**: 22/23 scenarios fully compliant, 1 partial (spec/design table mismatch on 400, not a behavioral failure — see findings).

---

### Correctness (Static — Structural Evidence)

| Requirement | Status | Notes |
|------------|--------|-------|
| RN-04 sin bypass para admin | ✅ Implemented | `domain/rules.ts::canCancel` has no role parameter and no `if (rol === "administrador")` branch anywhere in the file or its callers (`ReservaAdminRow.tsx`, `filters.ts`) — verified by direct source read, not just grep-for-absence. |
| RN-03 admin ve TODAS las reservas | ✅ Implemented | `reservasAdminApi.listPanel()` calls `apiClient.get("/reservas/", { service: "reservas" })` — same path family as `mf-reservas`'s own listing, no `/mias` or query param scoping the request to the caller's own user. Cross-checked against `mf-reservas/src/api/reservasApi.ts` for consistency: both call the bare `/reservas/` collection endpoint; the "mine vs. all" distinction is left to backend-side role scoping via JWT (consistent with how `mf-reservas` names its own call `listMias` while hitting the exact same URL). |

---

### Coherence (Design)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| ADR-02 (hooks copy + UTC gotcha replicated) | ✅ Yes | `toUtcMillis` in `mf-administracion/domain/rules.ts` is byte-for-byte the same interpretation as `mf-reservas`. |
| ADR-03 (inactivación advierte, nunca bloquea) | ✅ Yes | `InactivarCanchaDialog` never disables the confirm button on a failed reservation count. |
| ADR-04 (RN-04 sin excepción admin) | ✅ Yes | Confirmed above. |
| ADR-06 (horario: validarHorario como hint, no bloqueo) | ✅ Yes, and reasonable | Matches the spec's literal scenario (backend's 422 is what's actually asserted, not a client-side block). |
| ADR-07 (fan-out asimétrico, allSettled) | ✅ Yes | `listPanel` re-throws `r.reason` explicitly on reservas failure; canchas/usuarios degrade silently. |
| ADR-08 (enrichment por Map) | ✅ Yes | `buildReservasAdmin` verified. |
| ADR-09 (filtros no reordenan, "solo próximas" default true) | ⚠️ Deviated (reasonable but worth flagging) | See WARNING-2 below — orthogonal to RN-04 correctness but affects default visibility. |
| ADR-10 (mapApiError table) | ⚠️ Deviated from spec.md, matches design.md | See CRITICAL/WARNING below — `design.md` and code agree with each other, but `spec.md`'s own table for `mf-administracion-backend-adapter` disagrees with both. |
| ADR-11 (sin escrituras optimistas) | ✅ Yes | Every successful mutation calls the relevant `.refetch()`; no local state mutation before server confirmation anywhere in `features/`. |

---

### Issues Found

**CRITICAL** (must fix before archive):
None.

**WARNING** (should fix):

1. **Spec/design/code disagreement on 400 error action.** `openspec/changes/mf-administracion/specs/mf-administracion-backend-adapter/spec.md` (§ "Mapeo de errores por status") states the table row `400/422 | detail verbatim/aplanado | ninguna` — i.e. status 400 MUST map to `action: "none"`. The actual implementation (`src/api/errors.ts`), its test (`errors.test.ts`, `"400: detail verbatim + action refetch"`), and `design.md` ADR-10 all agree on `action: "refetch"` for 400 — a real, three-way-consistent design decision that the spec file was never updated to reflect. This is a spec staleness bug, not a runtime bug: behavior is self-consistent between design and code, but a reader who trusts `spec.md` alone (the source of truth for the OpenSpec workflow) will get 400 wrong. Recommend updating `spec.md`'s table before archive so the artifact trail doesn't lie.

   A secondary, more concrete consequence of this ambiguity: `CanchasPage.tsx`'s dedicated `useEffect` for `editarCancha.error?.action === "refetch"` fires on ANY 400 or 404 during edit — including a duplicate-name 400 on **edit**, not just create. There is no test for "editar una cancha con nombre duplicado (400)" (only "alta con 400" is tested, `CanchasPage.test.tsx:72`). If this path is hit in practice, the edit form will silently close and refetch, discarding the admin's in-progress edit and the visible error message context — likely not the intended UX (the create-path deliberately avoids this exact outcome per the code comment on line 48 of `CanchasPage.tsx`). Recommend adding a test for this case and deciding deliberately whether edit-with-400 should behave like edit-with-404 (refetch+close) or like create-with-400 (show error, keep form, no refetch).

2. **"Solo próximas" filter (default `true`) hides already-started `Confirmada` reservations from the admin panel by default**, which is orthogonal to RN-04 (button-disable) correctness but affects whether the admin can even see rows the spec's own scenario assumes are visible ("GIVEN una reserva Confirmada cuyo fecha+hora_inicio ya pasó... WHEN el admin ve la fila... THEN el botón Cancelar está deshabilitado" — with the default filter on, the admin does not see that row at all unless they toggle "solo próximas" off). This is documented and deliberately test-covered (the RN-04 test explicitly disables the toggle to exercise the scenario, per the comment at `ReservasAdminPage.test.tsx:141-143`), so it is not a silent bug, and no spec requirement forbids the extra filter. But it does mean the literal default-UX premise of the spec's own scenario doesn't hold without user action. Not a blocker; a UX call worth confirming with the team before considering this closed.

**SUGGESTION** (nice to have):

1. `InactivarCanchaDialog` reusing `reservasAdminApi.listPanel()` (which fetches ALL reservas/canchas/usuarios) just to count affected reservations for ONE cancha is functionally correct and spec-compliant, but is a heavier call than needed (fetches 3 collections to answer a single-cancha count). Not a defect — flagged only as a possible future optimization if the reservas collection grows large.
2. Consider adding an explicit test for "editar cancha con 400 nombre duplicado" regardless of the resolution to WARNING-1, since it's the only untested error-status combination in the canchas feature (alta+400, alta+403, edición+404, horarios+422, horarios+403 all have coverage; edición+400 does not).

---

### Verdict
**PASS WITH WARNINGS**

53/53 tasks complete, 241/241 tests pass (independently re-run, not just trusted from the apply report), build and typecheck clean, zero footprint outside `frontend/apps/mf-administracion` (and zero diff in `frontend/apps/shell`, `backend/`, `apigateway/`). RN-04 (no admin bypass) and RN-03 (admin sees `GET /reservas/` in full) are both confirmed correct by direct source inspection, not by name-based assumption. The two WARNINGs are real but non-blocking: one is an artifact-trail staleness issue with a plausible (untested) UX side effect on cancha edit + duplicate name, the other is a deliberate, test-covered UX tradeoff that doesn't break RN-04 but is worth a conscious sign-off. Recommend fixing WARNING-1's spec table and adding the missing edit+400 test before or shortly after archive; neither blocks archiving this change.

---

### Addendum (2026-08-28) — WARNING-1 y WARNING-2 resueltos

- **WARNING-1 (spec.md desactualizado)**: corregida la tabla de `mf-administracion-backend-adapter/spec.md` — la fila combinada `400/422 | ... | ninguna` se separó en `400 → refetch` y `422 → ninguna`, alineada con `design.md` ADR-10, `src/api/errors.ts` y `errors.test.ts` (ya coincidían entre sí; solo el spec estaba desactualizado). Sin cambios de código de producción para esta parte.
- **WARNING-2 (editar cancha con nombre duplicado, 400)**: investigado el comportamiento real antes de asumir bug. Se confirmó que SÍ era un bug de UX real, no solo falta de cobertura: el `useEffect` de `CanchasPage.tsx` reaccionaba a `editarCancha.error?.action === "refetch"`, y como `mapApiError` también marca `action: "refetch"` para status 400 (no solo 404), un 400 por nombre duplicado en edición cerraba el form y refetcheaba el listado igual que un 404 real — descartando lo que el admin tenía tipeado, aunque el mensaje de error sí quedaba visible (el `ErrorBanner` vive fuera del bloque gateado por `modo`). Se corrigió con TDD (RED confirmado con el bug presente, GREEN tras el fix): el efecto ahora discrimina por `editarCancha.error?.status === 404` en vez de por `action`, dejando el cierre automático solo para el caso real de "recurso borrado desde otra pestaña" (ADR-10). Un 400 en edición ahora mantiene el form abierto, con el error visible y sin perder el nombre tipeado — mismo criterio que el 400 en alta y que RN-02 en `mf-reservas`. Test agregado: `CanchasPage.test.tsx > "edición con 400 nombre duplicado: mensaje visible, form abierto y sin perder lo tipeado (fix WARNING-2)"`. No se tocó el resto de los flujos que dependen de `.refetch()` manual tras éxito (alta/inactivar/reactivar/horarios).
- Verificación post-fix: `pnpm --filter mf-administracion test` → 97/97 (antes 96); `pnpm -r test` → 242/242 en las 4 apps (shell 65, mf-reservas 74, mf-reportes 6, mf-administracion 97); `pnpm --filter mf-administracion typecheck` → 0 errores; `pnpm -r build` → 4/4 `ready built` (mismos warnings preexistentes de Module Federation DTS, no relacionados).
