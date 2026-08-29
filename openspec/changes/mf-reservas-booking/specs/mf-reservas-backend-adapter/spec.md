# mf-reservas-backend-adapter Specification

## Purpose

Capa `src/api/` (`reservasApi.ts`, `canchasApi.ts`, `dto.ts`, `errors.ts`) que es el único punto de `mf-reservas` que conoce paths y shapes crudos del backend, y el único punto a tocar cuando exista gateway. Traduce shape crudo → DTO propio y mapea errores por `status`, nunca por texto de `detail`.

## Requirements

### Requirement: Mapeo de shape crudo a DTO

El adapter MUST traducir las respuestas crudas del backend (snake_case, strings ISO) a DTOs propios en camelCase (`Reserva`, `BloqueHorario`, `Cancha`, `Disponibilidad`), sin exponer nombres de campos ni paths del backend fuera de `src/api/`. Fechas y horas MUST permanecer como strings (`YYYY-MM-DD`, `HH:mm:ss`) en el DTO.

#### Scenario: reservasApi mapea ReservaResponse

- GIVEN una respuesta cruda `ReservaResponse` de `POST/GET /reservas/`
- WHEN `reservasApi` la procesa
- THEN devuelve un `Reserva` DTO en camelCase con fechas/horas como strings, sin campos extra del backend

#### Scenario: canchasApi mapea disponibilidad

- GIVEN una respuesta cruda de `GET /reservas/disponibilidad` (contrato propuesto entregado por backend)
- WHEN `canchasApi.getDisponibilidad()` la procesa
- THEN devuelve un `Disponibilidad` DTO en camelCase con `BloqueHorario[]` anidados, sin campos extra del backend

### Requirement: Mapeo de errores por status

`mapApiError` MUST decidir la acción exclusivamente por `status` (nunca por el texto de `detail`), y MUST devolver `{message, action}` según esta tabla:

| status | message | action |
|--------|---------|--------|
| 400 | `detail` verbatim | refetch de disponibilidad |
| 403 | mensaje propio | ninguna |
| 404 | mensaje propio | ninguna |
| 422 | `detail` (ya aplanado) | ninguna |
| network/server | mensaje genérico | reintento |

El adapter MUST NOT ramificar por el texto de `detail` para decidir el `action`, incluso cuando `apiClient` reporta `code: "unknown"` en 400 — `status` es el único discriminador confiable.

#### Scenario: 400 con code unknown

- GIVEN un `ApiError` con `status=400` y `code="unknown"`
- WHEN `mapApiError` lo procesa
- THEN devuelve `action=refetch` basado en `status`, no en `code` ni en `detail`

#### Scenario: 403/404 con mensaje propio

- GIVEN un `ApiError` con `status` 403 o 404
- WHEN `mapApiError` lo procesa
- THEN devuelve un `message` propio del adapter, ignorando el `detail` recibido

#### Scenario: 422 aplanado

- GIVEN un `ApiError` con `status=422`
- WHEN `mapApiError` lo procesa
- THEN devuelve el `detail` ya aplanado a un string legible

#### Scenario: network/server con reintento

- GIVEN un error de red o `status>=500`
- WHEN `mapApiError` lo procesa
- THEN devuelve un mensaje genérico con `action=retry`
