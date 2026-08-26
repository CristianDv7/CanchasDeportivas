from datetime import date

from app.services.http_client import ReporteHttpClient


class ReporteService:

    @staticmethod
    async def ocupacion_por_cancha(
        token: str,
    ) -> list[dict]:

        canchas = await ReporteHttpClient.get_canchas(token)
        reservas = await ReporteHttpClient.get_reservas(token)

        # Solo contamos reservas que representan uso real.
        reservas_validas = [
            reserva
            for reserva in reservas
            if reserva.get("estado") != "Cancelada"
        ]

        resultado = []

        for cancha in canchas:
            cancha_id = cancha["id"]

            cantidad_reservas = sum(
                1
                for reserva in reservas_validas
                if reserva.get("cancha_id") == cancha_id
            )

            resultado.append(
                {
                    "cancha_id": cancha_id,
                    "cancha": cancha["nombre"],
                    "reservas": cantidad_reservas,
                }
            )

        return resultado

    @staticmethod
    async def reservas_por_periodo(
        token: str,
        fecha_inicio: date,
        fecha_fin: date,
    ) -> dict:

        if fecha_inicio > fecha_fin:
            raise ValueError(
                "La fecha de inicio debe ser menor o igual "
                "a la fecha de fin"
            )

        reservas = await ReporteHttpClient.get_reservas(token)

        reservas_periodo = [
            reserva
            for reserva in reservas
            if fecha_inicio
            <= date.fromisoformat(reserva["fecha"])
            <= fecha_fin
            and reserva.get("estado") != "Cancelada"
        ]

        return {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "total_reservas": len(reservas_periodo),
        }