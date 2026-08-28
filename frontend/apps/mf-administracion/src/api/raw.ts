// Shapes crudos del backend (snake_case), design.md §2. Privado del módulo:
// NADIE fuera de src/api/ importa este archivo — es la regla dura del
// desacople del gateway (design.md §1, "Regla dura").
export interface CanchaRaw {
  id: number;
  nombre: string;
  deporte_id: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeporteRaw {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface HorarioAtencionRaw {
  id: number;
  cancha_id: number;
  dia_semana: number; // ISO 1-7 (1=lunes)
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

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

export interface UsuarioRaw {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol_id: number;
  activo: boolean;
}
