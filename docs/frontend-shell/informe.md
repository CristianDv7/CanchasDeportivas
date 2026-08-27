# Informe: Esqueleto Frontend (Shell + Microfrontends) — Change `frontend-shell`

**Proyecto**: Sistema de Reserva de Canchas Deportivas
**Responsable**: Brando (bloque frontend)
**Fecha**: 26-27 de agosto de 2026
**Metodología**: Spec-Driven Development (SDD) con asistencia de Claude Code
**Artefactos completos**: `openspec/changes/archive/2026-08-26-frontend-shell/`

---

## 1. Objetivo

Construir el esqueleto del bloque frontend (Fase 1 del plan del proyecto): un *shell* React host con Module Federation, autenticación real contra `ms-usuarios`, control de acceso por rol, y tres microfrontends remotos (`mf-reservas`, `mf-administracion`, `mf-reportes`) cargados dinámicamente. El objetivo explícito **no** era implementar la lógica de negocio de cada remote todavía — eso queda para changes futuras — sino dejar la base arquitectónica sólida, probada y documentada.

## 2. Por qué SDD y no "sentarse a programar"

Se usó el flujo SDD (`sdd-explore → sdd-propose → sdd-spec → sdd-design → sdd-tasks → sdd-apply → sdd-verify → sdd-archive`) en vez de arrancar directo a escribir código. La diferencia se nota en cosas muy concretas de este proyecto:

- Las decisiones de arquitectura (Rsbuild vs. Webpack, dónde vive el `apiClient` compartido, cómo guardar el JWT) se tomaron **antes** de escribir una sola línea, con el trade-off explícito por escrito — no se improvisaron sobre la marcha.
- Cada unidad de lógica no trivial (`SessionStore`, `apiClient`, guards de ruta) se implementó con TDD estricto (RED → GREEN), porque el proyecto tiene el modo TDD estricto activo.
- Quedó un rastro de auditoría completo (`openspec/changes/archive/2026-08-26-frontend-shell/`) que cualquier compañero — o el profesor — puede leer para entender el *por qué* de cada decisión, no solo el *qué*.

## 3. Las fases y qué produjo cada una

### 3.1 Exploración (`sdd-explore`)

Se investigó el contrato real de `ms-usuarios` (login, JWT, roles `usuario`/`administrador`) y se compararon dos enfoques de Module Federation:

| Opción | Resultado |
|---|---|
| Webpack 5 + `@module-federation/enhanced` | Más documentación acumulada, pero HMR/build notablemente más lento |
| **Rsbuild (Rspack) + Module Federation 2.0** ✅ elegida | 5-10x más rápido en HMR/build; menos boilerplate; combo más nuevo (menos foros para bugs raros) |

Para un desarrollador solo levantando 4 apps en paralelo, la velocidad de iteración pesó más que la madurez de la comunidad.

### 3.2 Propuesta (`sdd-propose`)

Se cerraron 4 decisiones concretas que la exploración había dejado abiertas:

1. **pnpm workspaces** (no npm) — su `node_modules` estricto elimina la causa #1 de crashes en Module Federation: copias duplicadas de React.
2. **`apiClient` + sesión como módulo federado del shell**, no un paquete `packages/` — la sesión tiene que ser una única instancia en runtime, no una copia por remote.
3. **Token en memoria + espejo en `sessionStorage`**, detrás de una interfaz `SessionStore` — httpOnly no era viable (no controlamos el backend), pero la interfaz deja la migración a cookie como un cambio de un solo archivo el día que exista el Gateway.
4. **Placeholder = `RemoteHealthCard`**, no una pantalla vacía — cada remote muestra nombre, build id, origen federado, usuario/rol de la sesión y un botón para forzar un error, para poder *demostrar* la integración real en vez de solo prometerla.

### 3.3 Specs y Diseño (`sdd-spec` + `sdd-design`, en paralelo)

