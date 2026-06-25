# Adding a Widget

Thanks to the widget registry, a new widget needs **no backend changes** and
**no custom form code**. There are two steps.

## 1. Write the component

Create `frontend/src/widgets/MyWidget.tsx`. It receives a single `widget` prop and
reads its options from `widget.config`. Always provide sensible fallbacks so the
widget renders before it has been configured.

```tsx
import type { WidgetProps } from "./registry";

export function MyWidget({ widget }: WidgetProps) {
  // config values are `unknown` — coerce with a fallback.
  const label = (widget.config.label as string) ?? "Hello";

  return <div className="my-widget">{label}</div>;
}
```

## 2. Register it

Add an entry to `WIDGET_REGISTRY` in
[`frontend/src/widgets/registry.ts`](../frontend/src/widgets/registry.ts):

```ts
import { MyWidget } from "./MyWidget";

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  // ...existing widgets...
  myWidget: {
    type: "myWidget",
    name: "My Widget",
    component: MyWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    configFields: [
      { key: "label", label: "Label", type: "text", default: "Hello" },
    ],
  },
};
```

That's it. The widget now appears in the **Add widget** bar (edit mode), gets an
auto-generated config form behind its gear icon, and persists its layout and
config like every other widget.

## Config field types

`configFields` entries drive the generated form. Supported types:

| `type` | Renders as | `default` | Extra |
| ------ | ---------- | --------- | ----- |
| `text` | text input | `string` | — |
| `number` | number input | `number` | — |
| `boolean` | checkbox | `boolean` | — |
| `select` | dropdown | `string` | requires `options: { label, value }[]` |

All fields accept an optional `help` string shown beneath the input.

Example with several field types:

```ts
configFields: [
  {
    key: "units",
    label: "Units",
    type: "select",
    default: "metric",
    options: [
      { label: "Metric (°C)", value: "metric" },
      { label: "Imperial (°F)", value: "imperial" },
    ],
  },
  { key: "showFeelsLike", label: "Show feels-like", type: "boolean", default: true },
  { key: "apiKey", label: "API key", type: "text", default: "", help: "From your provider" },
]
```

The `default` values are seeded onto a widget when it is created, and the config
modal falls back to them for any missing keys — so older widgets keep working
when you add new fields.

## If your widget fetches data

Widgets that need external data (weather, calendar, …) should call the backend
rather than third-party APIs directly. Add a backend route under
`backend/app/routers/` that proxies the upstream API, so secrets stay server-side
and the browser only ever talks to `/api/*`. (Pattern to be established with the
Weather widget.)
