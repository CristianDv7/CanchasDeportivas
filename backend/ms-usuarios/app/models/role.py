from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.usuario import Usuario


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "usuarios"}

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    nombre: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True
    )

    descripcion: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    usuarios: Mapped[list["Usuario"]] = relationship(
        "Usuario",
        back_populates="rol"
    )