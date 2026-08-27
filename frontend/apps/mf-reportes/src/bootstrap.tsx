import { createRoot } from "react-dom/client";
import App from "./App";

// Ver apps/mf-reservas/src/bootstrap.tsx — solo para aislamiento en dev.
const container = document.getElementById("root");

if (!container) {
  throw new Error("[mf-reportes] No se encontró el nodo #root para montar la app.");
}

createRoot(container).render(<App />);
