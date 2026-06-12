import { useEffect, useRef } from "react";
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

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const escapeHtml = (value: unknown): string =>
  `${value ?? ""}`
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const isMobileViewport = viewportWidth < 768;
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
        itemWidth: isMobileViewport ? 12 : 18,
        itemHeight: isMobileViewport ? 10 : 14,
        itemGap: isMobileViewport ? 8 : 12,
        textStyle: {
          fontSize: isMobileViewport ? 10 : 11,
        },
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
      confine: true,
      extraCssText: `max-width:${isMobileViewport ? 190 : 260}px;white-space:normal;word-break:break-word;overflow-wrap:anywhere;`,
      position: (point: number[], _params: any, _dom: HTMLElement, _rect: any, size: any) => {
        const [pointX, pointY] = point;
        const boxWidth = Number(size?.contentSize?.[0] ?? 0);
        const boxHeight = Number(size?.contentSize?.[1] ?? 0);
        const viewWidth = Number(size?.viewSize?.[0] ?? 0);
        const viewHeight = Number(size?.viewSize?.[1] ?? 0);
        const offset = 12;

        const nextLeft = clamp(pointX - (boxWidth / 2), 8, Math.max(8, viewWidth - boxWidth - 8));
        const preferredTop = pointY - boxHeight - offset;
        const fallbackTop = pointY + offset;
        const nextTop = preferredTop < 8
          ? clamp(fallbackTop, 8, Math.max(8, viewHeight - boxHeight - 8))
          : preferredTop;

        return [nextLeft, nextTop];
      },
      formatter: (params: any) => {
        const point = Array.isArray(params?.data) ? params.data : [];
        const xIndex = Number(point?.[0] ?? -1);
        const yIndex = Number(point?.[1] ?? -1);
        const metricValue = Number(point?.[2] ?? 0);
        const detail = detailMap.get(`${xIndex}:${yIndex}`);
        const queueName = escapeHtml(detail?.queueName ?? yCategories[yIndex] ?? "");
        const bucketLabel = escapeHtml(formatBucketLabel(detail?.bucket ?? xCategories[xIndex] ?? ""));
        const averageElapsed = escapeHtml(formatMetric(detail?.avgElapsedMillis ?? metricValue));

        const rows = [
          `<div style="max-width:${isMobileViewport ? 180 : 240}px;line-height:1.4;white-space:normal;word-break:break-word;overflow-wrap:anywhere;">`,
          `<div style="font-weight:600;margin-bottom:4px;word-break:break-word;overflow-wrap:anywhere;">${queueName}</div>`,
          `<div>Bucket: ${bucketLabel}</div>`,
          `<div>Average Elapsed: ${averageElapsed}</div>`,
        ];

        if (tooltipFields.includes("messageCount") && detail?.messageCount !== undefined) {
          rows.push(`<div>Message Count: ${escapeHtml(new Intl.NumberFormat("en-GB").format(detail.messageCount))}</div>`);
        }
        if (tooltipFields.includes("peakElapsedMillis") && detail?.peakElapsedMillis !== undefined) {
          rows.push(`<div>Peak Elapsed: ${escapeHtml(formatMetric(detail.peakElapsedMillis))}</div>`);
        }

        rows.push("</div>");
        return rows.join("");
      },
    },
    grid: {
      left: isMobileViewport ? 82 : 110,
      right: isMobileViewport ? 10 : 20,
      top: 18,
      bottom: isMobileViewport ? 92 : 70,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: xCategories,
      splitArea: { show: true },
      axisLabel: {
        formatter: (value: string) => formatBucketLabel(value),
        rotate: isMobileViewport ? 45 : 30,
        fontSize: isMobileViewport ? 10 : 11,
        hideOverlap: true,
      },
    },
    yAxis: {
      type: "category",
      data: yCategories,
      splitArea: { show: true },
      axisLabel: {
        interval: 0,
        width: isMobileViewport ? 78 : 100,
        overflow: "truncate" as const,
        fontSize: isMobileViewport ? 10 : 11,
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

  useEffect(() => {
    const resizeChart = () => {
      try {
        chartRef.current?.getEchartsInstance?.()?.resize?.({ width: "auto", height: "auto" });
      } catch {
        // no-op: chart may not be ready yet
      }
    };

    const observedElement =
      containerRef.current?.closest(".grid-stack-item-content") as HTMLElement | null ??
      containerRef.current;

    const observer = typeof ResizeObserver !== "undefined" && observedElement
      ? new ResizeObserver(() => resizeChart())
      : null;

    if (observer && observedElement) {
      observer.observe(observedElement);
    }

    const rafId = window.requestAnimationFrame(resizeChart);
    const timeoutId = window.setTimeout(resizeChart, 120);
    const timeoutIdLong = window.setTimeout(resizeChart, 320);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.clearTimeout(timeoutIdLong);
      observer?.disconnect();
    };
  }, [option]);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 280, flex: 1 }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: "100%", height: "100%", minHeight: 280 }}
        notMerge
        lazyUpdate
        autoResize
      />
    </div>
  );
}
