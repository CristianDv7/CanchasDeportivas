// Shapes crudos del backend (snake_case), design.md §2/§4. Privado del
// módulo: NADIE fuera de src/api/ importa este archivo — es la regla dura
// del desacople del gateway (design.md §1, "Regla dura"). Espeja
// app/schemas/reporte.py de ms-reportes.
export interface OcupacionCanchaRaw {
  cancha_id: number;
  cancha: string;
  reservas: number;
}

export interface ReservasPeriodoRaw {
  fecha_inicio: string;
  fecha_fin: string;
  total_reservas: number;
}
