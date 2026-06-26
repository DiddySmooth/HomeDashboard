# HomeDashboard

A self-hosted, configurable dashboard for wall-mounted home displays. Add widgets,
arrange them on a drag-and-drop grid, and configure everything from a web UI —
no config files required. Designed to be downloaded and run yourself, like Plex
or the *arr apps.

## Status

Early development. **Phases 1–3 complete:**

- React + Vite (TypeScript) frontend with a drag-and-drop widget grid
- FastAPI backend with SQLite persistence for widgets and settings
- Widgets: **Clock & Date**, **Weather** (Open-Meteo or OpenWeatherMap), and
  **Weather Radar** (OWM precipitation/cloud/temp/wind map tiles via Leaflet)
- **Declarative widget config system** — widgets declare their options and get an
  auto-generated config form (no per-widget form code)
- Shared `Button` component + global design tokens (colors, typography, radii)
- Floating gear menu, edit mode with visible resize grips, loading/error states
- Docker Compose packaging

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — how the pieces fit together
- [Adding a widget](docs/ADDING_WIDGETS.md) — the 2-step widget recipe
- [API reference](docs/API.md) — backend endpoints
- [Development guide](docs/DEVELOPMENT.md) — local setup, dev proxy, building

## Tech Stack

| Layer    | Choice                          |
| -------- | ------------------------------- |
| Frontend | React + Vite + TypeScript       |
| Layout   | react-grid-layout               |
| Backend  | FastAPI (Python 3.11)           |
| Storage  | SQLite (via SQLModel)           |
| Deploy   | Docker Compose                  |

## Quick Start (Docker)

```bash
docker compose up --build
```

Then open http://localhost:8090. Click the gear (top-right) → **Edit layout** to
add and arrange widgets.

Persistent data is stored in `./data/homedash.db`.

## Development

Run the backend and frontend separately with hot reload.

**Backend** (http://localhost:8000):

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend** (http://localhost:5173, proxies `/api` to the backend):

```bash
cd frontend
npm install
npm run dev
```

## Project Layout

```
backend/
  app/
    main.py          FastAPI app + CORS + router wiring
    config.py        Settings (env-overridable, HOMEDASH_ prefix)
    database.py      SQLite engine + session
    models.py        Widget + Setting models
    routers/
      widgets.py     CRUD + bulk layout save
      settings.py    Key/value app settings
frontend/
  src/
    api/client.ts    Typed API client
    pages/           Dashboard + Settings views
    widgets/         Widget registry + components (Clock)
docker-compose.yml
```

## Adding a Widget

1. Create a component in `frontend/src/widgets/` accepting `WidgetProps`.
2. Register it in `frontend/src/widgets/registry.ts`.
3. It becomes available in the dashboard's **Add widget** bar automatically.

## Roadmap

- [x] Phase 1: Project scaffold
- [x] Phase 2: Widget system polish
- [x] Phase 3: Weather widget
- [ ] Phase 4: Calendar widget
- [ ] Phase 5: Settings & packaging polish
- [ ] Phase 6+: Home Assistant integration & device controls
