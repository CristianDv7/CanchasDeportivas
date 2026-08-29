import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export function NotFoundPage() {
  return (
    <div className="shell-notfound-screen">
      <div className="shell-notfound-card">
        <span className="shell-notfound-code" aria-hidden="true" />
        <h1>404 — Página no encontrada</h1>
        <Link to="/reservas">Volver a reservas</Link>
      </div>
    </div>
  );
}
