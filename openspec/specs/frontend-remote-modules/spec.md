# frontend-remote-modules Specification

## Purpose

Defines the 3 remotes (`mf-reservas`, `mf-administracion`, `mf-reportes`). All 3 have replaced the `RemoteHealthCard` placeholder with real features: `mf-reservas` (booking flow), `mf-administracion` (canchas/reservas admin), `mf-reportes` (reports dashboard, `mf-reportes-dashboard`). No remote renders `RemoteHealthCard` anymore. Module Federation loading, shared shell session, and per-remote error-boundary isolation are still specified and tested independently under `frontend-shell-host`.
