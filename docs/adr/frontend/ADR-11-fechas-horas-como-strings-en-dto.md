# ADR-11: Fechas/horas como `string` en el DTO, nunca `Date`

**Estado:** Aceptado — 2026-08-27
**Evidencia en código:** `frontend/apps/mf-reservas/src/api/dto.ts` (campos de fecha/hora tipados `string`) y `src/domain/rules.ts` (único lugar que parsea/compara contra el reloj).

## Contexto

`ms-reservas` devuelve fecha (`YYYY-MM-DD`) y horas (`HH:MM`) como strings ISO. RN-04 (no cancelar reservas que ya iniciaron) requiere comparar esa fecha/hora contra el reloj actual del cliente.

## Decisión

Los DTOs del frontend mantienen fecha/hora como `string`, no las parsean a `Date` al cruzar la frontera API → DTO. El parseo a `Date` (u operación equivalente) ocurre recién en el punto de uso — específicamente en `domain/rules.ts`, donde vive la lógica de RN-04.

## Consecuencias

**Positivas**
- Evita bugs de timezone silenciosos: `new Date("2026-08-27")` en JS se interpreta como UTC medianoche, no como medianoche local — una fuente clásica de off-by-one-day si se parsea temprano y se usa tarde sin cuidado. Mantener `string` hasta el punto de uso reduce las oportunidades de ese bug.
- `domain/rules.ts` queda como el único lugar que decide cómo se interpreta el tiempo — testeable de forma aislada y pura (ver [ADR-12](ADR-12-reglas-negocio-cliente-solo-computable.md)).

**Negativas / riesgos**
- Cualquier componente que necesite mostrar o comparar fechas debe saber que recibe un string y parsear explícitamente — no hay tipo `Date` que lo fuerce a manejarlo correctamente por el sistema de tipos.

## Requisitos No Funcionales derivados

**RNF-08 — Los datos de fecha/hora no deben interpretarse de forma ambigua respecto a zona horaria en ningún punto del pipeline frontend.**
Fecha/hora se mantienen como `string` hasta el único punto de uso que las interpreta (`domain/rules.ts`), evitando el bug clásico de parsear `Date` tempranamente en JS.

## Alternativas consideradas

- Parsear a `Date` en el mapper (borde API → DTO): descartada porque mueve la ambigüedad de timezone al punto más temprano posible, justo donde es más difícil de auditar más tarde.
