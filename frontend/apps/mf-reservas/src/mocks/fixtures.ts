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

export const disponibilidadRaw = {
  cancha_id: 1,
  fecha: "2026-08-28",
  bloques: [
    { hora_inicio: "08:00:00", hora_fin: "09:00:00", estado: "libre" },
    { hora_inicio: "09:00:00", hora_fin: "10:00:00", estado: "libre" },
    { hora_inicio: "10:00:00", hora_fin: "11:00:00", estado: "ocupado" },
  ],
};
