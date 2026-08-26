from datetime import date

import pytest
from unittest.mock import AsyncMock, patch

from app.services.reporte_service import ReporteService


@pytest.mark.asyncio
async def test_ocupacion_por_cancha_correctamente():
    # Arrange
    token = "token-admin"

    canchas = [
        {
            "id": 1,
            "nombre": "Cancha Pádel 1",
        },
        {
            "id": 2,
            "nombre": "Cancha Tenis 1",
        },
    ]

    reservas = [
        {
            "id": 1,
            "cancha_id": 1,
            "fecha": "2026-08-26",
            "estado": "Confirmada",
        },
        {
            "id": 2,
            "cancha_id": 1,
            "fecha": "2026-08-27",
            "estado": "Confirmada",
        },
        {
            "id": 3,
            "cancha_id": 2,
            "fecha": "2026-08-27",
            "estado": "Confirmada",
        },
    ]

    with patch(
        "app.services.reporte_service.ReporteHttpClient.get_canchas",
        new_callable=AsyncMock,
        return_value=canchas,
    ) as mock_canchas, patch(
        "app.services.reporte_service.ReporteHttpClient.get_reservas",
        new_callable=AsyncMock,
        return_value=reservas,
    ) as mock_reservas:

        # Act
        resultado = await ReporteService.ocupacion_por_cancha(token)

    # Assert
    assert resultado == [
        {
            "cancha_id": 1,
            "cancha": "Cancha Pádel 1",
            "reservas": 2,
        },
        {
            "cancha_id": 2,
            "cancha": "Cancha Tenis 1",
            "reservas": 1,
        },
    ]

    mock_canchas.assert_awaited_once_with(token)
    mock_reservas.assert_awaited_once_with(token)


@pytest.mark.asyncio
async def test_ocupacion_no_cuenta_reservas_canceladas():
    # Arrange
    token = "token-admin"

    canchas = [
        {
            "id": 1,
            "nombre": "Cancha Pádel 1",
        }
    ]

    reservas = [
        {
            "id": 1,
            "cancha_id": 1,
            "fecha": "2026-08-26",
            "estado": "Confirmada",
        },
        {
            "id": 2,
            "cancha_id": 1,
            "fecha": "2026-08-27",
            "estado": "Cancelada",
        },
    ]

    with patch(
        "app.services.reporte_service.ReporteHttpClient.get_canchas",
        new_callable=AsyncMock,
        return_value=canchas,
    ), patch(
        "app.services.reporte_service.ReporteHttpClient.get_reservas",
        new_callable=AsyncMock,
        return_value=reservas,
    ):

        # Act
        resultado = await ReporteService.ocupacion_por_cancha(token)

    # Assert
    assert resultado[0]["reservas"] == 1


@pytest.mark.asyncio
async def test_ocupacion_cancha_sin_reservas():
    # Arrange
    token = "token-admin"

    canchas = [
        {
            "id": 1,
            "nombre": "Cancha Pádel 1",
        }
    ]

    reservas = []

    with patch(
        "app.services.reporte_service.ReporteHttpClient.get_canchas",
        new_callable=AsyncMock,
        return_value=canchas,
    ), patch(
        "app.services.reporte_service.ReporteHttpClient.get_reservas",
        new_callable=AsyncMock,
        return_value=reservas,
    ):

        # Act
        resultado = await ReporteService.ocupacion_por_cancha(token)

    # Assert
    assert resultado == [
        {
            "cancha_id": 1,
            "cancha": "Cancha Pádel 1",
            "reservas": 0,
        }
    ]


@pytest.mark.asyncio
async def test_reservas_por_periodo_correctamente():
    # Arrange
    token = "token-admin"

    reservas = [
        {
            "id": 1,
            "fecha": "2026-08-10",
            "estado": "Confirmada",
        },
        {
            "id": 2,
            "fecha": "2026-08-15",
            "estado": "Confirmada",
        },
        {
            "id": 3,
            "fecha": "2026-08-20",
            "estado": "Confirmada",
        },
        {
            "id": 4,
            "fecha": "2026-09-01",
            "estado": "Confirmada",
        },
    ]

    fecha_inicio = date(2026, 8, 1)
    fecha_fin = date(2026, 8, 31)

    with patch(
        "app.services.reporte_service.ReporteHttpClient.get_reservas",
        new_callable=AsyncMock,
        return_value=reservas,
    ) as mock_reservas:

        # Act
        resultado = await ReporteService.reservas_por_periodo(
            token,
            fecha_inicio,
            fecha_fin,
        )

    # Assert
    assert resultado == {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "total_reservas": 3,
    }

    mock_reservas.assert_awaited_once_with(token)


@pytest.mark.asyncio
async def test_reservas_por_periodo_no_cuenta_canceladas():
    # Arrange
    token = "token-admin"

    reservas = [
        {
            "id": 1,
            "fecha": "2026-08-10",
            "estado": "Confirmada",
        },
        {
            "id": 2,
            "fecha": "2026-08-15",
            "estado": "Cancelada",
        },
    ]

    fecha_inicio = date(2026, 8, 1)
    fecha_fin = date(2026, 8, 31)

    with patch(
        "app.services.reporte_service.ReporteHttpClient.get_reservas",
        new_callable=AsyncMock,
        return_value=reservas,
    ):

        # Act
        resultado = await ReporteService.reservas_por_periodo(
            token,
            fecha_inicio,
            fecha_fin,
        )

    # Assert
    assert resultado["total_reservas"] == 1


@pytest.mark.asyncio
async def test_reservas_por_periodo_fecha_invalida():
    # Arrange
    token = "token-admin"

    fecha_inicio = date(2026, 8, 31)
    fecha_fin = date(2026, 8, 1)

    # Act / Assert
    with pytest.raises(
        ValueError,
        match="La fecha de inicio debe ser menor o igual a la fecha de fin",
    ):
        await ReporteService.reservas_por_periodo(
            token,
            fecha_inicio,
            fecha_fin,
        )