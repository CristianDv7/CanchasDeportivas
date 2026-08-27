// Expuesto vía MF como './App' (rsbuild.config.ts). Sub-rutas propias de
// mf-reservas irían acá con un <Routes> relativo (design.md §2: "Rutas
// internas de un remote: el remote, sub-router relativo").
import { RemoteHealthCard } from "./RemoteHealthCard";

export default function App() {
  return (
    <div>
      <h1>mf-reservas</h1>
      <RemoteHealthCard />
    </div>
  );
}
