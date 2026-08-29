# Delta for frontend-remote-modules

## REMOVED Requirements

### Requirement: RemoteHealthCard Identity Display

`mf-reportes` MUST render a `RemoteHealthCard` showing its own remote name and a build identifier. `mf-reservas` and `mf-administracion` already replaced the placeholder with real features and MUST NOT be required to render it.

(Reason: `mf-reportes` was the last remote still mounting the placeholder; it is replaced by the real reports dashboard (`mf-reportes-dashboard`). No remote renders `RemoteHealthCard` anymore, so this requirement has no remaining addressee.)

### Requirement: Federation Origin Display

The `RemoteHealthCard` (in `mf-reportes`) MUST display the origin URL from which its bundle was federated (e.g., `http://localhost:3003`).

(Reason: same as above — the placeholder that displayed this is removed. Module Federation loading itself is unaffected; this only removed the diagnostic display of it.)

### Requirement: Simulated Error Trigger

The `RemoteHealthCard` (in `mf-reportes`) MUST expose a control that, when activated, throws an unhandled error inside the remote's render tree, to allow verification of the shell's per-remote `ErrorBoundary`.

(Reason: the demo-only error trigger is removed along with the placeholder. Per-remote isolation is still specified and tested independently under `frontend-shell-host` — "Per-Remote Error Boundary" — so no coverage is lost; only this dev-only demo surface goes away.)
