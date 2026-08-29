# mf-reservas-booking Specification

## Purpose

Flujo de usuario `rol=usuario` en `mf-reservas`: consultar disponibilidad, crear una reserva y gestionar sus propias reservas (cancelar, ver estado). Espeja client-side lo que RN-01/02/03/04/06/08 permiten calcular sin backend; el resto lo decide el servidor.

## Requirements

### Requirement: Ver disponibilidad

Dada una cancha y una fecha, el sistema MUST mostrar una grilla de bloques horarios con estado `libre` u `ocupado`, consumida desde el adapter (`reservasApi.getDisponibilidad`). El sistema MUST NOT inferir ocupación a partir de otro origen (no hay info de a quién pertenece un bloque ocupado).

#### Scenario: Grilla muestra libres y ocupados

- GIVEN una cancha y fecha con bloques definidos
- WHEN el usuario abre la pantalla Disponibilidad
- THEN cada bloque se renderiza como `libre` u `ocupado` según la respuesta del adapter

#### Scenario: Cancha sin horario de atención ese día

- GIVEN una cancha sin horario definido para el día de la `fecha` elegida
- WHEN se consulta disponibilidad
- THEN la grilla se muestra vacía sin error

### Requirement: Crear reserva

El sistema MUST enviar `usuario_id` desde `shell/session` (no editable por el usuario) y, ante una respuesta exitosa, MUST reflejar la reserva creada.

#### Scenario: Reserva exitosa

- GIVEN un bloque `libre` seleccionado
- WHEN el usuario confirma la reserva
- THEN se crea con `estado=Confirmada` y se navega/informa éxito

### Requirement: Manejo de errores al reservar

Ante cualquier 400 (solapamiento, límite RN-06 o fuera de horario RN-01), el sistema MUST mostrar el `detail` del backend verbatim y MUST refetchear disponibilidad, sin distinguir la causa por texto. Ante 403/404/422 el sistema MUST mostrar un mensaje y MUST NOT refetchear disponibilidad.

#### Scenario: 400 en cualquiera de sus variantes

- GIVEN un POST que resulta en 400 (solapamiento, límite o fuera de horario)
- WHEN se recibe la respuesta
- THEN se muestra el `detail` recibido y se refresca la grilla de disponibilidad

#### Scenario: 403 al crear

- GIVEN una respuesta 403
- WHEN se recibe
- THEN se muestra un mensaje propio; la grilla no se refresca

#### Scenario: 404 al crear

- GIVEN una respuesta 404 (cancha inexistente/inactiva)
- WHEN se recibe
- THEN se muestra un mensaje propio; la grilla no se refresca

#### Scenario: 422 al crear

- GIVEN una respuesta 422 (`hora_inicio >= hora_fin`)
- WHEN se recibe
- THEN se muestra el `detail` ya aplanado; la grilla no se refresca

### Requirement: Cancelar reserva (RN-03/RN-04/RN-05)

El sistema MUST permitir cancelar solo reservas propias en `estado=Confirmada` cuyo bloque no haya iniciado. El botón Cancelar MUST estar deshabilitado u oculto en caso contrario, calculado client-side (RN-04) sin depender solo del backend.

#### Scenario: Cancelación exitosa

- GIVEN una reserva propia `Confirmada` cuyo `fecha+hora_inicio` es futuro
- WHEN el usuario cancela
- THEN pasa a `Cancelada` y la lista se actualiza

#### Scenario: Bloqueada por RN-04 (ya inició)

- GIVEN una reserva `Confirmada` cuyo `fecha+hora_inicio` (UTC) ya pasó
- WHEN se renderiza la fila (reloj congelado en test)
- THEN el botón Cancelar está deshabilitado

#### Scenario: Bloqueada por estado no Confirmada

- GIVEN una reserva en `Cancelada` o `Finalizada`
- WHEN se renderiza la fila
- THEN el botón Cancelar está deshabilitado u oculto

### Requirement: Badges de estado (RN-08)

El sistema MUST mostrar un badge visual distinto por cada `estado` posible (`Confirmada`, `Cancelada`, `Finalizada`), incluyendo `Finalizada` aunque hoy ningún dato real la produzca (sin trigger backend).

#### Scenario: Badge por estado

- GIVEN reservas en estado `Confirmada`, `Cancelada` y `Finalizada`
- WHEN se listan en Mis Reservas
- THEN cada una muestra el badge y color correspondiente a su estado

### Requirement: Límite de reservas activas (RN-06, informativo)

El sistema SHOULD mostrar un contador de reservas propias `Confirmada` respecto a un límite conocido, pero MUST NOT bloquear el submit del formulario en base a ese contador — el 400 del backend es la única fuente de verdad para el límite.

#### Scenario: Contador visible, no bloqueante

- GIVEN el usuario tiene reservas `Confirmada` activas
- WHEN abre Nueva Reserva
- THEN ve un contador informativo y el botón de crear permanece habilitado
