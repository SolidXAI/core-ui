import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";
import { DefaultDashboardChartWidget } from "./DefaultDashboardChartWidget";

export function DefaultDashboardBarChartWidget(props: DashboardWidgetComponentProps) {
  return <DefaultDashboardChartWidget {...props} />;
}
