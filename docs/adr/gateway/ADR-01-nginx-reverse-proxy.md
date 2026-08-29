# ADR-01: Api Gateway implementado con Nginx como reverse proxy, no como microservicio FastAPI

**Estado:** Aceptada — 2026-08-29

## Contexto

La guía del curso dejaba abierta la elección de tecnología para el Api Gateway entre un microservicio FastAPI propio o un proxy dedicado. El Gateway no tiene lógica de negocio propia: su única responsabilidad es enrutar cada request al microservicio correspondiente o al Shell/Host, y reenviar el header `Authorization` sin revalidarlo — cada microservicio ya valida el JWT de forma independiente (ver ADR-03 (Backend)).

## Decisión

El Api Gateway se implementará con Nginx como reverse proxy. Cinco reglas de enrutamiento cubren el contrato de rutas: una por microservicio (`/api/usuarios/*` incluyendo `/auth` y `/usuarios`, `/api/canchas/*`, `/api/reservas/*`, `/api/reportes/*`) y una quinta que reenvía el resto del tráfico al Shell/Host, con soporte de actualización a WebSocket para HMR en desarrollo.

## Consecuencias

**Positivas**
- Nginx resuelve el enrutamiento y el reenvío de headers sin escribir ni mantener código propio para una responsabilidad puramente de infraestructura.
- Al ser el único punto al que el navegador le habla directo, ningún microservicio necesita CORS — cae por completo esa responsabilidad, que un Gateway FastAPI sí hubiera tenido que asumir.
- El mismo contrato de rutas que ya replicaba el proxy de desarrollo del shell (ADR-01 (Frontend)) hace que la migración sea transparente para el frontend.

**Negativas / riesgos**
- La lógica de ruteo queda en configuración declarativa en vez de código versionado con tests propios del equipo.
- Cualquier regla más compleja que un reenvío directo (rate limiting, transformación de payload, lógica de negocio en el borde) exigiría revisar esta decisión — Nginx no es un framework de aplicación.

## Requisitos No Funcionales derivados

**RNF-17 — El sistema completo debe poder levantarse con un único comando reproducible.**
El Api Gateway forma parte de la orquestación completa junto a los 4 microservicios y los 4 apps de frontend — objetivo que este ADR, junto con ADR-06 (Backend), termina de satisfacer.

## Alternativas consideradas

- Api Gateway como microservicio FastAPI propio: descartada porque agrega una responsabilidad de mantenimiento de código (routers, dependencias, tests) para una función que un proxy maduro ya resuelve de forma declarativa y probada.
