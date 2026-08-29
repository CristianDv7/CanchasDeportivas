# ADR-01: Un schema Postgres por dominio dentro de una única base compartida (no bases separadas)

**Estado:** Aceptada — 2026-08-29

## ⚠️ Corrección respecto a los requisitos originales del proyecto

Los requisitos originales del proyecto describen "una base PostgreSQL por dominio (`usuarios_db`, `canchas_db`, `reservas_db`)". **Eso no es lo que hay implementado.** Hay una única instancia Postgres 16 (`backend-postgres`), una única base de datos (`backend`), con **schemas** separados por dominio dentro de esa misma base. Es una arquitectura distinta, con implicancias distintas — de ahí este ADR corrector.

## Contexto

El diseño original planteado por los requisitos del proyecto pedía aislamiento fuerte: una base de datos física por microservicio, ideal para que cada `ms-*` sea dueño exclusivo de sus datos sin ninguna posibilidad de acceso cruzado accidental.

## Decisión

El backend aislará por **schema** (`usuarios`, `canchas`, `reservas`) dentro de una única base y una única instancia de Postgres, orquestada con Docker Compose.

## Consecuencias

**Positivas**
- Un solo container Postgres que levantar en desarrollo — más simple para el equipo que 3-4 instancias independientes.
- Sigue habiendo aislamiento lógico razonable (cada microservicio apunta a su propio schema) sin la complejidad operativa de gestionar múltiples instancias/bases.

**Negativas / riesgos**
- El aislamiento es más débil que bases separadas: nada a nivel de infraestructura impide que un microservicio con las credenciales correctas acceda directo a un schema ajeno — la arquitectura exige que `Ms Reservas` valide canchas/usuarios vía HTTP contra los otros servicios (ver [ADR-02](ADR-02-comunicacion-sincrona-rest-entre-microservicios.md)) en vez de acceder a su schema directamente, pero el schema compartido no lo *fuerza* a nivel de DB.
- Una única instancia Postgres es un único punto de fallo para los 3 dominios: si el container cae, caen los tres microservicios a la vez — no hay aislamiento de disponibilidad entre dominios, solo lógico.

## Requisitos No Funcionales derivados

**RNF-11 — Un dominio de datos caído no debe afectar la disponibilidad de los otros dominios a nivel de infraestructura.** *(no garantizado hoy — deuda técnica aceptada para el alcance del curso; ver también [ADR-06](ADR-06-docker-compose-postgres-unico.md))*
Los 3 dominios comparten una única instancia Postgres; si el container cae, caen los tres microservicios a la vez — un schema compartido no da aislamiento de disponibilidad, solo lógico.

## Alternativas consideradas

- Base de datos separada por microservicio (lo pedido originalmente): más costosa de operar con Docker Compose en un entorno académico sin infraestructura dedicada.
