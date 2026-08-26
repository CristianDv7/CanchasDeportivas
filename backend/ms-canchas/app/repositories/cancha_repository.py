from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cancha import Cancha


class CanchaRepository:

    @staticmethod
    def get_all(db: Session) -> list[Cancha]:
        stmt = (
            select(Cancha)
            .order_by(Cancha.id)
        )

        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(
        db: Session,
        cancha_id: int,
    ) -> Cancha | None:

        stmt = select(Cancha).where(
            Cancha.id == cancha_id
        )

        return db.scalar(stmt)

    @staticmethod
    def get_by_nombre(
        db: Session,
        nombre: str,
    ) -> Cancha | None:

        stmt = select(Cancha).where(
            Cancha.nombre == nombre
        )

        return db.scalar(stmt)

    @staticmethod
    def get_by_deporte(
        db: Session,
        deporte_id: int,
    ) -> list[Cancha]:

        stmt = (
            select(Cancha)
            .where(Cancha.deporte_id == deporte_id)
            .order_by(Cancha.id)
        )

        return list(db.scalars(stmt).all())

    @staticmethod
    def create(
        db: Session,
        cancha: Cancha,
    ) -> Cancha:

        db.add(cancha)
        db.flush()
        db.refresh(cancha)

        return cancha

    @staticmethod
    def update(
        db: Session,
        cancha: Cancha,
    ) -> Cancha:

        db.flush()
        db.refresh(cancha)

        return cancha