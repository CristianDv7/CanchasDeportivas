from unittest.mock import MagicMock, patch

from app.models.deporte import Deporte
from app.schemas.deporte import DeporteCreate, DeporteUpdate
from app.services.deporte_service import DeporteService


def test_create_deporte_correctamente():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    repository.get_by_nombre.return_value = None

    deporte = Deporte(
        id=1,
        nombre="Pádel",
        descripcion="Deporte de raqueta",
        activo=True,
    )

    repository.create.return_value = deporte

    data = DeporteCreate(
        nombre="Pádel",
        descripcion="Deporte de raqueta",
    )

    # Act
    with patch(
        "app.services.deporte_service.DeporteRepository",
        repository,
    ):
        resultado = DeporteService.create(
            db,
            data,
        )

    # Assert
    assert resultado.nombre == "Pádel"
    assert resultado.descripcion == "Deporte de raqueta"

    repository.get_by_nombre.assert_called_once_with(
        db,
        "Pádel",
    )

    repository.create.assert_called_once_with(
        db,
        resultado,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(resultado)

def test_create_deporte_nombre_duplicado():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    deporte_existente = Deporte(
        id=1,
        nombre="Pádel",
        descripcion="Deporte existente",
        activo=True,
    )

    repository.get_by_nombre.return_value = deporte_existente

    data = DeporteCreate(
        nombre="Pádel",
        descripcion="Otro deporte",
    )

    # Act / Assert
    with patch(
        "app.services.deporte_service.DeporteRepository",
        repository,
    ):
        try:
            DeporteService.create(
                db,
                data,
            )
            assert False, "Se esperaba un ValueError"
        except ValueError as error:
            assert str(error) == "Ya existe un deporte con ese nombre"

    repository.get_by_nombre.assert_called_once_with(
        db,
        "Pádel",
    )

    repository.create.assert_not_called()


def test_update_deporte_correctamente():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    deporte = Deporte(
        id=1,
        nombre="Pádel",
        descripcion="Descripción anterior",
        activo=True,
    )

    repository.get_by_id.return_value = deporte
    repository.get_by_nombre.return_value = None
    repository.update.return_value = deporte

    data = DeporteUpdate(
        nombre="Pádel profesional",
        descripcion="Nueva descripción",
        activo=True,
    )

    # Act
    with patch(
        "app.services.deporte_service.DeporteRepository",
        repository,
    ):
        resultado = DeporteService.update(
            db,
            1,
            data,
        )

    # Assert
    assert resultado is not None
    assert resultado.id == 1
    assert resultado.nombre == "Pádel profesional"
    assert resultado.descripcion == "Nueva descripción"
    assert resultado.activo is True

    repository.get_by_id.assert_called_once_with(
        db,
        1,
    )

    repository.get_by_nombre.assert_called_once_with(
        db,
        "Pádel profesional",
    )

    repository.update.assert_called_once_with(
        db,
        resultado,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(resultado)

def test_update_deporte_no_encontrado():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    repository.get_by_id.return_value = None

    data = DeporteUpdate(
        nombre="Pádel",
    )

    # Act
    with patch(
        "app.services.deporte_service.DeporteRepository",
        repository,
    ):
        resultado = DeporteService.update(
            db,
            999,
            data,
        )

    # Assert
    assert resultado is None

    repository.get_by_id.assert_called_once_with(
        db,
        999,
    )

    repository.update.assert_not_called()

def test_update_deporte_nombre_duplicado():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    deporte_actual = Deporte(
        id=1,
        nombre="Pádel",
        descripcion="Deporte",
        activo=True,
    )

    otro_deporte = Deporte(
        id=2,
        nombre="Tenis",
        descripcion="Otro deporte",
        activo=True,
    )

    repository.get_by_id.return_value = deporte_actual
    repository.get_by_nombre.return_value = otro_deporte

    data = DeporteUpdate(
        nombre="Tenis",
    )

    # Act / Assert
    with patch(
        "app.services.deporte_service.DeporteRepository",
        repository,
    ):
        try:
            DeporteService.update(
                db,
                1,
                data,
            )
            assert False, "Se esperaba un ValueError"
        except ValueError as error:
            assert str(error) == "Ya existe un deporte con ese nombre"

    repository.update.assert_not_called()