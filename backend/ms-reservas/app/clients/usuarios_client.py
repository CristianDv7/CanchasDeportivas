import httpx

from app.core.config import settings


class UsuariosClient:

    @staticmethod
    def get_usuario(usuario_id: int) -> dict | None:

        url = (
            f"{settings.USUARIOS_SERVICE_URL}" # type: ignore
            f"/usuarios/{usuario_id}"
        )

        try:
            response = httpx.get(
                url,
                timeout=5.0,
            )

        except httpx.RequestError:
            raise RuntimeError(
                "No fue posible comunicarse con ms-usuarios"
            )

        if response.status_code == 404:
            return None

        if response.status_code != 200:
            raise RuntimeError(
                "Error al consultar ms-usuarios"
            )

        return response.json()