import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AccesoDenegadoPage } from "./AccesoDenegadoPage";

describe("AccesoDenegadoPage", () => {
  it("muestra un mensaje y un link a /reservas", () => {
    render(
      <MemoryRouter>
        <AccesoDenegadoPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /reservas/i })).toHaveAttribute("href", "/reservas");
  });
});
