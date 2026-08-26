from datetime import date, time, datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ReservaCreate(BaseModel):
    usuario_id: int = Field(gt=0)
    cancha_id: int = Field(gt=0)
    fecha: date
    hora_inicio: time
    hora_fin: time

    @model_validator(mode="after")
    def validar_horario(self):
        if self.hora_inicio >= self.hora_fin:
            raise ValueError(
                "La hora de inicio debe ser menor que la hora de fin"
            )

        return self


class ReservaUpdate(BaseModel):
    estado: str

    @model_validator(mode="after")
    def validar_estado(self):
        estados_validos = {
            "Confirmada",
            "Cancelada",
            "Finalizada",
        }

        if self.estado not in estados_validos:
            raise ValueError(
                "El estado debe ser Confirmada, Cancelada o Finalizada"
            )

        return self


class ReservaResponse(BaseModel):
    id: int
    usuario_id: int
    cancha_id: int
    fecha: date
    hora_inicio: time
    hora_fin: time
    estado: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )