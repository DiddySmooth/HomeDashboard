import type { LayoutItem, Widget, WidgetCreate } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listWidgets: () => request<Widget[]>("/widgets"),

  createWidget: (widget: WidgetCreate) =>
    request<Widget>("/widgets", {
      method: "POST",
      body: JSON.stringify(widget),
    }),

  updateWidget: (id: number, patch: Partial<WidgetCreate>) =>
    request<Widget>(`/widgets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  deleteWidget: (id: number) =>
    request<void>(`/widgets/${id}`, { method: "DELETE" }),

  saveLayout: (items: LayoutItem[]) =>
    request<Widget[]>("/widgets/layout", {
      method: "PUT",
      body: JSON.stringify(items),
    }),

  getSettings: () => request<Record<string, unknown>>("/settings"),

  setSetting: (key: string, value: unknown) =>
    request<{ key: string; value: unknown }>(`/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
};
