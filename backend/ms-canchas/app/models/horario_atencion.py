from datetime import time
from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    SmallInteger,
    Time,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.cancha import Cancha


class HorarioAtencion(Base):
    __tablename__ = "horarios_atencion"

    __table_args__ = (
        CheckConstraint(
            "dia_semana BETWEEN 1 AND 7",
            name="chk_dia_semana",
        ),
        CheckConstraint(
            "hora_inicio < hora_fin",
            name="chk_horario_valido",
        ),
        UniqueConstraint(
            "cancha_id",
            "dia_semana",
            name="uq_horario_cancha_dia",
        ),
        {
            "schema": "canchas",
        },
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    cancha_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey(
            "canchas.canchas.id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )

    dia_semana: Mapped[int] = mapped_column(
        SmallInteger,
        nullable=False,
    )

    hora_inicio: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    hora_fin: Mapped[time] = mapped_column(
        Time,
        nullable=False,
    )

    activo: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    cancha: Mapped["Cancha"] = relationship(
        "Cancha",
        back_populates="horarios",
    )