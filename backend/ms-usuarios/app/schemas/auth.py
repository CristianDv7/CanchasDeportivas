from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    usuario_id: int
    nombre: str
    email: EmailStr
    rol: str