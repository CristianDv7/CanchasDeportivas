from pydantic import BaseModel, ConfigDict, Field


class DeporteBase(BaseModel):
    nombre: str = Field(min_length=1, max_length=50)
    descripcion: str | None = Field(default=None, max_length=255)


class DeporteCreate(DeporteBase):
    pass


class DeporteUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=50)
    descripcion: str | None = Field(default=None, max_length=255)
    activo: bool | None = None


class DeporteResponse(DeporteBase):
    id: int
    activo: bool

    model_config = ConfigDict(from_attributes=True)