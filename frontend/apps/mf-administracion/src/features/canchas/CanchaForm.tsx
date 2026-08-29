// spec.md "Alta de cancha" + "Edición de cancha" — design.md §6. Componente
// controlado: no decide si debe llamarse a la API, solo arma el `CanchaInput`
// y delega en `onSubmit` (mismo patrón que ReservaForm de mf-reservas).
import { useState } from "react";
import type { Cancha, CanchaInput, Deporte } from "../../api";
import "./CanchaForm.css";

export interface CanchaFormProps {
  readonly deportes: readonly Deporte[];
  readonly initial?: Cancha;
  readonly pending: boolean;
  readonly onSubmit: (input: CanchaInput) => void;
  readonly onCancel: () => void;
}

export function CanchaForm({ deportes, initial, pending, onSubmit, onCancel }: CanchaFormProps) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "");
  const [deporteId, setDeporteId] = useState<number | "">(initial?.deporteId ?? "");

  return (
    <form
      className="mfa-cancha-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (deporteId === "") return;
        onSubmit({ nombre, deporteId: Number(deporteId) });
      }}
    >
      <label htmlFor="cancha-form-nombre">Nombre</label>
      <input
        id="cancha-form-nombre"
        value={nombre}
        onChange={(event) => setNombre(event.target.value)}
        required
      />

      <label htmlFor="cancha-form-deporte">Deporte</label>
      <select
        id="cancha-form-deporte"
        value={deporteId}
        onChange={(event) => setDeporteId(event.target.value === "" ? "" : Number(event.target.value))}
        required
      >
        <option value="">Elegí un deporte</option>
        {deportes.map((deporte) => (
          <option key={deporte.id} value={deporte.id}>
            {deporte.nombre}
          </option>
        ))}
      </select>

      <div className="mfa-cancha-form-actions">
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" disabled={pending}>
          {initial ? "Guardar cambios" : "Crear cancha"}
        </button>
      </div>
    </form>
  );
}
