// RED (tasks.md 2.1): toReserva/toCancha/toDisponibilidad traducen shape
// crudo (snake_case) a DTO (camelCase) — design.md §2. `estado` desconocido
// ⇒ `null` (privilegio mínimo, ADR-06 del shell); created_at/updated_at se
// descartan porque ninguna pantalla los usa.
import { describe, expect, it } from "vitest";
import type { BloqueRaw, CanchaRaw, DisponibilidadRaw, ReservaRaw } from "./raw";
import { toCancha, toDisponibilidad, toReserva, toReservaCreateBody } from "./mappers";

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

describe("toDisponibilidad", () => {
  const bloques: BloqueRaw[] = [
    { hora_inicio: "08:00:00", hora_fin: "09:00:00", estado: "libre" },
    { hora_inicio: "09:00:00", hora_fin: "10:00:00", estado: "ocupado" },
    { hora_inicio: "10:00:00", hora_fin: "11:00:00", estado: "bloqueado" },
  ];
  const raw: DisponibilidadRaw = { cancha_id: 1, fecha: "2026-08-28", bloques };

  it("mapea camelCase y normaliza cualquier estado que no sea 'libre' a 'ocupado'", () => {
    expect(toDisponibilidad(raw)).toEqual({
      canchaId: 1,
      fecha: "2026-08-28",
      bloques: [
        { horaInicio: "08:00:00", horaFin: "09:00:00", estado: "libre" },
        { horaInicio: "09:00:00", horaFin: "10:00:00", estado: "ocupado" },
        { horaInicio: "10:00:00", horaFin: "11:00:00", estado: "ocupado" },
      ],
    });
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
