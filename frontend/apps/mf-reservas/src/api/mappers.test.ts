// RED (tasks.md 2.1): toReserva/toCancha traducen shape crudo (snake_case) a
// DTO (camelCase) — design.md §2. `estado` desconocido ⇒ `null` (privilegio
// mínimo, ADR-06 del shell); created_at/updated_at se descartan porque
// ninguna pantalla los usa. `buildDisponibilidad` arma la grilla que el
// contrato REAL de `GET /reservas/disponibilidad` ya no devuelve armada
// (reemplaza al `toDisponibilidad` del contrato propuesto).
import { describe, expect, it } from "vitest";
import type { Reserva } from "./dto";
import type { CanchaRaw, HorarioAtencionRaw, ReservaRaw } from "./raw";
import { buildDisponibilidad, toCancha, toHorarioAtencion, toReserva, toReservaCreateBody } from "./mappers";

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

  it("descarta created_at/updated_at: no aparecen en el DTO", () => {
    const reserva = toReserva(raw) as unknown as Record<string, unknown>;
    expect(reserva).not.toHaveProperty("created_at");
    expect(reserva).not.toHaveProperty("updated_at");
    expect(reserva).not.toHaveProperty("createdAt");
    expect(reserva).not.toHaveProperty("updatedAt");
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
    expect(toCancha(raw)).toEqual({
      id: 1,
      nombre: "Cancha 1 - Fútbol 5",
      deporteId: 3,
      activa: true,
    });
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

describe("buildDisponibilidad", () => {
  // 2026-08-28 es viernes ⇒ ISO diaSemana=5 (verificado con Date.UTC).
  const FECHA = "2026-08-28";

  function horario(overrides: Partial<HorarioAtencionRaw> = {}) {
    return toHorarioAtencion({
      id: 1,
      cancha_id: 1,
      dia_semana: 5,
      hora_inicio: "08:00:00",
      hora_fin: "11:00:00",
      activo: true,
      ...overrides,
    });
  }

  function reserva(overrides: Partial<Reserva> = {}): Reserva {
    return {
      id: 10,
      usuarioId: 99,
      canchaId: 1,
      fecha: FECHA,
      horaInicio: "10:00:00",
      horaFin: "11:00:00",
      estado: "Confirmada",
      estadoRaw: "Confirmada",
      ...overrides,
    };
  }

  it("sin horario que matchee el día ⇒ bloques vacío", () => {
    const horarios = [horario({ dia_semana: 1 })]; // lunes, la fecha es viernes
    expect(buildDisponibilidad(1, FECHA, horarios, [])).toEqual({
      canchaId: 1,
      fecha: FECHA,
      bloques: [],
    });
  });

  it("horario inactivo ese día ⇒ bloques vacío", () => {
    const horarios = [horario({ activo: false })];
    expect(buildDisponibilidad(1, FECHA, horarios, [])).toEqual({
      canchaId: 1,
      fecha: FECHA,
      bloques: [],
    });
  });

  it("cero reservas ⇒ todos los bloques libres", () => {
    const { bloques } = buildDisponibilidad(1, FECHA, [horario()], []);
    expect(bloques).toEqual([
      { horaInicio: "08:00:00", horaFin: "09:00:00", estado: "libre" },
      { horaInicio: "09:00:00", horaFin: "10:00:00", estado: "libre" },
      { horaInicio: "10:00:00", horaFin: "11:00:00", estado: "libre" },
    ]);
  });

  it("reserva que se solapa parcialmente marca ocupados ambos bloques que toca", () => {
    const reservas = [reserva({ horaInicio: "09:30:00", horaFin: "10:30:00" })];
    const { bloques } = buildDisponibilidad(1, FECHA, [horario()], reservas);
    expect(bloques).toEqual([
      { horaInicio: "08:00:00", horaFin: "09:00:00", estado: "libre" },
      { horaInicio: "09:00:00", horaFin: "10:00:00", estado: "ocupado" },
      { horaInicio: "10:00:00", horaFin: "11:00:00", estado: "ocupado" },
    ]);
  });

  it("reserva exactamente en el borde de un bloque no ocupa al bloque adyacente", () => {
    const reservas = [reserva({ horaInicio: "09:00:00", horaFin: "10:00:00" })];
    const { bloques } = buildDisponibilidad(1, FECHA, [horario()], reservas);
    expect(bloques).toEqual([
      { horaInicio: "08:00:00", horaFin: "09:00:00", estado: "libre" },
      { horaInicio: "09:00:00", horaFin: "10:00:00", estado: "ocupado" },
      { horaInicio: "10:00:00", horaFin: "11:00:00", estado: "libre" },
    ]);
  });

  it("CONTRATO: usuarioId de la reserva nunca aparece en el resultado", () => {
    const reservas = [reserva({ usuarioId: 12345 })];
    const disponibilidad = buildDisponibilidad(1, FECHA, [horario()], reservas);

    const serializado = JSON.stringify(disponibilidad);
    expect(serializado).not.toMatch(/usuarioId|usuario_id|12345/);
    for (const bloque of disponibilidad.bloques) {
      expect(bloque).not.toHaveProperty("usuarioId");
    }
  });
});

describe("toReservaCreateBody", () => {
  it("arma el body snake_case con usuarioId provisto por el caller (RN-03), no por el input", () => {
    const body = toReservaCreateBody(
      { canchaId: 2, fecha: "2026-08-28", horaInicio: "10:00:00", horaFin: "11:00:00" },
      1,
    );
    expect(body).toEqual({
      usuario_id: 1,
      cancha_id: 2,
      fecha: "2026-08-28",
      hora_inicio: "10:00:00",
      hora_fin: "11:00:00",
    });
  });
});
