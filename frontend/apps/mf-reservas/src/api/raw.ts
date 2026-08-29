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

// Shape real de GET /horarios-atencion (ms-canchas, sin auth). Reemplaza el
// contrato PROPUESTO `DisponibilidadRaw`/`BloqueRaw` (grilla ya armada) que
// nunca implementó el backend: ahora el frontend arma la grilla combinando
// esto con `GET /reservas/disponibilidad` (ver `buildDisponibilidad` en
// mappers.ts).
export interface HorarioAtencionRaw {
  id: number;
  cancha_id: number;
  dia_semana: number; // ISO 1-7 (1=lunes)
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}
