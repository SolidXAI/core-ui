import { ArrowLeft, Braces, ChevronRight, Layers3, Search, X } from "lucide-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import qs from "qs";
import YAML from "yaml";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import {
  SolidButton,
  SolidCodeEditor,
  SolidInput,
  SolidSelect,
  SolidSpinner,
  SolidTag,
} from "../../../../components/shad-cn-ui";
import { SolidJsonEditor } from "../../../../components/core/json/SolidJsonEditor";
import "./WorkflowDefinitionEditorPage.css";

const WORKFLOW_LOG_LEVEL_OPTIONS = [
  { label: "All levels", value: "all" },
  { label: "Debug", value: "debug" },
  { label: "Info", value: "info" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
];

type WorkflowExecutionRecord = {
  id: number;
  executionIdentifier?: string | null;
  workflowKey?: string | null;
  workflowDisplayName?: string | null;
  status?: string | null;
  triggerType?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | string | null;
  inputPayload?: unknown;
  outputPayload?: unknown;
  definitionVersion?: string | null;
  definitionChecksum?: string | null;
  definitionSnapshot?: unknown;
  errorSummary?: string | null;
  errorDetails?: unknown;
  requestedByUserId?: number | string | null;
  createdAt?: string | null;
};

type WorkflowExecutionLogRecord = {
  id: number;
  logKey?: string | null;
  level?: string | null;
  message?: string | null;
  eventType?: string | null;
  source?: string | null;
  nodeId?: string | null;
  nodeType?: string | null;
  sequenceNumber?: number | null;
  occurredAt?: string | null;
  context?: unknown;
  metadata?: unknown;
  createdAt?: string | null;
};

type WorkflowStepExecutionRecord = {
  id: number;
  stepExecutionKey?: string | null;
  nodeId?: string | null;
  nodeName?: string | null;
  nodeKind?: string | null;
  nodeType?: string | null;
  status?: string | null;
  attemptNumber?: number | null;
  parentNodeId?: string | null;
  parentStepExecutionKey?: string | null;
  sequenceNumber?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | string | null;
  errorSummary?: string | null;
  createdAt?: string | null;
};

type WorkflowNodeRecord = Record<string, any> & {
  id: string;
  name?: string;
  type?: string;
};

type WorkflowExecutionOutputEntry = {
  key: string;
  label: string;
  nodeId?: string;
  nodeType?: string;
  value: unknown;
};

function formatReadonlyJson(value: unknown, emptyValue = "{}") {
  if (value === undefined || value === null || value === "") return emptyValue;
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
}

function formatReadonlyYaml(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") return value;
  return YAML.stringify(value);
}

function normalizeJsonDisplayValue(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function isPlainObjectValue(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUrlLike(value: string) {
  return /^https?:\/\//i.test(value);
}

function formatOutputVisualValue(value: unknown) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return JSON.stringify(value);
}

function summarizeOutputValue(value: unknown) {
  const normalizedValue = normalizeJsonDisplayValue(value);
  if (normalizedValue === null || normalizedValue === undefined) return "No output";
  if (Array.isArray(normalizedValue)) return `${normalizedValue.length} item${normalizedValue.length === 1 ? "" : "s"}`;
  if (isPlainObjectValue(normalizedValue)) {
    const count = Object.keys(normalizedValue).length;
    return `${count} field${count === 1 ? "" : "s"}`;
  }
  return String(formatOutputVisualValue(normalizedValue));
}

function formatExecutionDate(value?: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatExecutionLogTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseExecutionTimestamp(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function getNumericDurationMs(value?: number | string | null) {
  const numericValue =
    typeof value === "string" ? Number(value) : typeof value === "number" ? value : null;
  return typeof numericValue === "number" && Number.isFinite(numericValue) ? numericValue : null;
}

function formatDurationMs(value?: number | string | null) {
  const numericValue = getNumericDurationMs(value);
  if (numericValue == null || Number.isNaN(numericValue) || numericValue <= 0) return "Not available";
  if (numericValue < 1000) return `${numericValue} ms`;
  const seconds = numericValue / 1000;
  if (seconds < 60) return `${seconds.toFixed(seconds >= 10 ? 0 : 1)} s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function workflowLogLevelTone(level?: string | null) {
  const value = (level ?? "").toLowerCase();
  if (value === "error" || value === "fatal") return "danger";
  if (value === "warn" || value === "warning") return "warn";
  if (value === "info" || value === "success") return "success";
  return undefined;
}

function buildWorkflowExecutionLogQueryString(options: {
  workflowExecutionId: number;
  level?: string;
  search?: string;
}) {
  const queryData: Record<string, any> = {
    limit: 200,
    offset: 0,
    populate: ["workflowStepExecution"],
    sort: ["sequenceNumber:asc", "occurredAt:asc", "id:asc"],
    filters: {
      workflowExecution: {
        id: {
          $eq: options.workflowExecutionId,
        },
      },
    },
  };

  if (options.level && options.level !== "all") {
    queryData.filters.level = {
      $eqi: options.level,
    };
  }

  const trimmedSearch = options.search?.trim();
  if (trimmedSearch) {
    queryData.filters.$or = [
      { message: { $containsi: trimmedSearch } },
      { nodeId: { $containsi: trimmedSearch } },
      { nodeType: { $containsi: trimmedSearch } },
      { source: { $containsi: trimmedSearch } },
      { eventType: { $containsi: trimmedSearch } },
    ];
  }

  return qs.stringify(queryData, { encodeValuesOnly: true });
}

function buildWorkflowStepExecutionQueryString(options: { workflowExecutionId: number }) {
  const queryData: Record<string, any> = {
    limit: 500,
    offset: 0,
    sort: ["startedAt:asc", "sequenceNumber:asc", "id:asc"],
    filters: {
      workflowExecution: {
        id: {
          $eq: options.workflowExecutionId,
        },
      },
    },
  };

  return qs.stringify(queryData, { encodeValuesOnly: true });
}

function flattenWorkflowNodes(nodes: WorkflowNodeRecord[]): WorkflowNodeRecord[] {
  return nodes.flatMap((node) => [
    node,
    ...flattenWorkflowNodes(node.tasks ?? []),
    ...flattenWorkflowNodes(node.then ?? []),
    ...flattenWorkflowNodes(node.else ?? []),
    ...flattenWorkflowNodes(node.defaults ?? []),
    ...Object.values(node.cases ?? {}).flatMap((caseNodes: any) =>
      flattenWorkflowNodes(caseNodes),
    ),
  ]);
}

function getExecutionDefinitionNodes(definitionSnapshot: unknown): WorkflowNodeRecord[] {
  const normalized = normalizeJsonDisplayValue(definitionSnapshot);
  let definition: any = normalized;

  if (typeof definitionSnapshot === "string") {
    try {
      definition = YAML.parse(definitionSnapshot);
    } catch {
      definition = normalized;
    }
  }

  return Array.isArray(definition?.nodes) ? definition.nodes : [];
}

function buildExecutionOutputEntries(
  outputPayload: unknown,
  nodes: WorkflowNodeRecord[],
): WorkflowExecutionOutputEntry[] {
  const normalizedValue = normalizeJsonDisplayValue(outputPayload);
  if (normalizedValue === null || normalizedValue === undefined) return [];

  const nodeMap = new Map(
    flattenWorkflowNodes(nodes).map((node) => [String(node.id), node]),
  );

  if (isPlainObjectValue(normalizedValue)) {
    return Object.entries(normalizedValue).map(([key, value]) => {
      const node = nodeMap.get(key);
      return {
        key,
        label: node?.name ?? key,
        nodeId: key,
        nodeType: node?.type,
        value,
      };
    });
  }

  return [
    {
      key: "execution-output",
      label: "Execution Output",
      value: normalizedValue,
    },
  ];
}

function renderOutputPrimitive(value: unknown) {
  if (typeof value === "string" && isUrlLike(value)) {
    return (
      <a href={value} target="_blank" rel="noreferrer">
        {value}
      </a>
    );
  }
  return formatOutputVisualValue(value);
}

function renderOutputVisual(value: unknown, options: { hideSummary?: boolean } = {}): React.ReactNode {
  const normalizedValue = normalizeJsonDisplayValue(value);

  if (normalizedValue === null || normalizedValue === undefined) {
    return (
      <div className="workflow-editor-output-empty">
        <h4>No output produced</h4>
        <p>This execution completed without returning an output payload.</p>
      </div>
    );
  }

  if (!isPlainObjectValue(normalizedValue) && !Array.isArray(normalizedValue)) {
    return (
      <div className="workflow-editor-output-primitive">
        <span>Result</span>
        <strong>{renderOutputPrimitive(normalizedValue)}</strong>
      </div>
    );
  }

  if (Array.isArray(normalizedValue)) {
    if (!normalizedValue.length) {
      return (
        <div className="workflow-editor-output-empty">
          <h4>Empty array</h4>
          <p>The execution returned an empty collection.</p>
        </div>
      );
    }

    const objectRows = normalizedValue.filter(isPlainObjectValue);
    const tableKeys = Array.from(
      new Set(
        objectRows
          .flatMap((item) => Object.keys(item))
          .filter((key) =>
            objectRows.some((item) => {
              const cell = item[key];
              return !isPlainObjectValue(cell) && !Array.isArray(cell);
            }),
          ),
      ),
    ).slice(0, 6);

    if (objectRows.length === normalizedValue.length && tableKeys.length) {
      return (
        <div className="workflow-editor-output-visual">
          {options.hideSummary ? null : (
            <div className="workflow-editor-output-visual__summary">
              <strong>{normalizedValue.length}</strong>
              <span>items returned</span>
            </div>
          )}
          <div className="workflow-editor-output-table-wrap">
            <table className="workflow-editor-output-table">
              <thead>
                <tr>
                  {tableKeys.map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {objectRows.slice(0, 25).map((item, index) => (
                  <tr key={index}>
                    {tableKeys.map((key) => (
                      <td key={key}>{renderOutputPrimitive(item[key])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    return (
      <div className="workflow-editor-output-list">
        {normalizedValue.slice(0, 25).map((item, index) => (
          <div key={index} className="workflow-editor-output-list-item">
            <span>Item {index + 1}</span>
            <strong>{renderOutputPrimitive(item)}</strong>
          </div>
        ))}
      </div>
    );
  }

  const entries = isPlainObjectValue(normalizedValue) ? Object.entries(normalizedValue) : [];
  return (
    <div className="workflow-editor-output-object">
      {options.hideSummary ? null : (
        <div className="workflow-editor-output-visual__summary">
          <strong>{entries.length}</strong>
          <span>top-level fields</span>
        </div>
      )}
      <div className="workflow-editor-output-object-grid">
        {entries.map(([key, item]) => {
          const isNested = isPlainObjectValue(item) || Array.isArray(item);
          return (
            <div key={key} className={`workflow-editor-output-field ${isNested ? "is-nested" : ""}`}>
              <span>{key}</span>
              {isNested ? <pre>{formatReadonlyJson(item)}</pre> : <strong>{renderOutputPrimitive(item)}</strong>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WorkflowExecutionDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const executionId = params.id ?? "";

  const workflowExecutionApi = React.useMemo(
    () => createSolidEntityApi("workflowExecution"),
    [],
  );
  const workflowExecutionLogApi = React.useMemo(
    () => createSolidEntityApi("workflowExecutionLog"),
    [],
  );
  const workflowStepExecutionApi = React.useMemo(
    () => createSolidEntityApi("workflowStepExecution"),
    [],
  );
  const { useGetSolidEntityByIdQuery } = workflowExecutionApi;
  const { useLazyGetSolidEntitiesQuery: useLazyGetWorkflowExecutionLogsQuery } =
    workflowExecutionLogApi;
  const { useLazyGetSolidEntitiesQuery: useLazyGetWorkflowStepExecutionsQuery } =
    workflowStepExecutionApi;

  const {
    data: workflowExecutionResponse,
    isLoading: isWorkflowExecutionLoading,
    isError: isWorkflowExecutionError,
  } = useGetSolidEntityByIdQuery(
    { id: executionId, qs: "populate[0]=workflowDefinition" },
    { skip: !executionId },
  );
  const [triggerGetWorkflowExecutionLogs, workflowExecutionLogsQuery] =
    useLazyGetWorkflowExecutionLogsQuery();
  const [triggerGetWorkflowStepExecutions, workflowStepExecutionsQuery] =
    useLazyGetWorkflowStepExecutionsQuery();

  const execution = workflowExecutionResponse?.data as WorkflowExecutionRecord | undefined;
  const [activeTab, setActiveTab] = React.useState("summary");
  const [outputMode, setOutputMode] = React.useState<"visual" | "json">("visual");
  const [expandedOutputKey, setExpandedOutputKey] = React.useState<string | null>(null);
  const [logLevelFilter, setLogLevelFilter] = React.useState("all");
  const [logSearch, setLogSearch] = React.useState("");
  const [expandedLogId, setExpandedLogId] = React.useState<number | null>(null);
  const [expandedTimelineStepId, setExpandedTimelineStepId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!execution?.id) return;
    void triggerGetWorkflowStepExecutions(
      buildWorkflowStepExecutionQueryString({ workflowExecutionId: execution.id }),
    );
  }, [execution?.id, triggerGetWorkflowStepExecutions]);

  React.useEffect(() => {
    if (!execution?.id) return;
    void triggerGetWorkflowExecutionLogs(
      buildWorkflowExecutionLogQueryString({
        workflowExecutionId: execution.id,
        level: logLevelFilter,
        search: logSearch,
      }),
    );
  }, [execution?.id, logLevelFilter, logSearch, triggerGetWorkflowExecutionLogs]);

  const executionLogRecords = React.useMemo(
    () => ((workflowExecutionLogsQuery.data?.records ?? []) as WorkflowExecutionLogRecord[]),
    [workflowExecutionLogsQuery.data?.records],
  );
  const executionStepRecords = React.useMemo(
    () => ((workflowStepExecutionsQuery.data?.records ?? []) as WorkflowStepExecutionRecord[]),
    [workflowStepExecutionsQuery.data?.records],
  );
  const definitionNodes = React.useMemo(
    () => getExecutionDefinitionNodes(execution?.definitionSnapshot),
    [execution?.definitionSnapshot],
  );

  const executionTimeline = React.useMemo(() => {
    if (!execution) {
      return {
        rows: [],
        totalDurationMs: 0,
        startLabel: "-",
        endLabel: "-",
        slowestStep: null as WorkflowStepExecutionRecord | null,
        statusCounts: {} as Record<string, number>,
      };
    }

    const executionStart =
      parseExecutionTimestamp(execution.startedAt) ??
      parseExecutionTimestamp(execution.createdAt) ??
      Date.now();
    const executionFinish =
      parseExecutionTimestamp(execution.finishedAt) ??
      (getNumericDurationMs(execution.durationMs) != null
        ? executionStart + (getNumericDurationMs(execution.durationMs) ?? 0)
        : executionStart);
    const sortedSteps = [...executionStepRecords].sort((first, second) => {
      const firstSequence = first.sequenceNumber ?? first.id;
      const secondSequence = second.sequenceNumber ?? second.id;
      const firstStart = parseExecutionTimestamp(first.startedAt) ?? executionStart;
      const secondStart = parseExecutionTimestamp(second.startedAt) ?? executionStart;
      return firstStart - secondStart || firstSequence - secondSequence;
    });
    const normalizedSteps = sortedSteps.map((step) => {
      const durationMs = getNumericDurationMs(step.durationMs) ?? 0;
      const startedAt =
        parseExecutionTimestamp(step.startedAt) ??
        parseExecutionTimestamp(step.createdAt) ??
        executionStart;
      const finishedAt =
        parseExecutionTimestamp(step.finishedAt) ??
        (durationMs > 0 ? startedAt + durationMs : startedAt);
      return {
        step,
        startedAt,
        finishedAt: Math.max(finishedAt, startedAt),
        durationMs: Math.max(durationMs, Math.max(finishedAt - startedAt, 0)),
      };
    });
    const startMs = Math.min(executionStart, ...normalizedSteps.map((item) => item.startedAt));
    const endMs = Math.max(
      executionFinish,
      ...normalizedSteps.map((item) => item.finishedAt),
      startMs + 1,
    );
    const spanMs = Math.max(endMs - startMs, 1);
    const statusCounts: Record<string, number> = {};
    let slowestStep: WorkflowStepExecutionRecord | null = null;
    let slowestDuration = -1;
    const rows = normalizedSteps.map((item, index) => {
      const status = (item.step.status ?? "unknown").toLowerCase();
      statusCounts[status] = (statusCounts[status] ?? 0) + 1;
      if (item.durationMs > slowestDuration) {
        slowestDuration = item.durationMs;
        slowestStep = item.step;
      }
      const width = Math.max((item.durationMs / spanMs) * 100, item.durationMs > 0 ? 1.2 : 0.55);
      return {
        ...item,
        index,
        label: item.step.nodeName || item.step.nodeId || item.step.stepExecutionKey || `Step ${index + 1}`,
        startOffsetPercent: Math.min(Math.max(((item.startedAt - startMs) / spanMs) * 100, 0), 100),
        widthPercent: Math.min(width, 100),
        depth: item.step.parentStepExecutionKey || item.step.parentNodeId ? 1 : 0,
        status,
      };
    });
    return {
      rows,
      totalDurationMs: spanMs,
      startLabel: formatExecutionLogTime(new Date(startMs).toISOString()),
      endLabel: formatExecutionLogTime(new Date(endMs).toISOString()),
      slowestStep,
      statusCounts,
    };
  }, [execution, executionStepRecords]);

  const outputEntries = React.useMemo(
    () => buildExecutionOutputEntries(execution?.outputPayload, definitionNodes),
    [definitionNodes, execution?.outputPayload],
  );

  const logLevelCounts = executionLogRecords.reduce<Record<string, number>>((counts, log) => {
    const key = (log.level ?? "unknown").toLowerCase();
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  if (isWorkflowExecutionLoading) {
    return (
      <div className="workflow-editor-page workflow-editor-page--loading">
        <SolidSpinner />
      </div>
    );
  }

  if (isWorkflowExecutionError || !execution) {
    return (
      <div className="workflow-editor-page workflow-execution-detail-page">
        <div className="workflow-editor-empty-state">Workflow execution not found.</div>
      </div>
    );
  }

  const tabs = [
    { value: "summary", label: "Summary" },
    { value: "timeline", label: "Timeline" },
    { value: "logs", label: "Logs" },
    { value: "input", label: "Input" },
    { value: "output", label: "Output" },
    { value: "error", label: "Error" },
    { value: "definition", label: "Definition" },
  ];

  return (
    <div className="workflow-editor-page workflow-execution-detail-page">
      <div className="workflow-editor-header">
        <div className="workflow-editor-header-main">
          <SolidButton
            size="small"
            variant="ghost"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Back
          </SolidButton>
        </div>
      </div>

      <section className="workflow-editor-execution-modal workflow-execution-detail-page__surface">
        <div className="workflow-editor-execution-modal__header">
          <div>
            <div className="workflow-editor-execution-modal__eyebrow">Execution Detail</div>
            <h3>{execution.executionIdentifier ?? `Execution ${execution.id}`}</h3>
            <div className="workflow-editor-execution-modal__meta">
              <SolidTag>{execution.status ?? "Unknown"}</SolidTag>
              <span>{formatDurationMs(execution.durationMs)}</span>
              <span>{formatExecutionDate(execution.startedAt || execution.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="workflow-editor-execution-modal-tabs">
          <div className="workflow-editor-execution-modal-tabs__list" role="tablist" aria-label="Execution detail sections">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`workflow-execution-detail-tab-${tab.value}`}
                  id={`workflow-execution-detail-tab-trigger-${tab.value}`}
                  className={`workflow-editor-execution-modal-tabs__trigger ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            id={`workflow-execution-detail-tab-${activeTab}`}
            aria-labelledby={`workflow-execution-detail-tab-trigger-${activeTab}`}
            className="workflow-editor-execution-modal-tabs__panel"
          >
            {activeTab === "summary" ? (
              <div className="workflow-editor-execution-detail-summary">
                {[
                  ["Status", execution.status ?? "Unknown"],
                  ["Execution Identifier", execution.executionIdentifier ?? "-"],
                  ["Workflow", execution.workflowDisplayName ?? "-"],
                  ["Workflow Key", execution.workflowKey ?? "-"],
                  ["Trigger Type", execution.triggerType ?? "manual"],
                  ["Started", formatExecutionDate(execution.startedAt || execution.createdAt)],
                  ["Finished", formatExecutionDate(execution.finishedAt)],
                  ["Duration", formatDurationMs(execution.durationMs)],
                  ["Definition Version", execution.definitionVersion ?? "-"],
                  ["Definition Checksum", execution.definitionChecksum ?? "-"],
                  ["Requested By", execution.requestedByUserId ?? "-"],
                ].map(([label, value]) => (
                  <div key={label} className="workflow-editor-execution-detail-kv">
                    <div className="workflow-editor-execution-detail-kv__label">{label}</div>
                    <div className="workflow-editor-execution-detail-kv__value">{value}</div>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === "timeline" ? (
              <div className="workflow-editor-execution-timeline">
                <div className="workflow-editor-execution-timeline__hero">
                  <div>
                    <h4>Execution Timeline</h4>
                    <p>Step-level timing across this execution.</p>
                  </div>
                  <div className="workflow-editor-execution-timeline__stats">
                    <div>
                      <span>Total span</span>
                      <strong>{formatDurationMs(executionTimeline.totalDurationMs)}</strong>
                    </div>
                    <div>
                      <span>Steps</span>
                      <strong>{executionTimeline.rows.length}</strong>
                    </div>
                    <div>
                      <span>Slowest</span>
                      <strong>{executionTimeline.slowestStep?.nodeName ?? executionTimeline.slowestStep?.nodeId ?? "-"}</strong>
                    </div>
                  </div>
                </div>

                {workflowStepExecutionsQuery.isFetching && !executionTimeline.rows.length ? (
                  <div className="workflow-editor-execution-timeline__loading">
                    <SolidSpinner />
                    <span>Loading step timeline...</span>
                  </div>
                ) : executionTimeline.rows.length ? (
                  <>
                    <div className="workflow-editor-execution-timeline__legend">
                      {Object.entries(executionTimeline.statusCounts).map(([status, count]) => (
                        <SolidTag key={status} tone={workflowLogLevelTone(status) as any}>
                          {status}: {count}
                        </SolidTag>
                      ))}
                    </div>
                    <div className="workflow-editor-execution-gantt">
                      <div className="workflow-editor-execution-gantt__ruler">
                        <span>{executionTimeline.startLabel}</span>
                        <span>{formatDurationMs(executionTimeline.totalDurationMs)}</span>
                        <span>{executionTimeline.endLabel}</span>
                      </div>
                      <div className="workflow-editor-execution-gantt__rows">
                        {executionTimeline.rows.map((row) => {
                          const isExpanded = expandedTimelineStepId === row.step.id;
                          return (
                            <div key={row.step.id} className={`workflow-editor-execution-gantt-row workflow-editor-execution-gantt-row--${row.status} ${isExpanded ? "is-expanded" : ""}`}>
                              <button
                                type="button"
                                className="workflow-editor-execution-gantt-row__main"
                                aria-expanded={isExpanded}
                                onClick={() => setExpandedTimelineStepId((current) => current === row.step.id ? null : row.step.id)}
                              >
                                <span className="workflow-editor-execution-gantt-row__toggle"><ChevronRight size={14} /></span>
                                <span className="workflow-editor-execution-gantt-row__identity" style={{ "--workflow-step-depth": row.depth } as React.CSSProperties}>
                                  <strong>{row.label}</strong>
                                  <span>{row.step.nodeType ?? row.step.nodeKind ?? "step"}</span>
                                </span>
                                <span className="workflow-editor-execution-gantt-row__track">
                                  <span className="workflow-editor-execution-gantt-row__bar" style={{ left: `${row.startOffsetPercent}%`, width: `${row.widthPercent}%` }} />
                                </span>
                                <SolidTag tone={workflowLogLevelTone(row.status) as any}>{row.step.status ?? "unknown"}</SolidTag>
                                <span className="workflow-editor-execution-gantt-row__duration">{formatDurationMs(row.durationMs)}</span>
                              </button>
                              {isExpanded ? (
                                <div className="workflow-editor-execution-gantt-row__details">
                                  <div className="workflow-editor-execution-step-inspector">
                                    <div className="workflow-editor-execution-step-inspector__header">
                                      <div>
                                        <span>Step Detail</span>
                                        <h4>{row.label}</h4>
                                      </div>
                                      <button type="button" aria-label="Collapse step detail" onClick={() => setExpandedTimelineStepId(null)}>
                                        <X size={14} />
                                      </button>
                                    </div>
                                    <div className="workflow-editor-execution-step-inspector__meta">
                                      {[
                                        ["Status", row.step.status ?? "unknown"],
                                        ["Node Id", row.step.nodeId ?? "-"],
                                        ["Node Type", row.step.nodeType ?? "-"],
                                        ["Attempt", row.step.attemptNumber ?? 1],
                                        ["Started", formatExecutionDate(row.step.startedAt)],
                                        ["Finished", formatExecutionDate(row.step.finishedAt)],
                                        ["Duration", formatDurationMs(row.durationMs)],
                                        ["Step Key", row.step.stepExecutionKey ?? "-"],
                                      ].map(([label, value]) => (
                                        <div key={label}>
                                          <span>{label}</span>
                                          <strong>{value}</strong>
                                        </div>
                                      ))}
                                    </div>
                                    {row.step.errorSummary ? (
                                      <div className="workflow-editor-execution-step-inspector__error">{row.step.errorSummary}</div>
                                    ) : null}
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="workflow-editor-execution-timeline__empty">
                    <h4>No step timing captured</h4>
                    <p>This execution does not have persisted step execution records yet.</p>
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "logs" ? (
              <div className="workflow-editor-execution-logs">
                <div className="workflow-editor-execution-logs__hero">
                  <div>
                    <h4>Execution Log Stream</h4>
                    <p>Runtime messages emitted while this execution was processed.</p>
                  </div>
                  <div className="workflow-editor-execution-logs__stats">
                    <span>{workflowExecutionLogsQuery.isFetching ? "Loading" : `${executionLogRecords.length} logs`}</span>
                    {Object.entries(logLevelCounts).map(([level, count]) => (
                      <SolidTag key={level} tone={workflowLogLevelTone(level) as any}>{level}: {count}</SolidTag>
                    ))}
                  </div>
                </div>
                <div className="workflow-editor-execution-logs__filters">
                  <div className="workflow-editor-execution-logs__search">
                    <Search size={14} />
                    <SolidInput
                      value={logSearch}
                      placeholder="Search message, node, source"
                      onChange={(event) => {
                        setLogSearch(event.target.value);
                        setExpandedLogId(null);
                      }}
                    />
                  </div>
                  <SolidSelect
                    value={logLevelFilter}
                    options={WORKFLOW_LOG_LEVEL_OPTIONS}
                    onChange={(event) => {
                      setLogLevelFilter(event.value ?? "all");
                      setExpandedLogId(null);
                    }}
                  />
                </div>
                {workflowExecutionLogsQuery.isFetching && !executionLogRecords.length ? (
                  <div className="workflow-editor-execution-logs__loading">
                    <SolidSpinner />
                    <span>Loading execution logs...</span>
                  </div>
                ) : executionLogRecords.length ? (
                  <div className="workflow-editor-execution-log-list">
                    {executionLogRecords.map((log) => {
                      const isSelected = expandedLogId === log.id;
                      return (
                        <div key={log.id} className={`workflow-editor-execution-log-row workflow-editor-execution-log-row--${(log.level ?? "info").toLowerCase()} ${isSelected ? "is-selected" : ""}`}>
                          <button
                            type="button"
                            className="workflow-editor-execution-log-row__main"
                            aria-expanded={isSelected}
                            onClick={() => setExpandedLogId((current) => current === log.id ? null : log.id)}
                          >
                            <span className="workflow-editor-execution-log-row__toggle"><ChevronRight size={14} /></span>
                            <span className="workflow-editor-execution-log-row__sequence">{log.sequenceNumber ?? log.id}</span>
                            <span className="workflow-editor-execution-log-row__time">{formatExecutionLogTime(log.occurredAt || log.createdAt)}</span>
                            <SolidTag tone={workflowLogLevelTone(log.level) as any}>{log.level ?? "info"}</SolidTag>
                            <span className="workflow-editor-execution-log-row__node">{log.nodeId ?? log.source ?? "runtime"}</span>
                            <span className="workflow-editor-execution-log-row__message">{log.message ?? "No message"}</span>
                            {log.eventType ? <span className="workflow-editor-execution-log-row__event">{log.eventType}</span> : null}
                          </button>
                          {isSelected ? (
                            <div className="workflow-editor-execution-log-row__details">
                              <div className="workflow-editor-execution-log-inspector">
                                <div className="workflow-editor-execution-log-inspector__header">
                                  <div>
                                    <span>Log Detail</span>
                                    <h4>{log.message ?? "No message"}</h4>
                                  </div>
                                  <button type="button" aria-label="Collapse log detail" onClick={() => setExpandedLogId(null)}>
                                    <X size={14} />
                                  </button>
                                </div>
                                <div className="workflow-editor-execution-log-inspector__meta">
                                  {[
                                    ["Level", log.level ?? "info"],
                                    ["Sequence", log.sequenceNumber ?? log.id],
                                    ["Occurred", formatExecutionDate(log.occurredAt || log.createdAt)],
                                    ["Node", log.nodeId ?? "-"],
                                    ["Node Type", log.nodeType ?? "-"],
                                    ["Source", log.source ?? "-"],
                                    ["Event Type", log.eventType ?? "-"],
                                    ["Log Key", log.logKey ?? "-"],
                                  ].map(([label, value]) => (
                                    <div key={label}>
                                      <span>{label}</span>
                                      <strong>{value}</strong>
                                    </div>
                                  ))}
                                </div>
                                {log.context || log.metadata ? (
                                  <div className="workflow-editor-execution-log-inspector__payloads">
                                    <div>
                                      <h5>Context</h5>
                                      <SolidCodeEditor language="json" height="180px" fontSize={12} readOnly value={formatReadonlyJson(log.context)} />
                                    </div>
                                    <div>
                                      <h5>Metadata</h5>
                                      <SolidCodeEditor language="json" height="180px" fontSize={12} readOnly value={formatReadonlyJson(log.metadata)} />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="workflow-editor-execution-log-inspector__empty">
                                    No structured context or metadata was captured for this log.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="workflow-editor-execution-logs__empty">
                    <h4>No logs found</h4>
                    <p>This execution has no log entries matching the current filters.</p>
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "input" ? (
              <SolidCodeEditor language="json" height="calc(100vh - 260px)" fontSize={12} readOnly value={formatReadonlyJson(execution.inputPayload)} />
            ) : null}

            {activeTab === "output" ? (
              <div className="workflow-editor-output-viewer">
                <div className="workflow-editor-output-viewer__toolbar">
                  <div>
                    <h4>Execution Output</h4>
                    <p>Inspect node outputs visually or switch to the raw JSON payload.</p>
                  </div>
                  <div className="workflow-editor-view-toggle" aria-label="Output view">
                    <button type="button" className={`workflow-editor-view-toggle__button ${outputMode === "visual" ? "is-active" : ""}`} aria-label="Show visual output" title="Visual output" onClick={() => setOutputMode("visual")}>
                      <Layers3 size={14} />
                    </button>
                    <button type="button" className={`workflow-editor-view-toggle__button ${outputMode === "json" ? "is-active" : ""}`} aria-label="Show JSON output" title="JSON output" onClick={() => setOutputMode("json")}>
                      <Braces size={14} />
                    </button>
                  </div>
                </div>
                {outputMode === "json" ? (
                  <div className="workflow-editor-output-json-editor">
                    <SolidJsonEditor value={normalizeJsonDisplayValue(execution.outputPayload)} resetToken={`execution-output-${execution.id}-${outputMode}`} readOnly className="sdix-json-editor workflow-editor-output-json-host" />
                  </div>
                ) : outputEntries.length ? (
                  <div className="workflow-editor-output-node-list">
                    {outputEntries.map((entry, index) => {
                      const isExpanded = expandedOutputKey === entry.key;
                      return (
                        <div key={entry.key} className={`workflow-editor-output-node-row ${isExpanded ? "is-expanded" : ""}`}>
                          <button type="button" className="workflow-editor-output-node-row__header" aria-expanded={isExpanded} onClick={() => setExpandedOutputKey((current) => current === entry.key ? null : entry.key)}>
                            <span className="workflow-editor-output-node-row__toggle"><ChevronRight size={15} /></span>
                            <span className="workflow-editor-output-node-row__sequence">{index + 1}</span>
                            <span className="workflow-editor-output-node-row__identity"><strong>{entry.label}</strong></span>
                            <span className="workflow-editor-output-node-row__node-key">{entry.nodeId ?? entry.key}</span>
                            {entry.nodeType ? <SolidTag>{entry.nodeType}</SolidTag> : null}
                            <span className="workflow-editor-output-node-row__summary">{summarizeOutputValue(entry.value)}</span>
                          </button>
                          {isExpanded ? (
                            <div className="workflow-editor-output-node-row__body">
                              <div className="workflow-editor-output-node-detail">
                                <div className="workflow-editor-output-node-detail__header">
                                  <div>
                                    <span>Output Detail</span>
                                    <h4>{entry.label}</h4>
                                  </div>
                                  <button type="button" aria-label="Collapse output detail" onClick={() => setExpandedOutputKey(null)}>
                                    <X size={14} />
                                  </button>
                                </div>
                                {renderOutputVisual(entry.value, { hideSummary: true })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="workflow-editor-output-empty">
                    <h4>No output produced</h4>
                    <p>This execution completed without returning an output payload.</p>
                  </div>
                )}
              </div>
            ) : null}

            {activeTab === "error" ? (
              <div className="workflow-editor-execution-detail-error">
                <div className="workflow-editor-execution-detail-kv">
                  <div className="workflow-editor-execution-detail-kv__label">Error Summary</div>
                  <div className="workflow-editor-execution-detail-kv__value">{execution.errorSummary ?? "-"}</div>
                </div>
                <SolidCodeEditor language="json" height="calc(100vh - 320px)" fontSize={12} readOnly value={formatReadonlyJson(execution.errorDetails)} />
              </div>
            ) : null}

            {activeTab === "definition" ? (
              <SolidCodeEditor language="yaml" height="calc(100vh - 260px)" fontSize={12} readOnly value={formatReadonlyYaml(execution.definitionSnapshot)} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
