# ADR-05: Validación de solapamiento (RN-02) sin locking a nivel de base de datos

**Estado:** Observado — riesgo activo, no confirmado ni mitigado por Cristian — 2026-08-27
**Evidencia en código:** `backend/ms-reservas/app/services/reserva_service.py`, método `create()` — bloque `RN-02: VALIDAR SOLAPAMIENTO` (líneas ~141-158): `SELECT` de solapamiento seguido de `INSERT`, sin `SELECT ... FOR UPDATE`, sin constraint `UNIQUE`/`EXCLUDE` a nivel de tabla, dentro de la misma transacción implícita de SQLAlchemy pero sin lock explícito.

## Contexto

RN-02 es una regla con peso alto en la rúbrica del curso: "no permite reservar un bloque horario ya ocupado en la misma cancha". La implementación actual de `ReservaService.create()` es: (1) consultar si hay una reserva solapada con `get_reserva_solapada`, (2) si no hay, insertar la nueva reserva y hacer `commit()`.

## Decisión (observada, no deliberada — es una ausencia)

No hay ningún mecanismo a nivel de base de datos que impida que dos transacciones concurrentes pasen ambas el paso (1) antes de que cualquiera llegue al `commit()` del paso (2). Esto es un patrón clásico de **race condition check-then-act**.

## Consecuencias

**Negativas / riesgos — es el punto central de este ADR**
- **RN-02 puede violarse bajo concurrencia real**: dos usuarios reservando el mismo bloque horario de la misma cancha al mismo tiempo pueden ambos pasar la validación de solapamiento (ninguno ve todavía la reserva del otro) y ambos terminar con un `commit()` exitoso — la cancha queda doble-reservada, exactamente lo que RN-02 dice que no debe pasar.
- El nivel de aislamiento por defecto de Postgres (`READ COMMITTED`) no previene esto por sí solo: cada transacción ve el estado *committeado* al momento de su propia lectura, no bloquea a otras transacciones que lean el mismo rango antes de que la primera cierre.
- Es más probable que se manifieste bajo carga real (varios usuarios reservando en simultáneo cerca de un horario popular) que en testing manual secuencial — por eso puede pasar desapercibido en demos y aparecer recién con datos/usuarios reales.

**Positivas**
- Es la implementación más simple posible, y probablemente suficiente para demos y para el volumen de tráfico de un proyecto académico donde la probabilidad de dos requests exactamente simultáneas sobre el mismo bloque es baja.

## Mitigaciones posibles (no implementadas, a evaluar por Cristian)

1. `SELECT ... FOR UPDATE` sobre las reservas del mismo `cancha_id`+`fecha` dentro de la transacción, antes de insertar — serializa la validación entre transacciones concurrentes.
2. Constraint `EXCLUDE` a nivel de Postgres sobre `(cancha_id, fecha, rango_horario)` con `tsrange`/`btree_gist` — la base de datos rechaza el `INSERT` solapado sin importar qué haga la capa de aplicación; es la opción más robusta porque no depende de que el código de servicio recuerde hacerlo bien en cada punto de entrada.
3. Constraint `UNIQUE` simple sobre `(cancha_id, fecha, hora_inicio)` si los bloques son siempre de franjas fijas de 1h (RN-01) — más simple que una exclusion constraint, pero solo cubre solapamiento exacto de franja, no solapamientos parciales si alguna vez se permiten horarios no alineados a la grilla.

## Requisitos No Funcionales derivados

**RNF-06 — Una cancha no puede quedar reservada dos veces para el mismo bloque horario, incluso bajo escritura concurrente.** *(no garantizado hoy — riesgo activo; RN-02 tiene peso alto en la rúbrica del curso)*
La validación actual es check-then-act sin locking a nivel de base de datos. Requiere `SELECT ... FOR UPDATE`, una `EXCLUDE constraint`, o un `UNIQUE` sobre `(cancha_id, fecha, hora_inicio)` para cumplirse de forma garantizada — ver "Mitigaciones posibles" arriba.

## Alternativas consideradas

Ninguna fue evaluada por el equipo de backend hasta la fecha de este ADR — es un hallazgo de esta auditoría de documentación, no una decisión tomada y descartada.
