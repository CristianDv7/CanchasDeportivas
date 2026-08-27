import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./app/AppRouter";
import { getOrCreateSessionStore } from "./session/store";

const container = document.getElementById("root");

if (!container) {
  throw new Error("[shell] No se encontró el nodo #root para montar la app.");
}

// hydrate() antes del primer render (design.md §3, paso 8): status ya
// resuelto ⇒ sin flash de "recargo estando logueado y me tira al login".
void getOrCreateSessionStore()
  .hydrate()
  .finally(() => {
    createRoot(container).render(
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>,
    );
  });
