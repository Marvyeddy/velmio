from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, SecretStr
from pathlib import Path

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str = Field(..., alias="DATABASE_URL")
    TEST_DATABASE_URL: str = Field(..., alias="TEST_DATABASE_URL")
    LANGGRAPH_URL: str = Field(..., alias="LANGGRAPH_URL")
    MAIL_USERNAME: str = Field(..., alias="MAIL_USERNAME")
    MAIL_PASSWORD: SecretStr = Field(..., alias="MAIL_PASSWORD")
    MAIL_FROM: str = Field(..., alias="MAIL_FROM")
    JWT_KEY: str = Field(..., alias="JWT_KEY")
    FRONTEND_URL: str = Field(..., alias="FRONTEND_URL")
    JWT_ALG: str = Field(..., alias="JWT_ALG")

    model_config = SettingsConfigDict(
        env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore"
    )


config = Settings()
