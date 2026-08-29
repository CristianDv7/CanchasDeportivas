// design.md ADR-03/04: orquesta `RangoFechasPicker` + `useReservasPeriodo` +
// `ErrorBanner`. 2 estados de fecha: `draft` (lo que el admin tipea, NO
// dispara fetch) y `aplicado` (lo que entra en las deps de useResource, solo
// cambia al click en "Actualizar"). Rango por defecto (últimos 30 días) se
// autoconsulta al montar.
import { useState } from "react";
import type { IsoDate } from "../../api/dto";
import { rangoPorDefecto, validarRangoFechas } from "../../domain/rules";
import { ErrorBanner } from "../../components/ErrorBanner";
import { RangoFechasPicker } from "./RangoFechasPicker";
import { useReservasPeriodo } from "./useReservasPeriodo";
import "./ReservasPeriodoPanel.css";

export function ReservasPeriodoPanel() {
  const defecto = rangoPorDefecto();
  const [draft, setDraft] = useState<{ fechaInicio: IsoDate; fechaFin: IsoDate }>(defecto);
  const [aplicado, setAplicado] = useState<{ fechaInicio: IsoDate; fechaFin: IsoDate }>(defecto);

  const { data, error, status, refetch } = useReservasPeriodo(
    aplicado.fechaInicio,
    aplicado.fechaFin,
  );

  const rangoValido = validarRangoFechas(draft.fechaInicio, draft.fechaFin);

  return (
    <section className="mfrp-panel" aria-labelledby="periodo-titulo">
      <h2 id="periodo-titulo">Reservas por período</h2>

      <RangoFechasPicker
        fechaInicio={draft.fechaInicio}
        fechaFin={draft.fechaFin}
        onFechaInicioChange={(fecha) => setDraft((d) => ({ ...d, fechaInicio: fecha }))}
        onFechaFinChange={(fecha) => setDraft((d) => ({ ...d, fechaFin: fecha }))}
      />

      <button
        type="button"
        className="mfrp-actualizar-btn"
        disabled={!rangoValido}
        onClick={() => setAplicado(draft)}
      >
        Actualizar
      </button>

      {!rangoValido && (
        <p className="mfrp-rango-invalido" role="alert">
          El rango es inválido: la fecha de inicio debe ser anterior o igual a la fecha de fin.
        </p>
      )}

      {error && <ErrorBanner error={error} onRetry={refetch} />}

      {status === "success" && data && (
        <p className="mfrp-total">
          Total de reservas: <strong>{data.totalReservas}</strong>
        </p>
      )}
    </section>
  );
}
