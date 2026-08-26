from datetime import date, datetime, time

from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Date,
    DateTime,
    Index,
    String,
    Time,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Reserva(Base):
    __tablename__ = "reservas"

    __table_args__ = (
        CheckConstraint(
            "estado IN ('Confirmada', 'Cancelada', 'Finalizada')",
            name="ck_reserva_estado",
        ),
        CheckConstraint(
            "hora_inicio < hora_fin",
            name="ck_reserva_hora",
        ),
        Index(
            "uq_reserva_cancha_fecha_hora",
            "cancha_id",
            "fecha",
            "hora_inicio",
            "hora_fin",
            unique=True,
            postgresql_where=text(
                "estado = 'Confirmada'"
            ),
        ),
        {
            "schema": "reservas",
        },
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    usuario_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    cancha_id: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    fecha: Mapped[date] = mapped_column(
        Date,
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

    estado: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Confirmada",
        server_default=text("'Confirmada'"),
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