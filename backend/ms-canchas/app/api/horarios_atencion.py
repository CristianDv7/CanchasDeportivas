from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import require_admin
from app.db.database import get_db
from app.schemas.horario_atencion import (
    HorarioAtencionCreate,
    HorarioAtencionResponse,
    HorarioAtencionUpdate,
)
from app.services.horario_atencion_service import (
    HorarioAtencionService,
)


router = APIRouter(
    prefix="/horarios-atencion",
    tags=["Horarios de Atención"],
)


@router.get(
    "",
    response_model=list[HorarioAtencionResponse],
)
def listar_horarios(
    cancha_id: int | None = Query(
        default=None,
        gt=0,
    ),
    db: Session = Depends(get_db),
):
    return HorarioAtencionService.get_all(
        db,
        cancha_id,
    )


@router.get(
    "/{horario_id}",
    response_model=HorarioAtencionResponse,
)
def obtener_horario(
    horario_id: int,
    db: Session = Depends(get_db),
):
    horario = HorarioAtencionService.get_by_id(
        db,
        horario_id,
    )

    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario de atención no encontrado",
        )

    return horario


@router.post(
    "",
    response_model=HorarioAtencionResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_horario(
    data: HorarioAtencionCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    try:
        return HorarioAtencionService.create(
            db,
            data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/{horario_id}",
    response_model=HorarioAtencionResponse,
)
def actualizar_horario(
    horario_id: int,
    data: HorarioAtencionUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    try:
        horario = HorarioAtencionService.update(
            db,
            horario_id,
            data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not horario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Horario de atención no encontrado",
        )

    return horario