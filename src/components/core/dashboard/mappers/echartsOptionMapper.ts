import type { EChartsOption } from "echarts";

const readType = (definition: any): string => {
  const raw =
    definition?.visualization?.type ??
    definition?.visualization?.chartType ??
    definition?.type ??
    definition?.widgetType ??
    "";
  return `${raw}`.toLowerCase();
};

export const resolveChartType = (definition: any): "line" | "bar" | "pie" | "unknown" => {
  const type = readType(definition);
  if (type.includes("line")) return "line";
  if (type.includes("bar")) return "bar";
  if (type.includes("pie") || type.includes("donut") || type.includes("doughnut")) return "pie";
  return "unknown";
};

const seriesFromRuntime = (runtimeData: any, forcedType: "line" | "bar"): any[] => {
  const source = Array.isArray(runtimeData?.series) ? runtimeData.series : [];
  return source.map((entry: any) => ({
    name: entry?.name ?? "",
    type: forcedType,
    smooth: forcedType === "line",
    data: Array.isArray(entry?.data) ? entry.data : [],
  }));
};

export const toEChartsOption = (definition: any, runtimeData: any): EChartsOption => {
  const chartType = resolveChartType(definition);

  if (chartType === "pie") {
    const items = Array.isArray(runtimeData?.items) ? runtimeData.items : [];
    return {
      tooltip: { trigger: "item" },
      legend: { top: 0 },
      series: [
        {
          type: "pie",
          radius: ["42%", "70%"],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 1 },
          label: { show: true, formatter: "{b}: {d}%" },
          data: items.map((item: any) => ({
            name: item?.name ?? item?.label ?? "",
            value: item?.value ?? 0,
          })),
        },
      ],
    };
  }

  if (chartType === "line" || chartType === "bar") {
    return {
      tooltip: { trigger: "axis" },
      legend: { top: 0 },
      grid: { left: 20, right: 20, bottom: 24, top: 36, containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: chartType === "bar",
        data: Array.isArray(runtimeData?.categories) ? runtimeData.categories : [],
      },
      yAxis: { type: "value" },
      series: seriesFromRuntime(runtimeData, chartType),
    };
  }

  return {
    title: {
      text: "Unsupported chart type",
      left: "center",
      top: "middle",
      textStyle: { fontSize: 12, fontWeight: "normal", color: "#64748b" },
    },
  };
};
