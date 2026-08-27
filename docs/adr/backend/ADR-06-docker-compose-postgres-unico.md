# ADR-06: Orquestación con Docker Compose y una única instancia Postgres

**Estado:** Observado (no confirmado por Cristian/Wilson) — 2026-08-27
**Evidencia en código:** `backend/docker-compose.yml` — hoy solo define el servicio `postgres` (imagen `postgres:16`, puerto host `5433`); los 4 microservicios FastAPI no están containerizados todavía, corren de forma nativa/local durante desarrollo.

## Contexto

Los requisitos del proyecto piden "todo orquestado con Docker Compose". A la fecha de este ADR, `docker-compose.yml` solo levanta la base de datos — los microservicios se ejecutan fuera de Docker en desarrollo (uvicorn local contra los `.env` de cada uno).

## Decisión (observada, estado intermedio)

Se containeriza únicamente la base de datos por ahora. Es consistente con un orden de fases incremental: primero esqueletos + reglas de negocio, integración/Docker completo más adelante.

## Consecuencias

**Positivas**
- Desarrollo local más rápido de iterar: no hay que reconstruir una imagen Docker por cada cambio de código en un microservicio, alcanza con recargar uvicorn.

**Negativas / riesgos**
- El objetivo final del proyecto (todo orquestado con Docker Compose) todavía no está cumplido — falta un `Dockerfile` por microservicio y su servicio correspondiente en `docker-compose.yml`, más el `apigateway/` de Wilson (hoy inexistente en el compose).
- Sin esto, no hay forma de levantar el sistema completo con un solo comando reproducible — cualquier evaluador del curso necesita levantar cada `ms-*` a mano con sus propias variables de entorno.

## Requisitos No Funcionales derivados

**RNF-11 — Un dominio de datos caído no debe afectar la disponibilidad de los otros dominios a nivel de infraestructura.** *(no cumplido hoy; ver también [ADR-01](ADR-01-schema-per-domain-postgres-compartido.md))*

**RNF-17 — El sistema completo debe poder levantarse con un único comando reproducible.** *(no cumplido hoy — objetivo pendiente; ver también ADR-frontend-01)*
Hoy solo Postgres está containerizado; faltan los 4 `ms-*` y el API Gateway en el `docker-compose.yml`.

## Alternativas consideradas

No aplica — es un estado de progreso hacia el objetivo final pedido por los requisitos del proyecto, no una decisión definitiva alternativa a Docker Compose completo.
