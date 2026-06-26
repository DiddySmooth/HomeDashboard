from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, overridable via environment variables."""

    model_config = SettingsConfigDict(env_prefix="HOMEDASH_", env_file=".env")

    # Where persistent data (the SQLite DB) lives. Mounted as a volume in Docker.
    data_dir: Path = Path("./data")

    # CORS origins allowed to call the API. The Vite dev server runs on 5173.
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def database_url(self) -> str:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{self.data_dir / 'homedash.db'}"


settings = Settings()
