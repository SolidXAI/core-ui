import { ArrowLeft, Braces, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Layers3, Search, X } from "lucide-react";
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
import "./WorkflowDefinitionEditorPage.css";

const WORKFLOW_LOG_LEVEL_OPTIONS = [
  { label: "All levels", value: "all" },
  { label: "Debug", value: "debug" },
  { label: "Info", value: "info" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
];

const WORKFLOW_EXECUTION_SUMMARY_FIELDS = [
  "id",
  "executionIdentifier",
  "workflowKey",
  "workflowDisplayName",
  "status",
  "triggerType",
  "startedAt",
  "finishedAt",
  "durationMs",
  "definitionVersion",
  "definitionChecksum",
  "errorSummary",
  "requestedByUserId",
  "createdAt",
];

const WORKFLOW_EXECUTION_INPUT_FIELDS = ["id", "inputPayload"];
const WORKFLOW_EXECUTION_ERROR_FIELDS = ["id", "errorDetails"];
const WORKFLOW_EXECUTION_DEFINITION_FIELDS = ["id", "definitionSnapshot"];
const WORKFLOW_PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

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
  outputPayload?: unknown;
  errorSummary?: string | null;
  createdAt?: string | null;
};

type WorkflowPaginationMeta = {
  totalRecords?: number;
  currentPage?: number;
  nextPage?: number | null;
  prevPage?: number | null;
  totalPages?: number;
  perPage?: number;
};

type WorkflowExecutionOutputEntry = {
  key: string;
  label: string;
  nodeId?: string;
  nodeType?: string;
  value: unknown;
};

