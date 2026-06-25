from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import (
    Todo,
    TodoCreate,
    TodoUpdate,
    TodoRead,
    TodoCategory,
    TodoCategoryRead,
)

router = APIRouter(prefix="/api/todos", tags=["todos"])


@router.get("", response_model=list[TodoRead])
def list_todos(session: Session = Depends(get_session)) -> list[Todo]:
    return list(session.exec(select(Todo).order_by(Todo.created_at.desc())).all())


@router.get("/category/{category_id}", response_model=list[TodoRead])
def list_todos_by_category(
    category_id: int, session: Session = Depends(get_session)
) -> list[Todo]:
    return list(
        session.exec(
            select(Todo)
            .where(Todo.category_id == category_id)
            .order_by(Todo.created_at.desc())
        ).all()
    )


@router.post("", response_model=TodoRead, status_code=201)
def create_todo(
    payload: TodoCreate, session: Session = Depends(get_session)
) -> Todo:
    todo = Todo.model_validate(payload)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.patch("/{todo_id}", response_model=TodoRead)
def update_todo(
    todo_id: int,
    payload: TodoUpdate,
    session: Session = Depends(get_session),
) -> Todo:
    todo = session.get(Todo, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(todo, key, value)
    todo.updated_at = datetime.now(timezone.utc)

    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, session: Session = Depends(get_session)) -> None:
    todo = session.get(Todo, todo_id)
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    session.delete(todo)
    session.commit()


@router.get("/categories", response_model=list[TodoCategoryRead])
def list_categories(session: Session = Depends(get_session)) -> list[TodoCategory]:
    return list(session.exec(select(TodoCategory)).all())


@router.post("/categories", response_model=TodoCategoryRead, status_code=201)
def create_category(
    name: str, color: str = "#6366f1", session: Session = Depends(get_session)
) -> TodoCategory:
    category = TodoCategory(name=name, color=color)
    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(category_id: int, session: Session = Depends(get_session)) -> None:
    category = session.get(TodoCategory, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    session.delete(category)
    session.commit()
