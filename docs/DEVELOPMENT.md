# Development Guide

## Prerequisites

- Node.js 20+ and npm
- Python 3.11+
- (Optional) Docker + Docker Compose for the production-style run

## Running locally (hot reload)

Run the backend and frontend in two terminals.

### Backend → http://localhost:8000

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows (PowerShell: .venv\Scripts\Activate.ps1)
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend → http://localhost:5173

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api/*` to the backend, so you only open the
frontend URL in your browser.

## Pointing the dev proxy elsewhere

By default the dev proxy targets `http://localhost:8000`. To override it (for
example if port 8000 is already taken), create a **gitignored** `.env.local` in
`frontend/`:

```
VITE_API_TARGET=http://127.0.0.1:8011
```

Then run the backend on that port: `uvicorn app.main:app --reload --port 8011`.
The proxy target is read in `vite.config.ts` via Vite's `loadEnv`, so committed
defaults are never affected.

> Note: on some machines port 8000 is occupied by a WSL relay or another service.
> The `.env.local` override is the clean way to work around it.

## Production-style run (Docker)

```bash
docker compose up --build
```

Open http://localhost:8090. The frontend (nginx) serves the built SPA and
proxies `/api/` to the backend container. Data persists in `./data/`.

> The host port is `8090` (mapped to the container's port 80) because `8080` is
> commonly taken by other self-hosted apps. Change the mapping in
> `docker-compose.yml` if you prefer a different port.

## Type-checking & building

```bash
cd frontend
npm run build      # runs `tsc -b` then `vite build`
```

> The TypeScript project reference for `vite.config.ts` emits declaration files
> next to it (`vite.config.js`, `vite.config.d.ts`). These are **gitignored** —
> if they ever appear, they must not be committed: Vite resolves `vite.config.js`
> *before* `.ts`, so a stale emitted `.js` would silently shadow the real config.

## Project layout

```
backend/         FastAPI app (see docs/ARCHITECTURE.md)
frontend/        React + Vite SPA
docs/            Documentation (this folder)
docker-compose.yml
```

## Common tasks

- **Add a widget** → [ADDING_WIDGETS.md](ADDING_WIDGETS.md)
- **API reference** → [API.md](API.md)
- **How it all fits together** → [ARCHITECTURE.md](ARCHITECTURE.md)
