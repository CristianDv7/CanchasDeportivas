// Bug real (2026-08-28): un año de 5 dígitos tipeado en el input[type=date]
// nativo llegaba sin filtrar hasta `onFechaChange` → hasta el backend, que
// respondía con un 422 crudo de Pydantic mostrado tal cual al usuario. El
// input nativo NO impide años fuera de rango vía teclado, así que el filtro
// tiene que vivir acá, antes de propagar el cambio.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CanchaFechaPicker } from "./CanchaFechaPicker";

describe("CanchaFechaPicker — fecha", () => {
  it("propaga una fecha ISO válida", () => {
    const onFechaChange = vi.fn();
    render(
      <CanchaFechaPicker
        canchas={[]}
        canchaId={null}
        fecha={null}
        onCanchaChange={vi.fn()}
        onFechaChange={onFechaChange}
      />,
    );

    fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "2026-08-28" } });

    expect(onFechaChange).toHaveBeenCalledWith("2026-08-28");
  });

  it("NO propaga un año de 5 dígitos (el bug real reportado)", () => {
    const onFechaChange = vi.fn();
    render(
      <CanchaFechaPicker
        canchas={[]}
        canchaId={null}
        fecha={null}
        onCanchaChange={vi.fn()}
        onFechaChange={onFechaChange}
      />,
    );

    fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "92026-02-08" } });

    expect(onFechaChange).not.toHaveBeenCalled();
  });

  it("NO propaga un string vacío", () => {
    const onFechaChange = vi.fn();
    render(
      <CanchaFechaPicker
        canchas={[]}
        canchaId={null}
        fecha={null}
        onCanchaChange={vi.fn()}
        onFechaChange={onFechaChange}
      />,
    );

    fireEvent.change(screen.getByTestId("fecha-input"), { target: { value: "" } });

    expect(onFechaChange).not.toHaveBeenCalled();
  });
});
