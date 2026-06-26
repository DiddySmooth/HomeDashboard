import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { WidgetProps } from "../registry";
import "./WeatherRadarWidget.css";

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REFRESH_MS = 10 * 60 * 1000;

export function WeatherRadarWidget({ widget }: WidgetProps) {
  const location = (widget.config.location as string) ?? "";
  const owmApiKey = (widget.config.owmApiKey as string) ?? "";
  const zoom = Number(widget.config.zoom) || 8;
  const layer = (widget.config.layer as string) || "precipitation_new";

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.TileLayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const geocode = useCallback(async (loc: string): Promise<[number, number]> => {
    const res = await fetch(`${GEOCODE_URL}?name=${encodeURIComponent(loc)}&count=1`);
    const data = await res.json();
    const results = data.results;
    if (!results?.length) throw new Error(`Location not found: ${loc}`);
    return [results[0].latitude, results[0].longitude];
  }, []);

  useEffect(() => {
    if (!containerRef.current || !location.trim() || !owmApiKey.trim()) return;

    let cancelled = false;

    (async () => {
      try {
        const [lat, lng] = await geocode(location);
        if (cancelled) return;

        if (!mapRef.current) {
          mapRef.current = L.map(containerRef.current!, {
            center: [lat, lng],
            zoom,
            zoomControl: false,
            attributionControl: false,
          });

          L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            { maxZoom: 18 }
          ).addTo(mapRef.current);
        } else {
          mapRef.current.setView([lat, lng], zoom);
        }

        if (overlayRef.current) {
          mapRef.current.removeLayer(overlayRef.current);
        }

        const tileUrl = `/api/radar/tile/${layer}/{z}/{x}/{y}.png?api_key=${encodeURIComponent(owmApiKey)}`;
        overlayRef.current = L.tileLayer(tileUrl, {
          opacity: 0.6,
          maxZoom: 18,
        }).addTo(mapRef.current);

        setError(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => { cancelled = true; };
  }, [location, owmApiKey, zoom, layer, geocode]);

  // Invalidate map size when the widget container resizes
  useEffect(() => {
    if (!containerRef.current || !mapRef.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  });

  // Refresh the overlay periodically
  useEffect(() => {
    if (!overlayRef.current) return;
    const id = setInterval(() => {
      overlayRef.current?.setUrl(overlayRef.current.getTileUrl({} as L.Coords));
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [layer, owmApiKey]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, []);

  if (!location.trim()) {
    return (
      <div className="radar-widget radar-empty">
        <span className="radar-icon">🗺️</span>
        <p className="muted">Set a location in this widget's settings.</p>
      </div>
    );
  }

  if (!owmApiKey.trim()) {
    return (
      <div className="radar-widget radar-empty">
        <span className="radar-icon">🔑</span>
        <p className="muted">An OpenWeatherMap API key is required for radar.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="radar-widget radar-empty">
        <span className="radar-icon">⚠️</span>
        <p className="muted">{error}</p>
      </div>
    );
  }

  return <div ref={containerRef} className="radar-widget radar-map" />;
}
