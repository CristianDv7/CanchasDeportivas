// Expuesto vía MF como './App' (rsbuild.config.ts). El shell monta este
// remote bajo "/reportes/*" (dentro de RequireRole rol="administrador"),
// cero cambios en shell. Vista única con 2 paneles apilados, sin <Routes>
// propio (Decisión 1 de la propuesta, design.md §1) — a diferencia de
// mf-reservas/mf-administracion, acá no hay sub-rutas que navegar: ambos
// paneles conviven siempre en la misma pantalla, así que no aplica el bug de
// nav interno que sí tuvieron esos dos remotes (commit cd1087e).
import { OcupacionCanchasPanel } from "./features/ocupacion/OcupacionCanchasPanel";
import { ReservasPeriodoPanel } from "./features/periodo/ReservasPeriodoPanel";
import "./styles/tokens.css";

export default function App() {
  return (
    <div>
      <OcupacionCanchasPanel />
      <ReservasPeriodoPanel />
    </div>
  );
}
