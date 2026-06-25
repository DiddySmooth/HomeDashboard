import httpx
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response

router = APIRouter(prefix="/api/radar", tags=["radar"])

_OWM_TILE_URL = "https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png"


@router.get("/tile/{layer}/{z}/{x}/{y}.png")
async def proxy_tile(
    layer: str,
    z: int,
    x: int,
    y: int,
    api_key: str = Query(..., description="OpenWeatherMap API key"),
) -> Response:
    allowed_layers = {
        "precipitation_new", "clouds_new", "temp_new",
        "wind_new", "pressure_new",
    }
    if layer not in allowed_layers:
        raise HTTPException(400, detail=f"Unknown layer: {layer}")

    url = _OWM_TILE_URL.format(layer=layer, z=z, x=x, y=y)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params={"appid": api_key})
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(502, detail=f"Tile fetch error: {exc}") from exc

    return Response(
        content=resp.content,
        media_type=resp.headers.get("content-type", "image/png"),
        headers={"Cache-Control": "public, max-age=600"},
    )
