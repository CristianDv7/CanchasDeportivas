# ADR-05: Singleton de `SessionStore` vía `Symbol.for` global

**Estado:** Aceptado — 2026-08-26

## Contexto

Module Federation resuelve remotes bajo demanda. Existe riesgo de que, bajo ciertos escenarios de carga (HMR, remounts, o un remote que también empaqueta su propia copia del módulo de sesión por error), terminen conviviendo dos instancias del `SessionStore` — y entonces "iniciar sesión" en una y "leer sesión" en la otra ven estados distintos.

## Decisión

`getOrCreateSessionStore()` guarda la instancia en `globalThis[Symbol.for('canchasdeportivas.session.store.v1')]`. Cualquier bundle que ejecute esta función, sin importar cuántas veces se haya evaluado el módulo, reutiliza la misma instancia si ya existe en el `globalThis` del browser.

## Consecuencias

**Positivas**
- Defensa activa contra duplicación de instancias de Module Federation: neutraliza el riesgo de que la estrategia de carga de remotes deje convivir dos instancias del store.

**Negativas / riesgos**
- Usar `globalThis` como mecanismo de singleton es un patrón que puede sorprender a alguien que no conozca la razón (por eso queda documentado acá). Si en el futuro se necesitan sesiones múltiples/aisladas en una misma página (ej. multi-tenant), este patrón hay que revisitarlo.

## Requisitos No Funcionales derivados

**RNF-14 — El estado de sesión debe seguir siendo una única fuente de verdad incluso con múltiples builds de React coexistiendo en la misma página.** (ver también [ADR-04](ADR-04-usesyncexternalstore-sesion.md))
El singleton vía `Symbol.for` sobre `globalThis` garantiza una única instancia de `SessionStore` sin importar cuántas veces se evalúe el módulo en distintos bundles.

## Alternativas consideradas

- Confiar únicamente en el mecanismo de singleton de Module Federation para `react`/`react-dom`: insuficiente, porque no cubre módulos propios del shell como el store de sesión — ese mecanismo solo dedupe paquetes declarados explícitamente, no todo el grafo de módulos expuestos.
