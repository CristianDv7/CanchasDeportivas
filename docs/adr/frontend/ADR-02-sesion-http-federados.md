# ADR-02: Sesión y cliente HTTP federados desde el shell (no `packages/` compartido)

**Estado:** Aceptado — 2026-08-26
**Evidencia en código:** `frontend/apps/shell/rsbuild.config.ts` (`exposes: './session'`, `'./apiClient'`, `'./contract'`).

## Contexto

Los 3 remotes (`mf-reservas`, `mf-administracion`, `mf-reportes`) necesitan leer la sesión del usuario logueado y hacer llamadas HTTP autenticadas. Module Federation permite dos caminos: un paquete npm compartido en el workspace (`packages/session`, build-time) o exponer módulos del shell en runtime vía `exposes`.

## Decisión

El shell expone `./session`, `./apiClient` y `./contract` como remotes federados en runtime. Los microfrontends los consumen igual que cualquier otro remote MF, sin depender de un paquete instalado en `node_modules`.

## Consecuencias

**Positivas**
- Un solo build del shell define la verdad de sesión/HTTP; no hay riesgo de que un remote quede en una versión vieja del paquete tras un `pnpm install` desincronizado.
- Ningún remote arma sus propios headers de auth ni decide reglas de acceso: eso es responsabilidad exclusiva del shell (`SessionStore`, `RequireRole`).

**Negativas / riesgos**
- Acopla el arranque de los remotes al shell: si el shell no expone el manifest, ningún remote puede montar sesión ni HTTP (mitigado por ADR-05 y por `shareStrategy: "loaded-first"`, ver diseño de MF).
- Requiere disciplina de contrato estable en `shared/contract.ts` — cambiar la forma de `./session` rompe a los 3 remotes a la vez.

## Requisitos No Funcionales derivados

**RNF-01 — Superficie de credenciales aislada en un único módulo.**
`SessionStore`, expuesto por el shell, es el único componente que puede leer/escribir el token de sesión; ningún remote arma sus propios headers de autenticación.

**RNF-09 — La caída de un microfrontend remoto no debe tumbar rutas que no dependen de él.**
`shareStrategy: "loaded-first"` monta cada remote de forma aislada bajo demanda; un remote caído no bloquea la resolución conjunta de los otros.

## Alternativas consideradas

- `packages/session` en el pnpm workspace (build-time, import estático): descartada porque reintroduce el problema de versiones divergentes entre apps que Module Federation está pensado para evitar, y porque duplicaría lógica de auth en cada remote si no se disciplina el import.