type WorkflowPaginationState = {
  offset: number;
  limit: number;
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

function buildWorkflowExecutionFieldsQueryString(fields: string[]) {
  return qs.stringify({ fields }, { encodeValuesOnly: true });
}

function buildWorkflowExecutionLogQueryString(options: {
  workflowExecutionId: number;
  level?: string;
  search?: string;
  offset: number;
  limit: number;
}) {
  const queryData: Record<string, any> = {
    limit: options.limit,
    offset: options.offset,
    fields: [
      "id",
      "logKey",
      "level",
      "message",
      "eventType",
      "source",
      "nodeId",
      "nodeType",
      "sequenceNumber",
      "occurredAt",
      "context",
      "metadata",
      "createdAt",
    ],
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

function buildWorkflowStepExecutionQueryString(options: {
  workflowExecutionId: number;
  offset: number;
  limit: number;
  includeOutputPayload?: boolean;
}) {
  const queryData: Record<string, any> = {
    limit: options.limit,
    offset: options.offset,
    fields: [
      "id",
      "stepExecutionKey",
      "nodeId",
      "nodeName",
      "nodeKind",
      "nodeType",
      "status",
      "attemptNumber",
      "parentNodeId",
      "parentStepExecutionKey",
      "sequenceNumber",
      "startedAt",
      "finishedAt",
      "durationMs",
      "errorSummary",
      "createdAt",
      ...(options.includeOutputPayload ? ["outputPayload"] : []),
    ],
    sort: ["startedAt:asc", "sequenceNumber:asc", "id:asc"],
    filters: {
      workflowExecution: {
        id: {
          $eq: options.workflowExecutionId,
        },
      },
      ...(options.includeOutputPayload
        ? {
            outputPayload: {
              $notNull: true,
            },
          }
        : {}),
    },
  };

  return qs.stringify(queryData, { encodeValuesOnly: true });
}

function buildExecutionOutputEntriesFromSteps(
  steps: WorkflowStepExecutionRecord[],
): WorkflowExecutionOutputEntry[] {
  return steps
    .filter((step) => normalizeJsonDisplayValue(step.outputPayload) !== null)
    .map((step) => ({
      key: String(step.id),
      label: step.nodeName || step.nodeId || step.stepExecutionKey || `Step ${step.id}`,
      nodeId: step.nodeId ?? undefined,
      nodeType: step.nodeType ?? step.nodeKind ?? undefined,
      value: step.outputPayload,
    }));
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

function WorkflowExecutionPagination({
  meta,
  pagination,
  disabled,
  onChange,
}: {
  meta?: WorkflowPaginationMeta;
  pagination: WorkflowPaginationState;
  disabled?: boolean;
  onChange: (pagination: WorkflowPaginationState) => void;
}) {
  const totalRecords = meta?.totalRecords ?? 0;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(totalRecords / pagination.limit));
  const currentPage = meta?.currentPage ?? Math.floor(pagination.offset / pagination.limit) + 1;
  const firstRecord = totalRecords === 0 ? 0 : pagination.offset + 1;
  const lastRecord = Math.min(pagination.offset + pagination.limit, totalRecords);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToPage = (page: number) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);
    onChange({
      offset: (safePage - 1) * pagination.limit,
      limit: pagination.limit,
    });
  };

  return (
    <div className="workflow-editor-execution-pagination">
      <div className="workflow-editor-execution-pagination__meta">
        <span>Rows</span>
        <SolidSelect
          value={pagination.limit}
          options={WORKFLOW_PAGE_SIZE_OPTIONS.map((option) => ({ label: String(option), value: option }))}
          native={false}
          menuPlacement="top"
          disabled={disabled}
          onChange={(event) => onChange({ offset: 0, limit: Number(event.value) })}
        />
        <span>{firstRecord} - {lastRecord} of {totalRecords}</span>
      </div>
      <div className="workflow-editor-execution-pagination__actions">
        <SolidButton
          size="small"
          variant="ghost"
          leftIcon={<ChevronFirst size={14} />}
          aria-label="First page"
          disabled={disabled || !canGoPrevious}
          onClick={() => goToPage(1)}
        />
        <SolidButton
          size="small"
          variant="ghost"
          leftIcon={<ChevronLeft size={14} />}
          aria-label="Previous page"
          disabled={disabled || !canGoPrevious}
          onClick={() => goToPage(currentPage - 1)}
        />
        <span>Page {currentPage} of {totalPages}</span>
        <SolidButton
          size="small"
          variant="ghost"
          leftIcon={<ChevronRight size={14} />}
          aria-label="Next page"
          disabled={disabled || !canGoNext}
          onClick={() => goToPage(currentPage + 1)}
        />
        <SolidButton
          size="small"
          variant="ghost"
          leftIcon={<ChevronLast size={14} />}
          aria-label="Last page"
          disabled={disabled || !canGoNext}
          onClick={() => goToPage(totalPages)}
        />
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
  const { useGetSolidEntityByIdQuery, useLazyGetSolidEntityByIdQuery } = workflowExecutionApi;
  const { useLazyGetSolidEntitiesQuery: useLazyGetWorkflowExecutionLogsQuery } =
    workflowExecutionLogApi;
  const { useLazyGetSolidEntitiesQuery: useLazyGetWorkflowStepExecutionsQuery } =
    workflowStepExecutionApi;

  const {
    data: workflowExecutionResponse,
    isLoading: isWorkflowExecutionLoading,
    isError: isWorkflowExecutionError,
  } = useGetSolidEntityByIdQuery(
    {
      id: executionId,
      qs: buildWorkflowExecutionFieldsQueryString(WORKFLOW_EXECUTION_SUMMARY_FIELDS),
    },
    { skip: !executionId },
  );
  const [triggerGetWorkflowExecutionDetail, workflowExecutionDetailQuery] =
    useLazyGetSolidEntityByIdQuery();
  const [triggerGetWorkflowExecutionLogs, workflowExecutionLogsQuery] =
    useLazyGetWorkflowExecutionLogsQuery();
  const [triggerGetWorkflowStepExecutions, workflowStepExecutionsQuery] =
    useLazyGetWorkflowStepExecutionsQuery();
  const [triggerGetWorkflowOutputStepExecutions, workflowOutputStepExecutionsQuery] =
    useLazyGetWorkflowStepExecutionsQuery();

  const executionSummary = workflowExecutionResponse?.data as WorkflowExecutionRecord | undefined;
  const executionDetail = workflowExecutionDetailQuery.data?.data as WorkflowExecutionRecord | undefined;
  const execution = executionSummary
    ? {
        ...executionSummary,
        ...executionDetail,
      }
    : undefined;
  const [activeTab, setActiveTab] = React.useState("summary");
  const [outputMode, setOutputMode] = React.useState<"visual" | "json">("visual");
  const [expandedOutputKey, setExpandedOutputKey] = React.useState<string | null>(null);
  const [logLevelFilter, setLogLevelFilter] = React.useState("all");
  const [logSearch, setLogSearch] = React.useState("");
  const [debouncedLogSearch, setDebouncedLogSearch] = React.useState("");
  const [expandedLogId, setExpandedLogId] = React.useState<number | null>(null);
  const [expandedTimelineStepId, setExpandedTimelineStepId] = React.useState<number | null>(null);
  const [timelinePagination, setTimelinePagination] = React.useState<WorkflowPaginationState>({
    offset: 0,
    limit: 50,
  });
  const [logPagination, setLogPagination] = React.useState<WorkflowPaginationState>({
    offset: 0,
    limit: 100,
  });
  const [outputPagination, setOutputPagination] = React.useState<WorkflowPaginationState>({
    offset: 0,
    limit: 50,
  });

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedLogSearch(logSearch);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [logSearch]);

  React.useEffect(() => {
    setLogPagination((current) => ({ ...current, offset: 0 }));
  }, [logLevelFilter, debouncedLogSearch]);

  React.useEffect(() => {
    if (!execution?.id || activeTab !== "timeline") return;
    void triggerGetWorkflowStepExecutions(
      buildWorkflowStepExecutionQueryString({
        workflowExecutionId: execution.id,
        offset: timelinePagination.offset,
        limit: timelinePagination.limit,
      }),
    );
  }, [activeTab, execution?.id, timelinePagination, triggerGetWorkflowStepExecutions]);

  React.useEffect(() => {
    if (!execution?.id || activeTab !== "logs") return;
    void triggerGetWorkflowExecutionLogs(
      buildWorkflowExecutionLogQueryString({
        workflowExecutionId: execution.id,
        level: logLevelFilter,
        search: debouncedLogSearch,
        offset: logPagination.offset,
        limit: logPagination.limit,
      }),
    );
  }, [activeTab, debouncedLogSearch, execution?.id, logLevelFilter, logPagination, triggerGetWorkflowExecutionLogs]);

  React.useEffect(() => {
    if (!execution?.id || activeTab !== "output") return;
    void triggerGetWorkflowOutputStepExecutions(
      buildWorkflowStepExecutionQueryString({
        workflowExecutionId: execution.id,
        offset: outputPagination.offset,
        limit: outputPagination.limit,
        includeOutputPayload: true,
      }),
    );
  }, [activeTab, execution?.id, outputPagination, triggerGetWorkflowOutputStepExecutions]);

  React.useEffect(() => {
    if (!executionId) return;

    if (activeTab === "input") {
      void triggerGetWorkflowExecutionDetail({
        id: executionId,
        qs: buildWorkflowExecutionFieldsQueryString(WORKFLOW_EXECUTION_INPUT_FIELDS),
      });
    }

    if (activeTab === "error") {
      void triggerGetWorkflowExecutionDetail({
        id: executionId,
        qs: buildWorkflowExecutionFieldsQueryString(WORKFLOW_EXECUTION_ERROR_FIELDS),
      });
    }

    if (activeTab === "definition") {
      void triggerGetWorkflowExecutionDetail({
        id: executionId,
        qs: buildWorkflowExecutionFieldsQueryString(WORKFLOW_EXECUTION_DEFINITION_FIELDS),
      });
    }
  }, [activeTab, executionId, triggerGetWorkflowExecutionDetail]);

  const executionLogRecords = React.useMemo(
    () => ((workflowExecutionLogsQuery.data?.records ?? []) as WorkflowExecutionLogRecord[]),
    [workflowExecutionLogsQuery.data?.records],
  );
  const executionLogMeta = workflowExecutionLogsQuery.data?.meta as WorkflowPaginationMeta | undefined;
  const executionStepRecords = React.useMemo(
    () => ((workflowStepExecutionsQuery.data?.records ?? []) as WorkflowStepExecutionRecord[]),
    [workflowStepExecutionsQuery.data?.records],
  );
  const executionStepMeta = workflowStepExecutionsQuery.data?.meta as WorkflowPaginationMeta | undefined;
  const outputStepRecords = React.useMemo(
    () => ((workflowOutputStepExecutionsQuery.data?.records ?? []) as WorkflowStepExecutionRecord[]),
    [workflowOutputStepExecutionsQuery.data?.records],
  );
  const outputStepMeta = workflowOutputStepExecutionsQuery.data?.meta as WorkflowPaginationMeta | undefined;

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
    () => buildExecutionOutputEntriesFromSteps(outputStepRecords),
    [outputStepRecords],
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
                      <strong>{executionStepMeta?.totalRecords ?? executionTimeline.rows.length}</strong>
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
                    <WorkflowExecutionPagination
                      meta={executionStepMeta}
                      pagination={timelinePagination}
                      disabled={workflowStepExecutionsQuery.isFetching}
                      onChange={(nextPagination) => {
                        setExpandedTimelineStepId(null);
                        setTimelinePagination(nextPagination);
                      }}
                    />
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
                    <span>
                      {workflowExecutionLogsQuery.isFetching
                        ? "Loading"
                        : `${executionLogRecords.length} of ${executionLogMeta?.totalRecords ?? executionLogRecords.length} logs`}
                    </span>
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
                {workflowExecutionLogsQuery.isFetching && executionLogRecords.length ? (
                  <div className="workflow-editor-execution-logs__refreshing">
                    <SolidSpinner />
                    <span>Refreshing logs...</span>
                  </div>
                ) : null}
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
                <WorkflowExecutionPagination
                  meta={executionLogMeta}
                  pagination={logPagination}
                  disabled={workflowExecutionLogsQuery.isFetching}
                  onChange={(nextPagination) => {
                    setExpandedLogId(null);
                    setLogPagination(nextPagination);
                  }}
                />
              </div>
            ) : null}

            {activeTab === "input" ? (
              workflowExecutionDetailQuery.isFetching && execution.inputPayload === undefined ? (
                <div className="workflow-editor-execution-logs__loading">
                  <SolidSpinner />
                  <span>Loading execution input...</span>
                </div>
              ) : (
                <SolidCodeEditor language="json" height="calc(100vh - 260px)" fontSize={12} readOnly value={formatReadonlyJson(execution.inputPayload)} />
              )
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
                {workflowOutputStepExecutionsQuery.isFetching && !outputStepRecords.length ? (
                  <div className="workflow-editor-execution-logs__loading">
                    <SolidSpinner />
                    <span>Loading step outputs...</span>
                  </div>
                ) : outputMode === "json" ? (
                  <div className="workflow-editor-output-json-editor">
                    <SolidCodeEditor
                      language="json"
                      height="calc(100vh - 320px)"
                      fontSize={12}
                      readOnly
                      value={formatReadonlyJson(
                        outputStepRecords.map((step) => ({
                          id: step.id,
                          stepExecutionKey: step.stepExecutionKey,
                          nodeId: step.nodeId,
                          nodeName: step.nodeName,
                          nodeType: step.nodeType,
                          sequenceNumber: step.sequenceNumber,
                          outputPayload: step.outputPayload,
                        })),
                        "[]",
                      )}
                    />
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
                    <h4>No step outputs found</h4>
                    <p>This page does not contain step output payloads.</p>
                  </div>
                )}
                <WorkflowExecutionPagination
                  meta={outputStepMeta}
                  pagination={outputPagination}
                  disabled={workflowOutputStepExecutionsQuery.isFetching}
                  onChange={(nextPagination) => {
                    setExpandedOutputKey(null);
                    setOutputPagination(nextPagination);
                  }}
                />
              </div>
            ) : null}

            {activeTab === "error" ? (
              <div className="workflow-editor-execution-detail-error">
                <div className="workflow-editor-execution-detail-kv">
                  <div className="workflow-editor-execution-detail-kv__label">Error Summary</div>
                  <div className="workflow-editor-execution-detail-kv__value">{execution.errorSummary ?? "-"}</div>
                </div>
                {workflowExecutionDetailQuery.isFetching && execution.errorDetails === undefined ? (
                  <div className="workflow-editor-execution-logs__loading">
                    <SolidSpinner />
                    <span>Loading error detail...</span>
                  </div>
                ) : (
                  <SolidCodeEditor language="json" height="calc(100vh - 320px)" fontSize={12} readOnly value={formatReadonlyJson(execution.errorDetails)} />
                )}
              </div>
            ) : null}

            {activeTab === "definition" ? (
              workflowExecutionDetailQuery.isFetching && execution.definitionSnapshot === undefined ? (
                <div className="workflow-editor-execution-logs__loading">
                  <SolidSpinner />
                  <span>Loading definition snapshot...</span>
                </div>
              ) : (
                <SolidCodeEditor language="yaml" height="calc(100vh - 260px)" fontSize={12} readOnly value={formatReadonlyYaml(execution.definitionSnapshot)} />
              )
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
