import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { GridStack, type GridStackNode } from "gridstack";
import "gridstack/dist/gridstack.min.css";
import { getExtensionComponent } from "../../../../helpers/registry";
import { SolidButton, SolidDatePicker, SolidSelect, SolidSpinner } from "../../../../components/shad-cn-ui";
import { resolveChartType } from "../../../../components/core/dashboard/mappers/echartsOptionMapper";
import {
  useGetDashboardDataMutation,
  useGetDashboardDefinitionQuery,
  useGetDashboardLayoutQuery,
  useLazyGetDashboardVariableOptionsQuery,
  useSaveDashboardLayoutMutation,
} from "../../../../redux/api/dashboardRuntimeApi";
import type { DashboardGridLayoutItem, DashboardWidgetComponentProps } from "../../../../types/dashboard";
import styles from "./DashboardPage.module.css";

type Option = {
  label: string;
  value: string;
};

type DateRangeValue = {
  start: Date | null;
  end: Date | null;
};

type DashboardVariableValue = string | string[] | DateRangeValue | null | undefined;

const normalizeType = (value: unknown): string => `${value ?? ""}`.toLowerCase();

const isDateRangeVariable = (variable: any): boolean => {
  const type = normalizeType(variable?.type);
  return type === "daterange" || type === "date_range";
};

const isDynamicVariable = (variable: any): boolean => {
  const type = normalizeType(variable?.type);
  return type === "selectiondynamic" || type === "dynamicselect" || type === "selectdynamic";
};

const isStaticVariable = (variable: any): boolean => {
  const type = normalizeType(variable?.type);
  return type === "selectionstatic" || type === "select" || type === "multiselect";
};

const isMultiValueVariable = (variable: any): boolean => {
  const type = normalizeType(variable?.type);
  return type === "multiselect" || !!variable?.multiple || !!variable?.allowMultiple;
};

const toOptions = (options: any[]): Option[] =>
  (options ?? [])
    .map((entry: any) => {
      if (typeof entry === "string") {
        const [value, label] = entry.split(":");
        return { value, label: label ?? value };
      }
      return {
        value: `${entry?.value ?? entry?.id ?? ""}`,
        label: `${entry?.label ?? entry?.name ?? entry?.value ?? entry?.id ?? ""}`,
      };
    })
    .filter((entry) => !!entry.value);

const toIso = (value: Date | null | undefined): string | null => {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value.toISOString();
};

const extractWidgetName = (widgetData: any): string =>
  widgetData?.meta?.widgetName ?? widgetData?.widgetName ?? widgetData?.id ?? "";

const sortLayoutItems = (items: DashboardGridLayoutItem[]): DashboardGridLayoutItem[] =>
  [...(items ?? [])].sort((a, b) => {
    const byY = (a?.y ?? 0) - (b?.y ?? 0);
    if (byY !== 0) return byY;
    return (a?.x ?? 0) - (b?.x ?? 0);
  });

const toLayoutItems = (items: any[]): DashboardGridLayoutItem[] =>
  (items ?? [])
    .filter((item) => !!(item?.widgetId ?? item?.id))
    .map((item) => ({
      widgetId: item?.widgetId ?? item?.id,
      x: Number(item?.x ?? 0),
      y: Number(item?.y ?? 0),
      w: Number(item?.w ?? 4),
      h: Number(item?.h ?? 3),
      minW: item?.minW !== undefined ? Number(item?.minW) : undefined,
      minH: item?.minH !== undefined ? Number(item?.minH) : undefined,
    }));

const resolveDefaultDashboardWidgetComponentName = (definition: any, runtime: any): string => {
  const runtimeData = runtime?.data ?? runtime ?? {};
  if (runtimeData?.value !== undefined) return "DefaultDashboardKpiWidget";
  if (Array.isArray(runtimeData?.columns) && Array.isArray(runtimeData?.records)) return "DefaultDashboardTableWidget";

  const chartType = resolveChartType(definition);
  if (chartType === "line") return "DefaultDashboardLineChartWidget";
  if (chartType === "bar") return "DefaultDashboardBarChartWidget";
  if (chartType === "pie") return "DefaultDashboardPieChartWidget";
  return "DefaultDashboardUnknownWidget";
};

const getPreferredWidgetComponentName = (definition: any, runtime: any): string => {
  const explicit =
    definition?.componentName ??
    definition?.widgetComponentName ??
    definition?.renderer?.componentName ??
    definition?.ui?.componentName;
  return explicit || resolveDefaultDashboardWidgetComponentName(definition, runtime);
};

