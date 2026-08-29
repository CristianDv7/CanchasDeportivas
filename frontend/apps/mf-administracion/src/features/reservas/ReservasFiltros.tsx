// spec.md "Filtros client-side con contador" — design.md §5/ADR-09.
// Componente controlado: no guarda estado propio, filtra en el padre
// (ReservasAdminPage) vía `domain/filters.filtrarReservas`.
import type { Cancha, EstadoReserva } from "../../api";
import type { FiltrosReservas } from "../../domain/filters";
import "./ReservasFiltros.css";

export interface ReservasFiltrosProps {
  readonly canchas: readonly Cancha[];
  readonly filtros: FiltrosReservas;
  readonly onChange: (filtros: FiltrosReservas) => void;
}

const ESTADOS: readonly EstadoReserva[] = ["Confirmada", "Cancelada", "Finalizada"];

export function ReservasFiltros({ canchas, filtros, onChange }: ReservasFiltrosProps) {
  return (
    <div className="mfa-reservas-filtros">
      <label htmlFor="reservas-filtro-fecha">Fecha</label>
      <input
        id="reservas-filtro-fecha"
        type="date"
        value={filtros.fecha ?? ""}
        onChange={(event) => onChange({ ...filtros, fecha: event.target.value || undefined })}
      />

      <label htmlFor="reservas-filtro-cancha">Cancha</label>
      <select
        id="reservas-filtro-cancha"
        value={filtros.canchaId ?? ""}
        onChange={(event) =>
          onChange({ ...filtros, canchaId: event.target.value === "" ? undefined : Number(event.target.value) })
        }
      >
        <option value="">Todas</option>
        {canchas.map((cancha) => (
          <option key={cancha.id} value={cancha.id}>
            {cancha.nombre}
          </option>
        ))}
      </select>

      <label htmlFor="reservas-filtro-estado">Estado</label>
      <select
        id="reservas-filtro-estado"
        value={filtros.estado ?? ""}
        onChange={(event) =>
          onChange({
            ...filtros,
            estado: event.target.value === "" ? undefined : (event.target.value as EstadoReserva),
          })
        }
      >
        <option value="">Todos</option>
        {ESTADOS.map((estado) => (
          <option key={estado} value={estado}>
            {estado}
          </option>
        ))}
      </select>

      <label>
        <input
          type="checkbox"
          checked={filtros.soloProximas ?? true}
          onChange={(event) => onChange({ ...filtros, soloProximas: event.target.checked })}
        />
        Solo próximas
      </label>
    </div>
  );
}
