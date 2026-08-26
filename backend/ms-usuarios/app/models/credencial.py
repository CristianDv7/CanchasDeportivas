from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.usuario import Usuario


class Credencial(Base):
    __tablename__ = "credenciales"
    __table_args__ = {"schema": "usuarios"}

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    usuario_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "usuarios.usuarios.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        unique=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP")
    )

    # Relación con Usuario
    usuario: Mapped["Usuario"] = relationship(
        "Usuario",
        back_populates="credencial"
    )