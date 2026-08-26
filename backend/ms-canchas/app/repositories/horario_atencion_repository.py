from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.horario_atencion import HorarioAtencion


class HorarioAtencionRepository:

    @staticmethod
    def get_all(
        db: Session,
        cancha_id: int | None = None,
    ) -> list[HorarioAtencion]:

        stmt = select(HorarioAtencion)

        if cancha_id is not None:
            stmt = stmt.where(
                HorarioAtencion.cancha_id == cancha_id
            )

        stmt = stmt.order_by(
            HorarioAtencion.dia_semana,
            HorarioAtencion.hora_inicio,
        )

        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(
        db: Session,
        horario_id: int,
    ) -> HorarioAtencion | None:

        stmt = select(HorarioAtencion).where(
            HorarioAtencion.id == horario_id
        )

        return db.scalar(stmt)

    @staticmethod
    def get_by_cancha_dia(
        db: Session,
        cancha_id: int,
        dia_semana: int,
    ) -> list[HorarioAtencion]:

        stmt = (
            select(HorarioAtencion)
            .where(
                HorarioAtencion.cancha_id == cancha_id,
                HorarioAtencion.dia_semana == dia_semana,
            )
            .order_by(
                HorarioAtencion.hora_inicio
            )
        )

        return list(db.scalars(stmt).all())

    @staticmethod
    def create(
        db: Session,
        horario: HorarioAtencion,
    ) -> HorarioAtencion:

        db.add(horario)
        db.flush()
        db.refresh(horario)

        return horario

    @staticmethod
    def update(
        db: Session,
        horario: HorarioAtencion,
    ) -> HorarioAtencion:

        db.flush()
        db.refresh(horario)

        return horario

    @staticmethod
    def delete(
        db: Session,
        horario: HorarioAtencion,
    ) -> None:

        db.delete(horario)
        db.flush()