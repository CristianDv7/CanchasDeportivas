// RED (tasks.md 2.1/2.2/3.1): mapeo de los 5 recursos snake_case → DTO
// camelCase — design.md §2. `estado` desconocido ⇒ `null`; descarte de
// `created_at`/`updated_at`/`telefono`/`rol_id`; asimetría create/update de
// canchas y horarios (ADR-06).
import { describe, expect, it } from "vitest";
import type { Reserva } from "./dto";
import type {
  CanchaRaw,
  DeporteRaw,
  HorarioAtencionRaw,
  ReservaRaw,
  UsuarioRaw,
} from "./raw";
import {
  buildReservasAdmin,
  toCancha,
  toCanchaCreateBody,
  toCanchaUpdateBody,
  toDeporte,
  toHorarioAtencion,
  toHorarioCreateBody,
  toHorarioUpdateBody,
  toReserva,
  toUsuario,
} from "./mappers";

describe("toCancha", () => {
  const raw: CanchaRaw = {
    id: 1,
    nombre: "Cancha 1 - Fútbol 5",
    deporte_id: 3,
    activo: true,
    created_at: "2026-01-01T00:00:00",
    updated_at: "2026-01-01T00:00:00",
  };

  it("mapea camelCase (activo → activa) y descarta timestamps", () => {
    expect(toCancha(raw)).toEqual({ id: 1, nombre: "Cancha 1 - Fútbol 5", deporteId: 3, activa: true });
    const cancha = toCancha(raw) as unknown as Record<string, unknown>;
    expect(cancha).not.toHaveProperty("created_at");
    expect(cancha).not.toHaveProperty("updated_at");
  });
});

describe("toDeporte", () => {
  const raw: DeporteRaw = { id: 2, nombre: "Pádel", descripcion: null, activo: true };

  it("mapea camelCase conservando descripcion null", () => {
    expect(toDeporte(raw)).toEqual({ id: 2, nombre: "Pádel", descripcion: null, activo: true });
  });
});

describe("toHorarioAtencion", () => {
  const raw: HorarioAtencionRaw = {
    id: 5,
    cancha_id: 1,
    dia_semana: 5,
    hora_inicio: "08:00:00",
    hora_fin: "11:00:00",
    activo: true,
  };

  it("mapea camelCase", () => {
    expect(toHorarioAtencion(raw)).toEqual({
      id: 5,
      canchaId: 1,
      diaSemana: 5,
      horaInicio: "08:00:00",
      horaFin: "11:00:00",
      activo: true,
    });
  });
});

describe("toReserva", () => {
  const raw: ReservaRaw = {
    id: 10,
    usuario_id: 1,
    cancha_id: 2,
    fecha: "2026-08-28",
    hora_inicio: "10:00:00",
    hora_fin: "11:00:00",
    estado: "Confirmada",
    created_at: "2026-08-20T00:00:00",
    updated_at: "2026-08-20T00:00:00",
  };

  it("mapea camelCase y conserva fechas/horas como strings", () => {
    expect(toReserva(raw)).toEqual({
      id: 10,
      usuarioId: 1,
      canchaId: 2,
      fecha: "2026-08-28",
      horaInicio: "10:00:00",
      horaFin: "11:00:00",
      estado: "Confirmada",
      estadoRaw: "Confirmada",
    });
  });

  it("estado desconocido ⇒ null, pero estadoRaw conserva el valor crudo", () => {
    const reserva = toReserva({ ...raw, estado: "Pendiente" });
    expect(reserva.estado).toBeNull();
    expect(reserva.estadoRaw).toBe("Pendiente");
  });

  it.each(["Confirmada", "Cancelada", "Finalizada"] as const)(
    "reconoce el estado conocido %s",
    (estado) => {
      expect(toReserva({ ...raw, estado }).estado).toBe(estado);
    },
  );
});

describe("toUsuario", () => {
  const raw: UsuarioRaw = {
    id: 3,
    nombre: "Carla",
    apellido: "Díaz",
    email: "carla@test.local",
    telefono: "3333",
    rol_id: 2,
    activo: true,
  };

  it("mapea camelCase y descarta telefono/rol_id", () => {
    expect(toUsuario(raw)).toEqual({
      id: 3,
      nombre: "Carla",
      apellido: "Díaz",
      email: "carla@test.local",
      activo: true,
    });
    const usuario = toUsuario(raw) as unknown as Record<string, unknown>;
    expect(usuario).not.toHaveProperty("telefono");
    expect(usuario).not.toHaveProperty("rol_id");
  });
});

