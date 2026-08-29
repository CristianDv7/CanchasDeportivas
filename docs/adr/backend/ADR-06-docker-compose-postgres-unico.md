# ADR-06: Orquestación con Docker Compose y una única instancia Postgres

**Estado:** Aceptada — 2026-08-29

## Contexto

Los requisitos del proyecto piden "todo orquestado con Docker Compose". El plan de fases prioriza primero la base de datos y luego la containerización completa de los microservicios.

## Decisión

Se containeriza primero únicamente la base de datos. Es consistente con un orden de fases incremental: primero esqueletos + reglas de negocio, integración/Docker completo más adelante.

## Consecuencias

**Positivas**
- Desarrollo local más rápido de iterar: no hay que reconstruir una imagen Docker por cada cambio de código en un microservicio, alcanza con recargar uvicorn.

**Negativas / riesgos**
- Fue una etapa intermedia: hasta completar la containerización de los 4 microservicios y el Api Gateway ([gateway/01](../gateway/ADR-01-nginx-reverse-proxy.md)), no hubo forma de levantar el sistema completo con un solo comando reproducible.

## Requisitos No Funcionales derivados

**RNF-11 — Un dominio de datos caído no debe afectar la disponibilidad de los otros dominios a nivel de infraestructura.** *(riesgo aceptado para el alcance del curso; ver también [ADR-01](ADR-01-schema-per-domain-postgres-compartido.md))*

**RNF-17 — El sistema completo debe poder levantarse con un único comando reproducible.** *(cumplido — ver [gateway/01](../gateway/ADR-01-nginx-reverse-proxy.md))*
Docker Compose orquesta los 4 microservicios, los 4 apps de frontend y el Api Gateway junto a Postgres.

## Alternativas consideradas

No aplica — es un estado de progreso hacia el objetivo final pedido por los requisitos del proyecto, no una decisión definitiva alternativa a Docker Compose completo.
