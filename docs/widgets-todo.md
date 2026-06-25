# To Do List Widget

The To Do List widget lets you manage tasks and todos directly on your dashboard. Todos are persisted to the backend and organized into categories.

## Features

- **Add todos** — Create new tasks with a simple text input
- **Mark complete** — Check off completed todos
- **Categories** — Organize todos into custom categories with color coding
- **Due dates** — Optional due date for each task (set via API)
- **Delete** — Remove todos you no longer need
- **Progress tracking** — See completed/total count at a glance

## Configuration

When adding the widget to your dashboard, you can configure:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| Default category | Number | 0 | Category ID to filter by default. Use 0 to show all todos. |

## Usage

### Adding a Todo

1. Type your task description in the "Add a new todo..." input field
2. Press Enter or click the **+** button
3. The todo will appear in the list immediately

### Completing a Todo

1. Check the checkbox next to the todo
2. The item will be marked as complete (grayed out with strikethrough)
3. The progress counter updates automatically

### Deleting a Todo

1. Hover over the todo item
2. Click the **✕** button that appears
3. The todo is permanently removed

### Filtering by Category

Use the category dropdown to filter todos by a specific category. Select "All" to see all todos across all categories.

## Backend API

The widget communicates with the following API endpoints:

### Todos

- `GET /api/todos` — List all todos
- `GET /api/todos/category/{category_id}` — List todos in a specific category
- `POST /api/todos` — Create a new todo
- `PATCH /api/todos/{todo_id}` — Update a todo
- `DELETE /api/todos/{todo_id}` — Delete a todo

### Categories

- `GET /api/todos/categories` — List all categories
- `POST /api/todos/categories` — Create a new category
- `DELETE /api/todos/categories/{category_id}` — Delete a category

### Todo Schema

```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "",
  "completed": false,
  "due_date": "2026-06-30T00:00:00Z",
  "category_id": 1,
  "created_at": "2026-06-25T15:30:00Z",
  "updated_at": "2026-06-25T15:30:00Z"
}
```

### Category Schema

```json
{
  "id": 1,
  "name": "Shopping",
  "color": "#6366f1",
  "created_at": "2026-06-25T15:30:00Z"
}
```

## Implementation Details

### Frontend

- **File**: `frontend/src/widgets/TodoWidget/TodoWidget.tsx`
- **Styles**: `frontend/src/widgets/TodoWidget/TodoWidget.css`
- **Registry**: Registered in `frontend/src/widgets/registry.ts`

The widget uses React hooks (`useState`, `useEffect`) to manage local state and fetch/update todos via the backend API. The component respects the `VITE_API_TARGET` environment variable for API connection (defaults to `http://localhost:8011`).

### Backend

- **Models**: Defined in `backend/app/models.py` (`Todo`, `TodoCategory`)
- **API**: Endpoints in `backend/app/routers/todos.py`
- **Database**: SQLite with SQLModel ORM

Todos and categories are persisted to the SQLite database and accessible via the FastAPI endpoints.

## Future Enhancements

- [ ] Due date picker in the widget UI
- [ ] Task descriptions and notes
- [ ] Drag-and-drop reordering
- [ ] Subtasks/checklists
- [ ] Recurring todos
- [ ] Integration with calendar widget
