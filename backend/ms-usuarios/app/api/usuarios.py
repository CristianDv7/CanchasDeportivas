from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.Usuario_create import UsuarioCreate, UsuarioResponse
from app.services.usuario_service import UsuarioService
from app.core.dependencies import get_current_user,require_admin
from app.models.usuario import Usuario

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
)


@router.post(
    "",
    response_model=UsuarioResponse,
)
def crear_usuario(
    usuario_data: UsuarioCreate,
    db: Session = Depends(get_db),
):
    service = UsuarioService(db)

    try:
        return service.create_usuario(
            nombre=usuario_data.nombre,
            apellido=usuario_data.apellido,
            email=usuario_data.email,
            telefono=usuario_data.telefono,
            rol_id=usuario_data.rol_id,
            password=usuario_data.password,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


@router.get(
    "/{usuario_id}",
    response_model=UsuarioResponse,
)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
):
    service = UsuarioService(db)

    usuario = service.get_usuario(usuario_id)

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    return usuario

@router.get(
    "",
    response_model=list[UsuarioResponse],
)
def obtener_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    service = UsuarioService(db)

    return service.get_usuarios()
