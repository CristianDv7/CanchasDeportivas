// Expuesto vía MF como './App' (rsbuild.config.ts). El shell monta este
// remote bajo "/reservas/*" (AppRouter.tsx), por eso el <Routes> de acá es
// RELATIVO: cada <Route path="..."> cuelga del splat del shell
// (design.md §2: "Rutas internas de un remote: el remote, sub-router relativo").
//
// Bug real (2026-08-28): el shell solo linkea a "/reservas" (el índice) — sin
// este nav interno, "Nueva reserva" y "Mis reservas" solo eran alcanzables
// tipeando la URL a mano.
//
// Regla de negocio: reservar y cancelar reservas propias es una función de
// USUARIO — ninguna RN (01-08) le da al admin una reserva propia, su único
// rol respecto a "reservas" es RN-03 (cancelar la de cualquiera, vía el panel
// de mf-administracion). Por eso "Nueva reserva"/"Mis reservas" quedan
// bloqueadas para admin, tanto el link (UX) como la ruta en sí (defensa en
// profundidad — no alcanza con ocultar el botón). "Disponibilidad" sigue
// visible para los dos roles: es de solo lectura, sin efecto de negocio.
import { NavLink, Route, Routes } from "react-router-dom";
import { useSession } from "shell/session";
import { DisponibilidadPage } from "./features/disponibilidad/DisponibilidadPage";
import { MisReservasPage } from "./features/mis-reservas/MisReservasPage";
import { NuevaReservaPage } from "./features/nueva-reserva/NuevaReservaPage";
import "./App.css";
import "./styles/tokens.css";

export default function App() {
  const { hasRole } = useSession();
  const esUsuario = !hasRole("administrador");

  if (!esUsuario) {
    return <DisponibilidadPage />;
  }

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
