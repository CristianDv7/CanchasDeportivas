from unittest.mock import MagicMock

from app.models.role import Role
from app.models.usuario import Usuario
from app.services.usuario_service import UsuarioService


def test_create_usuario_correctamente():
    # Arrange
    db = MagicMock()

    usuario_repository = MagicMock()
    role_repository = MagicMock()

    usuario_repository.get_by_email.return_value = None

    role = Role(
        id=1,
        nombre="usuario",
        descripcion="Usuario final del sistema",
    )

    role_repository.get_by_id.return_value = role

    # El repository devuelve el mismo Usuario que recibe
    usuario_repository.create.side_effect = lambda usuario: usuario

    service = UsuarioService(db)

    # Reemplazamos los repositories reales por mocks
    service.usuario_repository = usuario_repository
    service.role_repository = role_repository

    # Act
    usuario = service.create_usuario(
        nombre="Juan",
        apellido="Perez",
        email="juan@test.com",
        telefono="0999999999",
        rol_id=1,
        password="123456",
    )

    # Assert
    assert usuario.nombre == "Juan"
    assert usuario.apellido == "Perez"
    assert usuario.email == "juan@test.com"
    assert usuario.telefono == "0999999999"
    assert usuario.rol_id == 1
    assert usuario.activo is True

    usuario_repository.get_by_email.assert_called_once_with(
        "juan@test.com"
    )

    role_repository.get_by_id.assert_called_once_with(1)

    usuario_repository.create.assert_called_once()

def test_create_usuario_email_duplicado():
    # Arrange
    db = MagicMock()

    usuario_repository = MagicMock()
    role_repository = MagicMock()

    usuario_existente = Usuario(
        id=1,
        nombre="Juan",
        apellido="Perez",
        email="juan@test.com",
        rol_id=1,
        activo=True,
    )

    usuario_repository.get_by_email.return_value = usuario_existente

    service = UsuarioService(db)

    service.usuario_repository = usuario_repository
    service.role_repository = role_repository

    # Act / Assert
    try:
        service.create_usuario(
            nombre="Otro",
            apellido="Usuario",
            email="juan@test.com",
            telefono=None,
            rol_id=1,
            password="123456",
        )

        assert False, "Se esperaba un ValueError"

    except ValueError as error:
        assert str(error) == "El email ya está registrado"
    
def test_create_usuario_rol_inexistente():
    # Arrange
    db = MagicMock()

    usuario_repository = MagicMock()
    role_repository = MagicMock()

    usuario_repository.get_by_email.return_value = None
    role_repository.get_by_id.return_value = None

    service = UsuarioService(db)

    service.usuario_repository = usuario_repository
    service.role_repository = role_repository

    # Act / Assert
    try:
        service.create_usuario(
            nombre="Juan",
            apellido="Perez",
            email="juan@test.com",
            telefono=None,
            rol_id=999,
            password="123456",
        )

        assert False, "Se esperaba un ValueError"

    except ValueError as error:
        assert str(error) == "El rol no existe"