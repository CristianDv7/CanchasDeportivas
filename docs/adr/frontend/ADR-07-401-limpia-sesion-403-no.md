# ADR-07: 401 limpia la sesión, 403 no

**Estado:** Aceptado — 2026-08-26
**Evidencia en código:** `frontend/apps/shell/src/http/client.ts` y `client.test.ts` (tests 401/403).

## Contexto

El `apiClient` federado recibe respuestas de los 4 microservicios. Un `401` y un `403` significan cosas distintas: el primero dice "tu credencial no es válida" (token vencido, inexistente, corrupto); el segundo dice "tu credencial es válida pero no tenés permiso para esto" (ej. un usuario no-admin intentando cancelar la reserva de otro, RN-03).

## Decisión

El `apiClient` distingue ambos casos: un `401` dispara limpieza de sesión (equivalente a logout) — con un guard para no repetir el efecto múltiples veces si llegan varios 401 en paralelo ("once-guard"). Un `403` no toca la sesión: el usuario sigue logueado, solo se le informa que esa acción puntual no está permitida.

## Consecuencias

**Positivas**
- Evita el bug típico de "tratar 403 como si fuera 401" y deslogar a un usuario válido solo porque intentó una acción sin permiso — mala UX y falso positivo de seguridad.
- El once-guard evita loops de logout si varias requests en vuelo devuelven 401 al mismo tiempo (ej. al volver de background con el token ya vencido).

**Negativas / riesgos**
- Depende de que los 4 microservicios respeten la semántica HTTP correcta (401 vs 403) de forma consistente — si algún `ms-*` devuelve 401 donde debería ser 403 (o viceversa), la UX se degrada silenciosamente. No hay contrato formal todavía que lo garantice (pendiente del Gateway).

## Requisitos No Funcionales derivados

**RNF-18 — La sesión no debe destruirse ante una respuesta de autorización insuficiente (403), solo ante una credencial inválida (401).**
Confundir ambos casos es la causa más común de desloguear a un usuario válido por intentar una acción sin permiso; el `apiClient` distingue explícitamente 401 de 403, con un once-guard para no repetir el logout ante varios 401 en paralelo.

## Alternativas consideradas

- Tratar 401 y 403 igual (logout en ambos): descartada, es la causa más común de "por qué me desloguea si yo estoy bien logueado" en apps con RBAC granular.
