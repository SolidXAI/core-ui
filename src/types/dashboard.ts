export type DashboardWidgetComponentProps = {
  definition: any;
  runtime: any;
  variables: Record<string, any>;
};

export type DashboardWidgetRendererKey =
  | "kpi"
  | "line"
  | "bar"
  | "pie"
  | "table"
  | "unknown";

export type DashboardGridLayoutItem = {
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};
