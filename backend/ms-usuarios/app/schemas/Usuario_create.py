

from pydantic import BaseModel, ConfigDict, EmailStr


class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str | None = None
    rol_id: int
    password: str


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str | None
    rol_id: int
    activo: bool

    model_config = ConfigDict(
        from_attributes=True
    )