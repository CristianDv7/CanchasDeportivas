from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import require_admin
from app.db.database import get_db
from app.schemas.cancha import (
    CanchaCreate,
    CanchaResponse,
    CanchaUpdate,
)
from app.services.cancha_service import CanchaService


router = APIRouter(
    prefix="/canchas",
    tags=["Canchas"],
)


@router.get(
    "",
    response_model=list[CanchaResponse],
)
def listar_canchas(
    deporte_id: int | None = Query(
        default=None,
        gt=0,
    ),
    db: Session = Depends(get_db),
):
    if deporte_id is not None:
        return CanchaService.get_by_deporte(
            db,
            deporte_id,
        )

    return CanchaService.get_all(db)


@router.get(
    "/{cancha_id}",
    response_model=CanchaResponse,
)
def obtener_cancha(
    cancha_id: int,
    db: Session = Depends(get_db),
):
    cancha = CanchaService.get_by_id(
        db,
        cancha_id,
    )

    if not cancha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada",
        )

    return cancha


@router.post(
    "",
    response_model=CanchaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_cancha(
    data: CanchaCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    
    try:
        return CanchaService.create(
            db,
            data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/{cancha_id}",
    response_model=CanchaResponse,
)
def actualizar_cancha(
    cancha_id: int,
    data: CanchaUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    try:
        cancha = CanchaService.update(
            db,
            cancha_id,
            data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not cancha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada",
        )

    return cancha

@router.patch(
    "/{cancha_id}/inactivar",
    response_model=CanchaResponse,
)
def inactivar_cancha(
    cancha_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    cancha = CanchaService.inactivar(
        db,
        cancha_id,
    )

    if not cancha:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cancha no encontrada",
        )

    return cancha