Se escribieron 3 especificaciones formales (Given/When/Then, 24 escenarios en total) — `frontend-shell-host`, `frontend-auth-session`, `frontend-remote-modules` — y el diseño técnico definió, con nombres y firmas exactas, las interfaces de `ApiClient`, `useSession()` y `SessionStore`, más dos diagramas de secuencia (carga de Module Federation, flujo de login+guard) y un **plan de validación de HMR con 6 pruebas concretas (A-F)** y una escalera de fallback si algo fallaba.

### 3.4 Tareas (`sdd-tasks`)

El diseño se partió en **5 fases, ~50 tareas**, cada unidad no trivial marcada explícitamente como par RED→GREEN por el modo TDD estricto del proyecto.

### 3.5 Implementación (`sdd-apply`, en 5 batches)

Se implementó fase por fase, verificando entre cada una antes de seguir:

- **Fase 1 — Infraestructura**: workspace pnpm, puertos reales de los 4 microservicios confirmados leyendo el código (ninguno los fija, se usó una convención: `8001-8004`), proxy same-origin del shell, Vitest configurado en las 4 apps.
- **Fase 2 — Implementación core**: `SessionStore` (token en memoria + espejo versionado), `apiClient` (mapeo de errores, guard de 401 único), `useSession()` con `useSyncExternalStore`, login real, guards por rol, el shell host completo, y `RemoteHealthCard` en los 3 remotes. **26 tareas, todas con test primero.**
- **Fase 3 — Validación manual**: acá el proceso cambió de forma — ver sección 5.
- **Fase 4 — Testing/Verificación**: se corrió la suite completa, se auditaron los 24 escenarios de las specs contra los tests reales (no solo se confió en los nombres de los tests), y se encontró un gap real que se cerró.
- **Fase 5 — Documentación**: `frontend/README.md` con todo lo operativo (cómo levantar el entorno, límites conocidos de HMR, credenciales de prueba).

### 3.6 Verificación independiente (`sdd-verify`)

Una auditoría separada, sin confiar en las notas de `tasks.md`: re-corrió la suite real, releyó las specs con ojo crítico, comparó las interfaces del código contra el diseño. **Veredicto: PASS, 0 CRITICAL.**

### 3.7 Archivo (`sdd-archive`)

Las 3 specs se mergearon a `openspec/specs/` como fuente de verdad del proyecto, y toda la carpeta del change se movió a `openspec/changes/archive/2026-08-26-frontend-shell/` como rastro de auditoría permanente.

## 4. Cuándo fue SDD y cuándo fue "vibe coding"

Esta es la distinción más honesta de todo el proceso, y vale la pena explicarla sin adornos.

### Lo que SÍ siguió el proceso SDD de punta a punta

Toda decisión de arquitectura, toda interfaz, y toda unidad de lógica de negocio previsible (`SessionStore`, `apiClient`, guards, el shell host) se escribió **con test primero**, siguiendo una spec ya aprobada, dentro de una tarea numerada de un checklist. Nada de esto se improvisó — si hoy alguien pregunta "¿por qué el token está en `sessionStorage` y no en `localStorage`?", la respuesta está documentada en la propuesta, con el trade-off explícito, escrita **antes** de tocar código.

### Lo que fue "vibe coding" — y por qué tenía que serlo

Cuando se levantó el entorno real (Postgres, `ms-usuarios` corriendo, las 4 apps del frontend) y se probó todo en un navegador de verdad, aparecieron **dos bugs reales que ningún documento podía haber anticipado**, porque solo existen cuando el código corre de verdad:

**Bug 1 — variables de entorno rotas en runtime.** Los 4 archivos `config/env.ts` leían `import.meta.env` a través de una variable intermedia (`const raw = import.meta.env`) en vez de la expresión literal. Rsbuild solo reemplaza esa expresión exacta en tiempo de build — el alias nunca matcheaba, así que en runtime real la app quedaba en pantalla blanca. **Los 82 tests automatizados no lo detectaban** (bajo Vitest, `import.meta.env` es un objeto real, no un literal reemplazado). Se encontró leyendo la consola del navegador en vivo, no por ningún proceso estructurado — pura investigación manual.

**Bug 2 — un remote caído tumbaba toda la app.** Al matar `mf-reportes` para simular una falla real, no solo esa ruta se rompía: `/reservas`, que depende de un remote completamente sano, **también** quedaba en blanco. Encontrar la causa exigió leer el bundle JavaScript compilado del runtime de Module Federation (`curl` al `index.js` servido en dev, buscar a mano dónde se armaba el `Promise.all` que fallaba), grepear los tipos TypeScript instalados en `node_modules` para confirmar que `shareStrategy: "loaded-first"` era una opción real y no una invención, y validar la hipótesis matando y levantando servicios repetidamente. Nada de este proceso estaba en ningún plan — fue debugging de caja negra, iterativo, sin guion.

**La diferencia práctica**: SDD funciona extremadamente bien para todo lo que se puede prever y diseñar de antemano — arquitectura, contratos, lógica de negocio. Pero un bug que solo existe cuando el sistema real corre (un reemplazo de build que falla en silencio, una interacción rara entre `shared: singleton` y el runtime de Module Federation) **no se puede spec-driven-development**: hay que prender el sistema, mirar lo que realmente pasa, y seguir la evidencia. Ese fue el momento de "vibe coding" de esta sesión — y es, honestamente, el trabajo más interesante que se hizo, porque no había receta.

Los dos bugs se arreglaron directamente (sin pasar por el checklist formal de tareas, por ser correcciones puntuales fuera del alcance previsto), se verificaron con la suite real, y quedaron documentados con el mismo nivel de detalle que el resto — nada se escondió del rastro de auditoría.

## 5. Evidencia — capturas de las pruebas reales

Todas las capturas son de la app corriendo de verdad contra `ms-usuarios` real (Postgres + FastAPI, sin mocks).

### Login vacío

![Login vacío](capturas/02-login-vacio.jpg)

### Sesión de administrador — `mf-reservas` cargado vía Module Federation

Login real contra `ms-usuarios`, JWT decodificado, `RemoteHealthCard` mostrando el origen federado real (`localhost:3001`) y los datos de sesión.

![Admin en mf-reservas](capturas/01-admin-mf-reservas-cargado.jpg)

### Rol `usuario` — navegación restringida

El usuario no-administrador ni siquiera ve los links de Administración/Reportes en el nav (RN-03/RN-07 reflejadas en la UI).

![Usuario con nav restringido](capturas/03-usuario-nav-restringido.jpg)

### Intento de acceso directo por URL — bloqueado

Si el usuario `usuario` intenta entrar a `/administracion` escribiendo la URL a mano, el guard lo redirige.

![Acceso denegado](capturas/04-acceso-denegado.jpg)

### Aislamiento de errores — `ErrorBoundary` por remote

Al forzar un error dentro de `mf-reservas` (botón "Forzar error"), solo ese remote cae — el resto del shell (nav, sesión) sigue funcionando.

![ErrorBoundary aislado](capturas/05-error-boundary-forzado.jpg)

### El resto de la app sigue viva

Navegando a Administración mientras Reservas está roto, todo funciona con normalidad — la prueba central de que el aislamiento entre remotes funciona.

![Administración sigue viva](capturas/06-administracion-sigue-vivo.jpg)

## 6. Resultados medibles

| Métrica | Resultado |
|---|---|
| Tests automatizados | 83 (4 apps, 14 archivos), todos verdes |
| Cobertura de escenarios de spec | 20/24 con test explícito, 3 parciales, 1 solo verificable manualmente (requiere runtime real de Module Federation) |
| Build de producción | Exit 0 en las 4 apps |
| Bugs de código reales encontrados y arreglados | 2 (env.ts, shareStrategy) |
| Bug preexistente encontrado de paso | 1 (YAML inválido en `openspec/config.yaml`, ya estaba roto antes de este change) |
| Hallazgos CRITICAL en la verificación final | 0 |

## 7. Qué sigue

Los 3 remotes son hoy placeholders funcionales (`RemoteHealthCard`), no pantallas de negocio. El siguiente change SDD (`mf-reservas-booking`, ya en exploración) implementa el flujo real de reservas — disponibilidad, nueva reserva, cancelación — diseñado para que conectarlo al futuro API Gateway de Wilson sea un cambio de configuración, no de arquitectura.
