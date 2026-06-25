import { useState } from "react";

import type { Widget } from "../types";
import { WIDGET_REGISTRY, type ConfigField } from "./registry";

interface Props {
  widget: Widget;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

export function WidgetConfigModal({ widget, onSave, onClose }: Props) {
  const def = WIDGET_REGISTRY[widget.type];
  const fields = def?.configFields ?? [];

  // Seed the form from the widget's current config, falling back to defaults.
  const [draft, setDraft] = useState<Record<string, unknown>>(() => {
    const seed: Record<string, unknown> = {};
    for (const f of fields) {
      seed[f.key] = widget.config[f.key] ?? f.default;
    }
    return seed;
  });

  const setValue = (key: string, value: unknown) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configure {def?.name ?? widget.type}</h2>
          <button className="widget-remove" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {fields.length === 0 && (
            <p className="muted">This widget has no options.</p>
          )}
          {fields.map((field) => (
            <Field
              key={field.key}
              field={field}
              value={draft[field.key]}
              onChange={(v) => setValue(field.key, v)}
            />
          ))}
        </div>

        <div className="modal-footer">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={() => onSave(draft)}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: ConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "boolean") {
    return (
      <label className="field-row">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="field">
        <span>{field.label}</span>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {field.help && <small className="muted">{field.help}</small>}
      </label>
    );
  }

  return (
    <label className="field">
      <span>{field.label}</span>
      <input
        type={field.type === "number" ? "number" : "text"}
        value={String(value ?? "")}
        onChange={(e) =>
          onChange(
            field.type === "number" ? Number(e.target.value) : e.target.value
          )
        }
      />
      {field.help && <small className="muted">{field.help}</small>}
    </label>
  );
}
