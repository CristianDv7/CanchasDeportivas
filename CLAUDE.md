# CanchasDeportivas — Sistema de Reserva de Canchas Deportivas

Proyecto integrador de la Maestría en Ingeniería de Software (curso Desarrollo de Aplicaciones Empresariales, 2026). Repo: https://github.com/CristianDv7/CanchasDeportivas

Documento de referencia completo: `Guia_Preparacion_Proyecto_Reserva_Canchas_2.docx` (raíz del repo — usar la `_2`, no la `_1`: la `_2` es la versión completa, agrega la sección de reglas de negocio que la `_1` no tiene). Este CLAUDE.md resume lo esencial para no perder contexto entre sesiones; ante dudas de detalle, releer ese docx (convertir con `pandoc archivo.docx -t plain`, no es legible directo).

## Roles del equipo (monorepo, un bloque por persona)

- **Brando** (vos, usuario de esta sesión) → `frontend/`: shell/host en React + Module Federation, y 3 microfrontends remotos: `mf-reservas`, `mf-administracion`, `mf-reportes`.
- **Cristian** → `backend/`: 4 microservicios FastAPI: `ms-usuarios`, `ms-canchas`, `ms-reservas`, `ms-reportes`.
- **Wilson Cabrera** → `apigateway/` (API Gateway, FastAPI recomendado) + `backend/docker-compose.yml` + diagramas C4 en `DiagramasC4/`.

## Arquitectura y stack

- Frontend: React 18 + Webpack 5 o Rsbuild (Module Federation).
- Backend: Python 3.11+/FastAPI, SQLAlchemy + Alembic, Uvicorn.
- Una base PostgreSQL por dominio (usuarios_db, canchas_db, reservas_db), gestionada solo por su microservicio.
- API Gateway como único punto de entrada al backend, reenvía cada request REST al microservicio correspondiente.
- Todo orquestado con Docker Compose.

## Estructura real del repo (verificada, no la nomenclatura del docx)

```
frontend/          — pnpm workspace, esqueleto Fase 1 completo (ver Estado)
  apps/shell/       — host React+MF: layout, routing, auth real, guards por rol, SessionStore/ApiClient federados
  apps/mf-reservas/       — flujo real: disponibilidad, nueva reserva, mis reservas (adapter/DTOs/hooks propios, MSW)
  apps/mf-administracion/ — flujo real: ABM de canchas/horarios (RN-07) + panel global de reservas con cancelación admin (RN-03)
  apps/mf-reportes/       — flujo real: dashboard admin-only (ocupación por cancha + reservas por período), reemplazó el placeholder RemoteHealthCard
backend/
  ms-usuarios/      — FastAPI, estructura app/{api,core,db,models,repositories,schemas,services}, alembic, tests
  ms-canchas/
  ms-reservas/      — expone GET /reservas/disponibilidad (implementado por Cristian, commit 4831b4b)
  ms-reportes/
  database/         — init scripts para postgres
  docker-compose.yml — levanta postgres:16 (db "backend", puerto host 5433)
apigateway/          — solo readme.md, gateway aún no implementado
DiagramasC4/          — diagramas de contexto, contenedores y 9 vistas de componentes (DSL propio en CanchasDeportivas.dsl, ver Estado)
```

Nota: el docx habla de `gateway/api-gateway` — ese nombre es la convención sugerida, el repo real usa `apigateway/`. Los microservicios de Cristian sí están avanzados (múltiples commits reales); apigateway sigue en cero.

## Estado (verificado 2026-08-29, tras SDD changes `frontend-shell` + `mf-reservas-booking` + `mf-administracion` + `mf-reportes`, sesión de verificación end-to-end de RN-01 a RN-08, y trabajo ad-hoc post-SDD)

