import { createRoot } from "react-dom/client";
import App from "./App";

// Entry point SOLO para levantar mf-reservas en aislamiento durante
// desarrollo (`pnpm --filter mf-reservas dev` sin el shell). Cuando se
// consume federado, el shell monta './App' directamente vía MF.
const container = document.getElementById("root");

if (!container) {
  throw new Error("[mf-reservas] No se encontró el nodo #root para montar la app.");
}

createRoot(container).render(<App />);
