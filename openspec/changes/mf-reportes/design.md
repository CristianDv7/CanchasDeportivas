# Design: mf-reportes — dashboard de reportes admin-only

Fase `sdd-design`. Entrada: `proposal.md` (aprobado). Alcance: **CÓMO** se construye — capa adapter, hooks, componentes y las 4 decisiones que la propuesta dejó abiertas para acá (barra proporcional, date-range, forma de los hooks, estructura de carpetas).

## 1. Arquitectura

Mismo patrón validado dos veces (`mf-reservas`, `mf-administracion`), sin router interno (Decisión 1 de la propuesta: una sola vista, 2 paneles apilados):

```
App.tsx  (sin <Routes> — decisión 1 propuesta)
    ├─► features/ocupacion/OcupacionCanchasPanel.tsx
    └─► features/periodo/ReservasPeriodoPanel.tsx
              │  DTOs camelCase, nunca paths ni snake_case
              ├─► domain/rules.ts   (puras: proporción, rango, validación)
              ├─► hooks/useResource.ts  (tercera copia — proposal Decisión 2)
              ▼
        api/reportesApi.ts  (ÚNICO lugar con paths y raw.ts/mappers)
              ▼
        shell/apiClient  ──► proxy Rsbuild ──► ms-reportes :8004
```

| Capa | Puede importar | Prohibido |
|------|----------------|-----------|
| `api/` | `shell/apiClient` | React, `features/`, `domain/` |
| `domain/` | tipos de `api/dto` | React, `api/*Api` |
| `hooks/` | `api/errors` | paths, DTOs concretos |
| `features/` | `api` (barrel), `domain`, `hooks`, `components/` | `api/raw` |

**Regla dura** (idéntica a los otros 2 remotes): `src/api/raw.ts` nunca se importa fuera de `src/api/`. No hay `useAction`: los 2 endpoints son `GET`, no hay mutaciones en este remote.

## 2. Decisiones de diseño

