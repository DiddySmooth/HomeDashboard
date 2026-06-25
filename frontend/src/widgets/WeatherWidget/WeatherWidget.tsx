import { useCallback, useEffect, useState } from "react";

import { api } from "../../api/client";
import type { Weather } from "../../types";
import type { WidgetProps } from "../registry";

import "./WeatherWidget.css";

const REFRESH_MS = 10 * 60 * 1000; // 10 minutes

/** Map a WMO weather code to an emoji, day/night aware for clear/cloudy. */
function weatherEmoji(code: number, isDay = true): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code === 1 || code === 2) return isDay ? "🌤️" : "☁️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if (code >= 61 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80 && code <= 82) return "🌧️";
  if (code >= 85 && code <= 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌡️";
}

function dayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { weekday: "short" });
}

export function WeatherWidget({ widget }: WidgetProps) {
  const location = (widget.config.location as string) ?? "";
  const units = (widget.config.units as string) ?? "metric";
  const provider = (widget.config.provider as string) ?? "open-meteo";
  const owmApiKey = (widget.config.owmApiKey as string) ?? "";
  const showForecast = widget.config.showForecast !== false;

  const [data, setData] = useState<Weather | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!location.trim()) return;
    if (provider === "openweathermap" && !owmApiKey.trim()) return;
    setLoading(true);
    api
      .getWeather(location, units, provider, owmApiKey)
      .then((w) => {
        setData(w);
        setError(null);
      })
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
  }, [location, units, provider, owmApiKey]);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  if (!location.trim()) {
    return (
      <div className="weather-widget weather-empty">
        <span className="weather-icon">🌡️</span>
        <p className="muted">Set a location in this widget's settings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-widget weather-empty">
        <span className="weather-icon">⚠️</span>
        <p className="muted">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="weather-widget weather-empty">
        <p className="muted">{loading ? "Loading…" : ""}</p>
      </div>
    );
  }

  const { current, units: u } = data;

  return (
    <div className="weather-widget">
      <div className="weather-location">{data.location}</div>

      <div className="weather-current">
        <span className="weather-icon">
          {weatherEmoji(current.code, current.is_day)}
        </span>
        <span className="weather-temp">
          {current.temp}
          {u.temp}
        </span>
      </div>

      <div className="weather-description">{current.description}</div>

      <div className="weather-meta">
        <span>
          Feels {current.apparent_temp}
          {u.temp}
        </span>
        <span>💧 {current.humidity}%</span>
        <span>
          💨 {current.wind_speed} {u.wind}
        </span>
      </div>

      {showForecast && data.daily.length > 1 && (
        <div className="weather-forecast">
          {data.daily.slice(1, 5).map((d) => (
            <div key={d.date} className="weather-forecast-day" title={d.description}>
              <span className="weather-forecast-label">{dayLabel(d.date)}</span>
              <span className="weather-forecast-icon">
                {weatherEmoji(d.code)}
              </span>
              <span className="weather-forecast-temps">
                {d.max}° <span className="muted">{d.min}°</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
