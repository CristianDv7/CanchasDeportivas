// spec.md mf-administracion-canchas — design.md §6 (Phase 8). Compone:
// listado + alta/edición (CanchaForm), inactivación con advertencia
// informada (InactivarCanchaDialog, ADR-03), reactivación (ADR-05) y
// horario semanal por cancha (HorariosSemana, ADR-06). Sin escrituras
// optimistas (ADR-11): toda mutación exitosa refetchea el listado.
import { useEffect, useState } from "react";
import { canchasApi, deportesApi } from "../../api";
import type { Cancha, CanchaInput } from "../../api";
import { DeporteIcon } from "../../components/DeporteIcon";
import { EstadoBadge } from "../../components/EstadoBadge";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useAction } from "../../hooks/useAction";
import { useResource } from "../../hooks/useResource";
import { CanchaForm } from "./CanchaForm";
import { HorariosSemana } from "./HorariosSemana";
import { InactivarCanchaDialog } from "./InactivarCanchaDialog";
import "./CanchasPage.css";

type Modo = { readonly tipo: "alta" } | { readonly tipo: "edicion"; readonly cancha: Cancha } | null;

export function CanchasPage() {
  const canchas = useResource(canchasApi.list, []);
  const deportes = useResource(deportesApi.list, []);

  const [modo, setModo] = useState<Modo>(null);
  const [canchaAInactivar, setCanchaAInactivar] = useState<Cancha | null>(null);

  const crearCancha = useAction((input: CanchaInput) => canchasApi.crear(input));
  const editarCancha = useAction(({ id, input }: { id: number; input: CanchaInput }) =>
    canchasApi.editar(id, input),
  );
  const inactivarCancha = useAction((id: number) => canchasApi.inactivar(id));
  const reactivarCancha = useAction(({ id, input }: { id: number; input: CanchaInput }) =>
    canchasApi.reactivar(id, input),
  );

  // ADR-10 (404 sobre una cancha editada que ya no existe): refetch para
  // reflejar la realidad y cerrar el form editado sobre un recurso muerto.
  // Deliberadamente NO se dispara para 400 (ej. nombre duplicado): aunque
  // `mapApiError` también marca `action: "refetch"` para 400, ese status no
  // cambió nada server-side — cerrar el form ahí le haría perder al admin
  // lo que estaba tipeando sin darle chance de corregir el nombre (mismo
  // criterio que el 400 en alta, ver `handleCrear`). Por eso se discrimina
  // por `status === 404`, no por `action`, para este cierre automático.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (editarCancha.error?.status === 404) {
      canchas.refetch();
      setModo(null);
    }
  }, [editarCancha.error]);

  async function handleCrear(input: CanchaInput) {
    const creada = await crearCancha.run(input);
    if (creada === null) return; // 400/422 sin refetch: nada cambió server-side.
    setModo(null);
    canchas.refetch();
  }

  async function handleEditar(id: number, input: CanchaInput) {
    const editada = await editarCancha.run({ id, input });
    if (editada === null) return; // el efecto de arriba maneja el 404.
    setModo(null);
    canchas.refetch();
  }

  async function handleInactivarConfirmado() {
    if (canchaAInactivar === null) return;
    const resultado = await inactivarCancha.run(canchaAInactivar.id);
    if (resultado === null) return;
    setCanchaAInactivar(null);
    canchas.refetch();
  }

  async function handleReactivar(cancha: Cancha) {
    const resultado = await reactivarCancha.run({
      id: cancha.id,
      input: { nombre: cancha.nombre, deporteId: cancha.deporteId },
    });
    if (resultado === null) return;
    canchas.refetch();
  }

  function abrirAlta() {
    crearCancha.reset();
    editarCancha.reset();
    setModo({ tipo: "alta" });
  }

  function abrirEdicion(cancha: Cancha) {
    editarCancha.reset();
    crearCancha.reset();
    setModo({ tipo: "edicion", cancha });
  }

  return (
    <section>
      <h2 className="mfa-page-title">Canchas</h2>

      {canchas.error && <ErrorBanner error={canchas.error} onRetry={canchas.refetch} />}
      {deportes.error && <ErrorBanner error={deportes.error} onRetry={deportes.refetch} />}

      <button type="button" onClick={abrirAlta}>
        Nueva cancha
      </button>

      {/* Fuera del bloque gateado por `modo` a propósito: el efecto de 404
          (arriba) cierra el form en el mismo tick en que aparece el error,
          y el mensaje debe seguir visible después de que el form se cierra. */}
      {crearCancha.error && <ErrorBanner error={crearCancha.error} />}
      {editarCancha.error && <ErrorBanner error={editarCancha.error} />}

      {modo?.tipo === "alta" && (
        <CanchaForm
          deportes={deportes.data ?? []}
          pending={crearCancha.pending}
          onSubmit={handleCrear}
          onCancel={() => setModo(null)}
        />
      )}

      {modo?.tipo === "edicion" && (
        <CanchaForm
          deportes={deportes.data ?? []}
          initial={modo.cancha}
          pending={editarCancha.pending}
          onSubmit={(input) => handleEditar(modo.cancha.id, input)}
          onCancel={() => setModo(null)}
        />
      )}

      <ul className="mfa-canchas-lista">
        {canchas.data?.map((cancha) => (
          <li key={cancha.id} data-testid={`cancha-row-${cancha.id}`} className="mfa-cancha-row">
            <div className="mfa-cancha-row-header">
              <DeporteIcon
                deporte={deportes.data?.find((d) => d.id === cancha.deporteId)?.nombre ?? null}
              />
              <span className="mfa-cancha-nombre">{cancha.nombre}</span>
              <span data-testid={`cancha-estado-${cancha.id}`}>
                {cancha.activa ? "Activa" : "Inactiva"}
              </span>
              <button type="button" onClick={() => abrirEdicion(cancha)}>
                Editar
              </button>
              {cancha.activa ? (
                <button type="button" onClick={() => setCanchaAInactivar(cancha)}>
                  Inactivar
                </button>
              ) : (
                <button type="button" onClick={() => handleReactivar(cancha)}>
                  Reactivar
                </button>
              )}
            </div>
            <HorariosSemana canchaId={cancha.id} />
          </li>
        ))}
      </ul>

      {canchaAInactivar && (
        <InactivarCanchaDialog
          cancha={canchaAInactivar}
          pendiente={inactivarCancha.pending}
          onConfirmar={handleInactivarConfirmado}
          onCancelar={() => setCanchaAInactivar(null)}
        />
      )}
    </section>
  );
}
