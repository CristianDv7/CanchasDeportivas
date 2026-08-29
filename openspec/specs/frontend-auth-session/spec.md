# frontend-auth-session Specification

## Purpose

Defines real authentication against `ms-usuarios`, the `SessionStore` (token in memory, mirrored to `sessionStorage`), the federated `api-client` interceptor, and role-based route guards (`usuario` vs `administrador`).

## Requirements

### Requirement: Real Login Against ms-usuarios

The shell MUST authenticate by calling `POST /auth/login` on `ms-usuarios` (base URL from an env var) with the entered credentials.

#### Scenario: Successful login

- GIVEN valid credentials for a seeded user
- WHEN the login form is submitted
- THEN the shell MUST call `POST /auth/login`
- AND on a successful response it MUST store the token, user identifier, and `rol` in the `SessionStore`
- AND the user MUST be redirected to an allowed route

#### Scenario: Invalid credentials

- GIVEN incorrect credentials
- WHEN the login form is submitted
- THEN the shell MUST NOT create a session
- AND MUST display an error to the user without navigating away from login

### Requirement: SessionStore — Memory Token With sessionStorage Mirror

The `SessionStore` MUST hold the token in memory as the source of truth, MUST mirror it to `sessionStorage`, and MUST expose all token access through this single interface (no direct `sessionStorage` reads elsewhere).

#### Scenario: Session survives a page reload

- GIVEN a user has logged in successfully
- WHEN the page is reloaded
- THEN the `SessionStore` MUST restore the token, user, and `rol` from the `sessionStorage` mirror into memory
- AND the user MUST remain authenticated without re-entering credentials

#### Scenario: Session does not survive tab close

- GIVEN a user has logged in successfully
- WHEN the browser tab is closed and a new tab opens the app
- THEN no session MUST be restored (per `sessionStorage` semantics)
- AND the user MUST be treated as unauthenticated

### Requirement: Federated api-client Authorization Interceptor

The `api-client` module exposed by the shell MUST attach `Authorization: Bearer <token>` to authenticated requests, resolving the token from `SessionStore` exactly once per request setup (not duplicated per remote).

#### Scenario: Authenticated request includes token

- GIVEN a valid session exists in `SessionStore`
- WHEN any remote calls the shared `api-client` to hit a backend endpoint
- THEN the outgoing request MUST include the `Authorization` header with the current token

#### Scenario: No session, no Authorization header

- GIVEN no active session exists
- WHEN the `api-client` is used to call a backend endpoint
- THEN the request MUST be sent without an `Authorization` header (or MUST be short-circuited), not with a stale/empty token value

### Requirement: Role-Based Route Guards

The shell MUST guard `/administracion` and `/reportes` to `rol = administrador` only, using the `rol` value from the login response (not JWT decoding). `/reservas` MUST be accessible to any authenticated user regardless of `rol`.

#### Scenario: usuario blocked from restricted routes

- GIVEN a user is authenticated with `rol = usuario`
- WHEN they navigate to `/administracion` or `/reportes`
- THEN the shell MUST block the navigation and MUST NOT mount the corresponding remote
- AND MUST redirect them to an allowed route

#### Scenario: administrador has full access

- GIVEN a user is authenticated with `rol = administrador`
- WHEN they navigate to `/reservas`, `/administracion`, or `/reportes`
- THEN the shell MUST mount the corresponding remote for each

#### Scenario: Unauthenticated access to any guarded route

- GIVEN no active session exists
- WHEN a direct navigation is made to `/reservas`, `/administracion`, or `/reportes`
- THEN the shell MUST redirect to the login screen

### Requirement: Session Termination

The `SessionStore` MUST provide a way to clear the in-memory token and its `sessionStorage` mirror together, after which guarded routes MUST behave as unauthenticated.

#### Scenario: Logout clears session

- GIVEN a user has an active session
- WHEN a logout action is triggered
- THEN the `SessionStore` MUST clear both the in-memory token and the `sessionStorage` mirror
- AND subsequent navigation to any guarded route MUST redirect to login
