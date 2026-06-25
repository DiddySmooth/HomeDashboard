import type { LayoutItem, Weather, Widget, WidgetCreate } from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    // Surface the backend's error detail when present (FastAPI sends `detail`).
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* response had no JSON body */
    }
    throw new Error(detail);
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

  getWeather: (
    location: string,
    units: string,
    provider = "open-meteo",
    apiKey = "",
  ) => {
    let url = `/weather?location=${encodeURIComponent(location)}&units=${encodeURIComponent(units)}`;
    url += `&provider=${encodeURIComponent(provider)}`;
    if (apiKey) url += `&api_key=${encodeURIComponent(apiKey)}`;
    return request<Weather>(url);
  },
};
