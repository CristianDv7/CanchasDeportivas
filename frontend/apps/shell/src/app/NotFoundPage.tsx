import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div>
      <h1>404 — Página no encontrada</h1>
      <Link to="/reservas">Volver a reservas</Link>
    </div>
  );
}
