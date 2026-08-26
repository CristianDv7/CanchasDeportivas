from datetime import date

from pydantic import BaseModel


class OcupacionCanchaResponse(BaseModel):
    cancha_id: int
    cancha: str
    reservas: int


class ReservaPeriodoResponse(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    total_reservas: int