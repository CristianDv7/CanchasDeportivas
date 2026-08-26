from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.cancha import Cancha
from app.repositories.cancha_repository import CanchaRepository
from app.repositories.deporte_repository import DeporteRepository
from app.schemas.cancha import CanchaCreate, CanchaUpdate


class CanchaService:

    @staticmethod
    def get_all(db: Session) -> list[Cancha]:
        return CanchaRepository.get_all(db)

    @staticmethod
    def get_by_id(
        db: Session,
        cancha_id: int,
    ) -> Cancha | None:

        return CanchaRepository.get_by_id(
            db,
            cancha_id,
        )

    @staticmethod
    def get_by_deporte(
        db: Session,
        deporte_id: int,
    ) -> list[Cancha]:

        return CanchaRepository.get_by_deporte(
            db,
            deporte_id,
        )

    @staticmethod
    def create(
        db: Session,
        data: CanchaCreate,
    ) -> Cancha:

        # Verificar que el deporte exista
        deporte = DeporteRepository.get_by_id(
            db,
            data.deporte_id,
        )

        if not deporte:
            raise ValueError(
                "El deporte especificado no existe"
            )

        # Verificar nombre duplicado
        existente = CanchaRepository.get_by_nombre(
            db,
            data.nombre,
        )

        if existente:
            raise ValueError(
                "Ya existe una cancha con ese nombre"
            )

        cancha = Cancha(
            nombre=data.nombre,
            deporte_id=data.deporte_id,
        )

        try:
            CanchaRepository.create(
                db,
                cancha,
            )

            db.commit()
            db.refresh(cancha)

            return cancha

        except IntegrityError:
            db.rollback()
            raise

    @staticmethod
    def update(
        db: Session,
        cancha_id: int,
        data: CanchaUpdate,
    ) -> Cancha | None:

        cancha = CanchaRepository.get_by_id(
            db,
            cancha_id,
        )

        if not cancha:
            return None

        # Si se cambia el deporte, verificar que exista
        if data.deporte_id is not None:

            deporte = DeporteRepository.get_by_id(
                db,
                data.deporte_id,
            )

            if not deporte:
                raise ValueError(
                    "El deporte especificado no existe"
                )

            cancha.deporte_id = data.deporte_id

        # Si se cambia el nombre, verificar duplicados
        if data.nombre is not None:

            existente = CanchaRepository.get_by_nombre(
                db,
                data.nombre,
            )

            if existente and existente.id != cancha_id:
                raise ValueError(
                    "Ya existe una cancha con ese nombre"
                )

            cancha.nombre = data.nombre

        if data.activo is not None:
            cancha.activo = data.activo

        try:
            CanchaRepository.update(
                db,
                cancha,
            )

            db.commit()
            db.refresh(cancha)

            return cancha

        except IntegrityError:
            db.rollback()
            raise

    @staticmethod
    def inactivar(
        db: Session,
        cancha_id: int,
    ) -> Cancha | None:

        cancha = CanchaRepository.get_by_id(
            db,
            cancha_id,
        )

        if not cancha:
            return None

        cancha.activo = False

        try:
            CanchaRepository.update(
                db,
                cancha,
            )

            db.commit()
            db.refresh(cancha)

            return cancha

        except IntegrityError:
            db.rollback()
            raise