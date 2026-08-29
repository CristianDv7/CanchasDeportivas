# mf-reportes-backend-adapter Specification

## Purpose

Capa `src/api/` (`reportesApi.ts`, `dto.ts`, `mappers.ts`, `errors.ts`) que es el único punto de `mf-reportes` que conoce paths y shapes crudos de `ms-reportes`. Traduce shape crudo → DTO propio y mapea errores por `status`, con rama propia para el 502 opaco del agregador.

## Requirements

### Requirement: Mapeo de ocupación por cancha a DTO

El adapter MUST traducir la respuesta cruda de `GET /reportes/ocupacion/canchas` (`list[{cancha_id, cancha, reservas}]`) a un DTO propio en camelCase (`OcupacionCancha[]` con `canchaId`, `cancha`, `reservas`), sin exponer nombres de campos ni paths del backend fuera de `src/api/`.

#### Scenario: Mapeo exitoso de ocupación

- GIVEN una respuesta cruda `list[{cancha_id, cancha, reservas}]` de `ms-reportes`
- WHEN `reportesApi.getOcupacionCanchas()` la procesa
- THEN devuelve `OcupacionCancha[]` en camelCase con los mismos valores, sin campos extra del backend

#### Scenario: Cancha con 0 reservas se preserva

- GIVEN una respuesta cruda que incluye una entrada con `reservas: 0`
- WHEN el adapter la mapea
- THEN el DTO resultante conserva esa entrada con `reservas: 0` (no se filtra ni se omite)

### Requirement: Mapeo de reservas por período a DTO

El adapter MUST traducir la respuesta cruda de `GET /reportes/reservas/periodo?fecha_inicio&fecha_fin` (`{fecha_inicio, fecha_fin, total_reservas}`) a un DTO propio en camelCase (`ReservasPeriodo` con `fechaInicio`, `fechaFin`, `totalReservas`), pasando `fecha_inicio`/`fecha_fin` como query params en formato `YYYY-MM-DD`.

#### Scenario: Mapeo exitoso de reservas por período

- GIVEN una respuesta cruda `{fecha_inicio, fecha_fin, total_reservas}` de `ms-reportes`
- WHEN `reportesApi.getReservasPeriodo(fechaInicio, fechaFin)` la procesa
- THEN devuelve un `ReservasPeriodo` DTO en camelCase con los mismos valores

### Requirement: Mapeo de errores por status con rama propia para 502

`mapApiError` MUST decidir la acción exclusivamente por `status` (nunca por el texto de `detail`), y MUST devolver `{message, action}` según esta tabla:

| status | message | action |
|--------|---------|--------|
| 400 | `detail` verbatim | ninguna (bloqueado antes del request por validación client-side) |
| 502 | "No se pudieron obtener los datos de canchas o reservas para armar el reporte" | retry |
| network / otros `>=500` | mensaje genérico | retry |

El 502 MUST tener una rama separada del genérico `>=500`, y su mensaje MUST NOT inventar cuál microservicio upstream falló (el backend no lo distingue).

#### Scenario: 400 con detail del backend

- GIVEN un `ApiError` con `status=400` (rango de fechas inválido) que llegó a pesar de la validación client-side
- WHEN `mapApiError` lo procesa
- THEN devuelve el `detail` del backend verbatim como `message`

#### Scenario: 502 con mensaje de disyunción honesta

- GIVEN un `ApiError` con `status=502`
- WHEN `mapApiError` lo procesa
- THEN devuelve `message="No se pudieron obtener los datos de canchas o reservas para armar el reporte"` y `action="retry"`, distinto del mensaje genérico de `>=500`

#### Scenario: network/otros 5xx con reintento genérico

- GIVEN un error de red o un `status>=500` distinto de 502
- WHEN `mapApiError` lo procesa
- THEN devuelve un mensaje genérico con `action="retry"`
