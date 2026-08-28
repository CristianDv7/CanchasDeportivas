# Observaciones para Cristian: `ms-canchas` y `ms-usuarios`

**De**: Brando (frontend)
**Para**: Cristian (backend)
**Sobre**: `ms-canchas`, `ms-usuarios`

No son bugs que me estén bloqueando — los 4 los esquivé por diseño del lado del frontend al armar `mf-administracion` (ABM de canchas/horarios, panel de reservas). Te los dejo documentados porque los encontré leyendo tu código para ese diseño, y me parecía peor no avisarte que mandarte un reporte. Decidís vos si los tocás o no.

## 1. `POST`/`PUT /deportes` sin ninguna dependencia de auth

**Dónde**: `ms-canchas/app/api/deportes.py:51-101`

A diferencia de `canchas.py` y `horarios_atencion.py` (que sí piden `require_admin` en sus endpoints de escritura), `deportes.py` no tiene ningún `Depends(get_current_user)` ni `Depends(require_admin)` en el `POST`/`PUT`. Cualquiera, incluso sin token, puede crear o editar deportes.

**Impacto**: rompe el mismo criterio de "solo admin escribe" que sí se respeta en canchas y horarios (RN-07). No lo estoy bloqueando en la UI de `mf-administracion` porque no es su alcance — el selector de deportes en el form de canchas solo lee (`GET`).

## 2. `HorarioAtencionService.update` ignora `activo` aunque el schema lo acepta

**Dónde**: `horario_atencion_service.py:169-172` vs. `schemas/horario_atencion.py:48`

`HorarioAtencionUpdate` tiene el campo `activo`, pero el método `update` nunca lo asigna al modelo — solo actualiza `cancha_id`/`dia_semana`/`hora_inicio`/`hora_fin`. Si alguien manda `{"activo": false}`, la respuesta es 200 y el registro queda intacto: un no-op silencioso.

**Impacto en mi diseño**: por esto decidí que `mf-administracion` **no** va a ofrecer un toggle de activar/desactivar horario — mostrarle al admin un botón que aparenta funcionar (200 OK) pero no hace nada sería peor que no tener la función. Si en algún momento lo corregís, aviso y lo sumamos en una change posterior.

## 3. Mismo `update` no revalida `(cancha_id, dia_semana)` → 500 en vez de 400

**Dónde**: `horario_atencion_service.py:174-186`, `models/horario_atencion.py:33-37`

El modelo tiene un `UniqueConstraint` sobre `(cancha_id, dia_semana)`. `create` sí lo valida antes de insertar y devuelve un 400 prolijo. `update` no — si dos horarios terminan compartiendo esa combinación, el `IntegrityError` de la base sube sin envolver y el cliente recibe un 500 feo.

**Impacto en mi diseño**: en `mf-administracion` armé la UI de horarios como una grilla fija de 7 filas (una por día de la semana) donde `dia_semana` es **inmutable** una vez creado el horario — "Editar horas" solo manda `hora_inicio`/`hora_fin`, nunca `dia_semana`. Con eso, el 500 queda estructuralmente inalcanzable desde mi UI. No es que lo arreglé, es que lo esquivé — si en algún momento das de baja esa restricción o cambiás el flujo, este supuesto se rompe.

## 4. `GET /usuarios/{id}` sin auth (la lista sí es admin-only)

**Dónde**: `ms-usuarios/app/api/usuarios.py:42-60`

`GET /usuarios` (la lista) pide admin. `GET /usuarios/{id}` (el detalle) no pide nada — cualquiera sin token puede pedir el detalle de un usuario si adivina o itera el `id`. Es una enumeración de usuarios sin autenticación.

**Impacto**: en `mf-administracion` lo uso solo para enriquecer el panel de reservas con el nombre del usuario que reservó (el admin ya está autenticado igual), así que no me bloquea, pero es una inconsistencia real de seguridad que vale la pena que corrijas cuando puedas — sobre todo si en algún momento se expone `ms-usuarios` más allá del gateway interno.

## Resumen

| # | Hallazgo | Bloqueante para frontend | Acción sugerida |
|---|---|---|---|
| 1 | `deportes` sin auth en escritura | No | Agregar `require_admin`, mismo patrón que `canchas.py` |
| 2 | `horario.update` ignora `activo` | No (UI lo esquiva) | Asignar el campo en el service si en algún momento querés soportar el toggle |
| 3 | `horario.update` sin revalidar unique constraint | No (UI lo esquiva) | Envolver el `IntegrityError` igual que en `create`, devolver 400 |
| 4 | `GET /usuarios/{id}` sin auth | No | Agregar `Depends(get_current_user)` como mínimo |

Nada de esto me frena para seguir con `mf-administracion` — lo armé para que no lo tengas que descubrir vos solo cuando alguien lo pise en producción.
