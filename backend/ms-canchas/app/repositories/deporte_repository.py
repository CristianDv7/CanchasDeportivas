from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.deporte import Deporte


class DeporteRepository:

    @staticmethod
    def get_all(db: Session) -> list[Deporte]:
        stmt = select(Deporte).order_by(Deporte.id)

        return list(db.scalars(stmt).all())

    @staticmethod
    def get_by_id(
        db: Session,
        deporte_id: int,
    ) -> Deporte | None:

        stmt = select(Deporte).where(
            Deporte.id == deporte_id
        )

        return db.scalar(stmt)

    @staticmethod
    def get_by_nombre(
        db: Session,
        nombre: str,
    ) -> Deporte | None:

        stmt = select(Deporte).where(
            Deporte.nombre == nombre
        )

        return db.scalar(stmt)

    @staticmethod
    def create(
        db: Session,
        deporte: Deporte,
    ) -> Deporte:

        db.add(deporte)
        db.flush()
        db.refresh(deporte)

        return deporte

    @staticmethod
    def update(
        db: Session,
        deporte: Deporte,
    ) -> Deporte:

        db.flush()
        db.refresh(deporte)

        return deporte