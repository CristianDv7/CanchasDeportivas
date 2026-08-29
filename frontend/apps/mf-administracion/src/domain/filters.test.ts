// RED (tasks.md 5.1): design.md §5/ADR-09 — filtro por fecha/canchaId/estado;
// toggle "solo próximas" (default activo); contador N de M; NO reordena el
// array de entrada.
import { describe, expect, it } from "vitest";
import type { ReservaAdmin } from "../api/dto";
import { filtrarReservas } from "./filters";

function reservaAdmin(overrides: Partial<ReservaAdmin> = {}): ReservaAdmin {
  return {
    id: 1,
    usuarioId: 1,
    canchaId: 1,
    fecha: "2026-09-01",
    horaInicio: "10:00:00",
    horaFin: "11:00:00",
    estado: "Confirmada",
    estadoRaw: "Confirmada",
    canchaLabel: "Cancha 1",
    usuarioLabel: "Ana Pérez",
    ...overrides,
  };
}

const NOW = Date.UTC(2026, 7, 28, 0, 0, 0); // 2026-08-28T00:00:00Z

describe("filtrarReservas (ADR-09)", () => {
  it("filtra por fecha exacta", () => {
    const reservas = [
      reservaAdmin({ id: 1, fecha: "2026-09-01" }),
      reservaAdmin({ id: 2, fecha: "2026-09-02" }),
    ];
    const resultado = filtrarReservas(reservas, { fecha: "2026-09-01" }, NOW);
    expect(resultado.map((r) => r.id)).toEqual([1]);
  });

  it("filtra por canchaId", () => {
    const reservas = [
      reservaAdmin({ id: 1, canchaId: 1 }),
      reservaAdmin({ id: 2, canchaId: 2 }),
    ];
    const resultado = filtrarReservas(reservas, { canchaId: 2 }, NOW);
    expect(resultado.map((r) => r.id)).toEqual([2]);
  });

  it("filtra por estado", () => {
    const reservas = [
      reservaAdmin({ id: 1, estado: "Confirmada", fecha: "2026-09-01" }),
      reservaAdmin({ id: 2, estado: "Cancelada", fecha: "2026-09-01" }),
    ];
    const resultado = filtrarReservas(reservas, { estado: "Cancelada", soloProximas: false }, NOW);
    expect(resultado.map((r) => r.id)).toEqual([2]);
  });

  it('toggle "solo próximas" está activo por default: excluye pasadas', () => {
    const reservas = [
      reservaAdmin({ id: 1, fecha: "2026-09-01", horaInicio: "10:00:00" }), // futura
      reservaAdmin({ id: 2, fecha: "2026-01-01", horaInicio: "10:00:00" }), // pasada
    ];
    const resultado = filtrarReservas(reservas, {}, NOW);
    expect(resultado.map((r) => r.id)).toEqual([1]);
  });

  it('soloProximas:false incluye reservas pasadas', () => {
    const reservas = [
      reservaAdmin({ id: 1, fecha: "2026-09-01" }),
      reservaAdmin({ id: 2, fecha: "2026-01-01" }),
    ];
    const resultado = filtrarReservas(reservas, { soloProximas: false }, NOW);
    expect(resultado.map((r) => r.id).sort()).toEqual([1, 2]);
  });

  it("no reordena el array de entrada (respeta el orden del backend)", () => {
    const reservas = [
      reservaAdmin({ id: 3, fecha: "2026-09-03" }),
      reservaAdmin({ id: 1, fecha: "2026-09-01" }),
      reservaAdmin({ id: 2, fecha: "2026-09-02" }),
    ];
    const resultado = filtrarReservas(reservas, { soloProximas: false }, NOW);
    expect(resultado.map((r) => r.id)).toEqual([3, 1, 2]);
  });

  it("no muta el array original", () => {
    const reservas = [reservaAdmin({ id: 1, fecha: "2026-09-01" })];
    const copia = [...reservas];
    filtrarReservas(reservas, {}, NOW);
    expect(reservas).toEqual(copia);
  });
});
