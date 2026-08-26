from datetime import date, time, timedelta
from unittest.mock import MagicMock, patch

from app.models.reserva import Reserva
from app.schemas.reserva import ReservaCreate
from app.services.reserva_service import ReservaService


def crear_data_reserva(
    usuario_id=1,
    cancha_id=1,
    fecha=None,
    hora_inicio=time(10, 0),
    hora_fin=time(11, 0),
):
    return ReservaCreate(
        usuario_id=usuario_id,
        cancha_id=cancha_id,
        fecha=fecha or date.today() + timedelta(days=1),
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
    )


def crear_reserva(
    id=1,
    usuario_id=1,
    cancha_id=1,
    fecha=None,
    hora_inicio=time(10, 0),
    hora_fin=time(11, 0),
    estado="Confirmada",
):
    return Reserva(
        id=id,
        usuario_id=usuario_id,
        cancha_id=cancha_id,
        fecha=fecha or date.today() + timedelta(days=1),
        hora_inicio=hora_inicio,
        hora_fin=hora_fin,
        estado=estado,
    )


def test_create_reserva_correctamente():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    repository.get_reservas_activas_usuario.return_value = []
    repository.get_reserva_solapada.return_value = None

    data = crear_data_reserva()

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act
        resultado = ReservaService.create(db, data)

    # Assert
    assert resultado.usuario_id == 1
    assert resultado.cancha_id == 1
    assert resultado.fecha == data.fecha
    assert resultado.hora_inicio == time(10, 0)
    assert resultado.hora_fin == time(11, 0)
    assert resultado.estado == "Confirmada"

    repository.get_reservas_activas_usuario.assert_called_once_with(
        db,
        1,
    )

    repository.get_reserva_solapada.assert_called_once_with(
        db,
        cancha_id=1,
        fecha=data.fecha,
        hora_inicio=time(10, 0),
        hora_fin=time(11, 0),
    )

    repository.create.assert_called_once()

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(resultado)


def test_create_reserva_limite_tres_reservas_activas():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    reservas_activas = [
        crear_reserva(id=1),
        crear_reserva(id=2),
        crear_reserva(id=3),
    ]

    repository.get_reservas_activas_usuario.return_value = reservas_activas

    data = crear_data_reserva()

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act / Assert
        try:
            ReservaService.create(db, data)

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == (
                "El usuario ha alcanzado el límite "
                "de reservas activas"
            )

    repository.get_reservas_activas_usuario.assert_called_once_with(
        db,
        1,
    )

    repository.get_reserva_solapada.assert_not_called()
    repository.create.assert_not_called()


def test_create_reserva_horario_solapado():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    repository.get_reservas_activas_usuario.return_value = []

    reserva_existente = crear_reserva(
        id=10,
        usuario_id=2,
        cancha_id=1,
    )

    repository.get_reserva_solapada.return_value = reserva_existente

    data = crear_data_reserva()

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act / Assert
        try:
            ReservaService.create(db, data)

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == (
                "La cancha ya está reservada en ese horario"
            )

    repository.create.assert_not_called()
    db.commit.assert_not_called()


def test_cancelar_reserva_propia_correctamente():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    reserva = crear_reserva(
        id=1,
        usuario_id=1,
    )

    repository.get_by_id.return_value = reserva

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act
        resultado = ReservaService.cancelar(
            db=db,
            reserva_id=1,
            usuario_id=1,
            es_administrador=False,
        )

    # Assert
    assert resultado.estado == "Cancelada"

    repository.get_by_id.assert_called_once_with(
        db,
        1,
    )

    repository.update.assert_called_once_with(
        db,
        reserva,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(reserva)


def test_usuario_no_puede_cancelar_reserva_de_otro_usuario():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    reserva = crear_reserva(
        id=1,
        usuario_id=1,
    )

    repository.get_by_id.return_value = reserva

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act / Assert
        try:
            ReservaService.cancelar(
                db=db,
                reserva_id=1,
                usuario_id=2,
                es_administrador=False,
            )

            assert False, "Se esperaba un PermissionError"

        except PermissionError as error:
            assert str(error) == (
                "No puede cancelar una reserva de otro usuario"
            )

    repository.update.assert_not_called()
    db.commit.assert_not_called()


def test_administrador_puede_cancelar_reserva_de_otro_usuario():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    reserva = crear_reserva(
        id=1,
        usuario_id=1,
    )

    repository.get_by_id.return_value = reserva

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act
        resultado = ReservaService.cancelar(
            db=db,
            reserva_id=1,
            usuario_id=999,
            es_administrador=True,
        )

    # Assert
    assert resultado.estado == "Cancelada"

    repository.update.assert_called_once_with(
        db,
        reserva,
    )

    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(reserva)


def test_no_se_puede_cancelar_reserva_ya_cancelada():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    reserva = crear_reserva(
        id=1,
        usuario_id=1,
        estado="Cancelada",
    )

    repository.get_by_id.return_value = reserva

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act / Assert
        try:
            ReservaService.cancelar(
                db=db,
                reserva_id=1,
                usuario_id=1,
                es_administrador=False,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == (
                "La reserva ya está cancelada"
            )

    repository.update.assert_not_called()
    db.commit.assert_not_called()


def test_no_se_puede_cancelar_reserva_que_ya_inicio():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    reserva = Reserva(
        id=1,
        usuario_id=1,
        cancha_id=1,
        fecha=date.today(),
        hora_inicio=time(8, 0),
        hora_fin=time(9, 0),
        estado="Confirmada",
    )

    repository.get_by_id.return_value = reserva

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act / Assert
        try:
            ReservaService.cancelar(
                db=db,
                reserva_id=1,
                usuario_id=1,
                es_administrador=False,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == (
                "No se puede cancelar una reserva que ya inició"
            )

    repository.update.assert_not_called()
    db.commit.assert_not_called()


def test_cancelar_reserva_inexistente():
    # Arrange
    db = MagicMock()
    repository = MagicMock()

    repository.get_by_id.return_value = None

    with patch(
        "app.services.reserva_service.ReservaRepository",
        repository,
    ):
        # Act / Assert
        try:
            ReservaService.cancelar(
                db=db,
                reserva_id=999,
                usuario_id=1,
                es_administrador=False,
            )

            assert False, "Se esperaba un ValueError"

        except ValueError as error:
            assert str(error) == "La reserva no existe"

    repository.update.assert_not_called()
    db.commit.assert_not_called()