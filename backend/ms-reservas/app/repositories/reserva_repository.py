from datetime import date, time

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.models.reserva import Reserva


class ReservaRepository:

    @staticmethod
    def get_all(db: Session) -> list[Reserva]:
        statement = select(Reserva).order_by(
            Reserva.fecha,
            Reserva.hora_inicio,
        )

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def get_by_id(
        db: Session,
        reserva_id: int,
    ) -> Reserva | None:

        statement = select(Reserva).where(
            Reserva.id == reserva_id
        )

        return db.scalar(statement)

    @staticmethod
    def get_by_usuario(
        db: Session,
        usuario_id: int,
    ) -> list[Reserva]:

        statement = (
            select(Reserva)
            .where(
                Reserva.usuario_id == usuario_id
            )
            .order_by(
                Reserva.fecha,
                Reserva.hora_inicio,
            )
        )

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def get_reservas_activas_usuario(
        db: Session,
        usuario_id: int,
    ) -> list[Reserva]:

        statement = (
            select(Reserva)
            .where(
                Reserva.usuario_id == usuario_id,
                Reserva.estado == "Confirmada",
            )
            .order_by(
                Reserva.fecha,
                Reserva.hora_inicio,
            )
        )

        return list(
            db.scalars(statement).all()
        )

    @staticmethod
    def get_reserva_solapada(
        db: Session,
        cancha_id: int,
        fecha: date,
        hora_inicio: time,
        hora_fin: time,
    ) -> Reserva | None:

        statement = select(Reserva).where(
            Reserva.cancha_id == cancha_id,
            Reserva.fecha == fecha,
            Reserva.estado == "Confirmada",
            Reserva.hora_inicio < hora_fin,
            Reserva.hora_fin > hora_inicio,
        )

        return db.scalar(statement)

    @staticmethod
    def create(
        db: Session,
        reserva: Reserva,
    ) -> Reserva:

        db.add(reserva)
        db.flush()

        return reserva

    @staticmethod
    def update(
        db: Session,
        reserva: Reserva,
    ) -> Reserva:

        db.add(reserva)
        db.flush()

        return reserva

    @staticmethod
    def get_reservas_por_cancha_fecha(
        db: Session,
        cancha_id: int,
        fecha: date,
    ) -> list[Reserva]:

        statement = (
            select(Reserva)
            .where(
                Reserva.cancha_id == cancha_id,
                Reserva.fecha == fecha,
                Reserva.estado == "Confirmada",
            )
            .order_by(
                Reserva.hora_inicio,
            )
        )

        return list(
            db.scalars(statement).all()
        )