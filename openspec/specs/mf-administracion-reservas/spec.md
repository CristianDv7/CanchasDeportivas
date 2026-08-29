# mf-administracion-reservas Specification

## Purpose

Panel global de reservas dentro de `mf-administracion`: listado de TODAS las reservas (RN-03, mitad admin) con enrichment client-side de cancha y usuario, filtros locales y cancelación de cualquier reserva, respetando RN-04 sin bypass para admin.

## Requirements

### Requirement: Listado global de reservas

El sistema MUST listar todas las reservas de todos los usuarios vía `GET /reservas/` (vista total para admin), enriquecidas client-side con nombre de cancha y de usuario mediante joins por `Map`.

#### Scenario: Listado enriquecido

- GIVEN reservas de múltiples usuarios y canchas
- WHEN el admin abre el panel de reservas
- THEN cada fila muestra nombre de cancha y nombre de usuario, no solo sus ids

#### Scenario: Degradación si falla GET /usuarios

- GIVEN que `GET /usuarios` responde con error
- WHEN se renderiza el listado
- THEN cada fila muestra `usuario_id` crudo en vez de nombre, y el panel MUST seguir siendo operable (incluida la cancelación)

### Requirement: Filtros client-side con contador

El sistema MUST permitir filtrar el listado en memoria por fecha, cancha y estado, y MUST mostrar un contador "N de M reservas" que refleje el filtrado activo.

#### Scenario: Filtro por estado

- GIVEN un listado con reservas en varios estados
- WHEN el admin filtra por `Confirmada`
- THEN solo se muestran filas `Confirmada` y el contador refleja N filtradas de M totales

### Requirement: Cancelación de cualquier reserva (RN-03 admin)

El sistema MUST permitir al admin cancelar una reserva de cualquier usuario vía `PATCH /reservas/{id}/cancelar`, y ante éxito MUST refetchear el listado.

#### Scenario: Cancelación de reserva ajena exitosa

- GIVEN una reserva `Confirmada` que pertenece a otro usuario, con `fecha+hora_inicio` futura
- WHEN el admin la cancela
- THEN pasa a `Cancelada` y el listado se refresca

### Requirement: RN-04 sin bypass para admin

El botón Cancelar MUST estar deshabilitado para cualquier reserva cuyo `fecha+hora_inicio` (UTC) ya haya iniciado, o cuyo estado no sea `Confirmada`, sin excepción para el rol `administrador`. El cálculo MUST ser client-side (mismo criterio que `mf-reservas`), no delegado únicamente al 400 del backend.

#### Scenario: Reserva ya iniciada, admin no puede cancelar

- GIVEN una reserva `Confirmada` cuyo `fecha+hora_inicio` ya pasó (reloj congelado en test)
- WHEN el admin ve la fila
- THEN el botón Cancelar está deshabilitado, igual que si fuera un usuario final

#### Scenario: Reserva no Confirmada

- GIVEN una reserva en `Cancelada` o `Finalizada`
- WHEN se renderiza la fila
- THEN el botón Cancelar está deshabilitado u oculto para el admin también

### Requirement: Badges de estado (RN-08)

El sistema MUST mostrar un badge visual distinto por cada `estado` (`Confirmada`, `Cancelada`, `Finalizada`) en el panel global.

#### Scenario: Badge por estado en panel global

- GIVEN reservas en los tres estados posibles
- WHEN se listan en el panel de administración
- THEN cada una muestra el badge correspondiente a su estado
