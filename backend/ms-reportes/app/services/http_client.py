import httpx

from app.core.config import settings


class ReporteHttpClient:

    @staticmethod
    async def get_canchas(
        token: str,
    ) -> list[dict]:

        url = f"{settings.CANCHAS_SERVICE_URL}/canchas" # type: ignore

        headers = {
            "Authorization": f"Bearer {token}",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=headers,
            )

        response.raise_for_status()

        return response.json()

    @staticmethod
    async def get_reservas(
        token: str,
    ) -> list[dict]:

        url = f"{settings.RESERVAS_SERVICE_URL}/reservas/" # type: ignore

        headers = {
            "Authorization": f"Bearer {token}",
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                url,
                headers=headers,
            )

        response.raise_for_status()

        return response.json()