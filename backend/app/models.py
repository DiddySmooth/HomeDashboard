from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column
from sqlalchemy.types import JSON
from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class WidgetBase(SQLModel):
    # Widget type identifier, e.g. "clock", "weather", "calendar".
    type: str = Field(index=True)

    # Grid layout (react-grid-layout coordinates).
    x: int = 0
    y: int = 0
    w: int = 4
    h: int = 4

    # Arbitrary per-widget configuration (location, API keys, calendar URL, ...).
    config: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))


class Widget(WidgetBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class WidgetCreate(WidgetBase):
    pass


class WidgetUpdate(SQLModel):
    type: str | None = None
    x: int | None = None
    y: int | None = None
    w: int | None = None
    h: int | None = None
    config: dict[str, Any] | None = None


class WidgetRead(WidgetBase):
    id: int


class TodoCategory(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    color: str = Field(default="#6366f1")
    created_at: datetime = Field(default_factory=_now)


class TodoBase(SQLModel):
    title: str
    description: str = ""
    completed: bool = False
    due_date: datetime | None = None
    category_id: int | None = None


class Todo(TodoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class TodoCreate(TodoBase):
    pass


class TodoUpdate(SQLModel):
    title: str | None = None
    description: str | None = None
    completed: bool | None = None
    due_date: datetime | None = None
    category_id: int | None = None


class TodoRead(TodoBase):
    id: int


class TodoCategoryRead(SQLModel):
    id: int
    name: str
    color: str


class Setting(SQLModel, table=True):
    """Simple key/value store for app-level settings (theme, etc.)."""

    key: str = Field(primary_key=True)
    value: Any = Field(default=None, sa_column=Column(JSON))
