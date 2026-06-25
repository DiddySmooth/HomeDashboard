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
