# ADR-09: Capa adapter/DTO aislada + MSW para el endpoint de disponibilidad aún inexistente

**Estado:** Aceptado — 2026-08-27 (validado en producción de facto: Cristian implementó el endpoint real el mismo día con un shape distinto al propuesto, y el adapter absorbió el cambio sin tocar UI)
**Evidencia en código:** `frontend/apps/mf-reservas/src/api/{dto,mappers,reservasApi}.ts`, `src/mocks/handlers.ts`.

## Contexto

Al diseñar `mf-reservas`, `GET /reservas/disponibilidad` todavía no existía en `ms-reservas` — era una propuesta del frontend hacia Cristian (`docs/propuestas/ms-reservas-endpoint-disponibilidad.md`). Convención del equipo: nunca implementar código en `backend/`, es el bloque de Cristian. Había que poder construir y testear la UI sin ese endpoint real.

## Decisión

Toda la interacción con `ms-reservas`/`ms-canchas` pasa por `reservasApi`/`canchasApi`, que devuelven DTOs propios del frontend (`dto.ts`), mapeados desde el JSON crudo del backend (`mappers.ts`). MSW (`mocks/handlers.ts`) sirve el endpoint de disponibilidad mientras no existe, con el shape propuesto. Ningún componente de UI conoce la forma cruda de la respuesta HTTP.

## Consecuencias

**Positivas**
- Cuando Cristian implementó el endpoint real (commit `ccad5aa`, mismo día) con un shape distinto al propuesto — devuelve `list[ReservaResponse]` crudo en vez de una grilla ya armada — el único archivo que cambió fue el mapper (`mappers.ts`). Cero cambios en componentes de UI.
- MSW permite testear y demostrar el flujo completo (incluida cancelación end-to-end) sin depender de que el backend esté corriendo.

**Negativas / riesgos**
- Doble mantenimiento temporal: mientras el mock y el endpoint real coexisten, hay que mantener ambos sincronizados en shape hasta apagar el mock definitivamente.
- Si el adapter no se disciplina (alguien importa `raw.ts` directo desde un componente), se pierde el aislamiento — mitigado por convención de carpetas, no por un límite técnico duro.

## Requisitos No Funcionales derivados

**RNF-12 — Un cambio en el contrato HTTP de un microservicio no debe requerir cambios en los componentes de UI del microfrontend consumidor.**
Validado en la práctica: el shape real de `GET /reservas/disponibilidad` difirió del propuesto y el único archivo que cambió fue el mapper (`mappers.ts`) — cero cambios en componentes de UI.

## Alternativas consideradas

- Bloquear el desarrollo de `mf-reservas` hasta que Cristian entregue el endpoint: descartada, hubiera parado todo el bloque de frontend por una dependencia cruzada entre bloques de personas distintas.
- Hacer fetch directo sin capa de mapeo, ajustando componentes cuando cambie el backend: descartada, es exactamente el acoplamiento que el adapter evita — y el episodio real (shape distinto al propuesto) confirma que era el riesgo correcto a mitigar.