describe("bodies de escritura — asimetría create/update (ADR-06)", () => {
  it("toCanchaCreateBody no incluye activo", () => {
    const body = toCanchaCreateBody({ nombre: "Cancha X", deporteId: 1 });
    expect(body).toEqual({ nombre: "Cancha X", deporte_id: 1 });
    expect(body).not.toHaveProperty("activo");
  });

  it("toCanchaUpdateBody incluye activo cuando se provee", () => {
    const body = toCanchaUpdateBody({ nombre: "Cancha X", deporteId: 1 }, true);
    expect(body).toEqual({ nombre: "Cancha X", deporte_id: 1, activo: true });
  });

  it("toCanchaUpdateBody omite activo si no se provee", () => {
    const body = toCanchaUpdateBody({ nombre: "Cancha X", deporteId: 1 });
    expect(body).not.toHaveProperty("activo");
  });

  it("toHorarioCreateBody incluye dia_semana", () => {
    const body = toHorarioCreateBody({
      canchaId: 1,
      diaSemana: 3,
      horaInicio: "08:00:00",
      horaFin: "10:00:00",
    });
    expect(body).toEqual({
      cancha_id: 1,
      dia_semana: 3,
      hora_inicio: "08:00:00",
      hora_fin: "10:00:00",
    });
  });

  it("toHorarioUpdateBody NUNCA manda dia_semana (ADR-06)", () => {
    const body = toHorarioUpdateBody({
      canchaId: 1,
      diaSemana: 3,
      horaInicio: "08:00:00",
      horaFin: "10:00:00",
    });
    expect(body).toEqual({ hora_inicio: "08:00:00", hora_fin: "10:00:00" });
    expect(body).not.toHaveProperty("dia_semana");
    expect(body).not.toHaveProperty("cancha_id");
  });
});

describe("buildReservasAdmin (ADR-08, join client-side)", () => {
  function reserva(overrides: Partial<Reserva> = {}): Reserva {
    return {
      id: 7,
      usuarioId: 3,
      canchaId: 7,
      fecha: "2026-08-28",
      horaInicio: "10:00:00",
      horaFin: "11:00:00",
      estado: "Confirmada",
      estadoRaw: "Confirmada",
      ...overrides,
    };
  }

  const cancha = { id: 7, nombre: "Cancha Central", deporteId: 1, activa: true };
  const usuario = { id: 3, nombre: "Ana", apellido: "Pérez", email: "a@x.com", activo: true };

  it("join OK: resuelve nombre de cancha y usuario", () => {
    const [resultado] = buildReservasAdmin([reserva()], [cancha], [usuario]);
    expect(resultado).toEqual({
      ...reserva(),
      canchaLabel: "Cancha Central",
      usuarioLabel: "Ana Pérez",
    });
  });

  it("canchas=[] ⇒ canchaLabel degradado 'Cancha #7'", () => {
    const [resultado] = buildReservasAdmin([reserva()], [], [usuario]) as [ReturnType<typeof buildReservasAdmin>[number]];
    expect(resultado.canchaLabel).toBe("Cancha #7");
    expect(resultado.usuarioLabel).toBe("Ana Pérez");
  });

  it("usuarios=[] ⇒ usuarioLabel degradado 'Usuario #3'", () => {
    const [resultado] = buildReservasAdmin([reserva()], [cancha], []) as [ReturnType<typeof buildReservasAdmin>[number]];
    expect(resultado.usuarioLabel).toBe("Usuario #3");
    expect(resultado.canchaLabel).toBe("Cancha Central");
  });

  it("ambos vacíos ⇒ ambos degradados", () => {
    const [resultado] = buildReservasAdmin([reserva()], [], []) as [ReturnType<typeof buildReservasAdmin>[number]];
    expect(resultado.canchaLabel).toBe("Cancha #7");
    expect(resultado.usuarioLabel).toBe("Usuario #3");
  });
});
