# Backend API Reference

Base path: `/api`. All request/response bodies are JSON.
Interactive docs are available at `/docs` (Swagger UI) when the backend runs.

## Health

### `GET /api/health`
Liveness check.

```json
{ "status": "ok" }
```

## Widgets

A widget has this shape:

```json
{
  "id": 1,
  "type": "clock",
  "x": 0, "y": 0, "w": 4, "h": 3,
  "config": { "format": "24h", "showSeconds": false, "showDate": true }
}
```

`x, y, w, h` are react-grid-layout grid units. `config` is a free-form object
whose shape is defined by the widget type on the frontend.

### `GET /api/widgets`
List all widgets.

### `POST /api/widgets`
Create a widget. Body: `type`, `x`, `y`, `w`, `h`, `config` (all but `type`
optional; defaults apply). Returns the created widget with its `id`. → `201`

### `PATCH /api/widgets/{id}`
Partial update. Any subset of `type, x, y, w, h, config`. → `200` / `404`

### `DELETE /api/widgets/{id}`
Delete a widget. → `204` / `404`

### `PUT /api/widgets/layout`
Bulk-update grid positions after a drag/resize. Body is an array of
`{ id, x, y, w, h }` (each field optional except `id`). Unknown ids are skipped.
Returns the updated widgets.

```json
[
  { "id": 1, "x": 0, "y": 0, "w": 6, "h": 4 },
  { "id": 2, "x": 6, "y": 0, "w": 6, "h": 4 }
]
```

## Settings

App-level key/value store (values are arbitrary JSON).

### `GET /api/settings`
Returns all settings as a flat object.

```json
{ "theme": "dark" }
```

### `PUT /api/settings/{key}`
Set one setting. Body: `{ "value": <any> }`. Returns `{ "key", "value" }`.

## Weather

### `GET /api/weather`
Fetches current conditions + a 5-day forecast from a configurable provider and
returns a normalized response. Results are cached in-memory for 10 minutes per
`(location, units, provider)`.

Query params:

| Param | Default | Meaning |
| ----- | ------- | ------- |
| `location` | *(required)* | City name, e.g. `Seattle` |
| `units` | `metric` | `metric` (°C, km/h) or `imperial` (°F, mph) |
| `provider` | `open-meteo` | `open-meteo` (free, no key) or `openweathermap` |
| `api_key` | `""` | API key (required when provider is `openweathermap`) |

Returns `400` if `location` is empty or if `openweathermap` is selected without an
`api_key`, `404` if the location can't be geocoded, `502` on an upstream provider
error.

```json
{
  "location": "Seattle, US",
  "units": { "temp": "°C", "wind": "km/h" },
  "current": {
    "temp": 17, "apparent_temp": 16, "humidity": 72,
    "wind_speed": 8, "code": 51, "description": "Light drizzle", "is_day": true
  },
  "daily": [
    { "date": "2026-06-25", "code": 51, "min": 13, "max": 18, "description": "Light drizzle" }
  ]
}
```

`code` is a [WMO weather code](https://open-meteo.com/en/docs) (OWM condition IDs
are converted to WMO equivalents on the backend); the frontend maps it to an icon.

## Radar

### `GET /api/radar/tile/{layer}/{z}/{x}/{y}.png`
Proxies [OpenWeatherMap map tiles](https://openweathermap.org/api/weathermaps) to
keep the API key server-side. Returns a PNG tile image.

Path params: `layer` (e.g. `precipitation_new`, `clouds_new`, `temp_new`,
`wind_new`, `pressure_new`), `z`/`x`/`y` (standard slippy map tile coordinates).

Query params:

| Param | Default | Meaning |
| ----- | ------- | ------- |
| `api_key` | *(required)* | OpenWeatherMap API key |

Tiles are returned with `Cache-Control: public, max-age=600`.

## Configuration (env vars)

The backend reads settings via the `HOMEDASH_` prefix:

| Variable | Default | Meaning |
| -------- | ------- | ------- |
| `HOMEDASH_DATA_DIR` | `./data` | Directory for the SQLite database (mounted as a volume in Docker) |
| `HOMEDASH_CORS_ORIGINS` | `localhost:5173, localhost:3000` | Allowed CORS origins (dev only) |
