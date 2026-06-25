# Architecture

HomeDashboard is a two-service application: a **React + Vite** frontend and a
**FastAPI** backend, packaged together with Docker Compose. It is designed to be
self-hosted and displayed on a wall-mounted screen, with all configuration done
through the web UI (no config files to edit).

## High-level diagram

```
┌─────────────────────────────────────────────┐
│  Browser (wall-mounted screen / any device)  │
│                                               │
│   React SPA (Vite build, served by nginx)     │
│   ├── Dashboard  → drag-and-drop widget grid  │
│   └── Settings   → app + widget configuration │
└───────────────────────┬───────────────────────┘
                         │  /api/* (fetch)
                         ▼
┌─────────────────────────────────────────────┐
│  FastAPI backend (uvicorn)                    │
│   ├── /api/widgets      CRUD + bulk layout     │
│   ├── /api/settings     key/value app settings │
│   └── /api/health       liveness check         │
│                         │                      │
│                         ▼                      │
│                  SQLite (SQLModel)             │
│                  data/homedash.db              │
└─────────────────────────────────────────────┘
```

In Docker, nginx serves the built frontend and reverse-proxies `/api/` to the
backend container. In development, the Vite dev server proxies `/api/` to a
locally running uvicorn (see [DEVELOPMENT.md](DEVELOPMENT.md)).

## Backend (`backend/`)

| File | Responsibility |
| ---- | -------------- |
| `app/main.py` | FastAPI app, CORS, lifespan (creates tables), router wiring |
| `app/config.py` | Settings via `pydantic-settings`; env-overridable with the `HOMEDASH_` prefix (e.g. `HOMEDASH_DATA_DIR`) |
| `app/database.py` | SQLite engine + session dependency; `init_db()` creates tables |
| `app/models.py` | `Widget` and `Setting` SQLModel tables + request/response schemas |
| `app/routers/widgets.py` | Widget CRUD and the bulk `PUT /layout` endpoint |
| `app/routers/settings.py` | App-level key/value settings |

### Data model

- **Widget** — one row per placed widget. Holds the widget `type`, grid position
  (`x, y, w, h` in react-grid-layout units), and a free-form JSON `config` blob
  whose shape is owned by each widget type on the frontend.
- **Setting** — a simple key/value store (JSON values) for app-wide settings such
  as the theme.

The backend intentionally does **not** validate the contents of a widget's
`config`. The schema lives on the frontend (see below), keeping the backend a
generic persistence layer so new widget types need no backend changes.

## Frontend (`frontend/src/`)

| Path | Responsibility |
| ---- | -------------- |
| `main.tsx` / `App.tsx` | Entry point + routing (`/` dashboard, `/settings`) |
| `api/client.ts` | Typed `fetch` wrapper for every backend endpoint |
| `types.ts` | Shared TypeScript types (`Widget`, `LayoutItem`, …) |
| `pages/Dashboard.tsx` | The grid, edit mode, add/remove, layout persistence |
| `pages/Settings.tsx` | App-level settings (theme, …) |
| `widgets/registry.ts` | The widget registry + config-field schema types |
| `widgets/WidgetConfigModal.tsx` | Generic config form generated from a widget's schema |
| `widgets/*Widget.tsx` | Individual widget components |

### The widget system

This is the core of the app. A **widget definition** in
[`registry.ts`](../frontend/src/widgets/registry.ts) declares:

- `type` — stable id stored on the widget row
- `name` — label shown in the UI
- `component` — the React component that renders the widget body
- `defaultSize` / `minSize` — grid sizing
- `configFields` — a declarative list of options (`select`, `boolean`, `text`,
  `number`) from which the config form is auto-generated

Because the config form is generated from `configFields`, **adding a new widget
requires no form code and no backend changes** — see
[ADDING_WIDGETS.md](ADDING_WIDGETS.md).

### Layout & persistence

The dashboard uses [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)
for drag-and-drop placement and resizing (enabled only in *edit mode*). On every
layout change while editing, the new positions are pushed to the backend via
`PUT /api/widgets/layout`, so the arrangement survives reloads and restarts.

## Why these choices

- **SQLite** — zero-config, single file, perfect for a self-hosted single-home app.
- **JSON config blob** — lets the widget catalogue grow without schema migrations.
- **Registry pattern** — one place to add a widget; everything else is generic.
- **nginx + reverse proxy** — single exposed port, no CORS in production.
