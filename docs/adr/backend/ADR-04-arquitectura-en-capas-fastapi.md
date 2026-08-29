# ADR-04: Arquitectura en capas por microservicio (FastAPI + SQLAlchemy + Alembic)

**Estado:** Aceptada — 2026-08-29

## Contexto

Los cuatro microservicios independientes necesitaban una estructura interna consistente para no reinventar convenciones en cada uno.

## Decisión

Cada microservicio seguirá una arquitectura en capas uniforme: `api/` (routers FastAPI), `core/` (config, security, dependencies), `db/` (conexión/base), `models/` (SQLAlchemy ORM), `repositories/` (acceso a datos), `schemas/` (Pydantic, request/response), `services/` (lógica de negocio, incluidas las validaciones de reglas de negocio). Migraciones de schema vía Alembic.

## Consecuencias

**Positivas**
- Consistencia entre los 4 microservicios: quien conoce la estructura de uno navega los otros tres sin curva de aprendizaje adicional.
- Separación clara entre lógica de negocio (`services/`) y acceso a datos (`repositories/`) — testeable de forma aislada, y es donde viven las validaciones de reglas de negocio en `Ms Reservas`.
- Alembic da control de versiones sobre el schema de base de datos, coherente con el resto del stack Python.

**Negativas / riesgos**
- `Ms Reportes` es el último microservicio en el orden de fases del proyecto, por lo que su estructura de persistencia puede quedar rezagada respecto a los otros tres mientras su modelo de datos no esté definido.
- Sin inyección de dependencias real ni interfaces en la capa de servicios, mockear la lógica de negocio en tests requiere tocar sus dependencias concretas directamente.

## Requisitos No Funcionales derivados

**RNF-13 — Los 4 microservicios deben mantener una estructura interna navegable de forma uniforme entre sí.**
Arquitectura en capas idéntica (`api/core/db/models/repositories/schemas/services`) en los 4 `ms-*`.

## Alternativas consideradas

- Arquitectura hexagonal/puertos-adaptadores explícita: más ceremonia de la que un proyecto académico de este alcance probablemente justifica; la estructura en capas actual ya separa razonablemente las responsabilidades sin ese costo adicional.
