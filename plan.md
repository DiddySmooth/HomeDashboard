# HomeDashboard

A self-hosted, configurable home dashboard designed for wall-mounted screens. Users can download, set up, and configure it themselves — similar to Plex or Lidarr.

## Tech Stack

- **Frontend:** React + Vite (TypeScript)
- **Backend:** Python (FastAPI) — config storage, Home Assistant proxy, API layer
- **Deployment:** Docker Compose (bundle frontend + backend)
- **Database:** SQLite (lightweight, no extra services needed for config/settings)

## Architecture

```
Browser (wall screen)  →  Vite React App (served by container)
                                ↓
                         FastAPI Backend
                          ├── Config API (widget layout, settings)
                          ├── Home Assistant WebSocket proxy
                          └── Weather / Calendar API integrations
                                ↓
                            SQLite DB (config, user prefs)
```

## MVP Widgets

1. **Clock / Date** — always-visible clock and date display
2. **Weather** — current conditions + forecast (via weather API or Home Assistant)
3. **Calendar** — upcoming events (Google Calendar integration)

## Future Widgets (post-MVP)

- Home Assistant device controls (lights, switches, thermostats)
- Media player (now playing from Plex/Spotify)
- To-do / shopping list
- Photo frame / slideshow
- Network status
- News / RSS feed
- Custom iframe embed

## Dashboard Layout

- Drag-and-drop grid layout — users can freely place and resize widgets
- Grid-based snapping for clean alignment
- Layout persisted to backend (SQLite)

## Configuration

- **Web-based setup UI** — a settings page in the browser for:
  - Adding/removing widgets
  - Configuring widget-specific settings (API keys, calendar URLs, HA connection)
  - Arranging the dashboard grid layout
  - General settings (theme, refresh intervals)
- No YAML editing required — everything through the UI

## Implementation Phases

### Phase 1: Project Scaffold ✅ DONE
- [x] Monorepo structure (frontend + backend)
- [x] Docker Compose configuration (backend + nginx-served frontend)
- [x] FastAPI skeleton with config API (widgets CRUD + layout, settings, SQLite)
- [x] React + Vite app with routing (dashboard view + settings view)
- [x] Widget registry + working Clock/Date widget on a drag-and-drop grid
- [x] Verified end-to-end: add widget → persists to backend → renders & survives reload

### Phase 2: Widget System ✅ DONE
- [x] Widget component architecture (registry, standardized props)
- [x] Drag-and-drop grid (react-grid-layout) + layout persistence via API
- [x] Clock/Date widget
- [x] **Declarative config schema** — widgets declare `configFields` (select/boolean/text/number)
- [x] **Generic config editor modal** — auto-generates a form from the schema, persists via PATCH
- [x] Clock config wired (12h/24h, seconds, date) + default config seeded on add
- [x] Loading/error states, per-widget min size, unknown-widget fallback
- [x] Per-machine dev proxy override via gitignored `.env.local` (loadEnv)

### Phase 3: Weather Widget
- Weather API integration (OpenWeatherMap or similar)
- Current conditions + multi-day forecast display
- Settings UI for location / API key

### Phase 4: Calendar Widget
- Google Calendar API integration
- Upcoming events display
- Settings UI for calendar connection

### Phase 5: Settings & Polish
- Full settings UI for all widget configs
- Theme support (light/dark, accent colors)
- Docker Compose packaging and setup docs
- README with install instructions

### Phase 6+: Home Assistant & Beyond
- Home Assistant WebSocket integration
- Device control widgets
- Additional community widgets
