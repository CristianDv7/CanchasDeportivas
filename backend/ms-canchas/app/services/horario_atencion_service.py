from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.horario_atencion import HorarioAtencion
from app.repositories.cancha_repository import CanchaRepository
from app.repositories.horario_atencion_repository import (
    HorarioAtencionRepository,
)
from app.schemas.horario_atencion import (
    HorarioAtencionCreate,
    HorarioAtencionUpdate,
)


class HorarioAtencionService:

    @staticmethod
    def get_all(
        db: Session,
        cancha_id: int | None = None,
    ) -> list[HorarioAtencion]:

        return HorarioAtencionRepository.get_all(
            db,
            cancha_id,
        )

    @staticmethod
    def get_by_id(
        db: Session,
        horario_id: int,
    ) -> HorarioAtencion | None:

        return HorarioAtencionRepository.get_by_id(
            db,
            horario_id,
        )

    @staticmethod
    def create(
        db: Session,
        data: HorarioAtencionCreate,
    ) -> HorarioAtencion:

        # Verificar que la cancha exista
        cancha = CanchaRepository.get_by_id(
            db,
            data.cancha_id,
        )

        if not cancha:
            raise ValueError(
                "La cancha especificada no existe"
            )

        # Validar día de la semana
        if not 1 <= data.dia_semana <= 7:
            raise ValueError(
                "El día de la semana debe estar entre 1 y 7"
            )

        # Validar horario
        if data.hora_inicio >= data.hora_fin:
            raise ValueError(
                "La hora de inicio debe ser menor que la hora de fin"
            )

        # Verificar que no exista otro horario para
        # la misma cancha y día
        horarios_existentes = (
            HorarioAtencionRepository.get_by_cancha_dia(
                db,
                data.cancha_id,
                data.dia_semana,
            )
        )

        if horarios_existentes:
            raise ValueError(
                "La cancha ya tiene un horario configurado para ese día"
            )

        horario = HorarioAtencion(
            cancha_id=data.cancha_id,
            dia_semana=data.dia_semana,
            hora_inicio=data.hora_inicio,
            hora_fin=data.hora_fin,
        )

        try:
            HorarioAtencionRepository.create(
                db,
                horario,
            )

            db.commit()
            db.refresh(horario)

            return horario

        except IntegrityError:
            db.rollback()
            raise ValueError(
                "La cancha ya tiene un horario configurado para ese día"
            )
    @staticmethod
    def update(
        db: Session,
        horario_id: int,
        data: HorarioAtencionUpdate,
    ) -> HorarioAtencion | None:

        horario = HorarioAtencionRepository.get_by_id(
            db,
            horario_id,
        )

        if not horario:
            return None

        # Determinar valores finales
        cancha_id = (
            data.cancha_id
            if data.cancha_id is not None
            else horario.cancha_id
        )

        dia_semana = (
            data.dia_semana
            if data.dia_semana is not None
            else horario.dia_semana
        )

        hora_inicio = (
            data.hora_inicio
            if data.hora_inicio is not None
            else horario.hora_inicio
        )

        hora_fin = (
            data.hora_fin
            if data.hora_fin is not None
            else horario.hora_fin
        )

        # Verificar cancha
        cancha = CanchaRepository.get_by_id(
            db,
            cancha_id,
        )

        if not cancha:
            raise ValueError(
                "La cancha especificada no existe"
            )

        # Validar día
        if not 1 <= dia_semana <= 7:
            raise ValueError(
                "El día de la semana debe estar entre 1 y 7"
            )

        # Validar horario
        if hora_inicio >= hora_fin:
            raise ValueError(
                "La hora de inicio debe ser menor que la hora de fin"
            )

        horario.cancha_id = cancha_id
        horario.dia_semana = dia_semana
        horario.hora_inicio = hora_inicio
        horario.hora_fin = hora_fin

        try:
            HorarioAtencionRepository.update(
                db,
                horario,
            )

            db.commit()
            db.refresh(horario)

            return horario

        except IntegrityError:
            db.rollback()
            raise