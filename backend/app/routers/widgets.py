from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Widget, WidgetCreate, WidgetRead, WidgetUpdate

router = APIRouter(prefix="/api/widgets", tags=["widgets"])


@router.get("", response_model=list[WidgetRead])
def list_widgets(session: Session = Depends(get_session)) -> list[Widget]:
    return list(session.exec(select(Widget)).all())


@router.post("", response_model=WidgetRead, status_code=201)
def create_widget(
    payload: WidgetCreate, session: Session = Depends(get_session)
) -> Widget:
    widget = Widget.model_validate(payload)
    session.add(widget)
    session.commit()
    session.refresh(widget)
    return widget


@router.patch("/{widget_id}", response_model=WidgetRead)
def update_widget(
    widget_id: int,
    payload: WidgetUpdate,
    session: Session = Depends(get_session),
) -> Widget:
    widget = session.get(Widget, widget_id)
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(widget, key, value)
    widget.updated_at = datetime.now(timezone.utc)

    session.add(widget)
    session.commit()
    session.refresh(widget)
    return widget


@router.delete("/{widget_id}", status_code=204)
def delete_widget(widget_id: int, session: Session = Depends(get_session)) -> None:
    widget = session.get(Widget, widget_id)
    if widget is None:
        raise HTTPException(status_code=404, detail="Widget not found")
    session.delete(widget)
    session.commit()


class LayoutItem(WidgetUpdate):
    id: int


@router.put("/layout", response_model=list[WidgetRead])
def update_layout(
    items: list[LayoutItem], session: Session = Depends(get_session)
) -> list[Widget]:
    """Bulk-update widget grid positions after a drag/resize."""
    updated: list[Widget] = []
    for item in items:
        widget = session.get(Widget, item.id)
        if widget is None:
            continue
        for key in ("x", "y", "w", "h"):
            value = getattr(item, key)
            if value is not None:
                setattr(widget, key, value)
        widget.updated_at = datetime.now(timezone.utc)
        session.add(widget)
        updated.append(widget)
    session.commit()
    for widget in updated:
        session.refresh(widget)
    return updated
