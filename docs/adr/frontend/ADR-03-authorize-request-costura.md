# ADR-03: `authorizeRequest(init)` como costura, en vez de exponer `getToken()`

**Estado:** Aceptado — 2026-08-26

## Contexto

El `apiClient` federado necesita adjuntar credenciales a cada request. La estrategia de almacenamiento del token de hoy es `sessionStorage`, pero los requisitos de seguridad del proyecto dejan abierta la puerta a migrar a cookies `httpOnly` en el futuro (el token deja de ser legible por JS).

## Decisión

`SessionStore` no expone un método `getToken()` que devuelva el string crudo. En su lugar expone `authorizeRequest(init: RequestInit): RequestInit | null`, que recibe la config de un `fetch` y devuelve la config ya autorizada (o `null` si no hay sesión). Es el único punto de costura entre "cómo se representa la credencial" y "cómo se usa".

## Consecuencias

**Positivas**
- Migrar a `httpOnly` cookies el día de mañana es un cambio de implementación interna de `authorizeRequest` (dejar de setear el header `Authorization` y confiar en `credentials: 'include'`), sin tocar ni un solo consumidor (`apiClient`, ni ningún remote).
- Ningún código fuera de `session/` puede leer el token en texto plano — reduce superficie de XSS que exfiltre credenciales.

**Negativas / riesgos**
- Es una decisión que paga dividendos recién si efectivamente se migra a cookies; hoy sigue siendo `sessionStorage`, con el riesgo estándar de XSS que eso implica (aceptado como límite conocido de Fase 1).

## Requisitos No Funcionales derivados

**RNF-01 — Superficie de credenciales aislada en un único módulo.** (ver también [ADR-02](ADR-02-sesion-http-federados.md))
`authorizeRequest` es el único punto que sabe cómo se representa la credencial; ningún consumidor la lee directamente en texto plano.

**RNF-02 — La estrategia de almacenamiento de credenciales debe poder migrar sin tocar consumidores.**
Migrar de `sessionStorage` a cookies `httpOnly` debe ser un cambio interno de `authorizeRequest`, sin modificar `apiClient` ni ningún remote.

## Alternativas consideradas

- `getToken(): string | null` expuesto directamente: descartada porque ata a todos los consumidores a la representación actual del token y hace cara cualquier migración futura de estrategia de auth.
