# Architecture Decision Records — CanchasDeportivas

Registro de decisiones arquitectónicas del proyecto. Formato: Nygard simplificado (Contexto / Decisión / Consecuencias / **Requisitos No Funcionales derivados** / Alternativas) — cada ADR trae adentro los NFR que genera, no hay un documento de NFR separado.

Reglas de este directorio:
- Un ADR nunca se edita retroactivamente. Si una decisión cambia, se crea un ADR nuevo que marca al anterior como `Reemplazado por ADR-XX`.
- La numeración de `frontend/` sigue la que ya se venía usando en comentarios del propio código fuente (ej. `rsbuild.config.ts`) para referenciar estas mismas decisiones — no se renumeró para no romper esas referencias cruzadas.
- Los ADR de `backend/` fueron reconstruidos por el equipo de frontend leyendo el código real de `backend/` (commits de Cristian), no fueron escritos por quien tomó la decisión. Están marcados como **observados**, no autorales, y deberían ser confirmados o corregidos por Cristian.

## Frontend (`frontend/`)

Autor: Brando. Reconstruidos a partir del código real de `frontend/apps/shell` y `frontend/apps/mf-reservas`.

| ADR | Título |
|-----|--------|
| [01](frontend/ADR-01-proxy-dev-sin-cors.md) | Proxy same-origin del dev-server en vez de CORS en el backend |
| [02](frontend/ADR-02-sesion-http-federados.md) | Sesión y cliente HTTP federados desde el shell (no `packages/` compartido) |
| [03](frontend/ADR-03-authorize-request-costura.md) | `authorizeRequest(init)` como costura, en vez de exponer `getToken()` |
| [04](frontend/ADR-04-usesyncexternalstore-sesion.md) | `useSyncExternalStore` para la sesión, no React Context |
| [05](frontend/ADR-05-singleton-sessionstore-symbol.md) | Singleton de `SessionStore` vía `Symbol.for` global |
| [06](frontend/ADR-06-rol-desconocido-privilegio-minimo.md) | Rol desconocido ⇒ privilegio mínimo, sesión sigue válida |
| [07](frontend/ADR-07-401-limpia-sesion-403-no.md) | 401 limpia la sesión, 403 no |
| [08](frontend/ADR-08-guards-layout-routes.md) | Guards de ruta como layout routes con `<Outlet/>` |
| [09](frontend/ADR-09-adapter-dto-mock-msw-disponibilidad.md) | Capa adapter/DTO aislada + MSW para el endpoint de disponibilidad aún inexistente |
| [10](frontend/ADR-10-fetching-propio-sin-cache-compartida.md) | Fetching propio (`useResource`/`useAction`), sin TanStack Query ni caché compartida |
| [11](frontend/ADR-11-fechas-horas-como-strings-en-dto.md) | Fechas/horas como `string` en el DTO, nunca `Date` |
| [12](frontend/ADR-12-reglas-negocio-cliente-solo-computable.md) | Reglas de negocio en cliente: solo se espeja lo computable sin estado del servidor |

## Backend (`backend/`) — observados, a confirmar por Cristian

| ADR | Título |
|-----|--------|
| [01](backend/ADR-01-schema-per-domain-postgres-compartido.md) | Un schema Postgres por dominio dentro de una única base compartida (no bases separadas) |
| [02](backend/ADR-02-comunicacion-sincrona-rest-entre-microservicios.md) | Comunicación entre microservicios síncrona vía REST/`httpx` |
| [03](backend/ADR-03-jwt-hs256-secreto-compartido-validacion-descentralizada.md) | JWT HS256 con secreto compartido, validado de forma independiente por cada microservicio |
| [04](backend/ADR-04-arquitectura-en-capas-fastapi.md) | Arquitectura en capas por microservicio (FastAPI + SQLAlchemy + Alembic) |
| [05](backend/ADR-05-validacion-solapamiento-sin-locking.md) | Validación de solapamiento (RN-02) sin locking a nivel de base de datos |
| [06](backend/ADR-06-docker-compose-postgres-unico.md) | Orquestación con Docker Compose y una única instancia Postgres |

## Requisitos No Funcionales — resumen de deuda técnica activa

Cada ADR trae su propia sección "Requisitos No Funcionales derivados" (18 NFR en total, RNF-01 a RNF-18). Esta tabla junta solo los que hoy **no se cumplen**, para verlos de un vistazo sin recorrer los 18 archivos:

| NFR | Riesgo | ADR | Prioridad sugerida |
|-----|--------|-----|---------------------|
| RNF-06 | Doble-reserva del mismo bloque bajo concurrencia (RN-02, peso alto en la rúbrica) | [backend/05](backend/ADR-05-validacion-solapamiento-sin-locking.md) | **Alta** |
| RNF-04 / RNF-05 | Secreto JWT compartido y committeado en texto plano | [backend/03](backend/ADR-03-jwt-hs256-secreto-compartido-validacion-descentralizada.md) | **Alta** |
| RNF-10 | Sin retry/circuit breaker entre microservicios | [backend/02](backend/ADR-02-comunicacion-sincrona-rest-entre-microservicios.md) | Media |
| RNF-17 | Docker Compose incompleto (falta gateway + 4 `ms-*`) | [backend/06](backend/ADR-06-docker-compose-postgres-unico.md), [frontend/01](frontend/ADR-01-proxy-dev-sin-cors.md) | Media (ya es el próximo paso planeado) |
| RNF-11 | Postgres único como punto único de fallo de los 3 dominios | [backend/01](backend/ADR-01-schema-per-domain-postgres-compartido.md), [backend/06](backend/ADR-06-docker-compose-postgres-unico.md) | Baja (aceptable para alcance académico, a confirmar) |
