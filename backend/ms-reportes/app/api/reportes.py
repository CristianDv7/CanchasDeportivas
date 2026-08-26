from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import require_admin
from app.schemas.reporte import (
    OcupacionCanchaResponse,
    ReservaPeriodoResponse,
)
from app.services.reporte_service import ReporteService

router = APIRouter(
    prefix="/reportes",
    tags=["Reportes"],
)


@router.get(
    "/ocupacion/canchas",
    response_model=list[OcupacionCanchaResponse],
)
async def obtener_ocupacion_por_cancha(
    current_user: dict = Depends(require_admin),
):
    """
    Obtiene la cantidad de reservas por cancha.

    Disponible únicamente para administradores.
    """

    token = current_user["_token"]

    try:
        return await ReporteService.ocupacion_por_cancha(
            token,
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="No fue posible obtener la información de los microservicios",
        )


@router.get(
    "/reservas/periodo",
    response_model=ReservaPeriodoResponse,
)
async def obtener_reservas_por_periodo(
    fecha_inicio: date = Query(...),
    fecha_fin: date = Query(...),
    current_user: dict = Depends(require_admin),
):
    """
    Obtiene el número de reservas dentro de un período.

    Disponible únicamente para administradores.
    """

    token = current_user["_token"]

    try:
        return await ReporteService.reservas_por_periodo(
            token,
            fecha_inicio,
            fecha_fin,
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        )

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="No fue posible obtener la información de los microservicios",
        )