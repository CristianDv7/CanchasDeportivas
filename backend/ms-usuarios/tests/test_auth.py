from unittest.mock import MagicMock

from app.models.credencial import Credencial
from app.models.role import Role
from app.models.usuario import Usuario
from app.services.usuario_service import UsuarioService


def crear_service():
    db = MagicMock()

    usuario_repository = MagicMock()
    role_repository = MagicMock()

    service = UsuarioService(db)

    service.usuario_repository = usuario_repository
    service.role_repository = role_repository

    return service, usuario_repository, role_repository

def test_login_correcto():
    service, usuario_repository, _ = crear_service()

    role = Role(
        id=1,
        nombre="usuario",
        descripcion="Usuario final",
    )

    usuario = Usuario(
        id=1,
        nombre="Cristian",
        apellido="Jimenez",
        email="cristian@test.com",
        telefono="0999999999",
        rol_id=1,
        activo=True,
    )

    usuario.rol = role

    credencial = Credencial(
        id=1,
        usuario_id=1,
        password_hash="123456",
    )

    usuario_repository.get_by_email.return_value = usuario
    usuario_repository.get_credencial_by_usuario_id.return_value = credencial

    resultado = service.login(
        email="cristian@test.com",
        password="123456",
    )

    assert resultado is usuario

    usuario_repository.get_by_email.assert_called_once_with(
        "cristian@test.com"
    )

    usuario_repository.get_credencial_by_usuario_id.assert_called_once_with(
        1
    )

def test_login_password_incorrecto():
    service, usuario_repository, _ = crear_service()

    usuario = Usuario(
        id=1,
        nombre="Cristian",
        apellido="Jimenez",
        email="cristian@test.com",
        telefono="0999999999",
        rol_id=1,
        activo=True,
    )

    credencial = Credencial(
        id=1,
        usuario_id=1,
        password_hash="123456",
    )

    usuario_repository.get_by_email.return_value = usuario
    usuario_repository.get_credencial_by_usuario_id.return_value = credencial

    resultado = service.login(
        email="cristian@test.com",
        password="incorrecta",
    )

    assert resultado is None

def test_login_usuario_inexistente():
    service, usuario_repository, _ = crear_service()

    usuario_repository.get_by_email.return_value = None

    resultado = service.login(
        email="noexiste@test.com",
        password="123456",
    )

    assert resultado is None

    usuario_repository.get_credencial_by_usuario_id.assert_not_called()

def test_login_usuario_inactivo():
    service, usuario_repository, _ = crear_service()

    usuario = Usuario(
        id=1,
        nombre="Cristian",
        apellido="Jimenez",
        email="cristian@test.com",
        telefono="0999999999",
        rol_id=1,
        activo=False,
    )

    usuario_repository.get_by_email.return_value = usuario

    resultado = service.login(
        email="cristian@test.com",
        password="123456",
    )

    assert resultado is None

    usuario_repository.get_credencial_by_usuario_id.assert_not_called()