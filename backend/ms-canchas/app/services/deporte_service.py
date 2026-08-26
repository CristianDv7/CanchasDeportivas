from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.deporte import Deporte
from app.repositories.deporte_repository import DeporteRepository
from app.schemas.deporte import DeporteCreate, DeporteUpdate


class DeporteService:

    @staticmethod
    def get_all(db: Session) -> list[Deporte]:
        return DeporteRepository.get_all(db)

    @staticmethod
    def get_by_id(
        db: Session,
        deporte_id: int,
    ) -> Deporte | None:
        return DeporteRepository.get_by_id(db, deporte_id)

    @staticmethod
    def create(
        db: Session,
        data: DeporteCreate,
    ) -> Deporte:

        existente = DeporteRepository.get_by_nombre(
            db,
            data.nombre,
        )

        if existente:
            raise ValueError(
                "Ya existe un deporte con ese nombre"
            )

        deporte = Deporte(
            nombre=data.nombre,
            descripcion=data.descripcion,
        )

        try:
            DeporteRepository.create(db, deporte)
            db.commit()
            db.refresh(deporte)

            return deporte

        except IntegrityError:
            db.rollback()
            raise

    @staticmethod
    def update(
        db: Session,
        deporte_id: int,
        data: DeporteUpdate,
    ) -> Deporte | None:

        deporte = DeporteRepository.get_by_id(
            db,
            deporte_id,
        )

        if not deporte:
            return None

        if data.nombre is not None:
            existente = DeporteRepository.get_by_nombre(
                db,
                data.nombre,
            )

            if existente and existente.id != deporte_id:
                raise ValueError(
                    "Ya existe un deporte con ese nombre"
                )

            deporte.nombre = data.nombre

        if data.descripcion is not None:
            deporte.descripcion = data.descripcion

        if data.activo is not None:
            deporte.activo = data.activo

        try:
            DeporteRepository.update(db, deporte)
            db.commit()
            db.refresh(deporte)

            return deporte

        except IntegrityError:
            db.rollback()
            raise