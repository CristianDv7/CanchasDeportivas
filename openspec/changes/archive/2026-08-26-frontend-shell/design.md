# Design: frontend-shell — arquitectura técnica

Fase: `sdd-design`. Entrada: `proposal.md` (aprobada) + `exploration.md`.
Alcance de este documento: **CÓMO** se construye el esqueleto. No contiene la lista de tareas (eso es `sdd-tasks`).

---

## 1. Arquitectura en una pantalla

```
┌──────────────────────────── Browser (origen único: localhost:3000) ───────────────────────────┐
│                                                                                                │
│  SHELL (host MF, :3000)                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │ app/        AppRouter · RootLayout · RemoteBoundary                                       │ │
│  │ auth/       LoginPage · RequireAuth · RequireRole · AccesoDenegadoPage                    │ │
│  │ shared/     ┌───────────── SUPERFICIE FEDERADA (contrato estable) ─────────────┐          │ │
│  │             │  exposes './session'   →  useSession, getSession, SessionUser…   │          │ │
│  │             │  exposes './apiClient' →  apiClient, ApiError, ServiceName…      │          │ │
│  │             └──────────────────────────────────────────────────────────────────┘          │ │
│  │ session/    SessionStore (memoria = verdad · sessionStorage = espejo)                     │ │
│  │ config/     env.ts (único punto que toca el bundler / import.meta.env)                    │ │
│  └──────────────────────────────────────────────────────────────────────────────────────────┘ │
│        │ MF: carga remotes                        ▲ MF: remotes consumen shell/*               │
│        ▼                                          │                                            │
│  ┌─────────────────┐   ┌────────────────────┐   ┌─────────────────┐                            │
│  │ mf-reservas     │   │ mf-administracion  │   │ mf-reportes     │  (código ejecutando        │
│  │ :3001           │   │ :3002              │   │ :3003           │   DENTRO de la página      │
│  │ RemoteHealthCard│   │ RemoteHealthCard   │   │ RemoteHealthCard│   del shell)               │
│  └─────────────────┘   └────────────────────┘   └─────────────────┘                            │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
                                        │ fetch same-origin /api/**
                                        ▼
                      Rsbuild dev-server proxy del shell (:3000)
                                        │
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
   ms-usuarios     ms-canchas      ms-reservas     ms-reportes   (FastAPI, sin CORS)
```

**Patrón**: host-with-shared-kernel. El shell es a la vez *host* (monta remotes) y *remote* (expone kernel de sesión/HTTP). Los remotes son hojas: no se conocen entre sí, no hablan entre sí, y no tienen su propia capa de auth ni de HTTP.

**Layering dentro de cada app** (Screaming/Clean-lite, sin sobre-ingeniería para Fase 1):

| Capa | Puede importar de | Ejemplo |
|------|-------------------|---------|
| `config/` | nada del proyecto | `env.ts` — único archivo que lee `import.meta.env` |
| `session/`, `http/` (dominio técnico) | `config/` | `SessionStore`, `apiClient` |
| `shared/` (superficie federada) | `session/`, `http/` | re-export estable |
| `auth/`, `app/` (UI) | todo lo anterior | `RequireRole`, `AppRouter` |

Regla dura: **nada fuera de `config/env.ts` lee variables de entorno ni APIs del bundler**. Es lo que hace barato el rollback Rsbuild→Webpack que promete la propuesta.

---

## 2. Boundaries: quién puede hacer qué

| Responsabilidad | Dueño | Prohibido para |
|-----------------|-------|----------------|
| Guardar/leer el token | `SessionStore` (shell) | Todos los demás, incluido el resto del shell |
| Inyectar `Authorization` | `apiClient` (shell) | Los remotes (no arman headers a mano) |
| Decidir si un rol entra a una ruta | `RequireRole` (shell) | Los remotes (duplicar = divergencia/bypass) |
| Enrutar top-level (`/reservas` → qué remote) | `AppRouter` (shell) | Los remotes |
| Rutas internas de un remote | El remote (sub-router relativo) | El shell |
| Pantallas y lógica de dominio | El remote | El shell |
| Hablar con su microservicio | El remote **usando `apiClient` del shell** | Fetch/axios propio |

El guard usa el `rol` del `LoginResponse`, **no decodifica el JWT**: es UX. La autoridad real sigue siendo el RBAC server-side (`ms-reservas` ya lo hace con `current_user["rol"]`). Un guard bypasseado no da acceso a datos, solo a una pantalla vacía que recibirá 403.

---

[... rest of design.md continues at 690 lines, copied completely ...]

## 11. Riesgos residuales de esta fase

| Riesgo | Estado tras el diseño |
|--------|----------------------|
| Puertos reales de los 4 microservicios | **Sin confirmar** — tarea explícita en `sdd-tasks` antes del `.env.example` |
| HMR cross-remote | Convertido en procedimiento verificable con fallback acotado (§8) |
| `dts` de MF 2.0 inestable | Fallback manual `remotes.d.ts` definido (§5.3) |
| Deduplicación de instancias de MF | Neutralizado por ADR-05 |
| Build de producción sin proxy | Deuda conocida y consciente; se resuelve con el gateway |
| Logout no propaga entre pestañas | Limitación aceptada de `sessionStorage`, documentada |
