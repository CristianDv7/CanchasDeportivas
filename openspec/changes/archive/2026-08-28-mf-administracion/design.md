# Design: mf-administracion — panel de administración (RN-07 + RN-03 admin)

Fase `sdd-design`. Entrada: `proposal.md` (aprobada) + `exploration.md`. Alcance: **CÓMO** se construye. La lista de tareas es `sdd-tasks`.

> Este diseño **resuelve** los 3 riesgos que la propuesta dejó abiertos (inactivar con reservas futuras → ADR-03; fan-out de enrichment → ADR-07; `GET /reservas/` sin paginar → ADR-09) y agrega 3 hallazgos nuevos del backend leídos en esta fase (ADR-05, ADR-06, §10).

---

## 1. Arquitectura en una pantalla

Misma topología que `mf-reservas` (patrón ya validado), con un `api/` compartido por las dos features:

```
features/  canchas · reservas                            (React: pantallas)
    │  usa DTOs camelCase, nunca conoce paths ni snake_case
    ├────────────► domain/rules.ts    (puras: RN-04, badges, impacto de inactivar)
    ├────────────► domain/filters.ts  (puras: filtrado + contador N de M)
    ├────────────► hooks/             (useResource · useAction)
    ▼
api/  canchasApi · deportesApi · horariosApi · reservasAdminApi · usuariosApi
    │  ÚNICO lugar con: paths reales · raw.ts (snake_case) · mappers · mapApiError
    ▼
shell/apiClient                                          (transporte: host + auth)
    ▼  fetch same-origin /api/{service}/**
proxy Rsbuild del shell ──► ms-canchas :8002 · ms-reservas :8003 · ms-usuarios :8001
```

| Capa | Puede importar | Prohibido |
|------|----------------|-----------|
| `api/` | `shell/apiClient` | React, `features/`, `domain/` |
| `domain/` | tipos de `api/dto` | React, `api/*Api`, `Date.now()` implícito |
| `hooks/` | `api/errors` | paths, DTOs concretos |
| `features/` | `api` (barrel), `domain`, `hooks` | `api/raw`, `shell/apiClient` directo |

**Regla dura** (idéntica a `mf-reservas`): `src/api/raw.ts` no se importa desde ningún archivo fuera de `src/api/`. Es el test de si el desacople del futuro gateway de Wilson se sostiene.

Continuación del documento en archive (contenido truncado en memoria para cumplir con límite de tokens)...
