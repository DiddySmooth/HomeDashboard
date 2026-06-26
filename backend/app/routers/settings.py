from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from ..database import get_session
from ..models import Setting

router = APIRouter(prefix="/api/settings", tags=["settings"])


class SettingValue(BaseModel):
    value: Any


@router.get("")
def get_all_settings(session: Session = Depends(get_session)) -> dict[str, Any]:
    rows = session.exec(select(Setting)).all()
    return {row.key: row.value for row in rows}


@router.put("/{key}")
def set_setting(
    key: str, payload: SettingValue, session: Session = Depends(get_session)
) -> dict[str, Any]:
    setting = session.get(Setting, key)
    if setting is None:
        setting = Setting(key=key, value=payload.value)
    else:
        setting.value = payload.value
    session.add(setting)
    session.commit()
    return {"key": key, "value": payload.value}
