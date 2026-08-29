# ADR-10: Fetching propio (`useResource`/`useAction`), sin TanStack Query ni caché compartida

**Estado:** Aceptado — 2026-08-27

## Contexto

Las 3 pantallas de `mf-reservas` (disponibilidad, nueva reserva, mis reservas) necesitan pedir y mutar datos contra `ms-reservas`/`ms-canchas`. Existían dos caminos: sumar una librería de data-fetching (TanStack Query) o escribir hooks propios mínimos.

## Decisión

Se escribieron `useResource` (fetch + estados de carga/error) y `useAction` (mutación) como hooks propios, sin librería externa, y explícitamente **sin caché compartida entre pantallas**: cada pantalla vuelve a pedir sus datos al montarse, no lee de un caché global.

## Consecuencias

**Positivas**
- Cero dependencia nueva en un remote que ya es chico — menos superficie de bundle, menos versión que sincronizar contra `shared` de Module Federation.
- Sin caché compartida, no hay riesgo de mostrar disponibilidad desactualizada en una pantalla después de crear/cancelar una reserva en otra — correctitud por sobre performance, adecuado para RN-02 (evitar reservar un bloque ya ocupado por datos viejos).

**Negativas / riesgos**
- Cada pantalla repite requests que TanStack Query dedupe/cachea automáticamente — más tráfico de red del estrictamente necesario. Aceptable a la escala actual (proyecto académico, pocos usuarios concurrentes), no necesariamente a escala mayor.
- Si `mf-administracion` o `mf-reportes` necesitan patrones de fetching más ricos (paginación, invalidación cruzada), este hook propio no escala sin reescritura — no fue diseñado para eso.

## Requisitos No Funcionales derivados

**RNF-15 — Las pantallas de `mf-reservas` deben priorizar corrección sobre minimizar tráfico de red.**
Sin caché compartida entre pantallas: cada pantalla vuelve a pedir sus datos, evitando mostrar disponibilidad desactualizada tras crear/cancelar una reserva en otra pantalla — a costa de más requests de los estrictamente necesarios.

## Alternativas consideradas

- TanStack Query: descartada para esta fase por sumar una dependencia y una curva de configuración (query keys, invalidación) que no se justifican para 3 pantallas con requests simples; queda como candidata legítima si `mf-administracion`/`mf-reportes` la necesitan.
