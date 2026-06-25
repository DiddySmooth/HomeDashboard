import type { ComponentType } from "react";

import type { Widget } from "../types";
import { ClockWidget } from "./ClockWidget/ClockWidget";
import { TodoWidget } from "./TodoWidget/TodoWidget";
import { WeatherRadarWidget } from "./WeatherRadarWidget/WeatherRadarWidget";
import { WeatherWidget } from "./WeatherWidget/WeatherWidget";

/** Props every widget component receives. */
export interface WidgetProps {
  widget: Widget;
}

/** A single configurable option for a widget, used to auto-generate its form. */
export type ConfigField =
  | {
      key: string;
      label: string;
      type: "text" | "number";
      default: string | number;
      help?: string;
    }
  | {
      key: string;
      label: string;
      type: "boolean";
      default: boolean;
      help?: string;
    }
  | {
      key: string;
      label: string;
      type: "select";
      default: string;
      options: { label: string; value: string }[];
      help?: string;
    };

export interface WidgetDefinition {
  /** Stable type id, stored on the widget row. */
  type: string;
  /** Human-readable name shown in the "add widget" UI. */
  name: string;
  /** The component that renders the widget body. */
  component: ComponentType<WidgetProps>;
  /** Default grid size when a new instance is created. */
  defaultSize: { w: number; h: number };
  /** Minimum grid size enforced during resize. */
  minSize?: { w: number; h: number };
  /** Declarative config options; an editor form is generated from these. */
  configFields?: ConfigField[];
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  clock: {
    type: "clock",
    name: "Clock & Date",
    component: ClockWidget,
    defaultSize: { w: 4, h: 3 },
    minSize: { w: 2, h: 2 },
    configFields: [
      {
        key: "format",
        label: "Time format",
        type: "select",
        default: "12h",
        options: [
          { label: "12-hour", value: "12h" },
          { label: "24-hour", value: "24h" },
        ],
      },
      { key: "showSeconds", label: "Show seconds", type: "boolean", default: true },
      { key: "showDate", label: "Show date", type: "boolean", default: true },
    ],
  },
  weather: {
    type: "weather",
    name: "Weather",
    component: WeatherWidget,
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    configFields: [
      {
        key: "location",
        label: "Location",
        type: "text",
        default: "",
        help: "City name, e.g. Seattle",
      },
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
      {
        key: "showForecast",
        label: "Show forecast",
        type: "boolean",
        default: true,
      },
      {
        key: "provider",
        label: "Weather provider",
        type: "select",
        default: "open-meteo",
        options: [
          { label: "Open-Meteo (no key needed)", value: "open-meteo" },
          { label: "OpenWeatherMap", value: "openweathermap" },
        ],
      },
      {
        key: "owmApiKey",
        label: "OpenWeatherMap API key",
        type: "text",
        default: "",
        help: "Required for OpenWeatherMap. Free at openweathermap.org/api",
      },
    ],
  },
  radar: {
    type: "radar",
    name: "Weather Radar",
    component: WeatherRadarWidget,
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    configFields: [
      {
        key: "location",
        label: "Location",
        type: "text",
        default: "",
        help: "City name for map center, e.g. Austin",
      },
      {
        key: "owmApiKey",
        label: "OpenWeatherMap API key",
        type: "text",
        default: "",
        help: "Required. Free at openweathermap.org/api",
      },
      {
        key: "zoom",
        label: "Zoom level",
        type: "number",
        default: 8,
        help: "Map zoom (1–18, higher = closer)",
      },
      {
        key: "layer",
        label: "Map layer",
        type: "select",
        default: "precipitation_new",
        options: [
          { label: "Precipitation", value: "precipitation_new" },
          { label: "Clouds", value: "clouds_new" },
          { label: "Temperature", value: "temp_new" },
          { label: "Wind", value: "wind_new" },
        ],
      },
    ],
  },
  todo: {
    type: "todo",
    name: "To Do List",
    component: TodoWidget,
    defaultSize: { w: 5, h: 5 },
    minSize: { w: 3, h: 3 },
    configFields: [
      {
        key: "defaultCategory",
        label: "Default category",
        type: "number",
        default: 0,
        help: "Category ID to display by default (0 = all)",
      },
    ],
  },
};

export const widgetDefinitions = Object.values(WIDGET_REGISTRY);

/** Build the default config object for a widget type from its declared fields. */
export function defaultConfig(type: string): Record<string, unknown> {
  const fields = WIDGET_REGISTRY[type]?.configFields ?? [];
  return Object.fromEntries(fields.map((f) => [f.key, f.default]));
}
