# Propuesta para Cristian: endpoint de disponibilidad en `ms-reservas`

**De**: Brando (frontend)
**Para**: Cristian (backend)
**Sobre**: `ms-reservas`

Esto es una propuesta, no un pedido — la decisión de implementarlo, ajustarlo o descartarlo es tuya. Lo dejo documentado con el contrato completo para que armarlo (si te sirve) sea lo más rápido posible.

## Por qué hace falta

Estoy armando la pantalla de disponibilidad de `mf-reservas` (elegir cancha + fecha, ver qué bloques horarios están libres) y me encontré con que hoy no hay forma de resolver eso desde el frontend:

- `GET /reservas/` para un usuario normal solo devuelve **sus propias** reservas — nunca las de otros usuarios.
- `ms-canchas` no sabe nada de reservas (separación de dominio limpia, está bien así).

Resultado: no hay ningún endpoint que le diga al frontend "para la cancha X el día Y, estos bloques están ocupados". Sin esto, lo único que puedo hacer es mostrar el horario de atención completo y confiar en que el `POST /reservas/` rechace con 400 si el bloque ya está tomado — una UX bastante mala (el usuario no se entera de que está ocupado hasta que intenta reservar).

## Qué necesitaría

Un endpoint nuevo, de solo lectura, en `ms-reservas` (porque es quien tiene la información de reservas):

```
GET /reservas/disponibilidad?cancha_id={int}&fecha={YYYY-MM-DD}
```

### Auth

Requiere estar logueado (`get_current_user`), pero **no** admin-only — cualquier usuario necesita ver disponibilidad antes de reservar.

### Respuesta esperada

```json
{
  "cancha_id": 1,
  "fecha": "2026-08-28",
  "bloques": [
    { "hora_inicio": "07:00:00", "hora_fin": "08:00:00", "estado": "libre" },
    { "hora_inicio": "08:00:00", "hora_fin": "09:00:00", "estado": "ocupado" }
  ]
}
```

- **Bloques candidatos**: se derivan del horario de atención de esa cancha para el día de la semana de `fecha` (`GET /horarios-atencion?cancha_id=` de `ms-canchas`, mismo dato que ya usás para RN-01 en `POST /reservas/` — si ya tenés la lógica de "generar bloques de 1h a partir del horario", esto la reutiliza tal cual).
- **Estado por bloque**: se cruza cada bloque candidato contra las reservas **`Confirmada`** de esa `cancha_id` + `fecha` (mismo criterio de solapamiento que ya usás en `get_reserva_solapada` para RN-02) → `"ocupado"` si hay cruce, `"libre"` si no.
- Si la cancha no tiene horario de atención definido para ese día → `bloques: []` (no error).

### Errores

- **404** si `cancha_id` no existe o está inactiva (mismo `CanchasClient` que ya usa `POST /reservas/` para validarlo).

### Importante — privacidad

La respuesta **nunca** debe incluir de quién es cada reserva ocupada (ni `usuario_id`, ni nombre, nada). Un usuario normal no tiene por qué saber quién reservó qué — solo si el bloque está libre u ocupado. Esto es intencional, no un detalle menor: si en algún momento el endpoint devuelve más info "por comodidad", se estaría filtrando datos de otros usuarios sin necesidad.

## Dónde encaja en tu código

Si seguís el mismo patrón de capas que ya tenés (router → service → repository), sería algo así:

- **Router** (`app/api/reservas.py`): nueva ruta `GET /disponibilidad`. **Ojo con el orden de registro**: como ya tenés `GET /{reserva_id}`, si `/disponibilidad` se registra DESPUÉS de esa ruta, FastAPI/Starlette la va a matchear como si `"disponibilidad"` fuera un `reserva_id` (falla feo, 422). Registrala antes.
- **Service** (`app/services/reserva_service.py`): un método nuevo que arme los bloques (podés extraer la lógica de "horario → bloques de 1h" que ya usás en `create()` para RN-01, en vez de duplicarla).
- **Repository** (`app/repositories/reserva_repository.py`): un método que traiga las reservas `Confirmada` de una cancha+fecha (parecido a lo que ya hace `get_reserva_solapada`, pero trayendo todas en vez de chequear una sola).
- **Schemas** (`app/schemas/reserva.py`): dos schemas nuevos para la respuesta (algo como `BloqueDisponibilidad` y `DisponibilidadResponse`).

## Validado

Armé un spike de esto en mi máquina para confirmar que la idea funciona antes de proponértela — anduvo bien, con tests, contra los datos seedeados reales. No lo dejé en el repo (no me correspondía tocar `backend/`), pero si querés una referencia más concreta de cómo quedaría, avisame y te paso el detalle.

## Qué pasa si no lo hacés (o lo hacés distinto)

El frontend puede seguir andando igual sin esto — la pantalla de disponibilidad se limita a mostrar el horario de atención completo (sin distinguir libre/ocupado) y confiar en el error del `POST` al reservar. Es peor UX, pero no bloquea nada más. Si preferís un contrato distinto (otro path, otro shape, exponerlo en otro microservicio), decime y ajusto el diseño del frontend a lo que definas — el adapter que estoy armando en `mf-reservas` está pensado justo para que ese tipo de cambio no me obligue a tocar las pantallas.
