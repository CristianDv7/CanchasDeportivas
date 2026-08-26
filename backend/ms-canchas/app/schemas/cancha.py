from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CanchaBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    deporte_id: int = Field(gt=0)


class CanchaCreate(CanchaBase):
    pass


class CanchaUpdate(BaseModel):
    nombre: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    deporte_id: int | None = Field(
        default=None,
        gt=0,
    )

    activo: bool | None = None


class CanchaResponse(CanchaBase):
    id: int
    activo: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)