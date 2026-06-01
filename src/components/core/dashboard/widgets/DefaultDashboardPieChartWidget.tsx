import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";
import { DefaultDashboardChartWidget } from "./DefaultDashboardChartWidget";

export function DefaultDashboardPieChartWidget(props: DashboardWidgetComponentProps) {
  return <DefaultDashboardChartWidget {...props} />;
}
