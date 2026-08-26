from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.deporte import Deporte
    from app.models.horario_atencion import HorarioAtencion


class Cancha(Base):
    __tablename__ = "canchas"
    __table_args__ = {"schema": "canchas"}

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    nombre: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    deporte_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "canchas.deportes.id",
            name="fk_cancha_deporte",
        ),
        nullable=False,
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    deporte: Mapped["Deporte"] = relationship(
        "Deporte",
        back_populates="canchas",
    )

    horarios: Mapped[list["HorarioAtencion"]] = relationship(
        "HorarioAtencion",
        back_populates="cancha",
        cascade="all, delete-orphan",
    )