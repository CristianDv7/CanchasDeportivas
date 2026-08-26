from datetime import datetime, timezone

from sqlalchemy.orm import Session
from datetime import date, datetime, time, timezone
from app.clients.canchas_client import CanchasClient
from app.clients.usuarios_client import UsuariosClient
from app.core.config import settings
from app.models.reserva import Reserva
from app.repositories.reserva_repository import ReservaRepository
from app.schemas.reserva import ReservaCreate


class ReservaService:

    @staticmethod
    def get_all(db: Session) -> list[Reserva]:
        return ReservaRepository.get_all(db)

    @staticmethod
    def get_by_id(
        db: Session,
        reserva_id: int,
    ) -> Reserva | None:
        return ReservaRepository.get_by_id(
            db,
            reserva_id,
        )

    @staticmethod
    def get_by_usuario(
        db: Session,
        usuario_id: int,
    ) -> list[Reserva]:
        return ReservaRepository.get_by_usuario(
            db,
            usuario_id,
        )

    @staticmethod
    def create(
        db: Session,
        data: ReservaCreate,
    ) -> Reserva:

        # ==================================================
        # RN: VALIDAR USUARIO MEDIANTE ms-usuarios
        # ==================================================

        usuario = UsuariosClient.get_usuario(
            data.usuario_id
        )

        if not usuario:
            raise ValueError(
                "El usuario especificado no existe"
            )

        if not usuario.get("activo", False):
            raise ValueError(
                "El usuario está inactivo"
            )

        # ==================================================
        # RN: VALIDAR CANCHA MEDIANTE ms-canchas
        # ==================================================

        cancha = CanchasClient.get_cancha(
            data.cancha_id
        )

        if not cancha:
            raise ValueError(
                "La cancha especificada no existe"
            )

        if not cancha.get("activo", False):
            raise ValueError(
                "La cancha está inactiva"
            )


        # ==================================================
        # RN-01: VALIDAR HORARIO DE ATENCIÓN
        # ==================================================

        horarios = CanchasClient.get_horarios_cancha(
            data.cancha_id
        )

        dia_semana = data.fecha.isoweekday()

        horario_valido = False

        for horario in horarios:

            if not horario.get("activo", True):
                continue

            if horario.get("dia_semana") != dia_semana:
                continue

            hora_inicio_atencion = time.fromisoformat(
                horario["hora_inicio"]
            )

            hora_fin_atencion = time.fromisoformat(
                horario["hora_fin"]
            )

            if (
                data.hora_inicio >= hora_inicio_atencion
                and data.hora_fin <= hora_fin_atencion
            ):
                horario_valido = True
                break

        if not horario_valido:
            raise ValueError(
                "La reserva está fuera del horario de atención de la cancha"
            )
        # ==================================================
        # RN-06: LÍMITE DE RESERVAS ACTIVAS
        # ==================================================

        reservas_activas = (
            ReservaRepository.get_reservas_activas_usuario(
                db,
                data.usuario_id,
            )
        )

        if (
            len(reservas_activas)
            >= settings.MAX_RESERVAS_ACTIVAS # type: ignore
        ):
            raise ValueError(
                "El usuario ha alcanzado el límite "
                "de reservas activas"
            )

        # ==================================================
        # RN-02: VALIDAR SOLAPAMIENTO
        # ==================================================

        reserva_solapada = (
            ReservaRepository.get_reserva_solapada(
                db,
                cancha_id=data.cancha_id,
                fecha=data.fecha,
                hora_inicio=data.hora_inicio,
                hora_fin=data.hora_fin,
            )
        )

        if reserva_solapada:
            raise ValueError(
                "La cancha ya está reservada en ese horario"
            )

        # ==================================================
        # CREAR RESERVA
        # ==================================================

        reserva = Reserva(
            usuario_id=data.usuario_id,
            cancha_id=data.cancha_id,
            fecha=data.fecha,
            hora_inicio=data.hora_inicio,
            hora_fin=data.hora_fin,
            estado="Confirmada",
        )

        ReservaRepository.create(
            db,
            reserva,
        )

        db.commit()
        db.refresh(reserva)

        return reserva

    @staticmethod
    def cancelar(
        db: Session,
        reserva_id: int,
        usuario_id: int,
        es_administrador: bool = False,
    ) -> Reserva:

        reserva = ReservaRepository.get_by_id(
            db,
            reserva_id,
        )

        if not reserva:
            raise ValueError(
                "La reserva no existe"
            )

        # ==================================================
        # RN-03: PERMISOS DE CANCELACIÓN
        # ==================================================

        if not es_administrador:

            if reserva.usuario_id != usuario_id:
                raise PermissionError(
                    "No puede cancelar una reserva "
                    "de otro usuario"
                )

        # ==================================================
        # VALIDAR ESTADO
        # ==================================================

        if reserva.estado == "Cancelada":
            raise ValueError(
                "La reserva ya está cancelada"
            )

        # ==================================================
        # RN-04: NO CANCELAR RESERVAS PASADAS
        # ==================================================

        ahora = datetime.now(timezone.utc)

        inicio_reserva = datetime.combine(
            reserva.fecha,
            reserva.hora_inicio,
        ).replace(
            tzinfo=timezone.utc
        )

        if inicio_reserva <= ahora:
            raise ValueError(
                "No se puede cancelar una reserva "
                "que ya inició"
            )

        # ==================================================
        # CANCELAR
        # ==================================================

        reserva.estado = "Cancelada"

        ReservaRepository.update(
            db,
            reserva,
        )

        db.commit()
        db.refresh(reserva)

        return reserva

    @staticmethod
    def finalizar_reserva(
        db: Session,
        reserva_id: int,
    ) -> Reserva | None:

        reserva = ReservaRepository.get_by_id(
            db,
            reserva_id,
        )

        if not reserva:
            return None

        # Solo las reservas confirmadas
        # pueden pasar a finalizadas.
        if reserva.estado != "Confirmada":
            return reserva

        ahora = datetime.now(timezone.utc)

        fin_reserva = datetime.combine(
            reserva.fecha,
            reserva.hora_fin,
        ).replace(
            tzinfo=timezone.utc
        )

        if fin_reserva <= ahora:
            reserva.estado = "Finalizada"

            ReservaRepository.update(
                db,
                reserva,
            )

            db.commit()
            db.refresh(reserva)

        return reserva