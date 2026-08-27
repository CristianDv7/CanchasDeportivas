// Expuesto vía MF como './App' (rsbuild.config.ts).
import { RemoteHealthCard } from "./RemoteHealthCard";
import "./styles/tokens.css";

export default function App() {
  return (
    <div>
      <RemoteHealthCard />
    </div>
  );
}
