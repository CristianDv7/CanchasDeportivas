// Expuesto vía MF como './App' (rsbuild.config.ts). El shell monta este
// remote bajo "/administracion/*" (AppRouter.tsx, dentro de
// RequireRole rol="administrador"), por eso el <Routes> de acá es RELATIVO
// — mismo patrón que mf-reservas/src/App.tsx (design.md §1).
import { Route, Routes } from "react-router-dom";
import { CanchasPage } from "./features/canchas/CanchasPage";
import { ReservasAdminPage } from "./features/reservas/ReservasAdminPage";
import "./styles/tokens.css";

export default function App() {
  return (
    <Routes>
      <Route index element={<CanchasPage />} />
      <Route path="canchas" element={<CanchasPage />} />
      <Route path="reservas" element={<ReservasAdminPage />} />
    </Routes>
  );
}
