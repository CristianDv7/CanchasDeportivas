from datetime import time
from unittest.mock import MagicMock, patch

from app.models.cancha import Cancha
from app.models.horario_atencion import HorarioAtencion
from app.schemas.horario_atencion import (
    HorarioAtencionCreate,
    HorarioAtencionUpdate,
)
from app.services.horario_atencion_service import HorarioAtencionService


def test_create_horario_correctamente():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    horario_repository = MagicMock()

    cancha = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    cancha_repository.get_by_id.return_value = cancha
    horario_repository.get_by_cancha_dia.return_value = []

    horario = HorarioAtencion(
        id=1,
        cancha_id=1,
        dia_semana=1,
        hora_inicio=time(7, 0),
        hora_fin=time(22, 0),
        activo=True,
    )

    horario_repository.create.return_value = horario

    data = HorarioAtencionCreate(
        cancha_id=1,
        dia_semana=1,
        hora_inicio=time(7, 0),
        hora_fin=time(22, 0),
    )

    # Act
    with patch(
        "app.services.horario_atencion_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.horario_atencion_service.HorarioAtencionRepository",
        horario_repository,
    ):
        resultado = HorarioAtencionService.create(
            db,
            data,
        )

    # Assert
    assert resultado.cancha_id == 1
    assert resultado.dia_semana == 1
    assert resultado.hora_inicio == time(7, 0)
    assert resultado.hora_fin == time(22, 0)

    cancha_repository.get_by_id.assert_called_once_with(
        db,
        1,
    )

    horario_repository.get_by_cancha_dia.assert_called_once_with(
        db,
        1,
        1,
    )

    horario_repository.create.assert_called_once_with(
        db,
        resultado,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(resultado)




def test_create_horario_duplicado():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    horario_repository = MagicMock()

    cancha = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    horario_existente = HorarioAtencion(
        id=1,
        cancha_id=1,
        dia_semana=1,
        hora_inicio=time(7, 0),
        hora_fin=time(22, 0),
        activo=True,
    )

    cancha_repository.get_by_id.return_value = cancha
    horario_repository.get_by_cancha_dia.return_value = [
        horario_existente
    ]

    data = HorarioAtencionCreate(
        cancha_id=1,
        dia_semana=1,
        hora_inicio=time(8, 0),
        hora_fin=time(20, 0),
    )

    # Act / Assert
    with patch(
        "app.services.horario_atencion_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.horario_atencion_service.HorarioAtencionRepository",
        horario_repository,
    ):
        try:
            HorarioAtencionService.create(
                db,
                data,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == (
                "La cancha ya tiene un horario configurado para ese día"
            )

    horario_repository.create.assert_not_called()


def test_update_horario_correctamente():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    horario_repository = MagicMock()

    horario = HorarioAtencion(
        id=1,
        cancha_id=1,
        dia_semana=1,
        hora_inicio=time(7, 0),
        hora_fin=time(22, 0),
        activo=True,
    )

    cancha = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    horario_repository.get_by_id.return_value = horario
    cancha_repository.get_by_id.return_value = cancha
    horario_repository.update.return_value = horario

    data = HorarioAtencionUpdate(
        cancha_id=1,
        dia_semana=2,
        hora_inicio=time(8, 0),
        hora_fin=time(21, 0),
    )

    # Act
    with patch(
        "app.services.horario_atencion_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.horario_atencion_service.HorarioAtencionRepository",
        horario_repository,
    ):
        resultado = HorarioAtencionService.update(
            db,
            1,
            data,
        )

    # Assert
    assert resultado is not None
    assert resultado.id == 1
    assert resultado.cancha_id == 1
    assert resultado.dia_semana == 2
    assert resultado.hora_inicio == time(8, 0)
    assert resultado.hora_fin == time(21, 0)

    horario_repository.get_by_id.assert_called_once_with(
        db,
        1,
    )

    cancha_repository.get_by_id.assert_called_once_with(
        db,
        1,
    )

    horario_repository.update.assert_called_once_with(
        db,
        resultado,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(resultado)


def test_update_horario_no_encontrado():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    horario_repository = MagicMock()

    horario_repository.get_by_id.return_value = None

    data = HorarioAtencionUpdate(
        hora_inicio=time(8, 0),
        hora_fin=time(20, 0),
    )

    # Act
    with patch(
        "app.services.horario_atencion_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.horario_atencion_service.HorarioAtencionRepository",
        horario_repository,
    ):
        resultado = HorarioAtencionService.update(
            db,
            999,
            data,
        )

    # Assert
    assert resultado is None

    horario_repository.get_by_id.assert_called_once_with(
        db,
        999,
    )

    cancha_repository.get_by_id.assert_not_called()
    horario_repository.update.assert_not_called()


def test_update_horario_cancha_inexistente():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    horario_repository = MagicMock()

    horario = HorarioAtencion(
        id=1,
        cancha_id=1,
        dia_semana=1,
        hora_inicio=time(7, 0),
        hora_fin=time(22, 0),
        activo=True,
    )

    horario_repository.get_by_id.return_value = horario
    cancha_repository.get_by_id.return_value = None

    data = HorarioAtencionUpdate(
        cancha_id=999,
    )

    # Act / Assert
    with patch(
        "app.services.horario_atencion_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.horario_atencion_service.HorarioAtencionRepository",
        horario_repository,
    ):
        try:
            HorarioAtencionService.update(
                db,
                1,
                data,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == "La cancha especificada no existe"

    horario_repository.update.assert_not_called()


def test_update_horario_dia_invalido():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    horario_repository = MagicMock()

    horario = HorarioAtencion(
        id=1,
        cancha_id=1,
        dia_semana=1,
        hora_inicio=time(7, 0),
        hora_fin=time(22, 0),
        activo=True,
    )

    cancha = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    horario_repository.get_by_id.return_value = horario
    cancha_repository.get_by_id.return_value = cancha

    data = MagicMock()
    data.cancha_id = None
    data.dia_semana = 8
    data.hora_inicio = None
    data.hora_fin = None

    # Act / Assert
    with patch(
        "app.services.horario_atencion_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.horario_atencion_service.HorarioAtencionRepository",
        horario_repository,
    ):
        try:
            HorarioAtencionService.update(
                db,
                1,
                data,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == (
                "El día de la semana debe estar entre 1 y 7"
            )

    horario_repository.update.assert_not_called()

def test_update_horario_hora_invalida():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    horario_repository = MagicMock()

    horario = HorarioAtencion(
        id=1,
        cancha_id=1,
        dia_semana=1,
        hora_inicio=time(7, 0),
        hora_fin=time(22, 0),
        activo=True,
    )

    cancha = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    horario_repository.get_by_id.return_value = horario
    cancha_repository.get_by_id.return_value = cancha

    data = MagicMock()
    data.cancha_id = None
    data.dia_semana = None
    data.hora_inicio = time(22, 0)
    data.hora_fin = time(7, 0)

    # Act / Assert
    with patch(
        "app.services.horario_atencion_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.horario_atencion_service.HorarioAtencionRepository",
        horario_repository,
    ):
        try:
            HorarioAtencionService.update(
                db,
                1,
                data,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == (
                "La hora de inicio debe ser menor que la hora de fin"
            )

    horario_repository.update.assert_not_called()