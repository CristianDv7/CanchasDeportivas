// spec.md "Crear reserva" + "Manejo de errores al reservar" + "Límite de
// reservas activas (RN-06)" — design.md §4/§6/§7. Compone: lista de canchas,
// selección cancha+fecha (reusa `CanchaFechaPicker` de la feature
// Disponibilidad, design.md §7 no declara un picker propio para esta
// pantalla), disponibilidad propia (`useDisponibilidad`, instancia separada
// de la de `DisponibilidadPage` — sin caché compartida, design.md §4), el
// contador informativo RN-06 (`useResource(reservasApi.listMias)` +
// `contarActivas`) y la creación (`useAction(reservasApi.crear)`).
import { useEffect, useState } from "react";
import { useSession } from "shell/session";
import { canchasApi, reservasApi } from "../../api";
import type { BloqueDisponibilidad, IsoDate, NuevaReservaInput, Reserva } from "../../api";
import { ErrorBanner } from "../../components/ErrorBanner";
import { contarActivas } from "../../domain/rules";
import { useAction } from "../../hooks/useAction";
import { useResource } from "../../hooks/useResource";
import { CanchaFechaPicker } from "../disponibilidad/CanchaFechaPicker";
import { useDisponibilidad } from "../disponibilidad/useDisponibilidad";
import { ReservaForm } from "./ReservaForm";

export function NuevaReservaPage() {
  const session = useSession();
  const usuarioId = session.user?.id ?? null;

  const canchas = useResource(canchasApi.list, []);
  const [canchaId, setCanchaId] = useState<number | null>(null);
  const [fecha, setFecha] = useState<IsoDate | null>(null);
  const disponibilidad = useDisponibilidad(canchaId, fecha);

  const misReservas = useResource(reservasApi.listMias, []);

  const [bloqueSeleccionado, setBloqueSeleccionado] = useState<BloqueDisponibilidad | null>(null);
  const [exito, setExito] = useState(false);

  const crearReserva = useAction<NuevaReservaInput, Reserva>((input) => {
    if (usuarioId === null) {
      // No debería ocurrir nunca: el shell exige sesión activa para montar
      // mf-reservas. `usuario_id` sale de la sesión (RN-03), nunca de un
      // input editable del formulario.
      return Promise.reject(new Error("NuevaReservaPage: no hay usuario en sesión"));
    }
    return reservasApi.crear(input, usuarioId);
  });

  // RN-02 (design.md §6): un 400 al crear significa que la grilla quedó
  // vieja entre el GET y el POST. El 400 ES el mecanismo de reconciliación:
  // se refresca disponibilidad y se limpia la selección (el bloque elegido
  // pudo haber quedado ocupado).
  useEffect(() => {
    if (crearReserva.error?.action === "refetch-disponibilidad") {
      disponibilidad.refetch();
      setBloqueSeleccionado(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch tiene
    // identidad estable (useCallback, design.md §4); solo debe dispararse
    // cuando aparece un error nuevo.
  }, [crearReserva.error]);

  function handleCanchaChange(id: number) {
    setCanchaId(id);
    setBloqueSeleccionado(null);
    setExito(false);
  }

  function handleFechaChange(nuevaFecha: IsoDate) {
    setFecha(nuevaFecha);
    setBloqueSeleccionado(null);
    setExito(false);
  }

  function handleSeleccionarBloque(bloque: BloqueDisponibilidad) {
    setBloqueSeleccionado(bloque);
    setExito(false);
  }

  async function handleConfirmar() {
    if (canchaId === null || fecha === null || bloqueSeleccionado === null) return;

    const input: NuevaReservaInput = {
      canchaId,
      fecha,
      horaInicio: bloqueSeleccionado.horaInicio,
      horaFin: bloqueSeleccionado.horaFin,
    };

    const creada = await crearReserva.run(input);
    if (creada === null) return;

    setBloqueSeleccionado(null);
    setExito(true);
    // Post-éxito (design.md §4, tabla "Consumo por pantalla"): el bloque
    // recién tomado también debe reflejarse en la grilla de disponibilidad.
    misReservas.refetch();
    disponibilidad.refetch();
  }

  return (
    <section>
      <h2>Nueva reserva</h2>

      {canchas.error && <ErrorBanner error={canchas.error} onRetry={canchas.refetch} />}

      <CanchaFechaPicker
        canchas={canchas.data ?? []}
        canchaId={canchaId}
        fecha={fecha}
        onCanchaChange={handleCanchaChange}
        onFechaChange={handleFechaChange}
      />

      {misReservas.data && (
        <p data-testid="contador-rn06">
          Reservas activas: {contarActivas(misReservas.data)}
        </p>
      )}

      {disponibilidad.error && (
        <ErrorBanner error={disponibilidad.error} onRetry={disponibilidad.refetch} />
      )}

      {crearReserva.error && <ErrorBanner error={crearReserva.error} />}

      {exito && (
        <p role="status" data-testid="reserva-exito">
          Reserva confirmada.
        </p>
      )}

      <ReservaForm
        bloques={disponibilidad.data?.bloques ?? []}
        seleccionado={bloqueSeleccionado}
        pending={crearReserva.pending}
        onSeleccionar={handleSeleccionarBloque}
        onConfirmar={handleConfirmar}
      />
    </section>
  );
}
