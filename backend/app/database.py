from collections.abc import Generator

from sqlmodel import Session, SQLModel, create_engine

from .config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
)


def init_db() -> None:
    """Create tables. Import models first so they register with SQLModel metadata."""
    from . import models  # noqa: F401

    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
