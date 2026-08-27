# ADR-04: `useSyncExternalStore` para la sesión, no React Context

**Estado:** Aceptado — 2026-08-26
**Evidencia en código:** `frontend/apps/shell/src/session/useSession.ts` — usa `useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)`; no existe ningún `SessionContext` en el codebase.

## Contexto

La sesión debe ser leíble tanto por el shell como por los 3 remotes federados, que corren como builds independientes (apps React separadas montadas dentro de la misma página, no bajo el mismo árbol de componentes de un único `ReactDOM.render`).

## Decisión

`useSession()` se implementa sobre `useSyncExternalStore`, leyendo un `SessionStore` externo (plain JS, fuera de React), en vez de un `SessionContext.Provider` envolviendo el árbol.

## Consecuencias

**Positivas**
- Un remote no necesita estar montado dentro del árbol de `<SessionContext.Provider>` del shell para leer la sesión — evita el problema de "dos instancias de React conviviendo" típico de Module Federation con Context (cada remote puede tener su propia instancia de React; Context no cruza esa frontera de forma confiable).
- Un único punto de verdad (`SessionStore`, fuera de React) en vez de dos (el store + el Provider) — menos superficie de desincronización.

**Negativas / riesgos**
- `useSyncExternalStore` es una API menos familiar que Context para quien no la usó antes; exige entender snapshot/subscribe correctamente para no romper la regla de referencial-igualdad en re-renders.

## Requisitos No Funcionales derivados

**RNF-14 — El estado de sesión debe seguir siendo una única fuente de verdad incluso con múltiples builds de React coexistiendo en la misma página (host + 3 remotes).** (ver también [ADR-05](ADR-05-singleton-sessionstore-symbol.md))
`useSyncExternalStore` lee de un store externo a React, evitando el problema de doble árbol de Context entre host y remotes con instancias de React potencialmente distintas.

## Alternativas consideradas

- `SessionContext` + `Provider` en el shell: descartada porque Module Federation con `singleton: true` en `react`/`react-dom` reduce pero no garantiza una única instancia de React entre host y remotes, y Context es frágil ante esa ambigüedad — un store externo con `Symbol.for` (ver ADR-05) no depende de eso.
