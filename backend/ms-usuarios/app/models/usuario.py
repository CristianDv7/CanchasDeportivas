from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.credencial import Credencial
    from app.models.role import Role

class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {"schema": "usuarios"}

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True
    )

    nombre: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    apellido: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True
    )

    telefono: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    rol_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("usuarios.roles.id"),
        nullable=False
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
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

    # Relaciones

    rol: Mapped["Role"] = relationship(
        "Role",
        back_populates="usuarios"
    )
    credencial: Mapped["Credencial"] = relationship(
        "Credencial",
        back_populates="usuario",
        uselist=False,
        cascade="all, delete-orphan"
    )