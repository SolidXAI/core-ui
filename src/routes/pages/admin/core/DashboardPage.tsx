import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Filter, RefreshCw, Save } from "lucide-react";
import { GridStack, type GridStackNode } from "gridstack";
import "gridstack/dist/gridstack.min.css";
import { getExtensionComponent } from "../../../../helpers/registry";
import {
  SolidButton,
  SolidDatePicker,
  SolidDialog,
  SolidDialogBody,
  SolidDialogFooter,
  SolidSelect,
  SolidSpinner,
} from "../../../../components/shad-cn-ui";
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
  return type === "date" || type === "daterange" || type === "date_range";
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
  return type === "multiselect" || !!variable?.multiple || !!variable?.allowMultiple || !!variable?.isMultiSelect;
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
        label: `${entry?.label ?? entry?.name ?? entry?.displayName ?? entry?.value ?? entry?.id ?? ""}`,
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

const getAllLayoutItemsFromGrid = (grid: GridStack | null): DashboardGridLayoutItem[] => {
  if (!grid) return [];
  const snapshot = grid.save(false, false, (node: any, widget: any) => {
    if (!widget.id) {
      widget.id =
        node?.id ??
        node?.el?.getAttribute?.("gs-id") ??
        node?.el?.getAttribute?.("id") ??
        "";
    }
  });
  const widgets = Array.isArray(snapshot) ? snapshot : [];
  const fromSave = toLayoutItems(
    widgets.map((item: any) => ({
      widgetId: item?.id ?? item?.widgetId,
      x: item?.x,
      y: item?.y,
      w: item?.w ?? item?.width,
      h: item?.h ?? item?.height,
      minW: item?.minW,
      minH: item?.minH,
    }))
  );

  if (fromSave.length > 0) return fromSave;

  const nodes = Array.isArray((grid as any)?.engine?.nodes) ? (grid as any).engine.nodes : [];
  return toLayoutItems(
    nodes.map((node: any) => ({
      widgetId:
        node?.id ??
        node?.el?.getAttribute?.("gs-id") ??
        node?.el?.getAttribute?.("id"),
      x: node?.x,
      y: node?.y,
      w: node?.w ?? node?.width,
      h: node?.h ?? node?.height,
      minW: node?.minW,
      minH: node?.minH,
    }))
  );
};

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

const resolvePresetRange = (preset: string | undefined): DateRangeValue => {
  if (!preset) return { start: null, end: null };
  const now = new Date();
  const end = new Date(now);

  if (preset === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }

  if (preset === "last_24_hours") {
    const start = new Date(now);
    start.setHours(start.getHours() - 24);
    return { start, end };
  }

  if (preset === "last_7_days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start, end };
  }

  if (preset === "last_30_days") {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start, end };
  }

  return { start: null, end: null };
};

