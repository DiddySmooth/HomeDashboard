import { useEffect, useState } from "react";

import type { WidgetProps } from "./registry";

export function ClockWidget({ widget }: WidgetProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const cfg = widget.config;
  const use24h = cfg.format === "24h";
  const showSeconds = cfg.showSeconds !== false;
  const showDate = cfg.showDate !== false;

  const time = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" } : {}),
    hour12: !use24h,
  });
  const date = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="clock-widget">
      <div className="clock-time">{time}</div>
      {showDate && <div className="clock-date">{date}</div>}
    </div>
  );
}
