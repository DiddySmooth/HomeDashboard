import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";

export function Settings() {
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const updateTheme = async (theme: string) => {
    await api.setSetting("theme", theme);
    setSettings((prev) => ({ ...prev, theme }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const theme = (settings.theme as string) ?? "dark";

  return (
    <div className="settings-page">
      <div className="toolbar">
        <h1>Settings</h1>
        <Link to="/" className="button-link">
          Back to dashboard
        </Link>
      </div>

      <section className="settings-section">
        <h2>Appearance</h2>
        <label>
          Theme
          <select value={theme} onChange={(e) => updateTheme(e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        {saved && <span className="saved-hint">Saved</span>}
      </section>

      <section className="settings-section">
        <h2>Widgets</h2>
        <p className="muted">
          Per-widget configuration (weather location, calendar URL, Home
          Assistant connection) will live here as those widgets are added.
        </p>
      </section>
    </div>
  );
}
