// RED (tasks.md 3.1-3.4): design.md ADR-01/02/04/07. Funciones puras, sin
// React, sin red.
import { describe, expect, it } from "vitest";
import {
  calcularMaxReservas,
  calcularProporcion,
  isValidFecha,
  rangoPorDefecto,
  validarRangoFechas,
} from "./rules";

describe("isValidFecha (copiado de mf-reservas/domain/rules.ts, ADR-07)", () => {
  it("propaga una fecha ISO válida", () => {
    expect(isValidFecha("2026-08-28")).toBe(true);
  });

  it("rechaza un año de 5 dígitos (bug real de teclado en input[type=date])", () => {
    expect(isValidFecha("92026-02-08")).toBe(false);
  });

  it("rechaza un string vacío", () => {
    expect(isValidFecha("")).toBe(false);
  });

  it("rechaza una fecha de calendario inválida (ej. mes 13)", () => {
    expect(isValidFecha("2026-13-01")).toBe(false);
  });
});

describe("validarRangoFechas (ADR-02: comparación lexicográfica de strings ISO)", () => {
  it("rango igual (fechaInicio === fechaFin) ⇒ true", () => {
    expect(validarRangoFechas("2026-08-28", "2026-08-28")).toBe(true);
  });

  it("rango invertido (fechaInicio > fechaFin) ⇒ false", () => {
    expect(validarRangoFechas("2026-08-28", "2026-08-01")).toBe(false);
  });

  it("rango normal (fechaInicio < fechaFin) ⇒ true", () => {
    expect(validarRangoFechas("2026-07-29", "2026-08-28")).toBe(true);
  });
});

describe("rangoPorDefecto (ADR-04: hoy inyectado, últimos 30 días, fecha local)", () => {
  it("devuelve fechaFin = hoy y fechaInicio = hoy - 30 días", () => {
    const hoy = new Date(2026, 7, 28); // 28 de agosto de 2026, local
    expect(rangoPorDefecto(hoy)).toEqual({ fechaInicio: "2026-07-29", fechaFin: "2026-08-28" });
  });

  it("cruza el límite de mes/año correctamente", () => {
    const hoy = new Date(2026, 0, 15); // 15 de enero de 2026, local
    expect(rangoPorDefecto(hoy)).toEqual({ fechaInicio: "2025-12-16", fechaFin: "2026-01-15" });
  });
});

describe("calcularMaxReservas (ADR-01)", () => {
  it("set vacío ⇒ 0", () => {
    expect(calcularMaxReservas([])).toBe(0);
  });

  it("devuelve el máximo del conjunto", () => {
    expect(calcularMaxReservas([12, 4, 0])).toBe(12);
  });
});

describe("calcularProporcion (ADR-01: guard contra NaN/Infinity)", () => {
  it("maxReservas <= 0 ⇒ 0% para todas (evita división por cero)", () => {
    expect(calcularProporcion(0, 0)).toBe(0);
    expect(calcularProporcion(5, 0)).toBe(0);
    expect(calcularProporcion(0, -1)).toBe(0);
  });

  it("caso normal: proporción relativa al máximo del set, redondeada a entero", () => {
    expect(calcularProporcion(4, 12)).toBe(33);
    expect(calcularProporcion(12, 12)).toBe(100);
  });

  it("redondea a un entero legible", () => {
    expect(Number.isInteger(calcularProporcion(1, 3))).toBe(true);
  });
});
