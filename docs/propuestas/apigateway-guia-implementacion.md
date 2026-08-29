# Guía para Wilson: cómo armar el API Gateway

**De**: Brando (frontend)
**Para**: Wilson (API Gateway / Docker / C4)
**Sobre**: `apigateway/`

Es una guía, no un pedido de que lo hagas de esta forma exacta — la implementación es tuya. La armo porque el frontend ya tiene un contrato fijo (hardcodeado en el proxy de dev del shell) contra el que el Gateway tiene que calzar para que no haya que tocar código de `frontend/` cuando lo conectes. Te dejo el contrato real, verificado contra el código, no supuesto.

## Por qué esta guía es precisa y no una idea general

Todo lo que sigue lo saqué leyendo el código real, no de la guía de preparación:

- Los 4 prefijos de ruta de cada microservicio (`app/api/*.py`, línea `APIRouter(prefix=...)`).
- Que los 4 `ms-*` **no registran `CORSMiddleware` en ningún lado** (confirmado con `rg` sobre los 4 `main.py`).
- Que el JWT lo emite únicamente `ms-usuarios` (`create_access_token` en `ms-usuarios/app/core/security.py`) y los otros 3 servicios solo lo **decodifican** (`decode_access_token`), todos con el mismo `SECRET_KEY`/`ALGORITHM=HS256` vía `pydantic_settings` — es decir, ya hoy los 4 servicios comparten un secreto para validar el mismo token.
- El contrato exacto que ya espera el frontend, porque **ya está escrito**: `frontend/apps/shell/rsbuild.config.ts` tiene un proxy de dev que hoy hace exactamente lo que tu Gateway tendría que hacer en serio.

## El contrato que el frontend ya asume

`shell/src/config/env.ts` define `PUBLIC_API_BASE` (hoy `/api`, same-origin) como la única base de la que cuelgan todas las llamadas del frontend — nada fuera de ese archivo lee `import.meta.env` directamente. Hoy, en dev, el proxy del shell resuelve esto:

```
/api/usuarios/*   → strip "/api/usuarios"   → MS_USUARIOS_URL  (http://localhost:8001)
/api/canchas/*    → strip "/api/canchas"    → MS_CANCHAS_URL   (http://localhost:8002)
/api/reservas/*   → strip "/api/reservas"   → MS_RESERVAS_URL  (http://localhost:8003)
/api/reportes/*   → strip "/api/reportes"   → MS_REPORTES_URL  (http://localhost:8004)
```

(`frontend/apps/shell/rsbuild.config.ts`, bloque `server.proxy`.)

Esto es literalmente lo que tu Gateway necesita reproducir: 4 grupos de rutas, cada uno reenviado — con el prefijo `/api/{servicio}` recortado — al microservicio correspondiente. Si tu Gateway expone exactamente esos 4 prefijos, conectar el frontend real es cambiar una sola variable de entorno (`PUBLIC_API_BASE` apuntando a la URL de tu Gateway en vez de `/api` same-origin) — cero cambios de código en `frontend/`.

## Los 4 targets (prefijos reales, no inventados)

| Microservicio | Puerto (dev, no dockerizado aún) | Rutas que expone (`prefix=` real en el código) |
|---|---|---|
| `ms-usuarios` | 8001 | `/auth`, `/usuarios` |
| `ms-canchas` | 8002 | `/canchas`, `/deportes`, `/horarios-atencion` |
| `ms-reservas` | 8003 | `/reservas` |
| `ms-reportes` | 8004 | `/reportes` |

Ojo con un detalle: `/api/usuarios/*` en el frontend cubre **dos** prefijos reales del lado de `ms-usuarios` (`/auth` y `/usuarios`), no uno. Por ejemplo `/api/usuarios/auth/login` → recortás `/api/usuarios` → le queda `/auth/login` → eso es lo que `ms-usuarios` espera. No asumas 1 grupo de frontend = 1 prefijo de backend.

## Auth: no necesitás re-validar el JWT vos

Los 4 microservicios ya decodifican el mismo JWT (mismo `SECRET_KEY` + `HS256`) de forma independiente vía su propio `get_current_user`. Dado eso, lo más simple y correcto es que el Gateway **no** valide ni toque el token — solo reenvíe el header `Authorization` tal cual le llega. Ventajas de no meter el `SECRET_KEY` en un 5to lugar:

- Menos superficie para que el secreto quede desincronizado entre servicios.
- El Gateway queda como reverse proxy puro (reenvía método, headers, body, query params, status code de vuelta) — sin lógica de negocio.

Si más adelante querés fallar rápido con un único 401 centralizado antes de pegarle a un microservicio, es una mejora válida, pero no es necesaria para que esto funcione — cada `ms-*` ya devuelve 401/403 por su cuenta si el token falta o el rol no alcanza.

## CORS: hoy no existe en ningún microservicio, y está bien así

Ningún `ms-*` registra `CORSMiddleware`. Eso es intencional en el diseño actual (el comentario en `shell/rsbuild.config.ts` lo llama "same-origin: ningún ms-* registra CORSMiddleware"): hoy el navegador nunca le pega directo a un `ms-*`, siempre pasa por el proxy de dev del shell (mismo origen, no hay preflight).

Cuando tu Gateway sea el único punto de entrada real:

- El **Gateway** es quien necesita `CORSMiddleware` (permitiendo el origen del shell — `http://localhost:3000` en dev, el dominio real en producción).
- Los 4 `ms-*` pueden seguir **sin** CORS — nadie más que el Gateway les pega directo. No hace falta que le pidas a Cristian que le agregue CORS a cada microservicio.

## Networking: hoy es `localhost`, no Docker todavía

`backend/docker-compose.yml` hoy solo levanta `postgres` (puerto host `5433`) — los 4 microservicios corren sueltos vía `uvicorn` en `localhost:800{1-4}`. Para tu Gateway ahora: apuntá a `http://localhost:800X` por variable de entorno (mismo patrón que ya usa el frontend: `MS_USUARIOS_URL`, etc., con default a `localhost` y override por `.env`). El día que vos o Cristian agreguen los 4 `ms-*` al `docker-compose.yml`, esos targets pasan a ser nombres de servicio Docker (`http://ms-usuarios:8001`) en vez de `localhost` — no es algo para resolver ahora, solo para no hardcodear `localhost` de forma que después cueste cambiar.

## Forma sugerida (según la guía del proyecto, sección 6.4)

FastAPI + `httpx` es lo recomendado por la guía de preparación — mismo lenguaje que el resto del backend, reenvía la solicitud del frontend al microservicio correcto. La guía también deja abierta la puerta a un proxy dedicado (Traefik, Nginx) si el equipo lo prefiere, sin que cambie la arquitectura. Esa decisión es tuya; lo único que este documento fija es el **contrato de rutas** de arriba, porque eso es lo que ya está escrito del lado del frontend.

## Qué pasa si no está listo todavía

Nada se rompe: hoy el frontend sigue funcionando contra los microservicios directo vía el proxy de dev del shell, sin Gateway de por medio. Cuando lo tengas, avisame el contrato final (si terminó siendo distinto a este) y ajusto `PUBLIC_API_BASE` — no debería hacer falta tocar nada más, para eso está `config/env.ts` como único punto de lectura de variables de entorno.
