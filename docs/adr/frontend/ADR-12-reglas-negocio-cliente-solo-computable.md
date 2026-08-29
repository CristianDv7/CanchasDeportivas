# ADR-12: Reglas de negocio en cliente — solo se espeja lo computable sin estado del servidor

**Estado:** Aceptado — 2026-08-27

## Contexto

`Mf Reservas` debe reflejar en UI las reglas de negocio RN-01 a RN-08 del alcance funcional del proyecto, pero el frontend no es la autoridad de ninguna de ellas — `Ms Reservas` valida todo server-side de todas formas. Había que decidir, regla por regla, si el frontend debía bloquear la acción de antemano o solo informar.

## Decisión

Se espejará como bloqueo duro (deshabilitar el botón) únicamente lo que el frontend puede calcular con certeza sin consultar al servidor: RN-04 ("no cancelar una reserva ya iniciada") se resuelve comparando la hora de inicio contra el reloj local — dato ya en mano, sin ambigüedad.

RN-06 ("límite de reservas activas simultáneas") **no** se espejará como gate que deshabilite el formulario de nueva reserva. Se mostrará un contador informativo ("2 de 3 reservas activas"), pero el límite exacto es configuración del servidor y puede cambiar sin que el frontend se entere. El envío se intentará igual; si el backend rechaza por límite, se muestra el error real devuelto.

## Consecuencias

**Positivas**
- Nunca hay una UI que le diga a un usuario "no podés hacer esto" por una regla que el frontend adivinó mal — RN-06 en particular podría desincronizarse silenciosamente si el límite configurado cambia en backend sin aviso.
- RN-04 sí puede bloquearse con confianza porque no depende de configuración externa, solo del reloj y un dato ya recibido.

**Negativas / riesgos**
- Para RN-06, el usuario puede completar todo un formulario de nueva reserva y recién enterarse del rechazo al enviarlo — peor UX que un bloqueo preventivo, a cambio de nunca mentir sobre el estado real.
- Este criterio ("¿es computable sin estado del servidor?") no está codificado en ningún lint ni test — es una convención documentada, hay que aplicarla a mano en cada RN nueva que se agregue (ej. cuando se aborde RN-07 en `mf-administracion`).

## Requisitos No Funcionales derivados

**RNF-07 — La UI nunca debe bloquear una acción basándose en una regla de negocio que no puede verificar con certeza.**
Solo se deshabilitan acciones en cliente cuando el dato para decidir es local y sin ambigüedad (RN-04). Reglas que dependen de configuración del servidor (RN-06) se muestran como información, no como bloqueo.

## Alternativas consideradas

- Espejar RN-06 también como bloqueo duro, hardcodeando el límite configurado en backend: descartada explícitamente porque acoplaría la UI a un valor de configuración que vive y puede cambiar solo en el servidor.
