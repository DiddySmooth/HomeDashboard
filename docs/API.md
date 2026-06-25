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

## Configuration (env vars)

The backend reads settings via the `HOMEDASH_` prefix:

| Variable | Default | Meaning |
| -------- | ------- | ------- |
| `HOMEDASH_DATA_DIR` | `./data` | Directory for the SQLite database (mounted as a volume in Docker) |
| `HOMEDASH_CORS_ORIGINS` | `localhost:5173, localhost:3000` | Allowed CORS origins (dev only) |