| # | Decisión | Alternativas descartadas | Rationale |
|---|----------|---------------------------|-----------|
| ADR-01 | Barra proporcional: `%` **relativo al máximo del set** (`Math.max` de `reservas` entre todas las canchas), no a un valor fijo. `maxReservas <= 0` (set vacío o todas en 0) ⇒ `0%` para todas. | Valor fijo (ej. capacidad teórica del recinto): no existe ese dato en el backend, habría que inventarlo. Normalizar 0/0 a 100%: mentira visual. | La cancha más ocupada siempre llena el 100% de su fila, cualquiera sea el volumen absoluto — funciona igual con 3 reservas que con 300. Guard explícito evita `NaN`/`Infinity` cuando todas están en 0 (caso real: temporada baja). |
| ADR-02 | `validarRangoFechas` compara los dos strings ISO **lexicográficamente** (`fechaInicio <= fechaFin`), sin `Date`/`toUtcMillis`. | Copiar `toUtcMillis` de `mf-reservas`/`mf-administracion` (interpretar como UTC y comparar epoch ms). | `toUtcMillis` existe para comparar un *instante* (fecha+hora) contra `Date.now()` — acá comparamos dos *fechas de calendario* entre sí, nunca contra "ahora". Con `"YYYY-MM-DD"` el orden lexicográfico de string **es** el orden cronológico; parsear a epoch solo reintroduciría el gotcha de timezone sin necesidad. Consecuencia: `mf-reportes/domain/rules.ts` NO es candidato al trigger de extracción de `packages/shared` de `toUtcMillis` (coherente con proposal Decisión 2). |
| ADR-03 | Los 2 `<input type="date">` escriben a un estado **borrador** (`draft`); un botón "Actualizar" lo copia al estado **aplicado**, que es el único que entra en las deps de `useResource`. | Auto-fetch en cada `onChange` (mismo criterio que `CanchaFechaPicker`/`useDisponibilidad` de `mf-reservas`). | La propuesta (Decisión 7) pide explícitamente "refetch manual con botón Actualizar. Sin polling" — divergencia deliberada de "cancha+fecha": ahí *no hay nada que mostrar* hasta elegir ambos campos, acá *siempre* hay un rango por defecto útil, así que auto-disparar en cada tecleo de fecha generaría requests intermedios contra rangos a medio completar. El botón se deshabilita si `!validarRangoFechas(draft)` (defensa antes del round-trip, Decisión 4 de la propuesta). |
| ADR-04 | `rangoPorDefecto(hoy = new Date())`: últimos 30 días, calculado con getters de fecha **local** (no UTC) — es un "hoy" percibido por el admin, no un instante a comparar contra el backend. Se dispara automáticamente al montar (sin gating por `enabled`). | `enabled: false` hasta que el admin interactúe (patrón `useDisponibilidad`). | Proposal Decisión 7: "un dashboard debe informar al abrirse". El rango por defecto siempre es válido (`hoy-30 <= hoy`), así que `useReservasPeriodo` no necesita `enabled` — a diferencia de `useDisponibilidad`, que sí lo necesita porque antes de elegir cancha+fecha no hay ningún valor por defecto razonable. |
| ADR-05 | `mapApiError`: rama **502 propia**, antes del `>=500` genérico — mensaje de disyunción honesta ("canchas o reservas") + `action: "retry"`. `400` (solo en `/reservas/periodo`) ⇒ se muestra el `detail` verbatim con `action: "none"` (no `"refetch"`): es un `GET` sobre un query propio, no el efecto colateral de un `POST` — no hay ninguna otra lista que resincronizar, el botón "Actualizar" ya es la vía de corrección. | Meter el 502 dentro del `>=500` genérico (como hacen `mf-reservas`/`mf-administracion`, que no tienen agregador). Copiar `action: "refetch-disponibilidad"` del 400 de `mf-reservas` para el 400 acá. | El 502 de `ms-reportes` es semánticamente distinto a un 500 propio: es un *fan-out* que falló contra otro microservicio (`except Exception` opaco, `reporte_service.py`/`reportes.py`) — nombrar la disyunción real ayuda al admin sin inventar cuál de los dos cayó (proposal Decisión 3). El 400 de acá no tiene "grilla" que resincronizar como el de `mf-reservas`. |
| ADR-06 | `OcupacionCanchasPanel` distingue 3 estados: `status==="success" && data.length===0` → "No hay canchas cargadas" (vacío real); `data.length>0` → tabla completa, **toda fila incluida aunque `reservas===0`** (barra en 0%, sin omitir). | Ocultar filas con `reservas===0` o fusionarlas en un texto tipo "N canchas sin actividad". | Proposal Decisión 6: en un reporte el cero es información (cancha ociosa) — colapsarlo esconde justo la señal que el admin busca. El estado vacío real (sin canchas cargadas en el sistema) es un caso distinto y debe distinguirse con su propio mensaje. |
| ADR-07 | `isValidFecha` se **copia textual** de `mf-reservas/domain/rules.ts` (guard contra años de 5 dígitos vía teclado en `<input type="date">`) y se aplica a **ambos** inputs del rango. | No filtrar (dejar pasar al backend, que devolvería 422). | El bug ya es real y documentado en `mf-reservas` (2026-08-28); acá hay el doble de superficie (2 inputs en vez de 1) para el mismo bug de navegador. Consistencia con el resto del monorepo: nunca dejar que un 422 de Pydantic (texto en inglés) llegue a pantalla. |

## 3. Data Flow

```
Mount ──► useResource(reportesApi.ocupacionCanchas, [])         ──► tabla + barras
Mount ──► rangoPorDefecto() ──► useReservasPeriodo(rango)        ──► total del período
Admin edita inputs ──► setDraft (NO dispara fetch)
Admin click "Actualizar" (habilitado ⇔ validarRangoFechas(draft)) ──► setRango(draft)
                                                                   ──► deps cambian ──► refetch
```

## 4. File Changes

