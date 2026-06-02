import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";

export function DefaultDashboardKpiWidget({ runtime }: DashboardWidgetComponentProps) {
  const value = runtime?.data?.value ?? runtime?.value ?? "--";
  const suffix = runtime?.uiHints?.suffix ?? "";
  return <div style={{ fontSize: "1.9rem", fontWeight: 700 }}>{`${value}${suffix}`}</div>;
}
