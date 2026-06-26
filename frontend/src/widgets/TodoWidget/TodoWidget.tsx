import { useEffect, useState } from "react";

import { api } from "../../api/client";
import type { Todo, TodoCategory } from "../../types";
import type { WidgetProps } from "../registry";
import "./TodoWidget.css";

export function TodoWidget({ widget }: WidgetProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [categories, setCategories] = useState<TodoCategory[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cfg = widget.config;
  const defaultCategory = cfg.defaultCategory as number | null;

  useEffect(() => {
    fetchData();
  }, [defaultCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [todosData, catsData] = await Promise.all([
        api.listTodos(),
        api.listTodoCategories(),
      ]);

      setTodos(todosData);
      setCategories(catsData);
      setSelectedCategory(defaultCategory || (catsData[0]?.id ?? null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTitle.trim()) return;

    try {
      const newTodo = await api.createTodo({
        title: newTitle,
        description: "",
        completed: false,
        due_date: null,
        category_id: selectedCategory,
      });

      setTodos([newTodo, ...todos]);
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add todo");
    }
  };

  const toggleTodo = async (id: number, completed: boolean) => {
    try {
      const updated = await api.updateTodo(id, { completed: !completed });
      setTodos(todos.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await api.deleteTodo(id);
      setTodos(todos.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    }
  };

  const filteredTodos = selectedCategory
    ? todos.filter((t) => t.category_id === selectedCategory)
    : todos;

  const completedCount = filteredTodos.filter((t) => t.completed).length;
  const totalCount = filteredTodos.length;

  return (
    <div className="todo-widget">
      {error && <div className="todo-error">{error}</div>}

      {loading ? (
        <div className="todo-loading">Loading...</div>
      ) : (
        <>
          <div className="todo-header">
            <div className="todo-progress">
              {completedCount}/{totalCount}
            </div>
            {categories.length > 0 && (
              <select
                value={selectedCategory || ""}
                onChange={(e) =>
                  setSelectedCategory(e.target.value ? Number(e.target.value) : null)
                }
                className="todo-category-select"
              >
                <option value="">All</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="todo-input-group">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTodo();
              }}
              placeholder="Add a new todo..."
              className="todo-input"
            />
            <button onClick={addTodo} className="todo-add-btn">
              +
            </button>
          </div>

          <div className="todo-list">
            {filteredTodos.length === 0 ? (
              <div className="todo-empty">No todos yet</div>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`todo-item ${todo.completed ? "completed" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="todo-checkbox"
                  />
                  <div className="todo-content">
                    <div className="todo-title">{todo.title}</div>
                    {todo.description && (
                      <div className="todo-description">{todo.description}</div>
                    )}
                    {todo.due_date && (
                      <div className="todo-due-date">
                        Due: {new Date(todo.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="todo-delete-btn"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
