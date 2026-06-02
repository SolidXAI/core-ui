import ReactECharts from "echarts-for-react";
import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";

type HeatmapPointDetail = {
  xIndex: number;
  yIndex: number;
  bucket?: string;
  queueName?: string;
  avgElapsedMillis?: number;
  messageCount?: number;
  peakElapsedMillis?: number;
  [key: string]: any;
};

type HeatmapLegendThreshold = {
  label?: string;
  color?: string;
  lte?: number;
  gte?: number;
  gt?: number;
};

const formatBucketLabel = (value: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatMetric = (value: number | undefined, unit = "ms"): string => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "--";
  }
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(Number(value))}${unit}`;
};

export function QueueSlaHeatmapWidget({ runtime }: DashboardWidgetComponentProps) {
  const data = runtime?.data ?? runtime ?? {};
  const xCategories: string[] = Array.isArray(data?.xCategories) ? data.xCategories : [];
  const yCategories: string[] = Array.isArray(data?.yCategories) ? data.yCategories : [];
  const points: [number, number, number][] = Array.isArray(data?.points) ? data.points : [];
  const pointDetails: HeatmapPointDetail[] = Array.isArray(data?.pointDetails) ? data.pointDetails : [];
  const tooltipFields: string[] = Array.isArray(data?.tooltipFields) ? data.tooltipFields : [];
  const legendThresholds: HeatmapLegendThreshold[] = Array.isArray(data?.legendThresholds) ? data.legendThresholds : [];

  if (xCategories.length === 0 || yCategories.length === 0 || points.length === 0) {
    return (
      <div style={{ height: "100%", minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.92rem" }}>
        No SLA heatmap data available for the current filters.
      </div>
    );
  }

  const detailMap = new Map(
    pointDetails.map((detail) => [`${detail.xIndex}:${detail.yIndex}`, detail] satisfies [string, HeatmapPointDetail])
  );

  const metricValues = points.map((entry) => Number(entry?.[2] ?? 0)).filter((entry) => Number.isFinite(entry));
  const min = metricValues.length ? Math.min(...metricValues) : 0;
  const max = metricValues.length ? Math.max(...metricValues) : 0;

  const visualMap = legendThresholds.length > 0
    ? {
        type: "piecewise",
        orient: "horizontal" as const,
        left: "center" as const,
        bottom: 0,
        pieces: legendThresholds.map((threshold) => ({
          label: threshold.label,
          color: threshold.color,
          lte: threshold.lte,
          gte: threshold.gte,
          gt: threshold.gt,
        })),
      }
    : {
        min,
        max,
        calculable: true,
        orient: "horizontal" as const,
        left: "center" as const,
        bottom: 0,
      };

  const option = {
    tooltip: {
      position: "top" as const,
      formatter: (params: any) => {
        const point = Array.isArray(params?.data) ? params.data : [];
        const xIndex = Number(point?.[0] ?? -1);
        const yIndex = Number(point?.[1] ?? -1);
        const metricValue = Number(point?.[2] ?? 0);
        const detail = detailMap.get(`${xIndex}:${yIndex}`);

        const rows = [
          `<div style="font-weight:600;margin-bottom:4px;">${detail?.queueName ?? yCategories[yIndex] ?? ""}</div>`,
          `<div>Bucket: ${formatBucketLabel(detail?.bucket ?? xCategories[xIndex] ?? "")}</div>`,
          `<div>Average Elapsed: ${formatMetric(detail?.avgElapsedMillis ?? metricValue)}</div>`,
        ];

        if (tooltipFields.includes("messageCount") && detail?.messageCount !== undefined) {
          rows.push(`<div>Message Count: ${new Intl.NumberFormat("en-GB").format(detail.messageCount)}</div>`);
        }
        if (tooltipFields.includes("peakElapsedMillis") && detail?.peakElapsedMillis !== undefined) {
          rows.push(`<div>Peak Elapsed: ${formatMetric(detail.peakElapsedMillis)}</div>`);
        }

        return rows.join("");
      },
    },
    grid: {
      left: 110,
      right: 20,
      top: 18,
      bottom: 70,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: xCategories,
      splitArea: { show: true },
      axisLabel: {
        formatter: (value: string) => formatBucketLabel(value),
        rotate: 30,
      },
    },
    yAxis: {
      type: "category",
      data: yCategories,
      splitArea: { show: true },
      axisLabel: {
        interval: 0,
      },
    },
    visualMap,
    series: [
      {
        name: "Queue SLA",
        type: "heatmap",
        data: points,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.25)",
          },
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ width: "100%", height: "100%", minHeight: 280 }} notMerge lazyUpdate />;
}
