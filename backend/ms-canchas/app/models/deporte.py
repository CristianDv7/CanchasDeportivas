from sqlalchemy import BigInteger, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.cancha import Cancha

class Deporte(Base):
    __tablename__ = "deportes"
    __table_args__ = {"schema": "canchas"}

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    nombre: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )

    descripcion: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    canchas: Mapped[list["Cancha"]] = relationship(
        "Cancha",
        back_populates="deporte",
    )