- Backend: 4 microservicios con avance real (commits: usuarios, canchas, reservas, reportes finalizados según mensajes de commit — verificar contenido real antes de asumir "terminado"). Cristian subió `.env` reales de los 4 microservicios (commit `33afd66`) confirmando los puertos: `ms-usuarios:8001`, `ms-canchas:8002`, `ms-reservas:8003`, `ms-reportes:8004` — coinciden con los adoptados provisoriamente en `frontend-shell`.
- Frontend: **shell + los 4 remotes con flujo de negocio real implementado, ningún placeholder pendiente**. `mf-reservas`: disponibilidad, nueva reserva, mis reservas (RN-01 a RN-06 y RN-08). `mf-administracion`: ABM de canchas/horarios (RN-07 completo) + panel global de reservas con cancelación admin (RN-03). `mf-reportes`: dashboard admin-only (ocupación por cancha + reservas por período), reemplazó `RemoteHealthCard` (SDD change `mf-reportes`, archivada 2026-08-29). Detalle en `openspec/changes/archive/2026-08-26-frontend-shell/`, `openspec/changes/archive/2026-08-27-mf-reservas-booking/`, `openspec/changes/archive/2026-08-28-mf-administracion/` y `openspec/changes/archive/2026-08-29-mf-reportes/`.
- **Registro público de usuarios** (2026-08-29, trabajo ad-hoc fuera de SDD): ruta `/registro` en el shell, consume `POST /usuarios` de `ms-usuarios` (ya existía, es público). El alta queda **siempre** con `rol_id: 1` ("usuario") fijo del lado del cliente (`shell/src/session/session.ts`, `ROL_USUARIO_ID`) — no hay `GET /roles` y un form de autoregistro nunca debe poder ofrecer el rol administrador. Autologuea tras el alta. Verificado contra la base real: usuarios creados por este form quedan con `rol_id: 1` igual que la seed.
- **Ícono por deporte** (2026-08-29): `DeporteIcon` (SVG inline pádel/tenis/básquet) en el listado de canchas de `mf-administracion` y en el selector de cancha + "Mis reservas" de `mf-reservas`. Copia independiente por microfrontend (sin código compartido entre remotes, por diseño).
- **Bug real corregido** (2026-08-29, reportado por el usuario): `mf-reservas` permitía confirmar una reserva sobre un bloque cuya hora de inicio ya había pasado — `buildDisponibilidad` solo miraba solapamiento con otras reservas, nunca el reloj. Se reutilizó `hasStarted` (ya usado en RN-04/cancelar) para bloquear también la creación; el bloque se muestra tachado como "pasado". De paso se corrigió que "Reserva confirmada." no decía qué cancha/fecha/horario quedó reservado.
- **Unificación visual** (2026-08-29, a pedido): Disponibilidad (antes una tabla, "pizarra de turnos") ahora usa la misma grilla de tarjetas que Nueva reserva — mismo lenguaje visual en toda la sección Reservas, Disponibilidad sigue siendo de solo lectura.
- **Dependencia que se creía pendiente y ya no lo está**: `mf-reservas` consumía `GET /reservas/disponibilidad` mockeado con MSW porque el endpoint no existía. Cristian lo implementó (commit `4831b4b`) con un shape distinto al propuesto originalmente; el frontend absorbió el cambio de contrato solo en el mapper del adapter (commit `ccad5aa`) — validación real del aislamiento adapter/DTO (ver ADR-09 de frontend). **Regla dura que sigue vigente**: nunca implementar código dentro de `backend/`/`apigateway/` nosotros mismos, ni como spike — son bloques de otros compañeros (ver memoria `feedback/scope-backend`).
- **Hallazgo pendiente, no nuestro**: no hay ningún mecanismo (endpoint ni job) en `ms-reservas` que transicione una reserva de `Confirmada` a `Finalizada` cuando pasa su horario — quedan `Confirmada` indefinidamente salvo que se cancelen. El estado `Finalizada` (RN-08) solo aparece porque el seed lo insertó a mano. Hueco del backend de Cristian, no tocar desde frontend.
- API Gateway: pendiente (Wilson). Hoy el shell pega directo a los microservicios vía proxy de dev, sin gateway.
- Diagramas C4: contexto, contenedores y **9 vistas de componentes** completadas (`DiagramasC4/CanchasDeportivas.dsl`, exportadas a PNG en `DiagramasC4/` y `DiagramasC4/componentes/`) — incluye Api Gateway y Mf Reportes como "diseño objetivo" (sin código real todavía, documentados igual porque son el destino acordado por el equipo).
- **Informe de descripción arquitectónica**: `docs/descripcion-arquitectonica-canchasdeportivas.md`, formato ANSI/IEEE Std 1471-2000 (mismo usado en el curso Desarrollo de Arquitecturas), alcance sistema completo. Declara honestamente 3 tensiones abiertas: RN-02 sin locking (riesgo de doble-reserva bajo concurrencia), el Api Gateway modelado vs. el que existe hoy, y el secreto JWT compartido/committeado.
- **Verificación end-to-end de RN-01 a RN-08** (2026-08-29): sistema completo levantado (postgres + 4 microservicios + shell + 3 remotes) y cada regla probada en UI y directo contra el backend (curl). Capturas reales en `docs/verificacion-reglas-negocio/capturas/`. Todas las RN pasaron; ver el hallazgo pendiente sobre RN-08/`Finalizada` arriba.
- **Git**: todo pusheado directo a `main` (sin PR, a pedido explícito). Últimos commits relevantes: `45ea050` (ícono por deporte + fix reserva pasada), `1b0f423` (registro público de usuarios), `c120d6c` (unificación Disponibilidad/Nueva reserva), `8d0f509` (captura admin usuario+cancha, elimina `docs/propuestas/` ya obsoleta).

## Informes de proceso SDD

