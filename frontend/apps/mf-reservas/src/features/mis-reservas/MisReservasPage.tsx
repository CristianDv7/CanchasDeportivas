// spec.md "Cancelar reserva (RN-03/RN-04/RN-05)" + "Badges de estado (RN-08)"
// — design.md §4/§7. Compone: `useResource(reservasApi.listMias)` para el
// listado y `useAction(reservasApi.cancelar)` para la mutación. A diferencia
// de `NuevaReservaPage` (design.md §6, RN-02), acá NO hace falta un
// `useEffect` reaccionando a `cancelarReserva.error`: no hay ningún refetch
// condicionado a un error (403/404 solo muestran mensaje, spec.md "Manejo de
// errores al reservar" — ese refetch-on-error es exclusivo del 400 al crear).
// El único post-proceso es sobre el CAMINO DE ÉXITO, y ahí el valor de
// retorno directo de `run()` alcanza (sin closures obsoletas).
import { canchasApi, deportesApi, reservasApi } from "../../api";
import { ErrorBanner } from "../../components/ErrorBanner";
import { useAction } from "../../hooks/useAction";
import { useResource } from "../../hooks/useResource";
import { ReservaRow } from "./ReservaRow";
import "./MisReservasPage.css";

export function MisReservasPage() {
  const misReservas = useResource(reservasApi.listMias, []);
  // Solo para nombre de cancha + ícono de deporte por fila (decorativo): un
  // 404/500 acá no debe romper la lista de reservas, así que no se propaga
  // ningún ErrorBanner por estos dos — degradan a "Cancha" + ícono genérico.
  const canchas = useResource(canchasApi.list, []);
  const deportes = useResource(deportesApi.list, []);
  const cancelarReserva = useAction(reservasApi.cancelar);

  async function handleCancelar(id: number) {
    const cancelada = await cancelarReserva.run(id);
    if (cancelada === null) return;
    // Post-éxito (design.md §4, tabla "Consumo por pantalla"): refetch simple.
    misReservas.refetch();
  }

  return (
    <section>
      <h2 className="mfr-page-title">Mis reservas</h2>

      {misReservas.error && (
        <ErrorBanner error={misReservas.error} onRetry={misReservas.refetch} />
      )}

      {cancelarReserva.error && <ErrorBanner error={cancelarReserva.error} />}

      {misReservas.data && misReservas.data.length === 0 && (
        <p data-testid="mis-reservas-vacio" className="mfr-reservas-vacio">
          Todavía no tenés reservas.
        </p>
      )}

      {misReservas.data && misReservas.data.length > 0 && (
        <ul className="mfr-reservas-list">
          {misReservas.data.map((reserva) => {
            const cancha = canchas.data?.find((c) => c.id === reserva.canchaId) ?? null;
            const deporte = deportes.data?.find((d) => d.id === cancha?.deporteId) ?? null;
            return (
              <ReservaRow
                key={reserva.id}
                reserva={reserva}
                canchaNombre={cancha?.nombre ?? null}
                deporteNombre={deporte?.nombre ?? null}
                pending={cancelarReserva.pending}
                onCancelar={handleCancelar}
              />
            );
          })}
        </ul>
      )}
    </section>
  );
}
