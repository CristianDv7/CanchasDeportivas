from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.usuario import Usuario
from app.models.credencial import Credencial
from app.repositories.usuario_repository import UsuarioRepository
from app.repositories.role_repository import RoleRepository


class UsuarioService:

    def __init__(self, db: Session):
        self.usuario_repository = UsuarioRepository(db)
        self.role_repository = RoleRepository(db)

    def get_usuario(self, usuario_id: int) -> Usuario | None:
        return self.usuario_repository.get_by_id(usuario_id)

    def get_usuario_by_email(self, email: str) -> Usuario | None:
        return self.usuario_repository.get_by_email(email)

    def get_usuarios(self) -> list[Usuario]:
        return self.usuario_repository.get_all()

    def create_usuario(
        self,
        nombre: str,
        apellido: str,
        email: str,
        telefono: str | None,
        rol_id: int,
        password: str,
    ) -> Usuario:

        usuario_existente = self.usuario_repository.get_by_email(email)

        if usuario_existente:
            raise ValueError("El email ya está registrado")

        rol = self.role_repository.get_by_id(rol_id)

        if not rol:
            raise ValueError("El rol no existe")

        now = datetime.now(timezone.utc)

        usuario = Usuario(
            nombre=nombre,
            apellido=apellido,
            email=email,
            telefono=telefono,
            rol_id=rol_id,
            activo=True,
            created_at=now,
            updated_at=now,
        )

        credencial = Credencial(
            password_hash=password,
            usuario=usuario,
            created_at=now,
            updated_at=now,
        )

        usuario.credencial = credencial

        return self.usuario_repository.create(usuario)

    def login(
        self,
        email: str,
        password: str,
    ) -> Usuario | None:

        usuario = self.usuario_repository.get_by_email(email)

        if not usuario:
            return None

        if not usuario.activo:
            return None

        credencial = self.usuario_repository.get_credencial_by_usuario_id(
            usuario.id
        )

        if not credencial:
            return None

        if credencial.password_hash != password:
            return None

        return usuario