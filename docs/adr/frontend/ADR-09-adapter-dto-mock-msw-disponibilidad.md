# ADR-09: Capa adapter/DTO aislada + MSW para el endpoint de disponibilidad aún inexistente

**Estado:** Aceptado — 2026-08-27

## Contexto

Al diseñar `mf-reservas`, el endpoint de disponibilidad era una propuesta del frontend hacia el bloque de backend, todavía no implementado. La convención dura del equipo prohíbe implementar código fuera del propio bloque, incluso como spike temporal. Había que poder construir y testear la UI sin ese endpoint real.

## Decisión

Toda la interacción con `Ms Reservas`/`Ms Canchas` pasará por adapters que devuelven DTOs propios del frontend, mapeados desde el JSON crudo del backend. MSW servirá el endpoint de disponibilidad mientras no exista, con el shape propuesto. Ningún componente de UI conocerá la forma cruda de la respuesta HTTP.

## Consecuencias

**Positivas**
- Si el contrato real del endpoint termina siendo distinto al propuesto, el único punto de cambio será el mapper del adapter, sin tocar ningún componente de UI.
- MSW permite testear y demostrar el flujo completo (incluida cancelación end-to-end) sin depender de que el backend esté corriendo.

**Negativas / riesgos**
- Doble mantenimiento temporal: mientras el mock y el endpoint real coexisten, hay que mantener ambos sincronizados en shape hasta apagar el mock definitivamente.
- Si el adapter no se disciplina (algún componente importa el módulo crudo directo), se pierde el aislamiento — mitigado por convención de carpetas, no por un límite técnico duro.

## Requisitos No Funcionales derivados

**RNF-12 — Un cambio en el contrato HTTP de un microservicio no debe requerir cambios en los componentes de UI del microfrontend consumidor.**
Si el shape real del endpoint difiere del propuesto, el único archivo que debe cambiar es el mapper — cero cambios en componentes de UI.

## Alternativas consideradas

- Bloquear el desarrollo de `mf-reservas` hasta que el bloque de backend entregue el endpoint: descartada, hubiera parado todo el bloque de frontend por una dependencia cruzada entre bloques de personas distintas.
- Hacer fetch directo sin capa de mapeo, ajustando componentes cuando cambie el backend: descartada, es exactamente el acoplamiento que el adapter evita.
