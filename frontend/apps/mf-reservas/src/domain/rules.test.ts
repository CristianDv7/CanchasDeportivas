// RED (tasks.md 3.1): canCancel con epoch explícito (antes/exacto/después de
// iniciar), estado≠Confirmada, estado:null — design.md §5. Sin globals: el
// reloj se pasa como epoch ms explícito, sin tocar Date.now()/vi.setSystemTime
// (eso queda para el nivel de componente, ver design.md tabla §5).
import { describe, expect, it } from "vitest";
import type { Reserva } from "../api/dto";
import { canCancel, contarActivas, estadoBadge, hasStarted, isValidFecha, toUtcMillis } from "./rules";

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

describe("toUtcMillis", () => {
  it("interpreta fecha+hora como UTC, no como hora local", () => {
    expect(toUtcMillis("2026-08-28", "10:00:00")).toBe(Date.UTC(2026, 7, 28, 10, 0, 0));
  });

  it("no depende del timezone del entorno de ejecución", () => {
    // Si esto se parseara como hora local, el resultado variaría según TZ del CI/dev.
    expect(toUtcMillis("2026-01-01", "00:00:00")).toBe(Date.UTC(2026, 0, 1, 0, 0, 0));
  });
});

describe("hasStarted", () => {
  const r = { fecha: "2026-08-28", horaInicio: "10:00:00" };
  const inicioMs = Date.UTC(2026, 7, 28, 10, 0, 0);

  it("false antes de que arranque el bloque", () => {
    expect(hasStarted(r, inicioMs - 1)).toBe(false);
  });

  it("true en el instante exacto de inicio (<=, no <)", () => {
    expect(hasStarted(r, inicioMs)).toBe(true);
  });

  it("true después de que arrancó", () => {
    expect(hasStarted(r, inicioMs + 1)).toBe(true);
  });
});

describe("canCancel", () => {
  const inicioMs = Date.UTC(2026, 7, 28, 10, 0, 0);

  it("true: Confirmada y todavía no inició", () => {
    expect(canCancel(reserva(), inicioMs - 1)).toBe(true);
  });

  it("false: Confirmada pero inicia justo ahora", () => {
    expect(canCancel(reserva(), inicioMs)).toBe(false);
  });

  it("false: Confirmada pero ya inició", () => {
    expect(canCancel(reserva(), inicioMs + 1)).toBe(false);
  });

  it("false: estado Cancelada, aunque no haya iniciado", () => {
    expect(canCancel(reserva({ estado: "Cancelada", estadoRaw: "Cancelada" }), inicioMs - 1)).toBe(
      false,
    );
  });

  it("false: estado Finalizada, aunque no haya iniciado", () => {
    expect(
      canCancel(reserva({ estado: "Finalizada", estadoRaw: "Finalizada" }), inicioMs - 1),
    ).toBe(false);
  });

  it("false: estado null (privilegio mínimo, sin acciones)", () => {
    expect(canCancel(reserva({ estado: null, estadoRaw: "Pendiente" }), inicioMs - 1)).toBe(false);
  });
});

describe("contarActivas", () => {
  it("cuenta solo las reservas en estado Confirmada", () => {
    const reservas = [
      reserva({ id: 1, estado: "Confirmada", estadoRaw: "Confirmada" }),
      reserva({ id: 2, estado: "Cancelada", estadoRaw: "Cancelada" }),
      reserva({ id: 3, estado: "Confirmada", estadoRaw: "Confirmada" }),
      reserva({ id: 4, estado: "Finalizada", estadoRaw: "Finalizada" }),
      reserva({ id: 5, estado: null, estadoRaw: "Pendiente" }),
    ];
    expect(contarActivas(reservas)).toBe(2);
  });

  it("devuelve 0 con lista vacía", () => {
    expect(contarActivas([])).toBe(0);
  });
});

describe("estadoBadge", () => {
  it.each([
    ["Confirmada", "Confirmada"],
    ["Cancelada", "Cancelada"],
    ["Finalizada", "Finalizada"],
  ] as const)("devuelve un label para %s", (estado, expectedLabel) => {
    expect(estadoBadge(estado).label).toBe(expectedLabel);
  });

  it("estados conocidos tienen tonos distintos entre sí", () => {
    const tones = new Set(
      (["Confirmada", "Cancelada", "Finalizada"] as const).map((e) => estadoBadge(e).tone),
    );
    expect(tones.size).toBe(3);
  });

  it("estado null ⇒ badge neutro sin throwear", () => {
    expect(() => estadoBadge(null)).not.toThrow();
    expect(estadoBadge(null).label).toBeTruthy();
  });
});

describe("isValidFecha", () => {
  it("true: fecha ISO bien formada de 4 dígitos de año", () => {
    expect(isValidFecha("2026-08-28")).toBe(true);
  });

  it("false: año de 5 dígitos (bug real: input[type=date] no lo impide)", () => {
    expect(isValidFecha("92026-02-08")).toBe(false);
  });

  it("false: string vacío", () => {
    expect(isValidFecha("")).toBe(false);
  });

  it("false: mes o día fuera de rango", () => {
    expect(isValidFecha("2026-13-01")).toBe(false);
    expect(isValidFecha("2026-02-30")).toBe(false);
  });

  it("false: formato no-ISO", () => {
    expect(isValidFecha("28/08/2026")).toBe(false);
  });
});
