import { useEffect, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";
import { toEChartsOption } from "../mappers/echartsOptionMapper";

export function DefaultDashboardChartWidget({ definition, runtime }: DashboardWidgetComponentProps) {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const option = toEChartsOption(definition, runtime?.data ?? runtime ?? {});

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
    <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 240, flex: 1 }}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: "100%", height: "100%", minHeight: 240 }}
        notMerge
        lazyUpdate
        autoResize
      />
    </div>
  );
}
