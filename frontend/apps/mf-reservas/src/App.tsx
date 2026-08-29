// Expuesto vía MF como './App' (rsbuild.config.ts). El shell monta este
// remote bajo "/reservas/*" (AppRouter.tsx), por eso el <Routes> de acá es
// RELATIVO: cada <Route path="..."> cuelga del splat del shell
// (design.md §2: "Rutas internas de un remote: el remote, sub-router relativo").
import { Route, Routes } from "react-router-dom";
import { DisponibilidadPage } from "./features/disponibilidad/DisponibilidadPage";
import { MisReservasPage } from "./features/mis-reservas/MisReservasPage";
import { NuevaReservaPage } from "./features/nueva-reserva/NuevaReservaPage";
import "./styles/tokens.css";

export default function App() {
  return (
    <Routes>
      <Route index element={<DisponibilidadPage />} />
      <Route path="nueva" element={<NuevaReservaPage />} />
      <Route path="mias" element={<MisReservasPage />} />
    </Routes>
  );
}
