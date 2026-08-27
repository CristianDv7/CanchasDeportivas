import { Link } from "react-router-dom";

export function AccesoDenegadoPage() {
  return (
    <div>
      <h1>Acceso denegado</h1>
      <p>Tu usuario no tiene permisos para ver esta sección.</p>
      <Link to="/reservas">Volver a reservas</Link>
    </div>
  );
}
