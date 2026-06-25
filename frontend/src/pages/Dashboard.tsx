import { useCallback, useEffect, useState } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import type { Widget } from "../types";
import {
  WIDGET_REGISTRY,
  defaultConfig,
  widgetDefinitions,
} from "../widgets/registry";
import { WidgetConfigModal } from "../widgets/WidgetConfigModal";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const COLS = 12;
const ROW_HEIGHT = 80;

export function Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);
  const [configuring, setConfiguring] = useState<Widget | null>(null);

  useEffect(() => {
    api
      .listWidgets()
      .then(setWidgets)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const layout: Layout[] = widgets.map((w) => {
    const min = WIDGET_REGISTRY[w.type]?.minSize;
    return {
      i: String(w.id),
      x: w.x,
      y: w.y,
      w: w.w,
      h: w.h,
      minW: min?.w,
      minH: min?.h,
    };
  });

  const onLayoutChange = useCallback(
    (next: Layout[]) => {
      if (!editing) return;
      setWidgets((prev) =>
        prev.map((widget) => {
          const item = next.find((l) => l.i === String(widget.id));
          return item
            ? { ...widget, x: item.x, y: item.y, w: item.w, h: item.h }
            : widget;
        })
      );
      api
        .saveLayout(
          next.map((l) => ({ id: Number(l.i), x: l.x, y: l.y, w: l.w, h: l.h }))
        )
        .catch((e) => setError(String(e)));
    },
    [editing]
  );

  const addWidget = async (type: string) => {
    const def = WIDGET_REGISTRY[type];
    // Place the new widget on a fresh row below everything else.
    const nextY = widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    try {
      const created = await api.createWidget({
        type,
        x: 0,
        y: nextY,
        w: def.defaultSize.w,
        h: def.defaultSize.h,
        config: defaultConfig(type),
      });
      setWidgets((prev) => [...prev, created]);
    } catch (e) {
      setError(String(e));
    }
  };

  const removeWidget = async (id: number) => {
    try {
      await api.deleteWidget(id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      setError(String(e));
    }
  };

  const saveConfig = async (id: number, config: Record<string, unknown>) => {
    try {
      const updated = await api.updateWidget(id, { config });
      setWidgets((prev) => prev.map((w) => (w.id === id ? updated : w)));
      setConfiguring(null);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="dashboard">
      {/* Floating gear menu, top-right. Hidden while editing (the add-bar
          provides the Done control instead). */}
      {!editing && (
        <div className="corner-controls">
          <button
            className="icon-button"
            title="Menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            ⚙
          </button>
          {menuOpen && (
            <>
              <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="menu">
                <button
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                >
                  Edit layout
                </button>
                <Link to="/settings" onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="widget-remove" onClick={() => setError(null)}>
            ✕
          </button>
        </div>
      )}

      {editing && (
        <div className="add-bar">
          <span>Add widget:</span>
          {widgetDefinitions.map((def) => (
            <button key={def.type} onClick={() => addWidget(def.type)}>
              + {def.name}
            </button>
          ))}
          <button className="primary done-button" onClick={() => setEditing(false)}>
            Done
          </button>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p>Loading…</p>
        </div>
      ) : widgets.length === 0 ? (
        <div className="empty-state">
          <p>No widgets yet.</p>
          <button onClick={() => setEditing(true)}>Add your first widget</button>
        </div>
      ) : (
        <GridLayout
          className="layout"
          layout={layout}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          width={width}
          isDraggable={editing}
          isResizable={editing}
          onLayoutChange={onLayoutChange}
          draggableHandle=".widget-header"
        >
          {widgets.map((widget) => {
            const def = WIDGET_REGISTRY[widget.type];
            const Body = def?.component;
            return (
              <div key={String(widget.id)} className="widget-card">
                {editing && (
                  <div className="widget-header">
                    <span>{def?.name ?? widget.type}</span>
                    <div className="widget-actions">
                      {def?.configFields?.length ? (
                        <button
                          className="widget-config"
                          title="Configure"
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={() => setConfiguring(widget)}
                        >
                          ⚙
                        </button>
                      ) : null}
                      <button
                        className="widget-remove"
                        title="Remove"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => removeWidget(widget.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
                <div className="widget-body">
                  {Body ? (
                    <Body widget={widget} />
                  ) : (
                    <div className="widget-unknown">
                      <strong>Unknown widget</strong>
                      <span className="muted">type: {widget.type}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </GridLayout>
      )}

      {configuring && (
        <WidgetConfigModal
          widget={configuring}
          onClose={() => setConfiguring(null)}
          onSave={(config) => saveConfig(configuring.id, config)}
        />
      )}
    </div>
  );
}
