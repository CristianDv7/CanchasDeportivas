// Ver apps/mf-reservas/src/RemoteHealthCard.tsx — mismo patrón por remote.
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
    throw new Error("Error forzado desde RemoteHealthCard (mf-reportes)");
  }

  async function checkBackend(): Promise<void> {
    setProbeStatus("checking");
    try {
      await apiClient.get("/", { service: "reportes" });
      setProbeStatus("connected");
    } catch {
      setProbeStatus("not-connected");
    }
  }

  return (
    <section aria-label="Estado de mf-reportes">
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
