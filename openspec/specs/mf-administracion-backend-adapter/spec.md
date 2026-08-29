# mf-administracion-backend-adapter Specification

## Purpose

Capa `src/api/` de `mf-administracion` (`canchasApi.ts`, `horariosApi.ts`, `reservasAdminApi.ts`, `usuariosApi.ts`, `dto.ts`, `mappers.ts`, `errors.ts`) que es el único punto que conoce paths y shapes crudos de `ms-canchas`, `ms-reservas` y `ms-usuarios`, y el único a tocar cuando exista gateway.

## Requirements

### Requirement: Mapeo de shape crudo a DTO

El adapter MUST traducir las respuestas crudas (snake_case) de `ms-canchas`, `ms-reservas` y `ms-usuarios` a DTOs propios en camelCase (`Cancha`, `HorarioAtencion`, `Reserva`, `Usuario`), sin exponer nombres de campos ni paths crudos fuera de `src/api/`.

#### Scenario: canchasApi mapea CanchaResponse

- GIVEN una respuesta cruda `CanchaResponse` de `ms-canchas`
- WHEN `canchasApi` la procesa
- THEN devuelve un `Cancha` DTO en camelCase sin campos crudos extra

#### Scenario: reservasAdminApi mapea vista total

- GIVEN una respuesta cruda `list[ReservaResponse]` de `GET /reservas/` con vista total (admin)
- WHEN `reservasAdminApi` la procesa
- THEN devuelve `Reserva[]` DTOs en camelCase, uno por cada reserva de cualquier usuario

### Requirement: Enrichment client-side por join

El adapter (o la capa que lo consume) MUST resolver `cancha` y `usuario` para cada reserva mediante joins en memoria (`Map` por id) construidos a partir de `GET /canchas` y `GET /usuarios` en paralelo con `GET /reservas/`, y MUST degradar por separado si una de las dos fuentes de enrichment falla, sin afectar la lista de reservas ni la cancelación.

#### Scenario: Enrichment con las tres fuentes disponibles

- GIVEN respuestas exitosas de `GET /reservas/`, `GET /canchas` y `GET /usuarios`
- WHEN se construye el listado enriquecido
- THEN cada reserva incluye nombre de cancha y de usuario resueltos por `Map`

#### Scenario: Falla GET /usuarios, reservas y cancelación siguen operables

- GIVEN que `GET /usuarios` falla
- WHEN se construye el listado
- THEN las reservas se muestran con `usuario_id` crudo y la cancelación sigue disponible

### Requirement: Mapeo de errores por status

`mapApiError` MUST decidir mensaje y acción exclusivamente por `status`, según esta tabla:

| status | message | action |
|--------|---------|--------|
| 403 | "no tenés permisos" | ninguna |
| 404 | mensaje propio (recurso eliminado) | refetch del listado afectado |
| 400 | `detail` verbatim | refetch del listado afectado |
| 422 | `detail` aplanado | ninguna |
| network/server | mensaje genérico | reintento |

El adapter MUST NOT ramificar por el texto de `detail` para decidir la acción.

#### Scenario: 404 dispara refetch

- GIVEN un `ApiError` con `status=404` en una operación sobre cancha, horario o reserva
- WHEN `mapApiError` lo procesa
- THEN devuelve `action=refetch` para refrescar el listado afectado

#### Scenario: 403 no ramifica por texto

- GIVEN un `ApiError` con `status=403`
- WHEN `mapApiError` lo procesa
- THEN devuelve el mensaje fijo "no tenés permisos", ignorando el `detail` recibido
