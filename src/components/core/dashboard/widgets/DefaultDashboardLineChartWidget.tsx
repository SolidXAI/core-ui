import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";
import { DefaultDashboardChartWidget } from "./DefaultDashboardChartWidget";

export function DefaultDashboardLineChartWidget(props: DashboardWidgetComponentProps) {
  return <DefaultDashboardChartWidget {...props} />;
}
