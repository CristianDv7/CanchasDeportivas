# ADR-01: Proxy same-origin del dev-server en vez de CORS en el backend

**Estado:** Aceptado — 2026-08-26
**Evidencia en código:** `frontend/apps/shell/rsbuild.config.ts` (bloque `server.proxy`).

## Contexto

El shell corre en `localhost:3000` y necesita hablar con 4 microservicios FastAPI en puertos distintos (`8001`-`8004`). Ninguno de los `ms-*` registra `CORSMiddleware`. Wilson todavía no entregó el API Gateway, así que hoy no hay un punto de entrada único real.

## Decisión

El dev-server de Rsbuild del shell expone un proxy interno que reescribe `/api/usuarios`, `/api/canchas`, `/api/reservas`, `/api/reportes` hacia los microservicios reales. El browser solo ve un origen (`localhost:3000`); el proxy hace el fan-out server-side. Ningún `ms-*` necesita CORS.

## Consecuencias

**Positivas**
- El navegador nunca hace una petición cross-origin real: cero configuración de CORS en 4 microservicios que no son nuestro código.
- El prefijo `/api/<servicio>` es exactamente el contrato que el Gateway de Wilson debería replicar cuando exista — la migración es transparente para el frontend.

**Negativas / riesgos**
- El proxy solo existe en modo desarrollo (`rsbuild dev`). Un build de producción servido como estático no tiene backend detrás — deuda conocida y consciente: se resuelve recién cuando el Gateway esté listo.
- Mientras no exista el Gateway, el frontend depende de conocer los 4 puertos reales de los microservicios (hoy asumidos 8001-8004, confirmados por Cristian en el commit `33afd66` de los `.env`).

## Requisitos No Funcionales derivados

**RNF-17 — Portabilidad y despliegue: el sistema completo debe poder levantarse con un único comando reproducible.** *(no cumplido hoy — objetivo pendiente; ver también [ADR-backend-06](../backend/ADR-06-docker-compose-postgres-unico.md))*
El proxy resuelve same-origin solo en modo desarrollo (`rsbuild dev`); un build de producción servido como estático no tiene backend detrás sin el Gateway de Wilson.

## Alternativas consideradas

- Habilitar CORS en cada `ms-*`: descartada porque son microservicios de otro compañero (Cristian) y esto acopla su código a una decisión de infraestructura del frontend.
