# frontend-remote-modules Specification

## Purpose

Defines the 3 remotes (`mf-reservas`, `mf-administracion`, `mf-reportes`) and the `RemoteHealthCard` placeholder each MUST render to demonstrate Module Federation loading, shared shell session, and error-boundary isolation.

## Requirements

### Requirement: RemoteHealthCard Identity Display

Each of the 3 remotes MUST render a `RemoteHealthCard` showing its own remote name and a build identifier.

#### Scenario: Remote identifies itself

- GIVEN `mf-reservas` is mounted by the shell
- WHEN its `RemoteHealthCard` renders
- THEN it MUST display the literal remote name (e.g., "mf-reservas") and a build id (e.g., timestamp or hash)

### Requirement: Federation Origin Display

The `RemoteHealthCard` MUST display the origin URL from which its bundle was federated (e.g., `http://localhost:3001`).

#### Scenario: Origin matches the remote's dev server

- GIVEN `mf-administracion` is served from `localhost:3002`
- WHEN its `RemoteHealthCard` renders
- THEN the displayed origin MUST be `localhost:3002`, not the shell's own origin

### Requirement: Shell Session Consumption

The `RemoteHealthCard` MUST read the authenticated user identifier and `rol` from the shell's federated session module, and MUST NOT maintain its own separate copy of session state.

#### Scenario: Card reflects the shell's session

- GIVEN an `administrador` is logged in via the shell
- WHEN `mf-reportes` mounts and renders its `RemoteHealthCard`
- THEN the card MUST display that same user identifier and `rol = administrador`

#### Scenario: Session change is reflected without remote rebuild

- GIVEN a different user logs in (e.g., `usuario` instead of `administrador`)
- WHEN a remote's `RemoteHealthCard` re-renders
- THEN it MUST show the new user identifier and `rol` without requiring a rebuild/redeploy of the remote

### Requirement: Simulated Error Trigger

The `RemoteHealthCard` MUST expose a control that, when activated, throws an unhandled error inside the remote's render tree, to allow verification of the shell's per-remote `ErrorBoundary`.

#### Scenario: Forcing an error is contained

- GIVEN `mf-reservas`'s `RemoteHealthCard` is rendered
- WHEN the "forzar error" control is activated
- THEN an error MUST be thrown inside `mf-reservas`'s render tree
- AND the shell's `ErrorBoundary` for that remote MUST catch it
- AND the shell layout and the other 2 remotes MUST remain functional

### Requirement: Optional Backend Health Probe

The `RemoteHealthCard` MAY perform a read-only authenticated GET to its associated microservice; on failure it MUST degrade to a "not connected" state without crashing the card or the remote.

#### Scenario: Probe succeeds

- GIVEN the remote's associated microservice is reachable
- WHEN the `RemoteHealthCard` performs its optional health GET
- THEN it MAY display a "connected" indicator

#### Scenario: Probe fails gracefully

- GIVEN the remote's associated microservice is unreachable
- WHEN the `RemoteHealthCard` performs its optional health GET
- THEN it MUST show a "no conectado" state
- AND MUST NOT throw an unhandled error or trigger the `ErrorBoundary`
