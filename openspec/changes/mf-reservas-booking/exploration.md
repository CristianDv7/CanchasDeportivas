# Exploration: mf-reservas — flujo de negocio real (disponibilidad, nueva reserva, cancelación, mis reservas)

## Current State

**ms-reservas** (`backend/ms-reservas/app/api/reservas.py`, prefix `/reservas`, FastAPI, JWT vía `get_current_user` que devuelve `{usuario_id, rol}` desde claims `sub`/`rol`):

- `GET /reservas/` → si `rol=="administrador"` devuelve TODAS (`ReservaRepository.get_all`); si no, devuelve solo las del `usuario_id` del token (`get_by_usuario`). Sin querystring (no filtra por cancha_id/fecha/estado). Response: `list[ReservaResponse]`.
- `GET /reservas/{id}` → 404 si no existe; 403 si no es admin y `usuario_id` no coincide (RN-03).
- `POST /reservas/` → body `ReservaCreate{usuario_id, cancha_id, fecha, hora_inicio, hora_fin}` (422 si `hora_inicio>=hora_fin`). 403 si un usuario no-admin intenta `usuario_id` distinto al propio. Server-side, en orden: valida usuario activo (ms-usuarios), cancha activa (ms-canchas), RN-01 horario de atención (via `CanchasClient.get_horarios_cancha`, compara `fecha.isoweekday()` y rango horario), RN-06 límite de reservas activas (`settings.MAX_RESERVAS_ACTIVAS`, default env=3, cuenta solo estado `Confirmada`), RN-02 solapamiento (`get_reserva_solapada`: mismo cancha_id+fecha, estado Confirmada, rango horario cruzado). Cualquier fallo → `ValueError` → **400** con `detail` en texto plano (no hay códigos de error machine-readable, solo strings en español). Éxito → 201 `ReservaResponse` con `estado="Confirmada"`.
- `PATCH /reservas/{id}/cancelar` → sin body. RN-03: si no-admin y no es dueño → **403** `PermissionError`. Si ya `Cancelada` → 400. RN-04: si `datetime.combine(fecha,hora_inicio)` (asumido UTC) `<= now(UTC)` → 400 "No se puede cancelar una reserva que ya inició". Éxito → estado pasa a `Cancelada` (RN-05: libera el bloque implícitamente porque el índice único de solapamiento solo aplica a `estado='Confirmada'`).
- `finalizar_reserva` existe en `ReservaService` (RN-08, transición a `Finalizada` si `hora_fin` ya pasó) pero **NO está expuesto por ningún endpoint ni hay job/cron que lo dispare** — hoy es código muerto desde la perspectiva de la API. El frontend no debe asumir que las reservas pasan a "Finalizada" automáticamente en esta iteración; solo debe soportar visualmente el estado si llega.
- Modelo: `estado` restringido a `Confirmada|Cancelada|Finalizada` (CheckConstraint), unicidad de solapamiento a nivel DB solo para `Confirmada`.

**ms-canchas** (`backend/ms-canchas/app/api/*.py`, sin auth en los GET usados por mf-reservas):
- `GET /canchas?deporte_id=` y `GET /canchas/{id}` → `CanchaResponse{id,nombre,deporte_id,activo,created_at,updated_at}`.
- `GET /deportes` y `/deportes/{id}` → `DeporteResponse{id,nombre,descripcion,activo}`.
- `GET /horarios-atencion?cancha_id=` → `HorarioAtencionResponse{id,cancha_id,dia_semana(1-7 ISO),hora_inicio,hora_fin,activo}`.
- Mutaciones (`POST/PUT/PATCH`) requieren `require_admin` — no las usa mf-reservas.

**Gap crítico confirmado**: no existe NINGÚN endpoint de "disponibilidad/ocupación" público. `GET /reservas/` para un usuario normal solo devuelve SUS PROPIAS reservas, nunca las de otros usuarios ni un agregado de bloques ocupados por cancha/fecha. ms-canchas tampoco sabe nada de reservas (separación de dominio limpia). Consecuencia: hoy es imposible pintar una grilla de disponibilidad real (libre/ocupado por terceros) desde el frontend sin ser admin. Lo único verificable client-side es: (a) horario de atención (de dónde salen los bloques candidatos), (b) las propias reservas del usuario (para no re-reservar el mismo bloque a sí mismo), (c) el resultado de intentar el POST (400 = ocupado por RN-02, la fuente de verdad real es el backend).

**Nota (2026-08-27)**: se armó y probó un endpoint `GET /reservas/disponibilidad` como spike para validar la idea (funcionó, con tests verdes), pero se revirtió — `backend/` es el bloque de Cristian, no corresponde que lo modifiquemos nosotros. Queda documentado como propuesta lista para que él la evalúe: ver `docs/propuestas/ms-reservas-endpoint-disponibilidad.md`.

**Gateway**: `apigateway/readme.md` existe y está **vacío (0 bytes)** — cero contrato, cero pistas.

**Proxy actual del shell** (`frontend/apps/shell/rsbuild.config.ts`): `/api/reservas` → rewrite a `""` → target `MS_RESERVAS_URL` directo (sin CORS, same-origin). Como el router de ms-reservas tiene prefix `/reservas`, el path real correcto desde mf-reservas debe ser `apiClient.get('/reservas/', {service:'reservas'})` (con la barra final incluida, doble segmento `reservas`), NO `/mias` como hoy hardcodea el placeholder `RemoteHealthCard.tsx` (`apiClient.get("/mias", {service:"reservas"})` — ese path no existe en el backend, así que el probe actual siempre cae a "not-connected"; es solo un placeholder degradable, confirmado).