- `docs/frontend-shell/informe.md` — proceso completo del esqueleto (shell + 3 remotes), con capturas reales y la distinción entre SDD estructurado vs. debugging exploratorio ("vibe coding") para los 2 bugs reales que solo aparecían corriendo el sistema.
- `docs/mf-reservas-booking/informe.md` — proceso del flujo real de reservas, con capturas del funcionamiento contra el backend real (incluida la cancelación de punta a punta) y el episodio del spike de backend revertido. **Ojo**: este informe (27-ago) todavía describe el endpoint de disponibilidad como pendiente — quedó desactualizado el mismo día por el commit `4831b4b` de Cristian.
- `docs/mf-administracion/capturas/` — capturas del ABM de canchas y panel admin de reservas contra el backend real. Sin `informe.md` propio.
- `docs/rediseno-visual/` — capturas del rediseño visual completo de shell + 4 remotes (commit `3330092`). Sin `informe.md` propio.
- `docs/verificacion-reglas-negocio/capturas/` — capturas reales (2026-08-29) de la verificación end-to-end de RN-01 a RN-08, más el registro de usuarios y el panel admin mostrando usuario+cancha por reserva. Sin `informe.md` propio: fue trabajo ad-hoc pedido en chat, no un change SDD formal.
- `docs/descripcion-arquitectonica-canchasdeportivas.md` — documento de arquitectura de sistema completo (ANSI/IEEE 1471-2000): stakeholders, vistas C4, matriz de trazabilidad RN→ADR→Contenedor, y justificación arquitectónica de los 18 ADR.

`docs/propuestas/` (propuesta técnica del endpoint de disponibilidad para Cristian) se eliminó 2026-08-29: contenido obsoleto, el endpoint real ya está implementado con shape distinto al propuesto (ver Estado).

## SDD (Spec-Driven Development)

Este proyecto usa el workflow SDD para el bloque frontend (`openspec/` + Engram). Changes archivados: `frontend-shell` (2026-08-26), `mf-reservas-booking` (2026-08-27), `mf-administracion` (2026-08-28) y `mf-reportes` (2026-08-29) en `openspec/changes/archive/` — los 4 remotes ya pasaron por SDD completo, ninguno queda como placeholder. Specs vigentes en `openspec/specs/{frontend-shell-host,frontend-auth-session,frontend-remote-modules,mf-reservas-booking,mf-reservas-backend-adapter}/spec.md`. El registro público de usuarios, el ícono por deporte, el fix de reserva en horario pasado y la unificación visual Disponibilidad/Nueva reserva (todos 2026-08-29) se hicieron ad-hoc por pedido en chat, sin pasar por el ciclo SDD. Próximo change candidato: conectar todo al Gateway cuando Wilson lo tenga listo.

## Reglas de negocio RN-01 a RN-08 (guía _2, sección 4)

Definidas en el Alcance Funcional; el backend (Cristian) las implementa, pero el frontend debe reflejarlas en UI/UX (deshabilitar acciones, mensajes de validación, estados visibles):

| RN | Descripción | Se implementa en |
|----|-------------|-------------------|
| RN-01 | Reserva sobre cancha específica (pádel/tenis/básquet), fecha y bloque horario predefinido (franjas de 1h) | ms-reservas |
| RN-02 | No permite reservar un bloque horario ya ocupado en la misma cancha (validación de solapamiento) | ms-reservas |
| RN-03 | Usuario final solo cancela sus propias reservas; admin cancela cualquiera | ms-reservas + ms-usuarios (rol) |
| RN-04 | No se puede cancelar una reserva cuya fecha/hora de inicio ya pasó | ms-reservas |
| RN-05 | Cancelar una reserva libera automáticamente el bloque horario | ms-reservas |
| RN-06 | Límite configurable de reservas activas simultáneas por usuario (ej. máx. 3) | ms-reservas |
| RN-07 | Solo el admin crea/edita/inactiva canchas y define horario de atención (ej. 07:00–22:00) | ms-canchas |
| RN-08 | Toda reserva tiene estado: Confirmada, Cancelada o Finalizada | ms-reservas |

RN-02 y RN-06 tienen más peso en la rúbrica. Impacto en frontend, ya reflejado y verificado end-to-end (ver Estado): `mf-reservas` cubre RN-01 a RN-06 y RN-08 (estados, límite de reservas activas, deshabilitar cancelación de reservas pasadas y creación sobre bloques ya pasados); `mf-administracion` cubre RN-03 y RN-07 (permisos de rol, ABM de canchas).

## Orden de fases sugerido (guía v2, sección 10)

1. Esqueletos en paralelo (compose+postgres / 4 microservicios / shell+3 remotes).
2. Cristian: CRUD + reglas de negocio RN-01 a RN-08 en usuarios/canchas/reservas.
3. Wilson conecta Gateway a los microservicios; Brando conecta `mf-reservas` al Gateway.
4. Brando conecta `mf-administracion`; Cristian expone roles y ABM de canchas.
5. Cristian implementa `ms-reportes`; Brando conecta `mf-reportes`.
6. Integración final, documentación (manual de despliegue), demo end-to-end.

## Convenciones

- Rama `main` protegida + `feature/<area>-<funcionalidad>` (ej. `feature/frontend-mf-reservas`), integrar por PR revisado por otro integrante.
- Variables de entorno para URLs de servicios y credenciales — nada hardcodeado.
- Cada microservicio expone Swagger en `/docs`.
