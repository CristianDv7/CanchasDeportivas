# ADR-08: Guards de ruta como layout routes con `<Outlet/>`

**Estado:** Aceptado — 2026-08-26

## Contexto

Con React Router, proteger una ruta se puede hacer envolviendo cada página individualmente (`<RequireAuth><MiPagina/></RequireAuth>`) o declarando el guard como una route de layout que envuelve un grupo de rutas hijas vía `<Outlet/>`.

## Decisión

`RequireAuth` y `RequireRole` se usan como elemento de una `<Route>` padre, con las rutas protegidas anidadas debajo como hijas que renderizan a través de `<Outlet/>`.

## Consecuencias

**Positivas**
- Agregar una ruta nueva dentro de una sección ya protegida (ej. una nueva pantalla dentro de `/administracion`) es imposible de dejar desprotegida por olvido: nace anidada bajo el guard, no requiere que alguien recuerde envolverla manualmente.
- Un solo lugar concentra la lógica de "quién entra acá", en vez de un `if` repetido en cada componente de página.

**Negativas / riesgos**
- Requiere entender bien el patrón de layout routes de React Router (elemento padre + `<Outlet/>`) para quien vaya a agregar rutas nuevas — un poco menos obvio a primera vista que envolver cada página.

## Requisitos No Funcionales derivados

**RNF-03 — Ninguna decisión de autorización de UI reemplaza la autoridad del servidor.** (ver también [ADR-06](ADR-06-rol-desconocido-privilegio-minimo.md))
Los guards son capas de UX que anidan rutas; el backend es quien realmente rechaza accesos no autorizados vía 401/403, no el frontend.

## Alternativas consideradas

- Wrapping manual por página: descartada porque es la fuente número uno de rutas "olvidadas sin proteger" en aplicaciones que crecen con el tiempo — falla por omisión, no por diseño.
