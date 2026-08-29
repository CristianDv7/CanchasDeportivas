// design.md ADR-01/06: tabla como fuente de verdad, barra `aria-hidden`
// decorativa con ancho `%` relativo al máximo del conjunto. Distingue vacío
// real (`data.length===0`) de cancha con `reservas:0` (fila incluida, barra
// en 0%, nunca omitida ni fusionada).
import { calcularMaxReservas, calcularProporcion } from "../../domain/rules";
import { reportesApi } from "../../api/reportesApi";
import { useResource } from "../../hooks/useResource";
import { ErrorBanner } from "../../components/ErrorBanner";
import "./OcupacionCanchasPanel.css";

export function OcupacionCanchasPanel() {
  const { data, error, status, refetch } = useResource(reportesApi.ocupacionCanchas, []);

  const maxReservas = calcularMaxReservas((data ?? []).map((c) => c.reservas));

  return (
    <section className="mfrp-panel" aria-labelledby="ocupacion-titulo">
      <h2 id="ocupacion-titulo">Ocupación por cancha</h2>

      {error && <ErrorBanner error={error} onRetry={refetch} />}

      {status === "success" && data && data.length === 0 && (
        <p className="mfrp-empty">No hay canchas cargadas.</p>
      )}

      {data && data.length > 0 && (
        <table className="mfrp-tabla">
          <thead>
            <tr>
              <th>Cancha</th>
              <th>Reservas</th>
              <th aria-hidden="true">Ocupación</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cancha) => (
              <tr key={cancha.canchaId}>
                <td>{cancha.cancha}</td>
                <td>{cancha.reservas}</td>
                <td>
                  <div className="mfrp-barra-track">
                    <div
                      className="mfrp-barra-fill"
                      aria-hidden="true"
                      data-testid={`barra-${cancha.canchaId}`}
                      style={{ width: `${calcularProporcion(cancha.reservas, maxReservas)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
