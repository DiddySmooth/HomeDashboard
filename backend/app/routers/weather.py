import time
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/weather", tags=["weather"])

CACHE_TTL = 600  # seconds
_cache: dict[tuple[str, str, str], tuple[float, dict[str, Any]]] = {}

# ---------------------------------------------------------------------------
# Open-Meteo
# ---------------------------------------------------------------------------

_OM_GEOCODE = "https://geocoding-api.open-meteo.com/v1/search"
_OM_FORECAST = "https://api.open-meteo.com/v1/forecast"

WMO_CODES: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def _wmo_describe(code: int | None) -> str:
    if code is None:
        return "Unknown"
    return WMO_CODES.get(code, "Unknown")


async def _fetch_open_meteo(
    location: str, units: str
) -> dict[str, Any]:
    temp_unit = "fahrenheit" if units == "imperial" else "celsius"
    wind_unit = "mph" if units == "imperial" else "kmh"

    async with httpx.AsyncClient(timeout=10) as client:
        geo = await client.get(_OM_GEOCODE, params={"name": location, "count": 1})
        geo.raise_for_status()
        results = geo.json().get("results")
        if not results:
            raise HTTPException(404, detail=f"Location not found: {location}")
        place = results[0]

        resp = await client.get(
            _OM_FORECAST,
            params={
                "latitude": place["latitude"],
                "longitude": place["longitude"],
                "current": (
                    "temperature_2m,apparent_temperature,relative_humidity_2m,"
                    "weather_code,wind_speed_10m,is_day"
                ),
                "daily": "weather_code,temperature_2m_max,temperature_2m_min",
                "temperature_unit": temp_unit,
                "wind_speed_unit": wind_unit,
                "timezone": "auto",
                "forecast_days": 5,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    cur = data["current"]
    daily = data["daily"]
    country = place.get("country_code") or place.get("country")
    label = f"{place['name']}, {country}" if country else place["name"]

    return {
        "location": label,
        "units": {
            "temp": "°F" if units == "imperial" else "°C",
            "wind": "mph" if units == "imperial" else "km/h",
        },
        "current": {
            "temp": round(cur["temperature_2m"]),
            "apparent_temp": round(cur["apparent_temperature"]),
            "humidity": cur["relative_humidity_2m"],
            "wind_speed": round(cur["wind_speed_10m"]),
            "code": cur["weather_code"],
            "description": _wmo_describe(cur["weather_code"]),
            "is_day": bool(cur["is_day"]),
        },
        "daily": [
            {
                "date": date,
                "code": code,
                "min": round(low),
                "max": round(high),
                "description": _wmo_describe(code),
            }
            for date, code, low, high in zip(
                daily["time"],
                daily["weather_code"],
                daily["temperature_2m_min"],
                daily["temperature_2m_max"],
            )
        ],
    }


# ---------------------------------------------------------------------------
# OpenWeatherMap
# ---------------------------------------------------------------------------

_OWM_GEO = "https://api.openweathermap.org/geo/1.0/direct"
_OWM_CURRENT = "https://api.openweathermap.org/data/2.5/weather"
_OWM_FORECAST = "https://api.openweathermap.org/data/2.5/forecast"


def _owm_describe(condition_id: int) -> str:
    if condition_id >= 200 and condition_id < 300:
        return "Thunderstorm"
    if condition_id >= 300 and condition_id < 400:
        return "Drizzle"
    if condition_id >= 500 and condition_id < 600:
        descs = {500: "Light rain", 501: "Moderate rain", 502: "Heavy rain",
                 503: "Very heavy rain", 504: "Extreme rain",
                 511: "Freezing rain", 520: "Light showers",
                 521: "Showers", 522: "Heavy showers"}
        return descs.get(condition_id, "Rain")
    if condition_id >= 600 and condition_id < 700:
        return "Snow"
    if condition_id >= 700 and condition_id < 800:
        descs = {701: "Mist", 711: "Smoke", 721: "Haze", 731: "Dust",
                 741: "Fog", 751: "Sand", 761: "Dust", 762: "Volcanic ash",
                 771: "Squall", 781: "Tornado"}
        return descs.get(condition_id, "Haze")
    if condition_id == 800:
        return "Clear sky"
    if condition_id == 801:
        return "Few clouds"
    if condition_id == 802:
        return "Scattered clouds"
    if condition_id == 803:
        return "Broken clouds"
    if condition_id == 804:
        return "Overcast"
    return "Unknown"


def _owm_to_wmo(condition_id: int) -> int:
    """Approximate OWM condition ID to a WMO code for the frontend emoji mapper."""
    if condition_id >= 200 and condition_id < 300:
        return 95
    if condition_id >= 300 and condition_id < 400:
        return 51
    if condition_id >= 500 and condition_id < 600:
        if condition_id <= 501:
            return 61
        if condition_id <= 502:
            return 63
        return 65
    if condition_id >= 600 and condition_id < 700:
        return 71
    if condition_id >= 700 and condition_id < 800:
        return 45
    if condition_id == 800:
        return 0
    if condition_id == 801:
        return 1
    if condition_id == 802:
        return 2
    if condition_id >= 803:
        return 3
    return 0


async def _fetch_owm(
    location: str, units: str, api_key: str
) -> dict[str, Any]:
    owm_units = "imperial" if units == "imperial" else "metric"

    async with httpx.AsyncClient(timeout=10) as client:
        geo = await client.get(
            _OWM_GEO,
            params={"q": location, "limit": 1, "appid": api_key},
        )
        geo.raise_for_status()
        places = geo.json()
        if not places:
            raise HTTPException(404, detail=f"Location not found: {location}")
        place = places[0]
        lat, lon = place["lat"], place["lon"]

        cur_resp, fc_resp = await _owm_parallel(
            client, lat, lon, owm_units, api_key
        )

    cur = cur_resp.json()
    fc = fc_resp.json()

    country = place.get("country", "")
    label = f"{place['name']}, {country}" if country else place["name"]
    cond = cur["weather"][0] if cur.get("weather") else {}
    cond_id = cond.get("id", 800)

    # Build daily aggregates from 3-hour forecast slots
    daily_map: dict[str, dict[str, Any]] = {}
    for slot in fc.get("list", []):
        date = slot["dt_txt"][:10]
        entry = daily_map.setdefault(date, {
            "date": date,
            "min": float("inf"),
            "max": float("-inf"),
            "code": 800,
            "worst_id": 800,
        })
        temp = slot["main"]
        entry["min"] = min(entry["min"], temp["temp_min"])
        entry["max"] = max(entry["max"], temp["temp_max"])
        slot_id = slot["weather"][0]["id"] if slot.get("weather") else 800
        if slot_id < entry["worst_id"]:
            entry["worst_id"] = slot_id

    daily = []
    for d in sorted(daily_map.values(), key=lambda x: x["date"])[:5]:
        wmo = _owm_to_wmo(d["worst_id"])
        daily.append({
            "date": d["date"],
            "code": wmo,
            "min": round(d["min"]),
            "max": round(d["max"]),
            "description": _owm_describe(d["worst_id"]),
        })

    return {
        "location": label,
        "units": {
            "temp": "°F" if units == "imperial" else "°C",
            "wind": "mph" if units == "imperial" else "km/h",
        },
        "current": {
            "temp": round(cur["main"]["temp"]),
            "apparent_temp": round(cur["main"]["feels_like"]),
            "humidity": cur["main"]["humidity"],
            "wind_speed": round(cur["wind"]["speed"]),
            "code": _owm_to_wmo(cond_id),
            "description": _owm_describe(cond_id),
            "is_day": _is_day_owm(cur),
        },
        "daily": daily,
    }


async def _owm_parallel(
    client: httpx.AsyncClient,
    lat: float,
    lon: float,
    units: str,
    api_key: str,
) -> tuple[httpx.Response, httpx.Response]:
    import asyncio

    cur_task = client.get(
        _OWM_CURRENT,
        params={"lat": lat, "lon": lon, "units": units, "appid": api_key},
    )
    fc_task = client.get(
        _OWM_FORECAST,
        params={"lat": lat, "lon": lon, "units": units, "appid": api_key},
    )
    cur_resp, fc_resp = await asyncio.gather(cur_task, fc_task)
    cur_resp.raise_for_status()
    fc_resp.raise_for_status()
    return cur_resp, fc_resp


def _is_day_owm(data: dict[str, Any]) -> bool:
    sys = data.get("sys", {})
    dt = data.get("dt", 0)
    sunrise = sys.get("sunrise", 0)
    sunset = sys.get("sunset", 0)
    if sunrise and sunset:
        return sunrise <= dt <= sunset
    return True


# ---------------------------------------------------------------------------
# Route
# ---------------------------------------------------------------------------

@router.get("")
async def get_weather(
    location: str = Query(..., description="City name, e.g. 'Seattle'"),
    units: str = Query("metric", description="'metric' or 'imperial'"),
    provider: str = Query("open-meteo", description="'open-meteo' or 'openweathermap'"),
    api_key: str = Query("", description="API key (required for openweathermap)"),
) -> dict[str, Any]:
    location = location.strip()
    if not location:
        raise HTTPException(status_code=400, detail="location is required")

    units = "imperial" if units == "imperial" else "metric"
    provider = provider.lower().strip()
    if provider not in ("open-meteo", "openweathermap"):
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")

    if provider == "openweathermap" and not api_key.strip():
        raise HTTPException(
            status_code=400,
            detail="api_key is required when using OpenWeatherMap",
        )

    cache_key = (location.lower(), units, provider)
    now = time.time()
    cached = _cache.get(cache_key)
    if cached and now - cached[0] < CACHE_TTL:
        return cached[1]

    try:
        if provider == "openweathermap":
            result = await _fetch_owm(location, units, api_key.strip())
        else:
            result = await _fetch_open_meteo(location, units)
    except HTTPException:
        raise
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502, detail=f"Weather provider error: {exc}"
        ) from exc

    _cache[cache_key] = (now, result)
    return result
