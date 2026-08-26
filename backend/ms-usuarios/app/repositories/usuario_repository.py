from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.credencial import Credencial
from app.models.usuario import Usuario


class UsuarioRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, usuario_id: int) -> Usuario | None:
        statement = select(Usuario).where(Usuario.id == usuario_id)

        return self.db.scalar(statement)

    def get_by_email(self, email: str) -> Usuario | None:
        statement = select(Usuario).where(Usuario.email == email)

        return self.db.scalar(statement)

    def get_all(self) -> list[Usuario]:
        statement = select(Usuario).order_by(Usuario.id)

        return list(self.db.scalars(statement).all())

    def create(self, usuario: Usuario) -> Usuario:
        self.db.add(usuario)
        self.db.commit()
        self.db.refresh(usuario)

        return usuario

    def delete(self, usuario: Usuario) -> None:
        self.db.delete(usuario)
        self.db.commit()

    def get_credencial_by_usuario_id(
        self,
        usuario_id: int
    ) -> Credencial | None:

        statement = select(Credencial).where(
            Credencial.usuario_id == usuario_id
        )

        return self.db.scalar(statement)