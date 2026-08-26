import httpx

from app.core.config import settings


class CanchasClient:

    @staticmethod
    def get_cancha(cancha_id: int) -> dict | None:

        url = (
            f"{settings.CANCHAS_SERVICE_URL}" # type: ignore
            f"/canchas/{cancha_id}"
        )

        try:
            response = httpx.get(
                url,
                timeout=5.0,
            )

        except httpx.RequestError:
            raise RuntimeError(
                "No fue posible comunicarse con ms-canchas"
            )

        if response.status_code == 404:
            return None

        if response.status_code != 200:
            raise RuntimeError(
                "Error al consultar ms-canchas"
            )

        return response.json()

    @staticmethod
    def get_horarios_cancha(
        cancha_id: int,
    ) -> list[dict]:

        url = (
            f"{settings.CANCHAS_SERVICE_URL}" # type: ignore
            "/horarios-atencion"
        )

        try:
            response = httpx.get(
                url,
                params={
                    "cancha_id": cancha_id,
                },
                timeout=5.0,
            )

        except httpx.RequestError:
            raise RuntimeError(
                "No fue posible comunicarse con ms-canchas"
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"Error al consultar horarios de ms-canchas. "
                f"Status: {response.status_code}. "
                f"Respuesta: {response.text}"
            )

        return response.json()