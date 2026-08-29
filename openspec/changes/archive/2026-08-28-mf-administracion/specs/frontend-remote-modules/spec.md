# Delta for frontend-remote-modules

## MODIFIED Requirements

### Requirement: RemoteHealthCard Identity Display

`mf-reportes` MUST render a `RemoteHealthCard` showing its own remote name and a build identifier. `mf-reservas` and `mf-administracion` already replaced the placeholder with real features and MUST NOT be required to render it.

(Previously: "Each of the 3 remotes MUST render a `RemoteHealthCard`...")

#### Scenario: Remote identifies itself

- GIVEN `mf-reportes` is mounted by the shell
- WHEN its `RemoteHealthCard` renders
- THEN it MUST display the literal remote name ("mf-reportes") and a build id (e.g., timestamp or hash)

### Requirement: Federation Origin Display

The `RemoteHealthCard` MUST display the origin URL from which its bundle was federated (e.g., `http://localhost:3003`).

(Previously: example used `mf-administracion` at `localhost:3002`, which no longer renders `RemoteHealthCard`)

#### Scenario: Origin matches the remote's dev server

- GIVEN `mf-reportes` is served from `localhost:3003`
- WHEN its `RemoteHealthCard` renders
- THEN the displayed origin MUST be `localhost:3003`, not the shell's own origin

### Requirement: Simulated Error Trigger

The `RemoteHealthCard` MUST expose a control that, when activated, throws an unhandled error inside the remote's render tree, to allow verification of the shell's per-remote `ErrorBoundary`.

(Previously: scenario used `mf-reservas`, which no longer renders `RemoteHealthCard`)

#### Scenario: Forcing an error is contained

- GIVEN `mf-reportes`'s `RemoteHealthCard` is rendered
- WHEN the "forzar error" control is activated
- THEN an error MUST be thrown inside `mf-reportes`'s render tree
- AND the shell's `ErrorBoundary` for that remote MUST catch it
- AND the shell layout and the other 2 remotes MUST remain functional
