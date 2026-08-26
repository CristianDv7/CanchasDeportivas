from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    CANCHAS_SERVICE_URL: str
    RESERVAS_SERVICE_URL: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings() # type: ignore