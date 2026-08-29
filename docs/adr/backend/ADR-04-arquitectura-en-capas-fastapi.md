# ADR-04: Arquitectura en capas por microservicio (FastAPI + SQLAlchemy + Alembic)

**Estado:** Observado (no confirmado por Cristian) — 2026-08-27
**Evidencia en código:** estructura idéntica en los 4 microservicios: `app/{api,core,db,models,repositories,schemas,services}/`, `alembic/` + `alembic.ini` en 3 de los 4 (`ms-reportes` usa `pytest.ini` sin alembic todavía).

## Contexto

Cuatro microservicios independientes (uno por Cristian) necesitaban una estructura interna consistente para no reinventar convenciones en cada uno.

## Decisión (observada)

Cada microservicio sigue una arquitectura en capas uniforme: `api/` (routers FastAPI), `core/` (config, security, dependencies), `db/` (conexión/base), `models/` (SQLAlchemy ORM), `repositories/` (acceso a datos), `schemas/` (Pydantic, request/response), `services/` (lógica de negocio, ej. `reserva_service.py` con las validaciones RN-01 a RN-06). Migraciones de schema vía Alembic.

## Consecuencias

**Positivas**
- Consistencia entre los 4 microservicios: quien conoce la estructura de uno navega los otros tres sin curva de aprendizaje adicional.
- Separación clara entre lógica de negocio (`services/`) y acceso a datos (`repositories/`) — testeable de forma aislada, y es efectivamente donde viven las reglas RN-01 a RN-06 en `ms-reservas` (ver `services/reserva_service.py`).
- Alembic da control de versiones sobre el schema de base de datos, coherente con el resto del stack Python.

**Negativas / riesgos**
- `ms-reportes` no tiene `alembic/` todavía — inconsistencia menor respecto a los otros 3, posiblemente porque su modelo de datos aún no está definido (`ms-reportes` es el último en el orden de fases sugerido para el proyecto).
- Los métodos de `services/` son `@staticmethod` sobre clases que actúan como namespaces (no hay inyección de dependencias real ni interfaces) — funcional para el alcance actual, pero dificulta mockear `ReservaService` en tests sin tocar sus dependencias concretas (`CanchasClient`, `UsuariosClient`) directamente.

## Requisitos No Funcionales derivados

**RNF-13 — Los 4 microservicios deben mantener una estructura interna navegable de forma uniforme entre sí.**
Arquitectura en capas idéntica (`api/core/db/models/repositories/schemas/services`) en los 4 `ms-*`.

## Alternativas consideradas

- Arquitectura hexagonal/puertos-adaptadores explícita: más ceremonia de la que un proyecto académico de este alcance probablemente justifica; la estructura en capas actual ya separa razonablemente las responsabilidades sin ese costo adicional.
