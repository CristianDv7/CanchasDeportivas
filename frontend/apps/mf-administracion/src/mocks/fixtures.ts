// Fixtures MSW en shape CRUDO (snake_case) del backend — design.md §2/§7.
// Deliberadamente NO tipados contra `src/api/raw.ts` (regla dura de
// desacople: no debe haber import cruzado `mocks/` → `api/`), igual que
// mf-reservas/src/mocks/fixtures.ts.

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
  {
    id: 3,
    nombre: "Cancha 3 - Tenis",
    deporte_id: 3,
    activo: false,
    created_at: "2026-01-01T00:00:00",
    updated_at: "2026-01-10T00:00:00",
  },
];

export const deportesRaw = [
  { id: 1, nombre: "Fútbol", descripcion: "Fútbol 5", activo: true },
  { id: 2, nombre: "Pádel", descripcion: null, activo: true },
  { id: 3, nombre: "Tenis", descripcion: null, activo: true },
];

// 2026-08-28 es viernes ⇒ ISO dia_semana=5 (verificado con Date.UTC, mismo
// criterio que mf-reservas).
export const horariosAtencionRaw = [
  {
    id: 1,
    cancha_id: 1,
    dia_semana: 5,
    hora_inicio: "08:00:00",
    hora_fin: "22:00:00",
    activo: true,
  },
  {
    id: 2,
    cancha_id: 1,
    dia_semana: 6,
    hora_inicio: "08:00:00",
    hora_fin: "20:00:00",
    activo: true,
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
    usuario_id: 2,
    cancha_id: 2,
    fecha: "2026-08-01",
    hora_inicio: "09:00:00",
    hora_fin: "10:00:00",
    estado: "Finalizada",
    created_at: "2026-07-25T00:00:00",
    updated_at: "2026-08-01T10:00:00",
  },
  {
    id: 12,
    usuario_id: 3,
    cancha_id: 1,
    fecha: "2026-08-15",
    hora_inicio: "18:00:00",
    hora_fin: "19:00:00",
    estado: "Cancelada",
    created_at: "2026-08-10T00:00:00",
    updated_at: "2026-08-11T00:00:00",
  },
];

export const usuariosRaw = [
  {
    id: 1,
    nombre: "Ana",
    apellido: "Pérez",
    email: "ana@test.local",
    telefono: "1111",
    rol_id: 1,
    activo: true,
  },
  {
    id: 2,
    nombre: "Beto",
    apellido: "Gómez",
    email: "beto@test.local",
    telefono: "2222",
    rol_id: 1,
    activo: true,
  },
  {
    id: 3,
    nombre: "Carla",
    apellido: "Díaz",
    email: "carla@test.local",
    telefono: "3333",
    rol_id: 2,
    activo: true,
  },
];

// Factories para overrides puntuales en tests, sin importar los tipos de
// `src/api/raw.ts` (regla dura de desacople) — mismo patrón que
// mf-reservas/src/mocks/fixtures.ts.
type CanchaRawFixture = (typeof canchasRaw)[number];
type ReservaRawFixture = (typeof reservasRaw)[number];
type HorarioRawFixture = (typeof horariosAtencionRaw)[number];

export function canchaRaw(overrides: Partial<CanchaRawFixture> = {}): CanchaRawFixture {
  return {
    id: 1,
    nombre: "Cancha de prueba",
    deporte_id: 1,
    activo: true,
    created_at: "2026-01-01T00:00:00",
    updated_at: "2026-01-01T00:00:00",
    ...overrides,
  };
}

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

export function horarioRaw(overrides: Partial<HorarioRawFixture> = {}): HorarioRawFixture {
  return {
    id: 1,
    cancha_id: 1,
    dia_semana: 1,
    hora_inicio: "08:00:00",
    hora_fin: "20:00:00",
    activo: true,
    ...overrides,
  };
}
