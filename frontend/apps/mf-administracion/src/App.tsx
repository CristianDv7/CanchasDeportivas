// Expuesto vía MF como './App' (rsbuild.config.ts). El shell monta este
// remote bajo "/administracion/*" (AppRouter.tsx, dentro de
// RequireRole rol="administrador"), por eso el <Routes> de acá es RELATIVO
// — mismo patrón que mf-reservas/src/App.tsx (design.md §1).
//
// Bug real (2026-08-28): el shell solo linkea a "/administracion" (el
// índice) — sin este nav interno, el panel de Reservas (cancelación admin,
// RN-03) solo era alcanzable tipeando la URL a mano.
import { NavLink, Route, Routes } from "react-router-dom";
import { CanchasPage } from "./features/canchas/CanchasPage";
import { ReservasAdminPage } from "./features/reservas/ReservasAdminPage";
import "./App.css";
import "./styles/tokens.css";

export default function App() {
  return (
    <div>
      <nav className="mfa-subnav" aria-label="Navegación de administración">
        <NavLink to="." end className={({ isActive }) => (isActive ? "active" : undefined)}>
          Canchas
        </NavLink>
        <NavLink to="reservas" className={({ isActive }) => (isActive ? "active" : undefined)}>
          Reservas
        </NavLink>
      </nav>
      <Routes>
        <Route index element={<CanchasPage />} />
        <Route path="canchas" element={<CanchasPage />} />
        <Route path="reservas" element={<ReservasAdminPage />} />
      </Routes>
    </div>
  );
}
