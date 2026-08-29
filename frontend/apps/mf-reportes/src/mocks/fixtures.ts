// Fixtures MSW en shape CRUDO (snake_case) del backend — design.md §2/§7.
// Deliberadamente NO tipados contra `src/api/raw.ts` (regla dura de
// desacople: no debe haber import cruzado `mocks/` → `api/`), igual que
// mf-administracion/mf-reservas/src/mocks/fixtures.ts.

export const ocupacionCanchasRaw = [
  { cancha_id: 1, cancha: "Cancha 1 - Fútbol 5", reservas: 12 },
  { cancha_id: 2, cancha: "Cancha 2 - Paddle", reservas: 4 },
  { cancha_id: 3, cancha: "Cancha 3 - Tenis", reservas: 0 },
];

export const reservasPeriodoRaw = {
  fecha_inicio: "2026-07-29",
  fecha_fin: "2026-08-28",
  total_reservas: 37,
};

// Factories para overrides puntuales en tests, sin importar los tipos de
// `src/api/raw.ts` (regla dura de desacople) — mismo patrón que
// mf-administracion/mf-reservas/src/mocks/fixtures.ts.
type OcupacionCanchaRawFixture = (typeof ocupacionCanchasRaw)[number];

export function ocupacionCanchaRaw(
  overrides: Partial<OcupacionCanchaRawFixture> = {},
): OcupacionCanchaRawFixture {
  return { cancha_id: 1, cancha: "Cancha de prueba", reservas: 0, ...overrides };
}

export function reservasPeriodoRawFixture(
  overrides: Partial<typeof reservasPeriodoRaw> = {},
): typeof reservasPeriodoRaw {
  return { ...reservasPeriodoRaw, ...overrides };
}
