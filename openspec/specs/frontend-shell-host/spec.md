# frontend-shell-host Specification

## Purpose

Defines the shell (host) application: global layout, top-level routing, Module Federation loading of the 3 remotes with singleton sharing, and per-remote failure isolation.

## Requirements

### Requirement: Host Layout

The shell MUST render a persistent application layout (navigation + content outlet) that wraps whichever route is active.

#### Scenario: Layout persists across navigation

- GIVEN an authenticated user on `/reservas`
- WHEN they navigate to another allowed route
- THEN the shell layout (nav) remains mounted
- AND only the content outlet changes

### Requirement: Top-Level Routing

The shell MUST define top-level routes `/reservas`, `/administracion`, `/reportes`, each mapped to one federated remote.

#### Scenario: Route resolves to its remote

- GIVEN the shell router is initialized
- WHEN the URL matches `/reservas`
- THEN the shell MUST mount the `mf-reservas` remote in the content outlet

#### Scenario: Unknown route

- GIVEN a URL that matches none of the defined routes
- WHEN the user navigates to it
- THEN the shell SHOULD render a not-found view instead of a blank screen

### Requirement: Module Federation Remote Loading

The shell MUST load `mf-reservas` (origin `localhost:3001`), `mf-administracion` (`:3002`), and `mf-reportes` (`:3003`) via Module Federation 2.0 remote manifests, and MUST declare React, ReactDOM, and `react-router` as `shared: { singleton: true }`.

#### Scenario: Single React instance across host and remotes

- GIVEN the shell and all 3 remotes declare React as a shared singleton
- WHEN all 3 remotes are mounted simultaneously
- THEN only one React instance MUST run on the page
- AND no "invalid hook call" / duplicate-React errors occur

#### Scenario: Remote entry unreachable at load time

- GIVEN a remote's `remoteEntry` manifest fails to load (network error/timeout)
- WHEN the shell attempts to mount that remote's route
- THEN the shell SHOULD render a degraded fallback for that route only
- AND the shell and the other 2 remotes MUST remain usable

### Requirement: Per-Remote Error Boundary

Each remote's mount point MUST be wrapped in its own `ErrorBoundary`, isolated from the shell and from the other remotes.

#### Scenario: Remote throws a runtime error

- GIVEN a remote is mounted successfully
- WHEN its own code throws an unhandled render/runtime error
- THEN that remote's `ErrorBoundary` MUST catch it and show an error state
- AND the shell layout and the other 2 remotes MUST continue functioning normally

#### Scenario: Recovering from a caught remote error

- GIVEN a remote's `ErrorBoundary` has caught an error
- WHEN the user navigates away and back to that remote's route
- THEN the shell MUST attempt to remount the remote fresh (not stay stuck in the error state)
