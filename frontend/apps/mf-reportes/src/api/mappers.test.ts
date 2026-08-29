// RED (tasks.md 2.1/2.2): mapeo snake_case → camelCase de los 2 endpoints de
// `ms-reportes` — design.md §2/§5. `reservas: 0` se preserva (no se filtra).
import { describe, expect, it } from "vitest";
import type { OcupacionCanchaRaw, ReservasPeriodoRaw } from "./raw";
import { toOcupacionCancha, toReservasPeriodo } from "./mappers";

describe("toOcupacionCancha", () => {
  it("mapea cancha_id/cancha/reservas → canchaId/cancha/reservas, sin campos extra", () => {
    const raw: OcupacionCanchaRaw = { cancha_id: 1, cancha: "Cancha 1 - Fútbol 5", reservas: 12 };

    expect(toOcupacionCancha(raw)).toEqual({ canchaId: 1, cancha: "Cancha 1 - Fútbol 5", reservas: 12 });
    const mapped = toOcupacionCancha(raw) as unknown as Record<string, unknown>;
    expect(mapped).not.toHaveProperty("cancha_id");
  });

  it("una entrada con reservas: 0 se preserva (no se filtra)", () => {
    const raw: OcupacionCanchaRaw = { cancha_id: 3, cancha: "Cancha 3 - Tenis", reservas: 0 };

    expect(toOcupacionCancha(raw)).toEqual({ canchaId: 3, cancha: "Cancha 3 - Tenis", reservas: 0 });
  });
});

describe("toReservasPeriodo", () => {
  it("mapea fecha_inicio/fecha_fin/total_reservas → fechaInicio/fechaFin/totalReservas", () => {
    const raw: ReservasPeriodoRaw = {
      fecha_inicio: "2026-07-29",
      fecha_fin: "2026-08-28",
      total_reservas: 37,
    };

    expect(toReservasPeriodo(raw)).toEqual({
      fechaInicio: "2026-07-29",
      fechaFin: "2026-08-28",
      totalReservas: 37,
    });
  });
});
