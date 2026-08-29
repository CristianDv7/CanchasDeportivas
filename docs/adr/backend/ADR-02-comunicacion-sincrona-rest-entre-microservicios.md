# ADR-02: Comunicación entre microservicios síncrona vía REST/`httpx`

**Estado:** Observado (no confirmado por Cristian) — 2026-08-27
**Evidencia en código:** `backend/ms-reservas/app/clients/{canchas_client,usuarios_client}.py` — llamadas `httpx.get(...)` con `timeout=5.0`, sin retry ni circuit breaker.

## Contexto

Crear una reserva en `ms-reservas` requiere validar que el usuario exista y esté activo (dato de `ms-usuarios`) y que la cancha exista, esté activa y la reserva caiga dentro de su horario de atención (dato de `ms-canchas`). Cada microservicio es dueño exclusivo de su base — `ms-reservas` no puede leer esas tablas directamente.

## Decisión (observada)

`ms-reservas` llama sincrónicamente, por HTTP REST, a `ms-usuarios` (`GET /usuarios/{id}`) y `ms-canchas` (`GET /canchas/{id}`, `GET /horarios-atencion`) en el momento de crear una reserva, con un timeout fijo de 5 segundos. No hay cola de mensajes ni bus de eventos entre microservicios.

## Consecuencias

**Positivas**
- Simplicidad: no hay infraestructura adicional (broker, colas) que operar para un proyecto del alcance de este curso.
- Consistencia fuerte en el momento de la validación: al crear una reserva, se consulta el estado real y actual de usuario/cancha, no una copia potencialmente desactualizada.

**Negativas / riesgos**
- **Acoplamiento temporal fuerte**: si `ms-usuarios` o `ms-canchas` están caídos o lentos, crear una reserva falla en cascada — `RuntimeError("No fue posible comunicarse con ms-canchas")` — aunque `ms-reservas` esté sano. No hay circuit breaker ni degradación (ej. cachear el último estado conocido).
- El timeout de 5s por llamada, con 2-3 llamadas encadenadas en el peor caso (usuario + cancha + horarios), puede acumular hasta ~15s de latencia máxima en un solo request de creación de reserva antes de fallar — impacto directo en NFR de tiempo de respuesta.
- Sin reintentos: un timeout transitorio de red (no una caída real del servicio) también hace fallar la operación completa.

## Requisitos No Funcionales derivados

**RNF-10 — Crear una reserva no debe fallar en cascada por la latencia o caída transitoria de un microservicio dependiente.** *(no cumplido hoy — deuda a resolver)*
Sin retry ni circuit breaker: una caída o timeout de `ms-usuarios`/`ms-canchas` hace fallar la creación de la reserva completa.

**RNF-16 — El tiempo de respuesta de crear una reserva debe tener un techo conocido y documentado.**
Con 3 llamadas HTTP encadenadas a 5s de timeout cada una, el peor caso ronda ~15s antes de fallar — debería fijarse un SLA explícito, y si no es aceptable, paralelizar las validaciones independientes (usuario y cancha no dependen entre sí).

## Alternativas consideradas

- Eventos asíncronos (ej. `ms-canchas` publica cambios de estado, `ms-reservas` mantiene una vista local cacheada): más resiliente a caídas puntuales, pero introduce consistencia eventual — no evaluado si es aceptable para RN-01/RN-02, que dependen de datos frescos de cancha/horario. Requeriría infraestructura de mensajería no presente hoy en el proyecto.
