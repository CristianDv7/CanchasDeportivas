// RED (tasks.md 4.1-4.3): design.md §5/ADR-03/ADR-04/ADR-06.
// - canCancel: epoch explícito (antes/exacto/después), estado≠Confirmada,
//   estado:null → false. Sin excepción por rol admin (ADR-04).
// - contarAfectadasPorInactivar: solo Confirmada + futuras + de esa cancha.
// - validarHorario: horaInicio >= horaFin ⇒ inválido (ADR-06).
import { describe, expect, it } from "vitest";
import type { Reserva } from "../api/dto";
import {
  canCancel,
  contarAfectadasPorInactivar,
  estadoBadge,
  hasStarted,
  toUtcMillis,
  validarHorario,
} from "./rules";

function reserva(overrides: Partial<Reserva> = {}): Reserva {
  return {
    id: 1,
    usuarioId: 1,
    canchaId: 2,
    fecha: "2026-08-28",
    horaInicio: "10:00:00",
    horaFin: "11:00:00",
    estado: "Confirmada",
    estadoRaw: "Confirmada",
    ...overrides,
  };
}

describe("toUtcMillis / hasStarted", () => {
  it("interpreta fecha+hora como UTC", () => {
    expect(toUtcMillis("2026-08-28", "10:00:00")).toBe(Date.UTC(2026, 7, 28, 10, 0, 0));
  });

  it("hasStarted: true en el instante exacto (<=, no <)", () => {
    const inicioMs = Date.UTC(2026, 7, 28, 10, 0, 0);
    expect(hasStarted({ fecha: "2026-08-28", horaInicio: "10:00:00" }, inicioMs)).toBe(true);
    expect(hasStarted({ fecha: "2026-08-28", horaInicio: "10:00:00" }, inicioMs - 1)).toBe(false);
  });
});

describe("canCancel — sin bypass para admin (ADR-04)", () => {
  const inicioMs = Date.UTC(2026, 7, 28, 10, 0, 0);

  it("true: Confirmada y todavía no inició", () => {
    expect(canCancel(reserva(), inicioMs - 1)).toBe(true);
  });

  it("false: Confirmada pero inicia justo ahora (exacto)", () => {
    expect(canCancel(reserva(), inicioMs)).toBe(false);
  });

  it("false: Confirmada pero ya inició", () => {
    expect(canCancel(reserva(), inicioMs + 1)).toBe(false);
  });

  it("false: estado Cancelada, aunque no haya iniciado", () => {
    expect(canCancel(reserva({ estado: "Cancelada", estadoRaw: "Cancelada" }), inicioMs - 1)).toBe(false);
  });

  it("false: estado Finalizada, aunque no haya iniciado", () => {
    expect(canCancel(reserva({ estado: "Finalizada", estadoRaw: "Finalizada" }), inicioMs - 1)).toBe(false);
  });

  it("false: estado null (privilegio mínimo)", () => {
    expect(canCancel(reserva({ estado: null, estadoRaw: "Pendiente" }), inicioMs - 1)).toBe(false);
  });
});

describe("contarAfectadasPorInactivar (ADR-03)", () => {
  const NOW = Date.UTC(2026, 7, 28, 0, 0, 0); // 2026-08-28T00:00:00Z

  it("cuenta solo Confirmada + futuras + de esa cancha", () => {
    const reservas: Reserva[] = [
      reserva({ id: 1, canchaId: 7, estado: "Confirmada", fecha: "2026-09-01" }), // cuenta
      reserva({ id: 2, canchaId: 7, estado: "Confirmada", fecha: "2026-09-02" }), // cuenta
      reserva({ id: 3, canchaId: 7, estado: "Cancelada", fecha: "2026-09-01" }), // ignora: cancelada
      reserva({ id: 4, canchaId: 7, estado: "Confirmada", fecha: "2026-01-01" }), // ignora: pasada
      reserva({ id: 5, canchaId: 8, estado: "Confirmada", fecha: "2026-09-01" }), // ignora: otra cancha
    ];
    expect(contarAfectadasPorInactivar(reservas, 7, NOW)).toBe(2);
  });

  it("cero reservas afectadas ⇒ 0", () => {
    expect(contarAfectadasPorInactivar([], 7, NOW)).toBe(0);
  });
});

describe("validarHorario (ADR-06, espeja model_validator)", () => {
  it("horaInicio < horaFin ⇒ válido", () => {
    expect(validarHorario("08:00:00", "10:00:00")).toBe(true);
  });

  it("horaInicio === horaFin ⇒ inválido", () => {
    expect(validarHorario("08:00:00", "08:00:00")).toBe(false);
  });

  it("horaInicio > horaFin ⇒ inválido", () => {
    expect(validarHorario("10:00:00", "08:00:00")).toBe(false);
  });
});

describe("estadoBadge", () => {
  it("estado null ⇒ badge neutro sin throwear", () => {
    expect(() => estadoBadge(null)).not.toThrow();
    expect(estadoBadge(null).label).toBeTruthy();
  });

  it.each([
    ["Confirmada", "success"],
    ["Cancelada", "neutral"],
    ["Finalizada", "info"],
  ] as const)("%s → tono %s", (estado, tone) => {
    expect(estadoBadge(estado).tone).toBe(tone);
  });
});
