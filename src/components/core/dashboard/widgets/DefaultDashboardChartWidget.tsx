import ReactECharts from "echarts-for-react";
import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";
import { toEChartsOption } from "../mappers/echartsOptionMapper";

export function DefaultDashboardChartWidget({ definition, runtime }: DashboardWidgetComponentProps) {
  const option = toEChartsOption(definition, runtime?.data ?? runtime ?? {});
  return <ReactECharts option={option} style={{ width: "100%", height: "100%", minHeight: 240 }} notMerge lazyUpdate />;
}
