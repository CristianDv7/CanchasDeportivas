# Verification Report: frontend-shell

**Change**: frontend-shell
**Mode**: Strict TDD (verified against `openspec/config.yaml` `strict_tdd: true`, `rules.verify.test_command: "pnpm -r test"`, `build_command: "pnpm -r build"`)
**Auditor**: sdd-verify (independent re-execution, not a transcription of tasks.md's own audit)
**Date**: 2026-08-26

---

## Completeness

| Metric | Value |
|--------|-------|
| Tasks total | 5 phases, ~50 sub-tasks |
| Tasks complete | All marked `[x]` |
| Tasks incomplete | 0 |

All 5 phases in `tasks.md` are checked off. No incomplete core or cleanup tasks found.

---

## Build & Tests Execution (real, re-run independently)

**Tests**: ✅ **83 passed / 0 failed / 0 skipped**, exit code 0.
```
apps/mf-reservas       6 passed (1 file)
apps/mf-administracion 6 passed (1 file)
apps/mf-reportes       6 passed (1 file)
apps/shell            65 passed (11 files)
Total: 14 test files, 83 tests, all green
```
Matches tasks.md's claim exactly (65+6+6+6=83). Stack traces for "Error forzado…" / "remoteEntry no disponible" in stdout are intentional errors thrown by tests to exercise `ErrorBoundary`s — not failures (confirmed by reading the tests that produce them).

**Typecheck**: ✅ `pnpm -r typecheck` — `tsc --noEmit` clean on all 4 apps, exit 0.

**Build**: ✅ `pnpm -r build` — exit 0, all 4 apps emit `dist/remoteEntry.js` + `dist/mf-manifest.json`. Bundle sizes match tasks.md 4.3 exactly (mf-administracion 390.6 kB, mf-reservas 390.5 kB, mf-reportes 390.3 kB, shell 505.5 kB). The non-blocking `TS6059` MF-DTS warning is present as documented (build still exits 0; typecheck is sound because of the manual `remotes.d.ts` fallback per remote — confirmed these 4 files exist on disk).

**Coverage**: Not available (`coverage: false` in config.yaml, `coverage_threshold: 0`) — consistent, no false promise.

---

## Independent Spec-vs-Code Verification (not just name-matching)

Read actual test bodies (not just titles) against Given/When/Then for a sample across all 3 specs:

| Requirement / Scenario | Test file | Verified how |
|---|---|---|
| `frontend-auth-session` — *No session, no Authorization header* | `http/client.test.ts` | Confirmed: `fetchImpl` mock, asserts `fetchImpl` is **never called** and rejects with `ApiError{status:0, code:'unauthorized'}` — exercises production `createApiClient` code, not a stub. |
| `frontend-auth-session` — 401/403/422/204/network mapping (design §5.1 contract table) | `http/client.test.ts` | 8 scenarios, each constructs a real `Response`/rejected fetch and asserts on `ApiErrorImpl` shape produced by the real `request()` function; once-guard test uses `Promise.allSettled` on 2 parallel calls and asserts `onUnauthorized` called exactly once, then resets after a new `store.set()` — real behavioral proof, not a name-only match. |
| `frontend-auth-session` — *usuario blocked from restricted routes* / *administrador has full access* / rol desconocido | `auth/RequireAuth.test.tsx` | Real `MemoryRouter` + `RequireAuth`/`RequireRole` layout routes render tree; asserts on which route's literal text actually rendered (`"Acceso Denegado"` vs `"Administracion Home"`) for 3 distinct role states — genuine behavioral coverage, not implementation-detail assertions. |
| `frontend-remote-modules` — *Probe fails gracefully* / *Probe succeeds* | `mf-reservas/RemoteHealthCard.test.tsx` | `vi.stubGlobal('fetch', …)` with a rejecting/resolving fetch, clicks the real "probar backend" button via `userEvent`, asserts `getByTestId('backend-status')` text — exercises the actual click handler and probe logic, not mocked away. |
| `frontend-shell-host` — *Remote throws a runtime error* (backfilled in 4.2) | `app/RemoteBoundary.test.tsx` | Distinguishes "loader rejects" (manifest down) from "loader resolves but component throws in render" (the actual `RemoteHealthCard` "forzar error" path) with two sibling `RemoteBoundary`s — confirms per-remote isolation is asserted, not just an error being caught somewhere. |

**Assertion Quality Audit** (Step 5f, mandatory under Strict TDD): scanned all 14 test files for tautologies, ghost loops (`forEach`/`for..of` over `queryAll`/`getAllBy`/`findAllBy`), and ratio of ` toBeInTheDocument()` used as smoke-test-only.
- **0 tautologies** (`expect(true).toBe(true)` etc.) found.
- **0 ghost loops** found (no `forEach`/`for-of` iterating query-all results in any test file).
- Every `toBeInTheDocument()` call is paired with a specific literal/regex text query (component name, role, or testid) tied to a distinct behavioral state — none are bare "renders without crash" smoke tests.
- No mock-heavy files (mocks are targeted: `fetchImpl` injection, `vi.stubGlobal('fetch', …)`, `getOrCreateSessionStore()` real store) — assertion-to-mock ratio is healthy throughout.

**Assertion quality**: ✅ All assertions verify real behavior.

---

## Design Interfaces vs. Real Implementation

Compared `design.md` §5.1/§5.2/§6 declared interfaces against the actual source:

| Interface | design.md | `apps/shell/src/**` | Match |
|---|---|---|---|
| `ApiClient` | `request/get/post/put/patch/delete/baseUrlFor/onUnauthorized`, `post/put/patch` with `options?`, `get/delete` with `options` required | `http/types.ts` + `http/client.ts` | ✅ Exact match, including the required-vs-optional `options` asymmetry between verbs. |
| `ApiError` shape | `name/status/code/detail/body/method/url`, token never in `.url`/message | `http/client.ts` `ApiErrorImpl` | ✅ Exact match; confirmed by a dedicated test asserting the token never leaks into `.url`/`.message`/`.detail`. |
| `SessionStore` | `getSnapshot/subscribe/hydrate/set/setStatus/clear/authorizeRequest` | `session/store.ts` | ✅ Exact match, including `authorizeRequest(init): RequestInit | null` (ADR-03 costura), not a `getToken()` leak anywhere in the codebase (confirmed no other consumer reads `sessionStorage` directly except `mirror.ts`). |
| `useSession`/`getSession`/`subscribeSession` | `useSyncExternalStore`, not Context (ADR-04) | `session/useSession.ts` | ✅ Exact match — uses `useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)`, no `SessionContext` exists anywhere in the shell. |
| `getOrCreateSessionStore()` singleton | `Symbol.for('canchasdeportivas.session.store.v1')` (ADR-05) | `session/store.ts` | ✅ Exact match, same symbol key. |
| `login`/`logout` idempotency | design.md §5.2 | `session/session.ts` | ✅ `logout()` short-circuits when already anonymous with no token; verified by test in `session.test.ts`. |

No undocumented divergences found between design.md and the real code.

---

## Coherence (Design/ADR Match)

| Decision | Followed? | Notes |
|----------|-----------|-------|
| ADR-01 (dev-server proxy, not backend CORS) | ✅ Yes | `apps/shell/rsbuild.config.ts` has the `/api/<servicio>` proxy block as designed. |
| ADR-02 (federated api-client/session, not `packages/`) | ✅ Yes | `shell` exposes `./session`, `./apiClient`, `./contract`; no `packages/` directory exists. |
| ADR-03 (`authorizeRequest`, not `getToken`) | ✅ Yes | Confirmed above. |
| ADR-04 (`useSyncExternalStore`, not Context) | ✅ Yes | Confirmed above. |
| ADR-05 (`Symbol.for` singleton) | ✅ Yes | Confirmed above; also manually re-verified live in 3.6 per tasks.md (browser console, same reference). |
| ADR-06 (unknown rol ⇒ min privilege, login still succeeds) | ✅ Yes | `useSession.test.tsx` — "rol desconocido ⇒ sesión válida pero hasRole() false". |
| ADR-07 (401 clears session, 403 doesn't) | ✅ Yes | Confirmed by `client.test.ts` 401/403 tests above. |
| ADR-08 (guards as layout routes with `<Outlet/>`) | ✅ Yes | `RequireAuth`/`RequireRole` used as `<Route element={...}>` wrappers in `AppRouter.test.tsx` / real `AppRouter.tsx`. |
| **`shareStrategy: "loaded-first"` fix (tasks.md 3.5)** | ✅ Yes, in **all 4** apps | Verified directly by reading `shareStrategy` in `apps/{shell,mf-reservas,mf-administracion,mf-reportes}/rsbuild.config.ts` — all 4 set `"loaded-first"`. No app was missed. |

---

## Targeted Findings (independent checks requested)

1. **`openspec/config.yaml` YAML validity** — ✅ Confirmed valid with `js-yaml` (`npx js-yaml openspec/config.yaml`, exit 0). The `rules.apply` block now correctly nests the guideline list under `guidelines:` as siblings of `tdd`/`test_command`. Bug fix claim in tasks.md 4.3 verified as real and correctly applied.

2. **`frontend/.env.example` — exists, and is correctly NOT gitignored**:
   - File exists on disk: `frontend/.env.example` (confirmed via `fd`).
   - `git check-ignore -v` confirms: `frontend/.env` **is** ignored (rule `.gitignore:4:.env`), `frontend/.env.example` is **not** ignored (rule `.gitignore:6:!.env.example` explicitly un-ignores it).
   - `git status --short` shows `?? frontend/.env.example` (untracked but visible, not silently swallowed by `.gitignore`) — correct outcome, team can commit it.
   - **⚠️ WARNING (documentation integrity, non-blocking)**: `tasks.md` line 131 (closing note of task 5.1) explicitly states *"al momento de cerrar esta fase, `frontend/.env.example` **sigue sin existir**"* (still doesn't exist) and blames the harness's `.env*` write-block. This is **no longer true** — the file exists now (timestamped Aug 26 23:11, i.e., after the note was written) and behaves correctly. The artifact itself is fine; the **audit trail in tasks.md is stale** and should be corrected (or a follow-up note added) before archiving, so a future reader doesn't get a false impression that the workaround is still pending.

3. **Scope check** — ✅ Clean. `git status` shows changes confined to `frontend/` and `openspec/` (plus root `CLAUDE.md`, an unrelated doc file, and untracked pre-existing `backend/ms-usuarios/**/__pycache__`/`.venv` artifacts that are `.gitignore`d and were not created by this change). No modifications inside `backend/` or `apigateway/` source.
   - Minor unrelated note: root `.gitignore` has a pending modification adding `.atl/` (SDD tooling) — unrelated to `frontend-shell`'s stated scope (workspace/MF/auth), most likely a leftover from `sdd-init`, not something this change's proposal/tasks mention. Harmless, doesn't touch backend/apigateway, not worth blocking on.

---

## Spec Compliance Matrix (24 scenarios across 3 specs)

Cross-checked tasks.md's own 4.2 audit against the real test files (not trusting it blindly) — confirmed accurate on every scenario I sampled (see "Independent Spec-vs-Code Verification" above). Summary:

| Spec | Scenarios | Compliant | Partial | Untested (justified) |
|---|---|---|---|---|
| `frontend-shell-host` | 7 | 5 | 1 | 1 |
| `frontend-auth-session` | 10 | 7 | 1 | 2 |
| `frontend-remote-modules` | 7 | 6 | 1 | 0 |
| **Total** | **24** | **18** | **3** | **3** |

The 3 UNTESTED scenarios (*Single React instance across host and remotes*, *Session does not survive tab close*, plus one folded into the auth count) are all justified as requiring real browser/MF runtime or real tab lifecycle — not achievable under jsdom/Vitest — and are transparently disclosed in tasks.md 4.2, not hidden. `openspec/config.yaml` already flags "Single React instance" as the #1 Playwright candidate, which is the correct next step, not a defect of this change.

The 3 PARTIAL scenarios (session survives reload — unit-level only, real reload not manually re-verified per 3.2's own note; recovering from caught error via navigate-away-and-back — covered by "Reintentar" button + code construction, not a router round-trip test; session change without remote rebuild — covered by composition with the shell's own live-reactivity test, not a single end-to-end test) are minor, honestly disclosed, and consistent with what I found reading the actual test files.

---

## Issues Found

**CRITICAL** (must fix before archive): **None.**

**WARNING** (should fix, non-blocking):
1. `tasks.md` 5.1's closing note about `frontend/.env.example` "still not existing" is stale/incorrect — the file exists and is correctly un-gitignored. Recommend adding a corrective note before archiving so the audit trail reflects final reality.
2. 3 spec scenarios remain PARTIAL (see matrix) — all pre-existing, disclosed gaps, not new findings. No action required beyond what tasks.md already recommends (Playwright as future work).

**SUGGESTION** (nice to have):
1. Consider adding Playwright (or similar) to close the one true automation gap: *Single React instance across host and remotes* — already correctly identified as the top candidate in `openspec/config.yaml`.
2. The root `.gitignore`'s new `.atl/` entry is unrelated to this change's scope — worth confirming in a future change/commit message that it belongs to `sdd-init` tooling, not `frontend-shell`.

---

## Verdict

**PASS WITH WARNINGS.**

Independent re-execution of the full test/typecheck/build pipeline confirms tasks.md's claims are accurate (83 tests, 4 clean builds, exact bundle sizes). Spot-checked test bodies (not just names) across all 3 specs show genuine behavioral coverage with no trivial/tautological assertions. Design interfaces match the real code exactly. The `shareStrategy: "loaded-first"` fix is present in all 4 apps. `openspec/config.yaml` YAML is valid. `.env.example` exists and is correctly excluded from `.gitignore`'s blanket `.env` rule — the one documentation inconsistency found (tasks.md 5.1 claiming it still didn't exist) does not affect functional readiness. No CRITICAL blockers. The change is ready for `sdd-archive`.
