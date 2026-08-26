from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.deporte import (
    DeporteCreate,
    DeporteResponse,
    DeporteUpdate,
)
from app.services.deporte_service import DeporteService


router = APIRouter(
    prefix="/deportes",
    tags=["Deportes"],
)


@router.get(
    "",
    response_model=list[DeporteResponse],
)
def listar_deportes(
    db: Session = Depends(get_db),
):
    return DeporteService.get_all(db)


@router.get(
    "/{deporte_id}",
    response_model=DeporteResponse,
)
def obtener_deporte(
    deporte_id: int,
    db: Session = Depends(get_db),
):
    deporte = DeporteService.get_by_id(
        db,
        deporte_id,
    )

    if not deporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deporte no encontrado",
        )

    return deporte


@router.post(
    "",
    response_model=DeporteResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_deporte(
    data: DeporteCreate,
    db: Session = Depends(get_db),
):
    try:
        return DeporteService.create(
            db,
            data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.put(
    "/{deporte_id}",
    response_model=DeporteResponse,
)
def actualizar_deporte(
    deporte_id: int,
    data: DeporteUpdate,
    db: Session = Depends(get_db),
):
    try:
        deporte = DeporteService.update(
            db,
            deporte_id,
            data,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not deporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deporte no encontrado",
        )

    return deporte