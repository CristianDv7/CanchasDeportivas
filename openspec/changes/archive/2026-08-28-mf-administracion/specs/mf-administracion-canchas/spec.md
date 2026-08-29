# mf-administracion-canchas Specification

## Purpose

ABM de canchas y horarios de atención dentro de `mf-administracion`, espejo en UI de RN-07: solo el rol `administrador` crea, edita e inactiva canchas y define su horario de atención.

## Requirements

### Requirement: Listado de canchas

El sistema MUST listar todas las canchas (activas e inactivas) con su deporte, y MUST distinguir visualmente el estado inactivo.

#### Scenario: Listado con canchas activas e inactivas

- GIVEN canchas con `activa=true` y `activa=false`
- WHEN el admin abre el listado
- THEN cada cancha se muestra con su deporte y un indicador visual de activa/inactiva

### Requirement: Alta de cancha

El sistema MUST permitir crear una cancha eligiendo su deporte desde `GET /deportes`, y ante éxito MUST refetchear el listado.

#### Scenario: Alta exitosa

- GIVEN un formulario completo con deporte válido
- WHEN el admin confirma el alta
- THEN la cancha se crea y aparece en el listado refrescado

#### Scenario: Alta con datos inválidos (422)

- GIVEN un formulario con datos que el backend rechaza (422)
- WHEN el admin confirma
- THEN se muestra el `detail` aplanado y el listado NO se refetchea

### Requirement: Edición de cancha

El sistema MUST permitir editar una cancha existente y, ante éxito, MUST refetchear el listado.

#### Scenario: Edición exitosa

- GIVEN una cancha existente
- WHEN el admin edita y confirma
- THEN los cambios se reflejan en el listado refrescado

#### Scenario: Edición sobre cancha eliminada (404)

- GIVEN una cancha que ya no existe en el backend
- WHEN el admin intenta editarla
- THEN se muestra un mensaje propio y el sistema MUST refetchear el listado

### Requirement: Inactivación de cancha (soft delete)

El sistema MUST inactivar una cancha vía `PATCH .../inactivar` (no hay borrado duro) y MUST refetchear el listado tras el éxito. El sistema MUST advertir al admin antes de confirmar si la cancha tiene reservas futuras `Confirmada` (si el backend no cascada la inactivación).

#### Scenario: Inactivación exitosa

- GIVEN una cancha activa sin reservas futuras confirmadas
- WHEN el admin confirma la inactivación
- THEN la cancha pasa a inactiva en el listado refrescado

#### Scenario: Inactivación con reservas futuras

- GIVEN una cancha activa con al menos una reserva futura `Confirmada`
- WHEN el admin intenta inactivarla
- THEN el sistema MUST mostrar una advertencia previa a la confirmación

### Requirement: Horario de atención por cancha

El sistema MUST permitir crear y editar el horario de atención de una cancha (rango horario diario), y ante éxito MUST refetchear el horario mostrado.

#### Scenario: Alta de horario

- GIVEN una cancha sin horario definido
- WHEN el admin carga un rango horario válido
- THEN el horario queda visible para esa cancha

#### Scenario: Edición de horario con rango inválido (422)

- GIVEN `hora_inicio >= hora_fin` en el formulario
- WHEN el admin confirma
- THEN se muestra el `detail` aplanado y el horario anterior no se pierde

### Requirement: Defensa en profundidad ante 403 (RN-07)

El sistema MUST cubrir el caso de un 403 del backend en cualquier escritura sobre canchas/horarios, aunque el guard del shell ya bloquea a `rol=usuario` antes de llegar acá.

#### Scenario: 403 en una escritura

- GIVEN una respuesta 403 del backend a una escritura de cancha u horario
- WHEN se recibe
- THEN se muestra un mensaje propio de "no tenés permisos" sin refetch