| Archivo | Acción | Descripción |
|---|---|---|
| `src/api/raw.ts` | Create | `OcupacionCanchaRaw`, `ReservasPeriodoRaw` (snake_case, espeja `app/schemas/reporte.py`). |
| `src/api/dto.ts` | Create | `IsoDate`, `OcupacionCancha`, `ReservasPeriodo` (camelCase, `readonly`). |
| `src/api/mappers.ts` | Create | `toOcupacionCancha`, `toReservasPeriodo`. |
| `src/api/reportesApi.ts` | Create | `ocupacionCanchas(signal)`, `reservasPeriodo(fechaInicio, fechaFin, signal)` — `apiClient.get` con `service: "reportes"` y `query: {fecha_inicio, fecha_fin}`. |
| `src/api/errors.ts` | Create | `mapApiError` con rama 502 (ADR-05). |
| `src/api/index.ts` | Create | Barrel: `reportesApi`, tipos DTO, `isApiError`/`mapApiError`. `raw.ts` no se re-exporta. |
| `src/domain/rules.ts` | Create | `isValidFecha`, `validarRangoFechas`, `rangoPorDefecto`, `calcularMaxReservas`, `calcularProporcion`. |
| `src/hooks/useResource.ts` | Create | Copia textual (comentario cruzado a `mf-reservas`/`mf-administracion`). |
| `src/components/ErrorBanner.tsx` | Create | Copia textual (mismo contrato `UiError`/`action`). |
| `src/features/ocupacion/OcupacionCanchasPanel.tsx` | Create | Tabla + barra, ADR-01/06. |
| `src/features/periodo/ReservasPeriodoPanel.tsx` | Create | Orquesta `RangoFechasPicker` + `useReservasPeriodo`, ADR-03/04. |
| `src/features/periodo/RangoFechasPicker.tsx` | Create | 2 `<input type="date">` controlados, filtra con `isValidFecha` (ADR-07). |
| `src/features/periodo/useReservasPeriodo.ts` | Create | Envuelve `useResource`, sin `enabled` (ADR-04). |
| `src/mocks/handlers.ts`, `src/mocks/server.ts` | Create | MSW — mismo patrón que `mf-administracion`. |
| `src/App.tsx` | Modify | Reemplaza `RemoteHealthCard` por los 2 paneles (sin `<Routes>`, Decisión 1). |
| `src/RemoteHealthCard.tsx`, `.css`, `.test.tsx` | Delete | Placeholder retirado. |
| `package.json` | Modify | Agrega `msw` a devDependencies. |
| `setupTests.ts` | Modify | Agrega ciclo de vida de `server` (idéntico a `mf-administracion`). |
| `openspec/specs/frontend-remote-modules/spec.md` | Modify | Delta: retira los 3 requisitos de `RemoteHealthCard`. |

## 5. Interfaces / Contratos

```ts
// dto.ts
export type IsoDate = string; // "YYYY-MM-DD"
export interface OcupacionCancha {
  readonly canchaId: number;
  readonly cancha: string;
  readonly reservas: number;
}
export interface ReservasPeriodo {
  readonly fechaInicio: IsoDate;
  readonly fechaFin: IsoDate;
  readonly totalReservas: number;
}

// reportesApi.ts (paths reales, único lugar que los conoce)
ocupacionCanchas(signal?): Promise<OcupacionCancha[]>       // GET /reportes/ocupacion/canchas
reservasPeriodo(fechaInicio, fechaFin, signal?): Promise<ReservasPeriodo>
  // GET /reportes/reservas/periodo?fecha_inicio=..&fecha_fin=..
```

CSS prefix propio: `mfrp-*` (no colisiona con `mfr-*` de `mf-reservas` ni `mfa-*` de `mf-administracion`).

## 6. Testing Strategy (TDD estricto — pares RED/GREEN)

| Capa | Qué testear | Enfoque |
|---|---|---|
| `domain/rules.ts` | `calcularProporcion` (max=0 ⇒ 0, caso normal, redondeo); `calcularMaxReservas` (set vacío ⇒ 0); `validarRangoFechas` (igual, invertido, normal); `rangoPorDefecto` (con `hoy` inyectado, sin `Date.now()` real); `isValidFecha` (copiado — reusar los mismos casos que `mf-reservas`). | Unit, sin red, sin React. |
| `api/mappers.ts` | snake_case → camelCase de ambos endpoints. | Unit puro. |
| `api/errors.ts` | 502 → mensaje propio + retry; 400 → `detail` verbatim + `none`; `>=500` genérico separado del 502. | Unit, `ApiError` construido a mano (duck-typing). |
| `OcupacionCanchasPanel` | vacío real vs. cancha en 0 (ADR-06); barra en 0% cuando todas están en 0; error 502 con retry. | MSW + Testing Library. |
| `ReservasPeriodoPanel` | rango por defecto se autoconsulta al montar; botón deshabilitado con rango inválido; click en "Actualizar" dispara el fetch con el rango aplicado (no con cada tecleo); 400 muestra `detail`. | MSW + Testing Library. |
| Integración | `pnpm -r test` y `pnpm -r build` verdes; sin diff en `shell/`, `backend/`, `apigateway/`. | CI/manual, igual que los 2 changes previos. |

## 7. Migration / Rollout

No aplica migración de datos. Rollout = mismo remote federado, mismo proxy — reemplaza contenido de `/reportes/*` en un solo deploy del bundle de `mf-reportes`. Rollback: `git revert` (ver proposal.md).

## 8. Open Questions

Ninguna — las 3 preguntas que la propuesta dejó abiertas para esta fase (barra proporcional, date-range, forma de los hooks) quedan resueltas en ADR-01 a ADR-04. La pregunta sobre el demo en vivo del `ErrorBoundary` ya fue resuelta por el orquestador (no se agrega trigger dev-only) y no se reabre acá.
