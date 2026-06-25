export interface Widget {
  id: number;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config: Record<string, unknown>;
}

export type WidgetCreate = Omit<Widget, "id">;

export interface LayoutItem {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WeatherCurrent {
  temp: number;
  apparent_temp: number;
  humidity: number;
  wind_speed: number;
  code: number;
  description: string;
  is_day: boolean;
}

export interface WeatherDaily {
  date: string;
  code: number;
  min: number;
  max: number;
  description: string;
}

export interface Weather {
  location: string;
  units: { temp: string; wind: string };
  current: WeatherCurrent;
  daily: WeatherDaily[];
}
