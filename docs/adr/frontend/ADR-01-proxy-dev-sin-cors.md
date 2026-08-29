# ADR-01: Proxy same-origin del dev-server en vez de CORS en el backend

**Estado:** Aceptado — 2026-08-26

## Contexto

El shell corre en `localhost:3000` durante desarrollo sin Docker y necesita hablar con 4 microservicios FastAPI en puertos distintos (`8001`-`8004`). Ninguno de los `ms-*` registra CORS.

## Decisión

El dev-server de Rsbuild del shell expone un proxy interno que reescribe `/api/usuarios`, `/api/canchas`, `/api/reservas`, `/api/reportes` hacia los microservicios reales. El browser solo ve un origen (`localhost:3000`); el proxy hace el fan-out server-side. Ningún `ms-*` necesita CORS.

## Consecuencias

**Positivas**
- El navegador nunca hace una petición cross-origin real: cero configuración de CORS en 4 microservicios que no son nuestro código.
- El prefijo `/api/<servicio>` es exactamente el contrato que el Api Gateway replica en Docker Compose ([gateway/01](../gateway/ADR-01-nginx-reverse-proxy.md)) — la migración fue transparente para el frontend.

**Negativas / riesgos**
- El proxy solo existe en modo desarrollo sin Docker. Un build de producción servido como estático no tiene backend detrás si no corre a través del Api Gateway.
- En modo desarrollo sin Docker, el frontend depende de conocer los 4 puertos reales de los microservicios (8001-8004).

## Requisitos No Funcionales derivados

**RNF-17 — Portabilidad y despliegue: el sistema completo debe poder levantarse con un único comando reproducible.** *(cumplido — ver [gateway/01](../gateway/ADR-01-nginx-reverse-proxy.md))*
El proxy resuelve same-origin en modo desarrollo sin Docker; con Docker Compose, el Api Gateway cumple el mismo rol para el sistema completo.

## Alternativas consideradas

- Habilitar CORS en cada `ms-*`: descartada porque son microservicios de otro bloque del equipo y esto acopla su código a una decisión de infraestructura del frontend.
