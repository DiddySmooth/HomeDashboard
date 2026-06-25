import type { ComponentType } from "react";

import type { Widget } from "../types";
import { ClockWidget } from "./ClockWidget";

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
};

export const widgetDefinitions = Object.values(WIDGET_REGISTRY);

/** Build the default config object for a widget type from its declared fields. */
export function defaultConfig(type: string): Record<string, unknown> {
  const fields = WIDGET_REGISTRY[type]?.configFields ?? [];
  return Object.fromEntries(fields.map((f) => [f.key, f.default]));
}
