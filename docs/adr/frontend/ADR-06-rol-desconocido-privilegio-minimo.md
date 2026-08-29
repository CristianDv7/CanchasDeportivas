# ADR-06: Rol desconocido ⇒ privilegio mínimo, sesión sigue válida

**Estado:** Aceptado — 2026-08-26

## Contexto

`Ms Usuarios` puede, en teoría, devolver un rol que el frontend no reconoce (por desincronización entre lo que el backend agrega y lo que el frontend todavía no mapeó). Hay dos formas de reaccionar: invalidar toda la sesión, o degradar solo la autorización.

## Decisión

Un `rol` no reconocido no invalida el login: la sesión sigue siendo válida (el usuario está autenticado), pero `hasRole()` devuelve `false` para cualquier chequeo — o sea, privilegio mínimo. Es "fail-closed" en autorización (ninguna ruta protegida se habilita) pero "fail-open" en sesión (no se fuerza un logout por un dato que el frontend no entiende).

## Consecuencias

**Positivas**
- Un rol nuevo agregado en backend sin que el frontend lo conozca todavía no tira abajo el login de nadie — solo esconde pantallas protegidas, degradando gracefully en vez de romper.
- El mismo patrón (valor desconocido ⇒ mínimo privilegio, nunca falla) se reutiliza en `Mf Reservas` para el estado de una reserva: un estado no reconocido no crashea la UI, solo deshabilita acciones sobre esa fila.

**Negativas / riesgos**
- Un usuario con un rol nuevo legítimo queda con acceso "de hecho" nulo hasta que el frontend actualice el mapeo de roles — hay que coordinar esos cambios entre bloques.

## Requisitos No Funcionales derivados

**RNF-03 — Ninguna decisión de autorización de UI reemplaza la autoridad del servidor.** (ver también [ADR-08](ADR-08-guards-layout-routes.md))
Los guards de rol en el shell son UX; el rechazo real de una operación no autorizada ocurre siempre server-side. Un rol desconocido en frontend degrada a privilegio mínimo, nunca amplía acceso.

## Alternativas consideradas

- Invalidar la sesión (logout forzado) ante un rol desconocido: descartada por ser una degradación más agresiva de la necesaria — un problema de mapeo del frontend no debería expulsar al usuario del sistema.
