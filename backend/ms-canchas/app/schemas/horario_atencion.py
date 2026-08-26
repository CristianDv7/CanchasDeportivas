from datetime import time

from pydantic import BaseModel, ConfigDict, Field, model_validator


class HorarioAtencionBase(BaseModel):
    dia_semana: int = Field(
        ge=1,
        le=7,
    )

    hora_inicio: time
    hora_fin: time

    activo: bool = True

    @model_validator(mode="after")
    def validar_horario(self):
        if self.hora_inicio >= self.hora_fin:
            raise ValueError(
                "La hora de inicio debe ser menor que la hora de fin"
            )

        return self


class HorarioAtencionCreate(HorarioAtencionBase):
    cancha_id: int = Field(
        gt=0,
    )


class HorarioAtencionUpdate(BaseModel):
    cancha_id: int | None = Field(
        default=None,
        gt=0,
    )

    dia_semana: int | None = Field(
        default=None,
        ge=1,
        le=7,
    )

    hora_inicio: time | None = None
    hora_fin: time | None = None

    activo: bool | None = None

    @model_validator(mode="after")
    def validar_horario(self):
        if (
            self.hora_inicio is not None
            and self.hora_fin is not None
            and self.hora_inicio >= self.hora_fin
        ):
            raise ValueError(
                "La hora de inicio debe ser menor que la hora de fin"
            )

        return self


class HorarioAtencionResponse(HorarioAtencionBase):
    id: int
    cancha_id: int

    model_config = ConfigDict(
        from_attributes=True
    )