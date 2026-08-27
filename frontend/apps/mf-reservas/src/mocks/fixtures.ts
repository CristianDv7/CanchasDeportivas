// Fixtures MSW en shape CRUDO (snake_case) del backend — design.md §2/§9.
// Deliberadamente NO tipados contra `src/api/raw.ts` (Fase 2, adapter):
// estos objetos son responsabilidad de los mocks, no del adapter, y no debe
// haber import cruzado `mocks/` → `api/`.

export const canchasRaw = [
  {
    id: 1,
    nombre: "Cancha 1 - Fútbol 5",
    deporte_id: 1,
    activo: true,
    created_at: "2026-01-01T00:00:00",
    updated_at: "2026-01-01T00:00:00",
  },
  {
    id: 2,
    nombre: "Cancha 2 - Paddle",
    deporte_id: 2,
    activo: true,
    created_at: "2026-01-01T00:00:00",
    updated_at: "2026-01-01T00:00:00",
  },
];

export const reservasRaw = [
  {
    id: 10,
    usuario_id: 1,
    cancha_id: 1,
    fecha: "2026-08-28",
    hora_inicio: "10:00:00",
    hora_fin: "11:00:00",
    estado: "Confirmada",
    created_at: "2026-08-20T00:00:00",
    updated_at: "2026-08-20T00:00:00",
  },
  {
    id: 11,
    usuario_id: 1,
    cancha_id: 2,
    fecha: "2026-08-01",
    hora_inicio: "09:00:00",
    hora_fin: "10:00:00",
    estado: "Finalizada",
    created_at: "2026-07-25T00:00:00",
    updated_at: "2026-08-01T10:00:00",
  },
];

// Contrato REAL (ya no la grilla propuesta): `horarios-atencion` (ms-canchas,
// sin auth) + `reservas/disponibilidad` (list[ReservaResponse], solo
// Confirmada) — el frontend arma la grilla combinando ambos
// (`buildDisponibilidad`, src/api/mappers.ts).
// 2026-08-28 es viernes ⇒ ISO dia_semana=5 (verificado con Date.UTC).
export const horariosAtencionRaw = [
  {
    id: 1,
    cancha_id: 1,
    dia_semana: 5,
    hora_inicio: "08:00:00",
    hora_fin: "11:00:00",
    activo: true,
  },
];

// Reservas Confirmada devueltas por `GET /reservas/disponibilidad` —
// incluyen `usuario_id` (de terceros) a propósito: el mapper del frontend es
// quien debe descartarlo activamente antes de llegar a la UI.
export const disponibilidadReservasRaw = [
  {
    id: 50,
    usuario_id: 7,
    cancha_id: 1,
    fecha: "2026-08-28",
    hora_inicio: "10:00:00",
    hora_fin: "11:00:00",
    estado: "Confirmada",
    created_at: "2026-08-20T00:00:00",
    updated_at: "2026-08-20T00:00:00",
  },
];

// Factory para overrides puntuales en tests (p. ej. MisReservasPage.test.tsx),
// sin importar `ReservaRaw` de `src/api/raw.ts` (regla dura de desacople,
// api/raw.ts línea 1-3): el shape se deriva estructuralmente de `reservasRaw`.
type ReservaRawFixture = (typeof reservasRaw)[number];

export function reservaRaw(overrides: Partial<ReservaRawFixture> = {}): ReservaRawFixture {
  return {
    id: 1,
    usuario_id: 1,
    cancha_id: 1,
    fecha: "2026-07-01",
    hora_inicio: "10:00:00",
    hora_fin: "11:00:00",
    estado: "Confirmada",
    created_at: "2026-06-01T00:00:00",
    updated_at: "2026-06-01T00:00:00",
    ...overrides,
  };
}
