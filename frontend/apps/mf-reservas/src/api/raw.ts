// Shapes crudos del backend (snake_case), design.md §2. Privado del módulo:
// NADIE fuera de src/api/ importa este archivo — es la regla dura del
// desacople del gateway (design.md §1, "Regla dura").
export interface ReservaRaw {
  id: number;
  usuario_id: number;
  cancha_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  created_at: string;
  updated_at: string;
}

export interface CanchaRaw {
  id: number;
  nombre: string;
  deporte_id: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface BloqueRaw {
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

export interface DisponibilidadRaw {
  cancha_id: number;
  fecha: string;
  bloques: BloqueRaw[];
}