`apiClient` (`frontend/apps/shell/src/http/{client,types}.ts`) ya desacopla mf-reservas del HOST/puerto real (`ServiceName` → `baseUrlFor`), mapea 401/403/404/409/422/5xx a `ApiError{code,status,detail,body}`, pero es agnóstico de forma: pasa el JSON crudo del backend tal cual (`ReservaResponse`, `CanchaResponse`, etc., snake_case, strings ISO). No desacopla de la FORMA/shape que el gateway de Wilson pueda imponer (envelopes de paginación, renombres, agregación de campos, error shape distinto a `{detail}`).

## Affected Areas (para futura fase de propuesta/implementación)
- `frontend/apps/mf-reservas/src/RemoteHealthCard.tsx` — probe usa path inexistente `/mias`; a reemplazar/retirar cuando entre lógica real.
- `frontend/apps/mf-reservas/src/App.tsx` — hoy solo monta el placeholder.
- `frontend/apps/mf-reservas/vitest.config.ts` / `setupTests.ts` — patrón de alias `shell/session`/`shell/apiClient` a reutilizar; falta MSW instalado (no hay evidencia de `msw` en el árbol revisado).
- `frontend/apps/shell/rsbuild.config.ts` — el mapeo de proxy `/api/reservas`→`MS_RESERVAS_URL` es lo único que cambiará el día que exista gateway real; mf-reservas no debería tocarse por ese eje.

## Recomendación de desacople (Gateway futuro)

La abstracción de transporte (`apiClient` + `ServiceName`) YA alcanza para el eje "host/puerto/proxy". NO alcanza para el eje "forma de los datos". Se recomienda agregar, dentro del propio remote `mf-reservas`, una capa fina de mapeo (un módulo tipo `reservasApi.ts`/`canchasApi.ts`) que sea el ÚNICO lugar que:
1. Conoce los paths reales actuales (`/reservas/`, `/canchas`, `/horarios-atencion`) y los shapes crudos del backend documentados arriba.
2. Traduce esos shapes a DTOs propios de `mf-reservas` (p.ej. `Reserva`, `BloqueHorario`) que consumen componentes/hooks.
3. Es el único punto a tocar cuando el gateway de Wilson cambie paths, envuelva respuestas o agregue/renombre campos — la UI no se entera.

Effort: bajo (adapter delgado, no una nueva capa arquitectónica). Encaja con el patrón feature-folder ya usado en el proyecto.

## Pantallas necesarias

1. Disponibilidad (cancha+fecha → grilla de bloques de 1h derivados de horarios-atencion; bloques de MIS reservas propias grisados; resto "candidatos", no garantizados hasta el POST — RN-01/02).
2. Nueva reserva (botón deshabilitado si ya se alcanzó `MAX_RESERVAS_ACTIVAS` contando reservas propias en estado Confirmada — RN-06; maneja 400 de solapamiento re-consultando y marcando el bloque ocupado).
3. Mis reservas (badge visual por `estado` Confirmada/Cancelada/Finalizada — RN-08; botón Cancelar oculto/deshabilitado si `estado!=Confirmada` o si `fecha+hora_inicio <= ahora` — RN-04 espejado client-side, no confiar solo en el backend).
4. Helper compartido estado→label/color reusado entre pantallas 1 y 3.

## Testing (MSW + Vitest)

Handlers necesarios contra los schemas reales: `GET/POST /api/reservas/reservas/(:id)`, `PATCH /api/reservas/reservas/:id/cancelar`, `GET /api/canchas/canchas`, `GET /api/canchas/deportes`, `GET /api/canchas/horarios-atencion`. Casos de error a mockear: 400 (solapamiento/límite/fuera de horario/usuario o cancha inactiva), 403 (crear para otro usuario / cancelar ajena), 404, 422 (hora_inicio>=hora_fin). RN-04 requiere congelar el reloj (`vi.setSystemTime`) para testear el disable del botón cancelar de forma determinística. No hay `msw` instalado todavía en el repo (a confirmar/agregar en la fase de tasks).

## Risks

- **Bloqueante de diseño**: no existe endpoint de disponibilidad/ocupación real — cualquier "grilla de disponibilidad" será aproximada (horario de atención + reservas propias) y la verdad final la da el POST. Debe documentarse como limitación conocida en el spec, o coordinarse con Cristian (`ms-reservas`) para exponer un endpoint público de ocupación — eso excede el alcance de un cambio solo-frontend. Propuesta lista para él en `docs/propuestas/ms-reservas-endpoint-disponibilidad.md`.
- `finalizar_reserva` no está cableado a ningún trigger — el estado "Finalizada" puede no aparecer nunca en datos reales durante la demo; el frontend debe soportarlo visualmente sin depender de que ocurra.
- El placeholder actual (`/mias`) apunta a un path inexistente — debe corregirse a `/reservas/` al implementar.
- Mensajes de error del backend son strings en español sin código machine-readable — cualquier lógica de UI que necesite diferenciar "límite alcanzado" vs "solapamiento" vs "fuera de horario" tendrá que parsear `detail` por texto (frágil) o vivir con un manejo genérico de 400. Vale la pena documentarlo como riesgo para specs/design.
- `apigateway/` vacío: cualquier decisión de paths/forma es especulativa hasta que Wilson defina algo; la capa de mapeo propuesta mitiga pero no elimina el riesgo de retrabajo.

## Ready for Proposal

Sí. Contrato de backend documentado con evidencia de código real, gap de disponibilidad identificado y recomendación de capa de desacople lista para la fase `sdd-propose`.
