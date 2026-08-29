// RED (tasks.md 7.2): 2 <input type="date"> controlados escriben a `draft`;
// filtra valores con `isValidFecha` en ambos inputs (ADR-07, mismo bug real
// de mf-reservas, el doble de superficie acá).
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RangoFechasPicker } from "./RangoFechasPicker";

describe("RangoFechasPicker", () => {
  it("propaga una fecha de inicio ISO válida", () => {
    const onFechaInicioChange = vi.fn();
    render(
      <RangoFechasPicker
        fechaInicio="2026-07-29"
        fechaFin="2026-08-28"
        onFechaInicioChange={onFechaInicioChange}
        onFechaFinChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId("fecha-inicio-input"), { target: { value: "2026-08-01" } });

    expect(onFechaInicioChange).toHaveBeenCalledWith("2026-08-01");
  });

  it("propaga una fecha de fin ISO válida", () => {
    const onFechaFinChange = vi.fn();
    render(
      <RangoFechasPicker
        fechaInicio="2026-07-29"
        fechaFin="2026-08-28"
        onFechaInicioChange={vi.fn()}
        onFechaFinChange={onFechaFinChange}
      />,
    );

    fireEvent.change(screen.getByTestId("fecha-fin-input"), { target: { value: "2026-09-01" } });

    expect(onFechaFinChange).toHaveBeenCalledWith("2026-09-01");
  });

  it("NO propaga un año de 5 dígitos en fecha de inicio (bug real)", () => {
    const onFechaInicioChange = vi.fn();
    render(
      <RangoFechasPicker
        fechaInicio="2026-07-29"
        fechaFin="2026-08-28"
        onFechaInicioChange={onFechaInicioChange}
        onFechaFinChange={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByTestId("fecha-inicio-input"), { target: { value: "92026-02-08" } });

    expect(onFechaInicioChange).not.toHaveBeenCalled();
  });

  it("NO propaga un año de 5 dígitos en fecha de fin (bug real)", () => {
    const onFechaFinChange = vi.fn();
    render(
      <RangoFechasPicker
        fechaInicio="2026-07-29"
        fechaFin="2026-08-28"
        onFechaInicioChange={vi.fn()}
        onFechaFinChange={onFechaFinChange}
      />,
    );

    fireEvent.change(screen.getByTestId("fecha-fin-input"), { target: { value: "92026-02-08" } });

    expect(onFechaFinChange).not.toHaveBeenCalled();
  });
});
