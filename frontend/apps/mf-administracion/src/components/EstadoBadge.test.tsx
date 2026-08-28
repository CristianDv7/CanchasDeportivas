// RED (tasks.md 7.2): design.md §5/§7 — envoltorio de UI puro sobre
// `domain/rules.estadoBadge` (incl. Finalizada, RN-08).
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EstadoBadge } from "./EstadoBadge";

describe("EstadoBadge", () => {
  it("Confirmada → label Confirmada, tono success", () => {
    render(<EstadoBadge estado="Confirmada" />);

    const badge = screen.getByTestId("estado-badge");
    expect(badge).toHaveTextContent("Confirmada");
    expect(badge).toHaveAttribute("data-tone", "success");
  });

  it("Cancelada → label Cancelada, tono neutral", () => {
    render(<EstadoBadge estado="Cancelada" />);

    const badge = screen.getByTestId("estado-badge");
    expect(badge).toHaveTextContent("Cancelada");
    expect(badge).toHaveAttribute("data-tone", "neutral");
  });

  it("Finalizada → label Finalizada, tono info (RN-08)", () => {
    render(<EstadoBadge estado="Finalizada" />);

    const badge = screen.getByTestId("estado-badge");
    expect(badge).toHaveTextContent("Finalizada");
    expect(badge).toHaveAttribute("data-tone", "info");
  });

  it("estado null → Desconocido, tono neutral, nunca throwea", () => {
    render(<EstadoBadge estado={null} />);

    const badge = screen.getByTestId("estado-badge");
    expect(badge).toHaveTextContent("Desconocido");
    expect(badge).toHaveAttribute("data-tone", "neutral");
  });
});
