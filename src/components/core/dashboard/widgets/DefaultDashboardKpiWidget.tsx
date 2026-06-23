import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";

export function DefaultDashboardKpiWidget({ runtime }: DashboardWidgetComponentProps) {
  const value = runtime?.data?.value ?? runtime?.value ?? "--";
  const suffix = runtime?.uiHints?.suffix ?? "";
  const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div
      style={{
        fontSize: isMobileViewport ? "1.55rem" : "1.9rem",
        fontWeight: 700,
        lineHeight: 1.1,
      }}
    >
      {`${value}${suffix}`}
    </div>
  );
}