const parseDateValue = (value: any): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildDefaultFilterValues = (variables: any[]): Record<string, DashboardVariableValue> => {
  const defaults: Record<string, DashboardVariableValue> = {};

  variables.forEach((variable: any) => {
    const name = variable?.name;
    if (!name) return;

    if (isDateRangeVariable(variable)) {
      const presetRange = resolvePresetRange(variable?.defaultValue?.preset ?? variable?.defaultValuePreset);
      const start = parseDateValue(variable?.defaultValue?.start ?? variable?.defaultValue?.from) ?? presetRange.start;
      const end = parseDateValue(variable?.defaultValue?.end ?? variable?.defaultValue?.to) ?? presetRange.end;
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

  return defaults;
};

const buildClearedFilterValues = (variables: any[]): Record<string, DashboardVariableValue> => {
  const cleared: Record<string, DashboardVariableValue> = {};

  variables.forEach((variable: any) => {
    const name = variable?.name;
    if (!name) return;

    if (isDateRangeVariable(variable)) {
      cleared[name] = { start: null, end: null };
      return;
    }

    if (isMultiValueVariable(variable)) {
      cleared[name] = [];
      return;
    }

    cleared[name] = "";
  });

  return cleared;
};

const isFilterValueApplied = (variable: any, value: DashboardVariableValue): boolean => {
  if (isDateRangeVariable(variable)) {
    const range = value as DateRangeValue | undefined;
    return !!range?.start || !!range?.end;
  }

  if (isMultiValueVariable(variable)) {
    return Array.isArray(value) && value.length > 0;
  }

  return value !== undefined && value !== null && `${value}`.trim() !== "";
};

const isSameFilterValue = (variable: any, left: DashboardVariableValue, right: DashboardVariableValue): boolean => {
  if (isDateRangeVariable(variable)) {
    const leftRange = (left as DateRangeValue | undefined) ?? { start: null, end: null };
    const rightRange = (right as DateRangeValue | undefined) ?? { start: null, end: null };
    return toIso(leftRange.start) === toIso(rightRange.start) && toIso(leftRange.end) === toIso(rightRange.end);
  }

  if (isMultiValueVariable(variable)) {
    const leftArr = Array.isArray(left) ? left.map((v) => `${v}`).sort() : [];
    const rightArr = Array.isArray(right) ? right.map((v) => `${v}`).sort() : [];
    if (leftArr.length !== rightArr.length) return false;
    return leftArr.every((value, index) => value === rightArr[index]);
  }

  return `${left ?? ""}` === `${right ?? ""}`;
};

const getDashboardTitle = (definition: any, fallback: string) =>
  definition?.displayName ?? definition?.title ?? definition?.name ?? fallback;

const getWidgetTitle = (widget: any, fallback: string) =>
  widget?.displayName ?? widget?.title ?? widget?.name ?? fallback;

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

  const [appliedVariableValues, setAppliedVariableValues] = useState<Record<string, DashboardVariableValue>>({});
  const [filterDraftValues, setFilterDraftValues] = useState<Record<string, DashboardVariableValue>>({});
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, Option[]>>({});
  const [draftLayoutItems, setDraftLayoutItems] = useState<DashboardGridLayoutItem[] | null>(null);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const bootstrappedRef = useRef(false);

  const variables = useMemo(() => (Array.isArray(definition?.variables) ? definition.variables : []), [definition]);
  const definitionWidgets = useMemo(() => (Array.isArray(definition?.widgets) ? definition.widgets : []), [definition]);
  const effectiveLayoutItems = useMemo(() => toLayoutItems(layoutData?.effectiveLayout?.items ?? []), [layoutData]);
  const gridColumns = Number(layoutData?.effectiveLayout?.columns ?? 12) || 12;

  const defaultFilterValues = useMemo(() => buildDefaultFilterValues(variables), [variables]);

  useEffect(() => {
    if (!definition || bootstrappedRef.current) return;
    setAppliedVariableValues(defaultFilterValues);
    setFilterDraftValues(defaultFilterValues);
    bootstrappedRef.current = true;
  }, [definition, defaultFilterValues]);

  useEffect(() => {
    if (!isFilterDialogOpen) return;
    setFilterDraftValues(appliedVariableValues);
  }, [appliedVariableValues, isFilterDialogOpen]);

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
    void handleRefresh(appliedVariableValues);
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

  const appliedFilterCount = useMemo(() => {
    return variables.reduce((count: number, variable: any) => {
      const name = variable?.name;
      if (!name) return count;
      const value = appliedVariableValues[name];
      const defaultValue = defaultFilterValues[name];
      if (!isFilterValueApplied(variable, value)) return count;
      return isSameFilterValue(variable, value, defaultValue) ? count : count + 1;
    }, 0);
  }, [appliedVariableValues, defaultFilterValues, variables]);

  useEffect(() => {
    if (!gridRef.current || orderedWidgets.length === 0) return;

    if (gridInstanceRef.current) {
      gridInstanceRef.current.destroy(false);
      gridInstanceRef.current = null;
    }

    const initialLayout: DashboardGridLayoutItem[] = effectiveLayoutItems.length
      ? effectiveLayoutItems
      : orderedWidgets.map((widget: any, index: number) => ({
          widgetId: widget?.id ?? widget?.name ?? `widget-${index}`,
          x: 0,
          y: index * 3,
          w: 4,
          h: 3,
        }));

    const gridWidgets = initialLayout.map((item: DashboardGridLayoutItem) => ({
      id: item.widgetId,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
    }));

    const instance = GridStack.init(
      {
        column: gridColumns,
        cellHeight: 92,
        margin: 8,
        float: true,
      },
      gridRef.current
    );

    // React renders the DOM; make sure Gridstack converts every item node to a widget,
    // then explicitly apply layout from API to avoid attribute-parsing or timing issues.
    instance.batchUpdate();
    const domItems = Array.from(gridRef.current.querySelectorAll(".grid-stack-item")) as HTMLElement[];
    domItems.forEach((itemEl) => {
      if (!(itemEl as any).gridstackNode) {
        instance.makeWidget(itemEl as any);
      }
    });
    instance.column(gridColumns, "none");
    instance.load(gridWidgets as any, false);
    instance.batchUpdate(false);

    instance.on("change", (_event: Event, _items: GridStackNode[]) => {
      const normalized = getAllLayoutItemsFromGrid(instance);
      setDraftLayoutItems(normalized);
    });

    gridInstanceRef.current = instance;
    return () => {
      instance.destroy(false);
      if (gridInstanceRef.current === instance) gridInstanceRef.current = null;
    };
  }, [orderedWidgets, gridColumns, effectiveLayoutItems]);

  const handleDraftVariableChange = (variableName: string, value: DashboardVariableValue) => {
    setFilterDraftValues((prev) => ({ ...prev, [variableName]: value }));
  };

  const buildPayloadVariables = (values: Record<string, DashboardVariableValue>): Record<string, any> => {
    const payload: Record<string, any> = {};
    variables.forEach((variable: any) => {
      const name = variable?.name;
      if (!name) return;
      const value = values[name];

      if (isDateRangeVariable(variable)) {
        const range = value as DateRangeValue | undefined;
        const from = toIso(range?.start ?? null);
        const to = toIso(range?.end ?? null);
        if (!from && !to) return;
        payload[name] = { from, to };
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

  async function handleRefresh(values = appliedVariableValues) {
    if (!moduleName || !dashboardName) return;
    await getDashboardData({
      moduleName,
      dashboardName,
      variables: buildPayloadVariables(values),
    }).unwrap();
  }

  async function handleApplyFilters() {
    const nextValues = { ...filterDraftValues };
    setAppliedVariableValues(nextValues);
    setIsFilterDialogOpen(false);
    await handleRefresh(nextValues);
  }

  async function handleClearFilters() {
    const clearedValues = buildClearedFilterValues(variables);
    setFilterDraftValues(clearedValues);
    setAppliedVariableValues(clearedValues);
    setIsFilterDialogOpen(false);
    await handleRefresh(clearedValues);
  }

  async function handleSaveLayout() {
    if (!moduleName || !dashboardName) return;
    const liveGridLayout = getAllLayoutItemsFromGrid(gridInstanceRef.current);
    const baseLayout = effectiveLayoutItems.length ? effectiveLayoutItems : [];
    const items = liveGridLayout.length
      ? liveGridLayout
      : draftLayoutItems && draftLayoutItems.length
        ? draftLayoutItems
        : baseLayout;

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

    const value = filterDraftValues[variableName];
    const label = variable?.displayName ?? variable?.label ?? variableName;

    if (isDateRangeVariable(variable)) {
      const range = (value as DateRangeValue | undefined) ?? { start: null, end: null };
      return (
        <div key={variableName} className={styles.filterField}>
          <label className={styles.filterLabel}>{label}</label>
          <div className={styles.dateRange}>
            <SolidDatePicker
              selected={range.start ?? null}
              onChange={(next: Date | null) =>
                handleDraftVariableChange(variableName, { start: next ?? null, end: range.end ?? null })
              }
              placeholderText="Start date"
              dateFormat="yyyy-MM-dd"
            />
            <SolidDatePicker
              selected={range.end ?? null}
              onChange={(next: Date | null) =>
                handleDraftVariableChange(variableName, { start: range.start ?? null, end: next ?? null })
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
              handleDraftVariableChange(variableName, selected);
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
          onChange={(event) => handleDraftVariableChange(variableName, event.value ? `${event.value}` : "")}
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
      return <UnknownWidget definition={widgetDefinition} runtime={runtime} variables={appliedVariableValues} />;
    }
    return (
      <ExtensionWidget
        {...({ definition: widgetDefinition, runtime, variables: appliedVariableValues } satisfies DashboardWidgetComponentProps)}
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
          <h1 className={styles.title}>{getDashboardTitle(definition, dashboardName)}</h1>
          <p className={styles.subtitle}>{definition?.description ?? `${moduleName} / ${dashboardName}`}</p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.filterButtonWrap}>
            <SolidButton
              className={styles.iconButton}
              leftIcon={<Filter size={16} />}
              onClick={() => setIsFilterDialogOpen(true)}
              tooltip="Filters"
              aria-label="Filters"
            />
            {appliedFilterCount > 0 ? <span className={styles.filterCountBadge}>{appliedFilterCount}</span> : null}
          </div>

          <SolidButton
            className={styles.iconButton}
            leftIcon={<RefreshCw size={16} />}
            onClick={() => void handleRefresh()}
            disabled={dataLoading}
            tooltip="Refresh"
            aria-label="Refresh"
          />

          <SolidButton
            className={styles.iconButton}
            leftIcon={<Save size={16} />}
            onClick={() => void handleSaveLayout()}
            disabled={saveLayoutLoading}
            tooltip="Save Layout"
            aria-label="Save Layout"
          />
        </div>
      </div>

      <SolidDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        header="Dashboard Filters"
        contentClassName={styles.filterDialogContent}
      >
        <SolidDialogBody>
          <div className={styles.filterModalColumn}>{variables.map(renderVariable)}</div>
        </SolidDialogBody>
        <SolidDialogFooter className={styles.filterModalActions}>
          <SolidButton variant="outline" onClick={() => void handleClearFilters()}>
            Clear
          </SolidButton>
          <SolidButton onClick={() => void handleApplyFilters()}>
            Apply
          </SolidButton>
        </SolidDialogFooter>
      </SolidDialog>

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
                <h3 className={styles.widgetTitle}>{getWidgetTitle(widget, widgetName)}</h3>
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
