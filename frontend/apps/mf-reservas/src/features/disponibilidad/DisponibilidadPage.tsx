// spec.md "Ver disponibilidad" — design.md §4/§7. Compone: lista de canchas
// (`useResource(canchasApi.list, [])`), selección de cancha+fecha
// (`CanchaFechaPicker`) y grilla (`useDisponibilidad` + `BloquesGrid`).
// Loading/error se muestran con `ErrorBanner` (design.md §3): ningún
// componente ramifica por `status`/texto, solo por `action`.
import { useState } from "react";
import { canchasApi } from "../../api";
import type { IsoDate } from "../../api";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useResource } from "../../hooks/useResource";
import { BloquesGrid } from "./BloquesGrid";
import { CanchaFechaPicker } from "./CanchaFechaPicker";
import { useDisponibilidad } from "./useDisponibilidad";
import "./DisponibilidadPage.css";

export function DisponibilidadPage() {
  const canchas = useResource(canchasApi.list, []);
  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState<IsoDate | null>(null);

  const disponibilidad = useDisponibilidad(canchaId, fecha);

  return (
    <section>
      <h2 className="mfr-page-title">Disponibilidad</h2>

      {canchas.error && <ErrorBanner error={canchas.error} onRetry={canchas.refetch} />}

      <CanchaFechaPicker
        canchas={canchas.data ?? []}
        canchaId={canchaId}
        fecha={fecha}
        onCanchaChange={setCanchaId}
        onFechaChange={setFecha}
      />

      {disponibilidad.error && (
        <ErrorBanner error={disponibilidad.error} onRetry={disponibilidad.refetch} />
      )}

      {disponibilidad.status === "loading" && disponibilidad.data === null && (
        <p className="mfr-loading">Cargando disponibilidad…</p>
      )}

      {disponibilidad.data && <BloquesGrid bloques={disponibilidad.data.bloques} />}
    </section>
  );
}
