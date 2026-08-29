# ADR-03: JWT HS256 con secreto compartido, validado de forma independiente por cada microservicio

**Estado:** Aceptada — 2026-08-29

## Contexto

No existe todavía un API Gateway que centralice la validación de auth. Mientras tanto, cada microservicio necesita saber si un request viene de un usuario autenticado y con qué rol.

## Decisión

`Ms Usuarios` emitirá un JWT firmado con HS256. Los demás microservicios validarán ese mismo token **de forma independiente**, cada uno con su propia copia del secreto simétrico, sin consultar a `Ms Usuarios` en cada request.

## Consecuencias

**Positivas**
- Validación local y rápida: ningún microservicio necesita una llamada de red extra a `Ms Usuarios` solo para autenticar un request — evita un punto de fallo síncrono adicional a los ya descritos en [ADR-02](ADR-02-comunicacion-sincrona-rest-entre-microservicios.md).
- Es el patrón estándar de JWT stateless: cualquier servicio con el secreto puede verificar sin estado compartido.

**Negativas / riesgos — importante para seguridad**
- El secreto debe gestionarse exclusivamente por variable de entorno, nunca comitteado al repositorio — condición no negociable dado el riesgo que implica un secreto simétrico compartido.
- Al ser HS256 con un secreto **simétrico compartido entre los 4 microservicios**, cualquiera de ellos (o quien comprometa a cualquiera de ellos) puede **emitir** tokens válidos para cualquier usuario y rol, no solo validarlos — HS256 no distingue "puedo verificar" de "puedo firmar". Un algoritmo asimétrico (RS256/ES256) con clave privada solo en `Ms Usuarios` y clave pública distribuida al resto eliminaría ese riesgo.
- No hay revocación de tokens: si un token se filtra, sigue siendo válido hasta su expiración.

## Requisitos No Funcionales derivados

**RNF-03 — Ninguna decisión de autorización de UI reemplaza la autoridad del servidor.** (ver también ADR-frontend-06 y ADR-frontend-08)
Cada microservicio valida rol/ownership de forma independiente contra el JWT, sin confiar en lo que decida mostrar el frontend.

**RNF-04 — El secreto de firma de JWT no debe permitir suplantar a otro microservicio.** *(riesgo aceptado para el alcance del curso)*
HS256 simétrico compartido entre los 4 `ms-*` permite que cualquiera de ellos emita tokens válidos para cualquier usuario/rol, no solo que los valide.

**RNF-05 — Los secretos de configuración no deben viajar en el control de versiones.** *(condición no negociable, independiente del algoritmo elegido)*
El secreto debe gestionarse exclusivamente por variable de entorno.

## Alternativas consideradas

- RS256/ES256 (asimétrico): `Ms Usuarios` firma con clave privada, el resto valida con clave pública — reduce el radio de explosión si un microservicio no-auth se compromete. Queda como evolución posible si el Api Gateway llega a centralizar la validación.
- Centralizar la validación en el futuro Api Gateway: reduciría la duplicación de lógica de validación, pero no resuelve por sí sola el problema del secreto committeado.
