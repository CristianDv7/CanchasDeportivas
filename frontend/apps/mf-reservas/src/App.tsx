// Expuesto vía MF como './App' (rsbuild.config.ts). El shell monta este
// remote bajo "/reservas/*" (AppRouter.tsx), por eso el <Routes> de acá es
// RELATIVO: cada <Route path="..."> cuelga del splat del shell
// (design.md §2: "Rutas internas de un remote: el remote, sub-router relativo").
//
// Bug real (2026-08-28): el shell solo linkea a "/reservas" (el índice) — sin
// este nav interno, "Nueva reserva" y "Mis reservas" solo eran alcanzables
// tipeando la URL a mano.
import { NavLink, Route, Routes } from "react-router-dom";
import { DisponibilidadPage } from "./features/disponibilidad/DisponibilidadPage";
import { MisReservasPage } from "./features/mis-reservas/MisReservasPage";
import { NuevaReservaPage } from "./features/nueva-reserva/NuevaReservaPage";
import "./App.css";
import "./styles/tokens.css";

export default function App() {
  return (
    <div>
      <nav className="mfr-subnav" aria-label="Navegación de reservas">
        <NavLink to="." end className={({ isActive }) => (isActive ? "active" : undefined)}>
          Disponibilidad
        </NavLink>
        <NavLink to="nueva" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Nueva reserva
        </NavLink>
        <NavLink to="mias" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Mis reservas
        </NavLink>
      </nav>
      <Routes>
        <Route index element={<DisponibilidadPage />} />
        <Route path="nueva" element={<NuevaReservaPage />} />
        <Route path="mias" element={<MisReservasPage />} />
      </Routes>
    </div>
  );
}
