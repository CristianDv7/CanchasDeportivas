# ADR-03: JWT HS256 con secreto compartido, validado de forma independiente por cada microservicio

**Estado:** Observado (no confirmado por Cristian/Wilson) — 2026-08-27
**Evidencia en código:** `backend/ms-usuarios/app/core/security.py` (emite el token), `backend/ms-reservas/app/core/security.py` (lo decodifica de forma independiente); mismo `SECRET_KEY`/`ALGORITHM=HS256` en los `.env` de `ms-usuarios`, `ms-canchas`, `ms-reservas`, `ms-reportes`.

## Contexto

No existe todavía un API Gateway (bloque de Wilson, pendiente) que centralice la validación de auth. Mientras tanto, cada microservicio necesita saber si un request viene de un usuario autenticado y con qué rol.

## Decisión (observada)

`ms-usuarios` emite un JWT firmado con HS256 (`{sub: usuario_id, rol, exp}`). Los demás microservicios (`ms-canchas`, `ms-reservas`, `ms-reportes`) validan ese mismo token **de forma independiente**, cada uno con su propia copia del `SECRET_KEY` simétrico, sin consultar a `ms-usuarios` en cada request.

## Consecuencias

**Positivas**
- Validación local y rápida: ningún microservicio necesita una llamada de red extra a `ms-usuarios` solo para autenticar un request — evita un punto de fallo síncrono adicional a los ya descritos en [ADR-02](ADR-02-comunicacion-sincrona-rest-entre-microservicios.md).
- Es el patrón estándar de JWT stateless: cualquier servicio con el secreto puede verificar sin estado compartido.

**Negativas / riesgos — importante para seguridad**
- **El secreto está hardcodeado y committeado en texto plano** en 4 archivos `.env` dentro del repo (`SECRET_KEY=microserviciousuarios`), y como default en el código (`"dev-secret-key"` en `config.py`) si el `.env` faltara. Cualquiera con acceso al repo tiene el secreto de firma de producción — esto es un hallazgo de seguridad real, no hipotético.
- Al ser HS256 con un secreto **simétrico compartido entre los 4 microservicios**, cualquiera de ellos (o quien comprometa a cualquiera de ellos) puede **emitir** tokens válidos para cualquier usuario y rol, no solo validarlos — HS256 no distingue "puedo verificar" de "puedo firmar". Un algoritmo asimétrico (RS256/ES256) con clave privada solo en `ms-usuarios` y clave pública distribuida al resto eliminaría ese riesgo.
- No hay revocación de tokens: si un token se filtra, sigue siendo válido hasta su `exp`.

## Requisitos No Funcionales derivados

**RNF-03 — Ninguna decisión de autorización de UI reemplaza la autoridad del servidor.** (ver también ADR-frontend-06 y ADR-frontend-08)
Cada microservicio valida rol/ownership de forma independiente contra el JWT, sin confiar en lo que decida mostrar el frontend.

**RNF-04 — El secreto de firma de JWT no debe permitir suplantar a otro microservicio.** *(no cumplido hoy — deuda a resolver)*
HS256 simétrico compartido entre los 4 `ms-*` permite que cualquiera de ellos emita tokens válidos para cualquier usuario/rol, no solo que los valide.

**RNF-05 — Los secretos de configuración no deben viajar en el control de versiones.** *(no cumplido hoy — deuda a resolver)*
`SECRET_KEY` está en texto plano en 4 archivos `.env` trackeados por git.

## Alternativas consideradas

- RS256/ES256 (asimétrico): `ms-usuarios` firma con clave privada, el resto valida con clave pública — reduce el radio de explosión si un microservicio no-auth se compromete. No evaluado por el equipo de backend hasta la fecha de este ADR, a confirmar con Cristian.
- Centralizar la validación en el futuro Gateway de Wilson: reduciría la duplicación de lógica de validación, pero no resuelve por sí sola el problema del secreto committeado.