export function DashboardPage() {
  const params = useParams();
  const moduleName = params.moduleName ?? "";
  const dashboardName = params.dashboardName ?? "";
  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);

  const { data: definition, isLoading: definitionLoading } = useGetDashboardDefinitionQuery(
    { moduleName, dashboardName },
    { skip: !moduleName || !dashboardName }
  );

  const { data: layoutData } = useGetDashboardLayoutQuery(
    { moduleName, dashboardName },
    { skip: !moduleName || !dashboardName }
  );

  const [getDashboardData, { data: dashboardData, isLoading: dataLoading, error: dataError }] = useGetDashboardDataMutation();
  const [saveDashboardLayout, { isLoading: saveLayoutLoading }] = useSaveDashboardLayoutMutation();
  const [getVariableOptions] = useLazyGetDashboardVariableOptionsQuery();

  const [variableValues, setVariableValues] = useState<Record<string, DashboardVariableValue>>({});
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, Option[]>>({});
  const [draftLayoutItems, setDraftLayoutItems] = useState<DashboardGridLayoutItem[] | null>(null);
  const bootstrappedRef = useRef(false);

  const variables = useMemo(() => (Array.isArray(definition?.variables) ? definition.variables : []), [definition]);
  const definitionWidgets = useMemo(() => (Array.isArray(definition?.widgets) ? definition.widgets : []), [definition]);
  const effectiveLayoutItems = useMemo(
    () => toLayoutItems(layoutData?.effectiveLayout?.items ?? []),
    [layoutData]
  );
  const gridColumns = Number(layoutData?.effectiveLayout?.columns ?? 12) || 12;

  useEffect(() => {
    if (!definition || bootstrappedRef.current) return;
    const defaults: Record<string, DashboardVariableValue> = {};
    variables.forEach((variable: any) => {
      const name = variable?.name;
      if (!name) return;

      if (isDateRangeVariable(variable)) {
        const start = variable?.defaultValue?.start ? new Date(variable.defaultValue.start) : null;
        const end = variable?.defaultValue?.end ? new Date(variable.defaultValue.end) : null;
        defaults[name] = { start, end };
        return;
      }

      if (isMultiValueVariable(variable)) {
        const base = variable?.defaultValue;
        defaults[name] = Array.isArray(base) ? base.map((entry: any) => `${entry}`) : [];
        return;
      }

      if (variable?.defaultValue !== undefined && variable?.defaultValue !== null) {
        defaults[name] = `${variable.defaultValue}`;
        return;
      }

      defaults[name] = "";
    });

    setVariableValues(defaults);
    bootstrappedRef.current = true;
  }, [definition, variables]);

  useEffect(() => {
    if (!moduleName || !dashboardName || variables.length === 0) return;
    const dynamicVariables = variables.filter((variable: any) => isDynamicVariable(variable));
    dynamicVariables.forEach((variable: any) => {
      const variableName = variable?.name;
      if (!variableName) return;
      void getVariableOptions({ moduleName, dashboardName, variableName, limit: 100 })
        .unwrap()
        .then((response) => {
          setDynamicOptions((prev) => ({ ...prev, [variableName]: toOptions(Array.isArray(response) ? response : []) }));
        })
        .catch(() => {
          setDynamicOptions((prev) => ({ ...prev, [variableName]: [] }));
        });
    });
  }, [dashboardName, getVariableOptions, moduleName, variables]);

  useEffect(() => {
    if (!bootstrappedRef.current || !moduleName || !dashboardName) return;
    void handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleName, dashboardName, bootstrappedRef.current]);

  const widgetDefinitionMap = useMemo(() => {
    const map = new Map<string, any>();
    definitionWidgets.forEach((widget: any) => {
      if (widget?.id) map.set(widget.id, widget);
      if (widget?.name) map.set(widget.name, widget);
    });
    return map;
  }, [definitionWidgets]);

  const widgetDataMap = useMemo(() => {
    const map = new Map<string, any>();
    const rows = Array.isArray(dashboardData?.widgets) ? dashboardData.widgets : [];
    rows.forEach((row: any) => {
      const name = extractWidgetName(row);
      if (name) map.set(name, row);
    });
    return map;
  }, [dashboardData]);

  const orderedWidgets = useMemo(() => {
    const layoutItems = sortLayoutItems(effectiveLayoutItems);
    if (!layoutItems.length) return definitionWidgets;

    const seen = new Set<string>();
    const arranged: any[] = [];
    layoutItems.forEach((item: DashboardGridLayoutItem) => {
      const key = item?.widgetId;
      const definitionWidget = widgetDefinitionMap.get(key);
      if (!definitionWidget || seen.has(key)) return;
      arranged.push(definitionWidget);
      seen.add(key);
    });

    definitionWidgets.forEach((widget: any) => {
      const key = widget?.id ?? widget?.name;
      if (!key || seen.has(key)) return;
      arranged.push(widget);
    });

    return arranged;
  }, [definitionWidgets, effectiveLayoutItems, widgetDefinitionMap]);

  const widgetLayoutMap = useMemo(() => {
    const map = new Map<string, DashboardGridLayoutItem>();
    effectiveLayoutItems.forEach((item) => map.set(item.widgetId, item));
    return map;
  }, [effectiveLayoutItems]);

  useEffect(() => {
    if (!gridRef.current || orderedWidgets.length === 0) return;

    if (gridInstanceRef.current) {
      gridInstanceRef.current.destroy(false);
      gridInstanceRef.current = null;
    }

    const instance = GridStack.init(
      {
        column: gridColumns,
        cellHeight: 92,
        margin: 8,
        float: true,
      },
      gridRef.current
    );

    instance.on("change", (_event: Event, items: GridStackNode[]) => {
      const normalized = toLayoutItems(
        (items ?? []).map((item) => ({
          widgetId:
            item?.id ??
            (item as any)?.el?.getAttribute?.("gs-id") ??
            (item as any)?.el?.getAttribute?.("id"),
          x: item?.x,
          y: item?.y,
          w: item?.w,
          h: item?.h,
          minW: item?.minW,
          minH: item?.minH,
        }))
      );
      setDraftLayoutItems(normalized);
    });

    gridInstanceRef.current = instance;
    return () => {
      instance.destroy(false);
      if (gridInstanceRef.current === instance) gridInstanceRef.current = null;
    };
  }, [orderedWidgets, gridColumns]);

  const handleVariableChange = (variableName: string, value: DashboardVariableValue) => {
    setVariableValues((prev) => ({ ...prev, [variableName]: value }));
  };

  const buildPayloadVariables = (): Record<string, any> => {
    const payload: Record<string, any> = {};
    variables.forEach((variable: any) => {
      const name = variable?.name;
      if (!name) return;
      const value = variableValues[name];

      if (isDateRangeVariable(variable)) {
        const range = value as DateRangeValue | undefined;
        const start = toIso(range?.start ?? null);
        const end = toIso(range?.end ?? null);
        if (!start && !end) return;
        payload[name] = { start, end };
        return;
      }

      if (isMultiValueVariable(variable)) {
        const list = Array.isArray(value) ? value.filter(Boolean) : [];
        if (!list.length) return;
        payload[name] = list;
        return;
      }

      if (value === undefined || value === null || value === "") return;
      payload[name] = value;
    });
    return payload;
  };

  async function handleRefresh() {
    if (!moduleName || !dashboardName) return;
    await getDashboardData({
      moduleName,
      dashboardName,
      variables: buildPayloadVariables(),
    }).unwrap();
  }

  async function handleSaveLayout() {
    if (!moduleName || !dashboardName) return;
    const baseLayout = effectiveLayoutItems.length ? effectiveLayoutItems : [];
    const items = draftLayoutItems && draftLayoutItems.length ? draftLayoutItems : baseLayout;
    await saveDashboardLayout({
      moduleName,
      dashboardName,
      layout: {
        engine: "gridstack",
        columns: gridColumns,
        items,
      },
    }).unwrap();
    setDraftLayoutItems(null);
  }

  const renderVariable = (variable: any) => {
    const variableName = variable?.name;
    if (!variableName) return null;

    const value = variableValues[variableName];
    const label = variable?.label ?? variableName;

    if (isDateRangeVariable(variable)) {
      const range = (value as DateRangeValue | undefined) ?? { start: null, end: null };
      return (
        <div key={variableName} className={styles.filterField}>
          <label className={styles.filterLabel}>{label}</label>
          <div className={styles.dateRange}>
            <SolidDatePicker
              selected={range.start ?? null}
              onChange={(next: Date | null) =>
                handleVariableChange(variableName, { start: next ?? null, end: range.end ?? null })
              }
              placeholderText="Start date"
              dateFormat="yyyy-MM-dd"
            />
            <SolidDatePicker
              selected={range.end ?? null}
              onChange={(next: Date | null) =>
                handleVariableChange(variableName, { start: range.start ?? null, end: next ?? null })
              }
              placeholderText="End date"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>
      );
    }

    if (isMultiValueVariable(variable)) {
      const baseOptions = isDynamicVariable(variable)
        ? (dynamicOptions[variableName] ?? [])
        : toOptions(variable?.selectionStaticValues ?? variable?.options ?? []);
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div key={variableName} className={styles.filterField}>
          <label className={styles.filterLabel}>{label}</label>
          <select
            multiple
            className={styles.multiSelect}
            value={selectedValues}
            onChange={(event) => {
              const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
              handleVariableChange(variableName, selected);
            }}
          >
            {baseOptions.map((option) => (
              <option key={`${variableName}-${option.value}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    const options = isDynamicVariable(variable)
      ? (dynamicOptions[variableName] ?? [])
      : isStaticVariable(variable)
        ? toOptions(variable?.selectionStaticValues ?? variable?.options ?? [])
        : [];

    return (
      <div key={variableName} className={styles.filterField}>
        <label className={styles.filterLabel}>{label}</label>
        <SolidSelect
          value={typeof value === "string" ? value : ""}
          options={options}
          optionLabel="label"
          optionValue="value"
          placeholder={`Select ${label}`}
          onChange={(event) => handleVariableChange(variableName, event.value ? `${event.value}` : "")}
        />
      </div>
    );
  };

  const renderWidgetBody = (widgetDefinition: any, runtime: any) => {
    const componentName = getPreferredWidgetComponentName(widgetDefinition, runtime);
    const ExtensionWidget = getExtensionComponent(componentName);
    if (!ExtensionWidget) {
      const UnknownWidget = getExtensionComponent("DefaultDashboardUnknownWidget");
      if (!UnknownWidget) return <pre>{JSON.stringify(runtime?.data ?? runtime ?? {}, null, 2)}</pre>;
      return <UnknownWidget definition={widgetDefinition} runtime={runtime} variables={variableValues} />;
    }
    return (
      <ExtensionWidget
        {...({ definition: widgetDefinition, runtime, variables: variableValues } satisfies DashboardWidgetComponentProps)}
      />
    );
  };

  if (definitionLoading) {
    return (
      <div className={styles.page}>
        <SolidSpinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>{definition?.title ?? dashboardName}</h1>
          <p className={styles.subtitle}>
            {definition?.description ?? `${moduleName} / ${dashboardName}`}
          </p>
        </div>
        <div className={styles.headerActions}>
          <SolidButton onClick={() => void handleRefresh()} disabled={dataLoading}>
            {dataLoading ? "Refreshing..." : "Refresh"}
          </SolidButton>
          <SolidButton onClick={() => void handleSaveLayout()} disabled={saveLayoutLoading}>
            {saveLayoutLoading ? "Saving..." : "Save Layout"}
          </SolidButton>
        </div>
      </div>

      <div className={styles.filterPanel}>
        <div className={styles.filterGrid}>{variables.map(renderVariable)}</div>
        <div className={styles.actions}>
          <SolidButton onClick={() => void handleRefresh()} disabled={dataLoading}>
            Apply Filters
          </SolidButton>
        </div>
      </div>

      {dataError ? <p className={styles.error}>Failed to load dashboard data.</p> : null}

      <div ref={gridRef} className={`grid-stack ${styles.gridStack}`}>
        {orderedWidgets.map((widget: any) => {
          const widgetName = widget?.id ?? widget?.name;
          const runtime = widgetDataMap.get(widgetName);
          const slot = widgetLayoutMap.get(widgetName);
          return (
            <div
              key={widgetName}
              className="grid-stack-item"
              gs-id={widgetName}
              gs-x={slot?.x ?? 0}
              gs-y={slot?.y ?? 0}
              gs-w={slot?.w ?? 4}
              gs-h={slot?.h ?? 3}
              gs-min-w={slot?.minW ?? 2}
              gs-min-h={slot?.minH ?? 2}
            >
              <div className={`grid-stack-item-content ${styles.widgetCard}`}>
                <h3 className={styles.widgetTitle}>{widget?.title ?? widgetName}</h3>
                <div className={styles.widgetBody}>
                  {runtime ? renderWidgetBody(widget, runtime) : <p className={styles.muted}>No data</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
