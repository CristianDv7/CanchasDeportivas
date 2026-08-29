from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.schemas.reserva import (
    ReservaCreate,
    ReservaResponse,
)
from app.services.reserva_service import ReservaService


router = APIRouter(
    prefix="/reservas",
    tags=["Reservas"],
)


# ============================================================
# LISTAR RESERVAS
# ============================================================

@router.get(
    "/",
    response_model=list[ReservaResponse],
)
def listar_reservas(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Lista las reservas.

    Administrador:
    - Puede consultar todas las reservas.

    Usuario:
    - Puede consultar solamente sus propias reservas.
    """

    if current_user["rol"] == "administrador":
        return ReservaService.get_all(db)

    return ReservaService.get_by_usuario(
        db,
        current_user["usuario_id"],
    )


# ============================================================
# CONSULTAR DISPONIBILIDAD
# ============================================================

@router.get(
    "/disponibilidad",
    response_model=list[ReservaResponse],
)
def consultar_disponibilidad(
    cancha_id: int,
    fecha: date,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Consulta los horarios ocupados de una cancha
    para una fecha determinada.

    Las reservas canceladas no se muestran,
    por lo que sus horarios se consideran disponibles.
    """

    if cancha_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El cancha_id debe ser mayor que 0",
        )

    return ReservaService.get_disponibilidad(
        db,
        cancha_id,
        fecha,
    )


# ============================================================
# OBTENER UNA RESERVA
# ============================================================

@router.get(
    "/{reserva_id}",
    response_model=ReservaResponse,
)
def obtener_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    reserva = ReservaService.get_by_id(
        db,
        reserva_id,
    )

    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reserva no encontrada",
        )

    # Administrador puede consultar cualquier reserva.
    if current_user["rol"] == "administrador":
        return reserva

    # Usuario solamente puede consultar sus propias reservas.
    if reserva.usuario_id != current_user["usuario_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tiene permisos para consultar esta reserva",
        )

    return reserva


# ============================================================
# CREAR RESERVA
# ============================================================

@router.post(
    "/",
    response_model=ReservaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_reserva(
    data: ReservaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # El usuario no puede crear reservas a nombre
    # de otro usuario.
    if (
        current_user["rol"] != "administrador"
        and data.usuario_id != current_user["usuario_id"]
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puede crear una reserva para otro usuario",
        )

    try:
        return ReservaService.create(
            db,
            data,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )


# ============================================================
# CANCELAR RESERVA
# ============================================================

@router.patch(
    "/{reserva_id}/cancelar",
    response_model=ReservaResponse,
)
def cancelar_reserva(
    reserva_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    es_administrador = (
        current_user["rol"] == "administrador"
    )

    try:
        return ReservaService.cancelar(
            db=db,
            reserva_id=reserva_id,
            usuario_id=current_user["usuario_id"],
            es_administrador=es_administrador,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )

    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        )