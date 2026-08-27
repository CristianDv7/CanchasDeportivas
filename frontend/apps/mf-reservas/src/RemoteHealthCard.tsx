// Placeholder de identidad + demo de MF (frontend-remote-modules spec).
// Lee la sesión del shell vía 'shell/session' y usa 'shell/apiClient' para
// un probe de backend opcional y degradable — nunca arma su propio fetch ni
// guarda su propia copia de la sesión (design.md §2).
import { useState } from "react";
import { apiClient } from "shell/apiClient";
import { useSession } from "shell/session";
import { env } from "./config/env";

type ProbeStatus = "idle" | "checking" | "connected" | "not-connected";

export function RemoteHealthCard() {
  const { user, rol } = useSession();
  const [count, setCount] = useState(0);
  const [forceError, setForceError] = useState(false);
  const [probeStatus, setProbeStatus] = useState<ProbeStatus>("idle");

  if (forceError) {
    // Se captura por el ErrorBoundary del shell para esta ruta, aislado del
    // resto de la app (frontend-shell-host spec, "Per-Remote Error Boundary").
    throw new Error("Error forzado desde RemoteHealthCard (mf-reservas)");
  }

  async function checkBackend(): Promise<void> {
    setProbeStatus("checking");
    try {
      await apiClient.get("/mias", { service: "reservas" });
      setProbeStatus("connected");
    } catch {
      // Degrada sin throw ni disparar el ErrorBoundary (spec: "Probe fails gracefully").
      setProbeStatus("not-connected");
    }
  }

  return (
    <section aria-label="Estado de mf-reservas">
      <h2 data-testid="remote-name">{env.remoteName}</h2>
      <dl>
        <dt>Build</dt>
        <dd data-testid="build-id">{env.buildId}</dd>
        <dt>Origen</dt>
        <dd data-testid="remote-origin">{env.origin}</dd>
        <dt>Usuario</dt>
        <dd data-testid="session-user">{user?.email ?? "sin sesión"}</dd>
        <dt>Rol</dt>
        <dd data-testid="session-rol">{rol ?? "desconocido"}</dd>
      </dl>

      <button type="button" onClick={() => setCount((c) => c + 1)}>
        +1 (contador: {count})
      </button>

      <button type="button" onClick={() => setForceError(true)}>
        Forzar error
      </button>

      <button type="button" onClick={() => void checkBackend()}>
        Probar backend
      </button>
      {probeStatus !== "idle" && (
        <p data-testid="backend-status">
          {probeStatus === "checking" && "verificando…"}
          {probeStatus === "connected" && "conectado"}
          {probeStatus === "not-connected" && "no conectado"}
        </p>
      )}
    </section>
  );
}
