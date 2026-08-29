// DTOs propios (camelCase) que consumen features/ y domain/ — design.md §2/§5.
// Nunca conocen paths ni shapes del backend; eso vive en raw.ts/mappers.ts.
export type IsoDate = string; // "YYYY-MM-DD"

export interface OcupacionCancha {
  readonly canchaId: number;
  readonly cancha: string;
  readonly reservas: number;
}

export interface ReservasPeriodo {
  readonly fechaInicio: IsoDate;
  readonly fechaFin: IsoDate;
  readonly totalReservas: number;
}
