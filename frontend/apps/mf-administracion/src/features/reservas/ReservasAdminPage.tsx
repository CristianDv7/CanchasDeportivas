// spec.md mf-administracion-reservas — design.md §4/§6 (Phase 9). Compone:
// `useResource(reservasAdminApi.listPanel)` (enrichment + degradación,
// ADR-07/ADR-08), `domain/filters.filtrarReservas` (ADR-09) y
// `useAction(reservasAdminApi.cancelar)` (RN-03, sin optimismo — ADR-11).
import { useState } from "react";
import { canchasApi, reservasAdminApi } from "../../api";
import { ErrorBanner } from "../../components/ErrorBanner";
import type { FiltrosReservas } from "../../domain/filters";
import { filtrarReservas } from "../../domain/filters";
import { useAction } from "../../hooks/useAction";
import { useResource } from "../../hooks/useResource";
import { ReservaAdminRow } from "./ReservaAdminRow";
import { ReservasFiltros } from "./ReservasFiltros";
import "./ReservasAdminPage.css";

export function ReservasAdminPage() {
  const panel = useResource(reservasAdminApi.listPanel, []);
  const canchas = useResource(canchasApi.list, []);
  const [filtros, setFiltros] = useState<FiltrosReservas>({});

  const cancelarReserva = useAction((id: number) => reservasAdminApi.cancelar(id));

  const total = panel.data?.length ?? 0;
  const filtradas = panel.data ? filtrarReservas(panel.data, filtros) : [];

  async function handleCancelar(id: number) {
    const resultado = await cancelarReserva.run(id);
    if (resultado === null) return;
    // ADR-11: sin escrituras optimistas, refetch simple del panel completo.
    panel.refetch();
  }

  return (
    <section>
      <h2 className="mfa-page-title">Reservas</h2>

      {panel.error && <ErrorBanner error={panel.error} onRetry={panel.refetch} />}
      {cancelarReserva.error && <ErrorBanner error={cancelarReserva.error} />}

      <ReservasFiltros canchas={canchas.data ?? []} filtros={filtros} onChange={setFiltros} />

      <p data-testid="reservas-contador" className="mfa-reservas-contador">
        Mostrando {filtradas.length} de {total} reservas
      </p>

      <ul className="mfa-reservas-admin-lista">
        {filtradas.map((reserva) => (
          <ReservaAdminRow
            key={reserva.id}
            reserva={reserva}
            pending={cancelarReserva.pending}
            onCancelar={handleCancelar}
          />
        ))}
      </ul>
    </section>
  );
}
