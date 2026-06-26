from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .routers import radar, settings as settings_router, todos
from .routers import weather, widgets


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="HomeDashboard API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(widgets.router)
app.include_router(settings_router.router)
app.include_router(weather.router)
app.include_router(radar.router)
app.include_router(todos.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
