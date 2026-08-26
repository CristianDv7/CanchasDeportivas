from unittest.mock import MagicMock, patch

from app.models.cancha import Cancha
from app.models.deporte import Deporte
from app.schemas.cancha import CanchaCreate, CanchaUpdate
from app.services.cancha_service import CanchaService

def test_create_cancha_correctamente():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    deporte_repository = MagicMock()

    deporte = Deporte(
        id=1,
        nombre="Pádel",
        descripcion="Deporte de raqueta",
        activo=True,
    )

    deporte_repository.get_by_id.return_value = deporte
    cancha_repository.get_by_nombre.return_value = None

    def fake_create(db, cancha):
        cancha.id = 1
        cancha.activo = True
        return cancha

    cancha_repository.create.side_effect = fake_create

    data = CanchaCreate(
        nombre="Cancha Pádel 1",
        deporte_id=1,
    )

    # Act
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.cancha_service.DeporteRepository",
        deporte_repository,
    ):
        resultado = CanchaService.create(
            db,
            data,
        )

    # Assert
    assert resultado.nombre == "Cancha Pádel 1"
    assert resultado.deporte_id == 1
    assert resultado.activo is True

    deporte_repository.get_by_id.assert_called_once_with(
        db,
        1,
    )

    cancha_repository.get_by_nombre.assert_called_once_with(
        db,
        "Cancha Pádel 1",
    )

    cancha_repository.create.assert_called_once_with(
        db,
        resultado,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(resultado)


def test_create_cancha_deporte_inexistente():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    deporte_repository = MagicMock()

    deporte_repository.get_by_id.return_value = None

    data = CanchaCreate(
        nombre="Cancha Nueva",
        deporte_id=999,
    )

    # Act / Assert
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.cancha_service.DeporteRepository",
        deporte_repository,
    ):
        try:
            CanchaService.create(
                db,
                data,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == "El deporte especificado no existe"

    deporte_repository.get_by_id.assert_called_once_with(
        db,
        999,
    )

    cancha_repository.get_by_nombre.assert_not_called()
    cancha_repository.create.assert_not_called()


def test_create_cancha_nombre_duplicado():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    deporte_repository = MagicMock()

    deporte = Deporte(
        id=1,
        nombre="Pádel",
        descripcion="Deporte",
        activo=True,
    )

    cancha_existente = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    deporte_repository.get_by_id.return_value = deporte
    cancha_repository.get_by_nombre.return_value = cancha_existente

    data = CanchaCreate(
        nombre="Cancha Pádel 1",
        deporte_id=1,
    )

    # Act / Assert
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.cancha_service.DeporteRepository",
        deporte_repository,
    ):
        try:
            CanchaService.create(
                db,
                data,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == "Ya existe una cancha con ese nombre"

    cancha_repository.get_by_nombre.assert_called_once_with(
        db,
        "Cancha Pádel 1",
    )

    cancha_repository.create.assert_not_called()


def test_update_cancha_correctamente():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    deporte_repository = MagicMock()

    cancha = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    nuevo_deporte = Deporte(
        id=2,
        nombre="Tenis",
        descripcion="Deporte de raqueta",
        activo=True,
    )

    cancha_repository.get_by_id.return_value = cancha
    deporte_repository.get_by_id.return_value = nuevo_deporte
    cancha_repository.get_by_nombre.return_value = None
    cancha_repository.update.return_value = cancha

    data = CanchaUpdate(
        nombre="Cancha Tenis 1",
        deporte_id=2,
        activo=True,
    )

    # Act
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.cancha_service.DeporteRepository",
        deporte_repository,
    ):
        resultado = CanchaService.update(
            db,
            1,
            data,
        )

    # Assert
    assert resultado is not None
    assert resultado.id == 1
    assert resultado.nombre == "Cancha Tenis 1"
    assert resultado.deporte_id == 2
    assert resultado.activo is True

    cancha_repository.get_by_id.assert_called_once_with(
        db,
        1,
    )

    deporte_repository.get_by_id.assert_called_once_with(
        db,
        2,
    )

    cancha_repository.get_by_nombre.assert_called_once_with(
        db,
        "Cancha Tenis 1",
    )

    cancha_repository.update.assert_called_once_with(
        db,
        resultado,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(resultado)


def test_update_cancha_no_encontrada():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    deporte_repository = MagicMock()

    cancha_repository.get_by_id.return_value = None

    data = CanchaUpdate(
        nombre="Cancha Nueva",
    )

    # Act
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.cancha_service.DeporteRepository",
        deporte_repository,
    ):
        resultado = CanchaService.update(
            db,
            999,
            data,
        )

    # Assert
    assert resultado is None

    cancha_repository.get_by_id.assert_called_once_with(
        db,
        999,
    )

    deporte_repository.get_by_id.assert_not_called()
    cancha_repository.update.assert_not_called()


def test_update_cancha_deporte_inexistente():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    deporte_repository = MagicMock()

    cancha = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    cancha_repository.get_by_id.return_value = cancha
    deporte_repository.get_by_id.return_value = None

    data = CanchaUpdate(
        deporte_id=999,
    )

    # Act / Assert
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.cancha_service.DeporteRepository",
        deporte_repository,
    ):
        try:
            CanchaService.update(
                db,
                1,
                data,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == "El deporte especificado no existe"

    deporte_repository.get_by_id.assert_called_once_with(
        db,
        999,
    )

    cancha_repository.update.assert_not_called()


def test_update_cancha_nombre_duplicado():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()
    deporte_repository = MagicMock()

    cancha_actual = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    otra_cancha = Cancha(
        id=2,
        nombre="Cancha Tenis 1",
        deporte_id=2,
        activo=True,
    )

    cancha_repository.get_by_id.return_value = cancha_actual
    cancha_repository.get_by_nombre.return_value = otra_cancha

    data = CanchaUpdate(
        nombre="Cancha Tenis 1",
    )

    # Act / Assert
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ), patch(
        "app.services.cancha_service.DeporteRepository",
        deporte_repository,
    ):
        try:
            CanchaService.update(
                db,
                1,
                data,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == "Ya existe una cancha con ese nombre"

    cancha_repository.update.assert_not_called()


def test_inactivar_cancha_correctamente():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()

    cancha = Cancha(
        id=1,
        nombre="Cancha Pádel 1",
        deporte_id=1,
        activo=True,
    )

    cancha_repository.get_by_id.return_value = cancha
    cancha_repository.update.return_value = cancha

    # Act
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ):
        resultado = CanchaService.inactivar(
            db,
            1,
        )

    # Assert
    assert resultado is not None
    assert resultado.id == 1
    assert resultado.activo is False

    cancha_repository.get_by_id.assert_called_once_with(
        db,
        1,
    )

    cancha_repository.update.assert_called_once_with(
        db,
        resultado,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(resultado)


def test_inactivar_cancha_no_encontrada():
    # Arrange
    db = MagicMock()

    cancha_repository = MagicMock()

    cancha_repository.get_by_id.return_value = None

    # Act
    with patch(
        "app.services.cancha_service.CanchaRepository",
        cancha_repository,
    ):
        resultado = CanchaService.inactivar(
            db,
            999,
        )

    # Assert
    assert resultado is None

    cancha_repository.get_by_id.assert_called_once_with(
        db,
        999,
    )

    cancha_repository.update.assert_not_called()