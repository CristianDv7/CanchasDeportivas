# mf-reportes-dashboard Specification

## Purpose

Dashboard admin-only de `mf-reportes`: 2 paneles de solo lectura (ocupación por cancha, reservas por período) montados sin router interno, reemplazando el placeholder `RemoteHealthCard`.

## Requirements

### Requirement: Panel de ocupación por cancha

El sistema MUST renderizar, al montar `/reportes`, una tabla con una fila por cancha devuelta por `GET /reportes/ocupacion/canchas`, mostrando el nombre de la cancha y su cantidad de reservas, junto a una barra proporcional decorativa (`aria-hidden`, ancho `%` relativo al máximo del conjunto).

#### Scenario: Ocupación con datos

- GIVEN `ms-reportes` devuelve 3 canchas con distintas cantidades de reservas
- WHEN el admin abre `/reportes`
- THEN la tabla muestra las 3 filas con su cantidad y una barra cuyo ancho es proporcional al máximo

#### Scenario: Cancha con 0 reservas se distingue del estado vacío

- GIVEN `ms-reportes` devuelve una cancha con `reservas: 0` entre otras con reservas
- WHEN se renderiza la tabla
- THEN esa cancha aparece como fila con barra en 0%, no se omite ni se confunde con el estado "no hay canchas cargadas"

#### Scenario: Estado vacío real

- GIVEN `ms-reportes` devuelve una lista vacía
- WHEN se renderiza el panel
- THEN se muestra un mensaje de "no hay canchas cargadas", distinto del caso de cancha con 0 reservas

#### Scenario: Error 502 en ocupación

- GIVEN `GET /reportes/ocupacion/canchas` responde 502
- WHEN se intenta cargar el panel
- THEN se muestra el mensaje de disyunción honesta ("No se pudieron obtener los datos de canchas o reservas para armar el reporte") con una acción de reintento

### Requirement: Panel de reservas por período

El sistema MUST permitir al admin elegir un rango de fechas mediante 2 inputs `type="date"` (fecha de inicio, fecha de fin), precargados con un rango por defecto de los últimos 30 días, y MUST mostrar el total de reservas del período consultando `GET /reportes/reservas/periodo` al abrir el panel y al presionar "Actualizar".

#### Scenario: Total del rango por defecto al abrir

- GIVEN el admin abre `/reportes` por primera vez
- WHEN el panel de período se monta
- THEN se dispara la consulta con el rango por defecto (últimos 30 días) y se muestra el `total_reservas` devuelto

#### Scenario: Refetch manual con nuevo rango válido

- GIVEN el admin cambió ambas fechas a un rango válido
- WHEN presiona "Actualizar"
- THEN se dispara una nueva consulta con el rango elegido y se actualiza el total mostrado

#### Scenario: Error 400 del backend se muestra verbatim

- GIVEN el backend responde 400 a un rango que pasó la validación client-side (ej. reglas adicionales del backend)
- WHEN se recibe la respuesta
- THEN se muestra el `detail` del backend tal cual, sin reintento automático

#### Scenario: Error 502 en período

- GIVEN `GET /reportes/reservas/periodo` responde 502
- WHEN se intenta cargar el panel
- THEN se muestra el mismo mensaje de disyunción honesta con acción de reintento

### Requirement: Validación de rango de fechas antes del request

El sistema MUST validar, mediante una función pura en `domain/rules.ts`, que `fecha_inicio <= fecha_fin` antes de disparar el request de período, y MUST bloquear el botón "Actualizar" (o mostrar un mensaje de validación) cuando el rango es inválido, sin realizar el round-trip al backend.

#### Scenario: Rango inválido bloquea el request

- GIVEN el admin ingresa `fecha_inicio` posterior a `fecha_fin`
- WHEN intenta actualizar el reporte
- THEN el sistema MUST NOT disparar el request y MUST mostrar un mensaje explicando que el rango es inválido

#### Scenario: Rango válido no se bloquea

- GIVEN `fecha_inicio <= fecha_fin`
- WHEN el admin actualiza el reporte
- THEN el sistema dispara el request normalmente

### Requirement: Vista única sin router interno

El sistema MUST montar ambos paneles apilados en una sola vista bajo la ruta `/reportes/*` del shell, sin introducir un router interno propio de `mf-reportes`.

#### Scenario: Ambos paneles visibles en una sola navegación

- GIVEN un admin autenticado navega a `/reportes`
- WHEN la vista se monta
- THEN ambos paneles (ocupación y período) son visibles sin navegación adicional dentro del remote
