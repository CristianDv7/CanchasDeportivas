# ADR-05: Validación de solapamiento (RN-02) sin locking a nivel de base de datos

**Estado:** Aceptada — 2026-08-29

## Contexto

RN-02 es una regla con peso alto en la rúbrica del curso: "no permite reservar un bloque horario ya ocupado en la misma cancha". La validación de solapamiento se resuelve en dos pasos: (1) consultar si hay una reserva solapada, (2) si no hay, insertar la nueva reserva.

## Decisión

No hay ningún mecanismo a nivel de base de datos que impida que dos transacciones concurrentes pasen ambas el paso (1) antes de que cualquiera confirme el paso (2). Esto es un patrón clásico de **race condition check-then-act**.

## Consecuencias

**Negativas / riesgos — es el punto central de este ADR**
- **RN-02 puede violarse bajo concurrencia real**: dos usuarios reservando el mismo bloque horario de la misma cancha al mismo tiempo pueden ambos pasar la validación de solapamiento (ninguno ve todavía la reserva del otro) y ambos confirmar exitosamente — la cancha queda doble-reservada, exactamente lo que RN-02 dice que no debe pasar.
- El nivel de aislamiento por defecto de Postgres (`READ COMMITTED`) no previene esto por sí solo: cada transacción ve el estado *committeado* al momento de su propia lectura, no bloquea a otras transacciones que lean el mismo rango antes de que la primera cierre.
- Es más probable que se manifieste bajo carga real (varios usuarios reservando en simultáneo cerca de un horario popular) que en testing manual secuencial — por eso puede pasar desapercibido en demos y aparecer recién con datos/usuarios reales.

**Positivas**
- Es la implementación más simple posible, y probablemente suficiente para demos y para el volumen de tráfico de un proyecto académico donde la probabilidad de dos requests exactamente simultáneas sobre el mismo bloque es baja.

## Mitigaciones posibles

1. `SELECT ... FOR UPDATE` sobre las reservas del mismo `cancha_id`+`fecha` dentro de la transacción, antes de insertar — serializa la validación entre transacciones concurrentes.
2. Constraint `EXCLUDE` a nivel de Postgres sobre `(cancha_id, fecha, rango_horario)` con `tsrange`/`btree_gist` — la base de datos rechaza el `INSERT` solapado sin importar qué haga la capa de aplicación; es la opción más robusta porque no depende de que el código de servicio recuerde hacerlo bien en cada punto de entrada.
3. Constraint `UNIQUE` simple sobre `(cancha_id, fecha, hora_inicio)` si los bloques son siempre de franjas fijas de 1h (RN-01) — más simple que una exclusion constraint, pero solo cubre solapamiento exacto de franja, no solapamientos parciales si alguna vez se permiten horarios no alineados a la grilla.

## Requisitos No Funcionales derivados

**RNF-06 — Una cancha no puede quedar reservada dos veces para el mismo bloque horario, incluso bajo escritura concurrente.** *(no garantizado hoy — riesgo activo; RN-02 tiene peso alto en la rúbrica del curso)*
La validación actual es check-then-act sin locking a nivel de base de datos. Requiere `SELECT ... FOR UPDATE`, una `EXCLUDE constraint`, o un `UNIQUE` sobre `(cancha_id, fecha, hora_inicio)` para cumplirse de forma garantizada — ver "Mitigaciones posibles" arriba.

## Alternativas consideradas

Ninguna de las mitigaciones listadas arriba fue descartada — quedan como trabajo futuro sobre esta misma decisión.
