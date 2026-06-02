import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";

export function DefaultDashboardUnknownWidget({ runtime }: DashboardWidgetComponentProps) {
  return (
    <pre style={{ margin: 0, fontSize: "0.78rem", overflow: "auto", maxHeight: "100%" }}>
      {JSON.stringify(runtime?.data ?? runtime ?? {}, null, 2)}
    </pre>
  );
}
