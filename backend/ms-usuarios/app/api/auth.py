from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.usuario_service import UsuarioService


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"],
)


@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    service = UsuarioService(db)

    usuario = service.login(
        email=login_data.email,
        password=login_data.password,
    )

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="Credenciales inválidas",
        )

    return LoginResponse(
        usuario_id=usuario.id,
        nombre=usuario.nombre,
        email=usuario.email,
        rol=usuario.rol.nombre,
    )