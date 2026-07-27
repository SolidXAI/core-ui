import {
  Activity,
  ArrowLeft,
  Braces,
  ChevronRight,
  Copy,
  Workflow,
  Layers3,
  Play,
  Search,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import qs from "qs";
import YAML from "yaml";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { useGetmodulesQuery } from "../../../../redux/api/moduleApi";
import { useGetWorkflowNodeTypesQuery } from "../../../../redux/api/workflowNodeApi";
import {
  useExecuteWorkflowDefinitionMutation,
  useValidateWorkflowDefinitionMutation,
} from "../../../../redux/api/workflowDefinitionEditorApi";
import { showToast } from "../../../../redux/features/toastSlice";
import {
  WorkflowNodeDocsPanel,
  type WorkflowDocsModel,
} from "../../../../components/workflow/WorkflowNodeDocsPanel";
import {
  WorkflowFlowCanvas,
  type WorkflowInsertTarget,
} from "../../../../components/workflow/WorkflowFlowCanvas";
import {
  WorkflowAddNodeDialog,
  WorkflowExpressionAutocompleteField,
  WorkflowNodeEditorDialog,
  type WorkflowExpressionSuggestion,
} from "../../../../components/workflow/WorkflowNodeSchemaEditor";
import type {
  WorkflowNodeConfigurationFieldDefinition,
  WorkflowNodeMetadataResponse,
} from "../../../../types/workflow-node";
import {
  SolidAutocomplete,
  SolidButton,
  SolidCheckbox,
  SolidCodeEditor,
  SolidDatePicker,
  SolidDialog,
  SolidDialogBody,
  SolidInput,
  SolidPanel,
  SolidSelect,
  SolidSpinner,
  SolidTabGroup,
  SolidTag,
  SolidTextarea,
} from "../../../../components/shad-cn-ui";
import { SolidJsonEditor } from "../../../../components/core/json/SolidJsonEditor";
import "./WorkflowDefinitionEditorPage.css";

const RESERVED_WORKFLOW_MODULE_NAMES = new Set(["solid-core"]);

function isWorkflowModuleSelectable(module?: Record<string, any> | null) {
  const moduleName = String(module?.name ?? "").trim();
  return Boolean(moduleName) && !RESERVED_WORKFLOW_MODULE_NAMES.has(moduleName);
}

type WorkflowDefinitionRecord = {
  id: number;
  key?: string;
  displayName?: string;
  moduleMetadata?: Record<string, any> | null;
  moduleMetadataId?: number | null;
  moduleMetadataUserKey?: string | null;
  namespace?: string;
  description?: string;
  status?: string;
  definitionYaml?: WorkflowDefinitionDsl | string | null;
  tags?: unknown;
};

type WorkflowNodeRecord = {
  [key: string]: any;
  id: string;
  name?: string;
  description?: string;
  kind: string;
  type: string;
  disabled?: boolean;
  timeoutMs?: number;
  retryPolicy?: Record<string, any>;
  onError?: "fail" | "continue";
  configuration?: Record<string, any>;
  metadata?: Record<string, any>;
  tasks?: WorkflowNodeRecord[];
  then?: WorkflowNodeRecord[];
  else?: WorkflowNodeRecord[];
  defaults?: WorkflowNodeRecord[];
  cases?: Record<string, WorkflowNodeRecord[]>;
};

type WorkflowDefinitionDsl = {
  version?: string;
  description?: string;
  inputs?: Record<string, any>;
  variables?: Record<string, any>;
  nodes: WorkflowNodeRecord[];
  triggers?: Array<Record<string, any>>;
  metadata?: Record<string, any>;
};

type WorkflowSecretSuggestionRecord = {
  id?: number;
  key?: string;
  displayName?: string;
  description?: string;
  valueType?: string;
  status?: string;
};

type ValidationState = {
  status: "idle" | "validating" | "valid" | "invalid";
  source?: "client" | "server";
  message?: string;
  errors: string[];
};

type WorkflowIdentityErrors = Partial<
  Record<"displayName" | "key" | "moduleMetadata" | "namespace" | "tags", string>
>;

type WorkflowDefinitionParseResult =
  | {
      ok: true;
      definition: WorkflowDefinitionDsl;
      yaml: string;
    }
  | {
      ok: false;
      errors: string[];
      yaml: string;
    };

type WorkflowDetailTab =
  | "overview"
  | "inputs"
  | "variables"
  | "topology"
  | "executions"
  | "triggers";

type WorkflowTriggerGuideMode = "curl" | "api" | "scheduled";

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
  definitionSnapshot?: string | null;
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
  retryCount?: number | null;
  maxRetries?: number | null;
  parentNodeId?: string | null;
  parentStepExecutionKey?: string | null;
  sequenceNumber?: number | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | string | null;
  timeoutMs?: number | string | null;
  inputPayload?: unknown;
  outputPayload?: unknown;
  runtimeContext?: unknown;
  nodeSnapshot?: unknown;
  errorSummary?: string | null;
  errorDetails?: unknown;
  createdAt?: string | null;
};

type WorkflowExecutionOutputEntry = {
  key: string;
  label: string;
  nodeId?: string;
  nodeType?: string;
  value: unknown;
};

type WorkflowInputEntry = {
  key: string;
  definition: {
    type: string;
    label: string;
    required: boolean;
    default: any;
    description: string;
  };
};

type WorkflowVariableEntry = {
  key: string;
  definition: {
    type: string;
    label: string;
    value: any;
    description: string;
  };
};

const createEmptyWorkflowDefinition = (): WorkflowDefinitionDsl => ({
  version: "1.0.0",
  description: "",
  inputs: {},
  variables: {},
  nodes: [],
  triggers: [],
  metadata: {},
});

const TOPOLOGY_SPLIT_STORAGE_KEY = "solid.workflow.editor.topologySplitPercent";

const WORKFLOW_STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const WORKFLOW_INPUT_TYPE_OPTIONS = [
  { label: "String", value: "string" },
  { label: "Number", value: "number" },
  { label: "Boolean", value: "boolean" },
  { label: "Date", value: "date" },
  { label: "Object", value: "object" },
  { label: "Array", value: "array" },
];

const WORKFLOW_TRIGGER_GUIDE_OPTIONS: Array<{
  label: string;
  value: WorkflowTriggerGuideMode;
  description: string;
}> = [
  {
    label: "CURL",
    value: "curl",
    description: "Run this workflow through the authenticated execution endpoint.",
  },
  {
    label: "API",
    value: "api",
    description: "Call this workflow from a SolidX service, subscriber, or job.",
  },
  {
    label: "Scheduled",
    value: "scheduled",
    description: "Persist CRON metadata so the scheduler can run this workflow.",
  },
];

const WORKFLOW_EXECUTION_STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Success", value: "success" },
  { label: "Failed", value: "failed" },
  { label: "Running", value: "running" },
  { label: "Pending", value: "pending" },
];

const WORKFLOW_EXECUTION_PAGE_SIZE = 25;

const WORKFLOW_LOG_LEVEL_OPTIONS = [
  { label: "All levels", value: "all" },
  { label: "Debug", value: "debug" },
  { label: "Info", value: "info" },
  { label: "Warn", value: "warn" },
  { label: "Error", value: "error" },
];

const WORKFLOW_CRON_EXAMPLES = [
  { label: "Every hour", value: "0 * * * *" },
  { label: "Weekdays at 9 AM", value: "0 9 * * 1-5" },
  { label: "Mondays at 2 AM", value: "0 2 * * 1" },
  { label: "Daily midnight", value: "0 0 * * *" },
];

const WORKFLOW_CRON_FIELD_HELP = [
  { key: "minute", label: "Minute", placeholder: "0", help: "0-59, * or */5" },
  { key: "hour", label: "Hour", placeholder: "9", help: "0-23, * or */2" },
  { key: "dayOfMonth", label: "Day", placeholder: "*", help: "1-31 or *" },
  { key: "month", label: "Month", placeholder: "*", help: "1-12 or *" },
  { key: "dayOfWeek", label: "Weekday", placeholder: "*", help: "0-7, 1-5 or *" },
] as const;

function readStoredTopologySplitPercent() {
  if (typeof window === "undefined") {
    return 62;
  }

  const storedValue = Number(window.localStorage.getItem(TOPOLOGY_SPLIT_STORAGE_KEY));
  return Number.isFinite(storedValue) ? Math.min(78, Math.max(22, storedValue)) : 62;
}

function splitCronExpression(expression: string) {
  const parts = String(expression ?? "").trim().split(/\s+/).filter(Boolean);
  const normalized = parts.length === 5 ? parts : ["0", "9", "*", "*", "*"];
  return {
    minute: normalized[0] ?? "0",
    hour: normalized[1] ?? "9",
    dayOfMonth: normalized[2] ?? "*",
    month: normalized[3] ?? "*",
    dayOfWeek: normalized[4] ?? "*",
  };
}

function joinCronExpression(parts: ReturnType<typeof splitCronExpression>) {
  return [
    parts.minute || "*",
    parts.hour || "*",
    parts.dayOfMonth || "*",
    parts.month || "*",
    parts.dayOfWeek || "*",
  ].join(" ");
}

function isValidSimpleCronExpression(expression: string) {
  return String(expression ?? "").trim().split(/\s+/).filter(Boolean).length === 5;
}

function isNumericCronPart(value: string) {
  return /^\d+$/.test(String(value ?? ""));
}

function getCronMinuteStep(value: string) {
  const match = String(value ?? "").match(/^\*\/(\d+)$/);
  return match?.[1] ?? null;
}

function formatCronNumber(value: string) {
  return String(Number(value)).padStart(2, "0");
}

function describeCronList(value: string) {
  const items = String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length <= 1) {
    return value;
  }
  if (items.length === 2) {
    return items.join(" and ");
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function describeCronMonthScope(month: string) {
  if (month === "*") {
    return "";
  }
  if (/^\d+(,\d+)*$/.test(month)) {
    return ` in months ${describeCronList(month)}`;
  }
  return ` in month ${month}`;
}

function describeCronDateScope(dayOfMonth: string) {
  if (dayOfMonth === "*") {
    return "";
  }
  if (/^\d+(,\d+)*$/.test(dayOfMonth)) {
    return ` on dates ${describeCronList(dayOfMonth)}`;
  }
  return ` on day ${dayOfMonth}`;
}

function describeCronWeekdayScope(dayOfWeek: string) {
  if (dayOfWeek === "*") {
    return "";
  }
  if (dayOfWeek === "1") {
    return " on Mondays";
  }
  if (dayOfWeek === "1-5") {
    return " on weekdays";
  }
  if (dayOfWeek === "0" || dayOfWeek === "7") {
    return " on Sundays";
  }
  return ` on weekday ${dayOfWeek}`;
}

function describeCronCalendarScope(dayOfMonth: string, month: string, dayOfWeek: string) {
  return [
    describeCronDateScope(dayOfMonth),
    describeCronWeekdayScope(dayOfWeek),
    describeCronMonthScope(month),
  ].join("");
}

function describeWorkflowCronExpression(expression: string, timezone = "UTC") {
  const cron = String(expression ?? "").trim();
  if (!isValidSimpleCronExpression(cron)) {
    return "Enter exactly five CRON fields: minute hour day month weekday.";
  }

  const parts = splitCronExpression(cron);
  const numericHour = isNumericCronPart(parts.hour) ? formatCronNumber(parts.hour) : null;
  const numericMinute = isNumericCronPart(parts.minute) ? formatCronNumber(parts.minute) : null;
  const minuteStep = getCronMinuteStep(parts.minute);
  const time = numericHour && numericMinute ? `${numericHour}:${numericMinute}` : null;
  const timezoneSuffix = timezone ? ` (${timezone})` : "";
  const calendarScope = describeCronCalendarScope(
    parts.dayOfMonth,
    parts.month,
    parts.dayOfWeek,
  );

  if (cron === "* * * * *") {
    return `Runs every minute${timezoneSuffix}.`;
  }
  if (
    /^\*\/\d+$/.test(parts.minute) &&
    parts.hour === "*" &&
    parts.dayOfMonth === "*" &&
    parts.month === "*" &&
    parts.dayOfWeek === "*"
  ) {
    return `Runs every ${parts.minute.replace("*/", "")} minutes${timezoneSuffix}.`;
  }
  if (minuteStep && numericHour) {
    return `Runs every ${minuteStep} minutes between ${numericHour}:00 and ${numericHour}:59${calendarScope}${timezoneSuffix}.`;
  }
  if (time && parts.dayOfMonth === "*" && parts.month === "*" && parts.dayOfWeek === "*") {
    return `Runs every day at ${time}${timezoneSuffix}.`;
  }
  if (time && parts.dayOfMonth === "*" && parts.month === "*" && parts.dayOfWeek === "1") {
    return `Runs every Monday at ${time}${timezoneSuffix}.`;
  }
  if (time && parts.dayOfMonth === "*" && parts.month === "*" && parts.dayOfWeek === "1-5") {
    return `Runs every weekday at ${time}${timezoneSuffix}.`;
  }
  if (time) {
    return `Runs at ${time}${calendarScope}${timezoneSuffix}.`;
  }
  return `Runs on the schedule ${cron}${timezoneSuffix}.`;
}

function workflowInputHasDefault(value: any) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return (
      Object.prototype.hasOwnProperty.call(value, "default") &&
      value.default !== undefined &&
      value.default !== null
    );
  }
  return value !== undefined && value !== null;
}

function isWorkflowExpressionString(value: unknown) {
  return typeof value === "string" && /^\s*\{\{\s*.+?\s*\}\}\s*$/.test(value);
}

function serializeWorkflowDefinitionYaml(definition: WorkflowDefinitionDsl) {
  return YAML.stringify(definition);
}

function serializeJsonDtoValue(value: unknown, fallback: unknown = null) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value ?? fallback);
}

function formatReadonlyJson(value: unknown, emptyValue = "{}") {
  if (value === undefined || value === null || value === "") {
    return emptyValue;
  }

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
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return YAML.stringify(value);
}

function normalizeJsonDisplayValue(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

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

function formatOutputVisualValue(value: unknown) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
}

function isUrlLike(value: string) {
  return /^https?:\/\//i.test(value);
}

function summarizeOutputValue(value: unknown) {
  const normalizedValue = normalizeJsonDisplayValue(value);

  if (normalizedValue === null || normalizedValue === undefined) {
    return "No output";
  }

  if (Array.isArray(normalizedValue)) {
    return `${normalizedValue.length} item${normalizedValue.length === 1 ? "" : "s"}`;
  }

  if (isPlainObjectValue(normalizedValue)) {
    const count = Object.keys(normalizedValue).length;
    return `${count} field${count === 1 ? "" : "s"}`;
  }

  return String(formatOutputVisualValue(normalizedValue));
}

function slugifyWorkflowKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function camelizeWorkflowInputKey(value: string) {
  const words = String(value ?? "")
    .trim()
    .replace(/['’]/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  if (!words.length) {
    return "";
  }

  return words
    .map((word, index) => {
      const hasLowercase = /[a-z]/.test(word);
      const hasUppercase = /[A-Z]/.test(word);
      const normalizedWord = hasLowercase && hasUppercase ? word : word.toLowerCase();
      return index === 0
        ? normalizedWord.charAt(0).toLowerCase() + normalizedWord.slice(1)
        : normalizedWord.charAt(0).toUpperCase() + normalizedWord.slice(1);
    })
    .join("");
}

function buildUniqueWorkflowInputKey(baseKey: string, existingKeys: string[]) {
  const fallbackKey = camelizeWorkflowInputKey(baseKey) || "input";
  const existing = new Set(existingKeys);
  if (!existing.has(fallbackKey)) {
    return fallbackKey;
  }

  let index = 2;
  while (existing.has(`${fallbackKey}${index}`)) {
    index += 1;
  }
  return `${fallbackKey}${index}`;
}

function buildUniqueWorkflowVariableKey(baseKey: string, existingKeys: string[]) {
  const fallbackKey = camelizeWorkflowInputKey(baseKey) || "variable";
  const existing = new Set(existingKeys);
  if (!existing.has(fallbackKey)) {
    return fallbackKey;
  }

  let index = 2;
  while (existing.has(`${fallbackKey}${index}`)) {
    index += 1;
  }
  return `${fallbackKey}${index}`;
}

function normalizeWorkflowTag(value: string) {
  return value.trim();
}

function parseWorkflowTagInput(value: string) {
  return value
    .split(",")
    .map(normalizeWorkflowTag)
    .filter(Boolean);
}

function formatWorkflowTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch {
      return parseWorkflowTagInput(value);
    }
  }

  return [];
}

function buildUniqueWorkflowKey(baseKey: string, existingKeys: string[]) {
  const fallbackKey = slugifyWorkflowKey(baseKey) || "item";
  const existing = new Set(existingKeys);
  if (!existing.has(fallbackKey)) {
    return fallbackKey;
  }

  let index = 2;
  while (existing.has(`${fallbackKey}-${index}`)) {
    index += 1;
  }
  return `${fallbackKey}-${index}`;
}

function normalizeWorkflowInputDefinition(value: any) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return {
      type: value.type ?? "string",
      label: value.label ?? "",
      required: Boolean(value.required),
      default: value.default ?? "",
      description: value.description ?? "",
    };
  }

  return {
    type: "string",
    label: "",
    required: false,
    default: value ?? "",
    description: "",
  };
}

function getWorkflowInputEntries(inputs?: Record<string, any>): WorkflowInputEntry[] {
  return Object.entries(inputs ?? {}).map(([key, value]) => ({
    key,
    definition: normalizeWorkflowInputDefinition(value),
  }));
}

function getWorkflowVariableMetadata(metadata?: Record<string, any>) {
  const variableDefinitions = metadata?.variableDefinitions;
  return variableDefinitions && typeof variableDefinitions === "object" && !Array.isArray(variableDefinitions)
    ? variableDefinitions as Record<string, any>
    : {};
}

function inferWorkflowVariableType(value: unknown, metadataType?: string) {
  if (
    metadataType &&
    WORKFLOW_INPUT_TYPE_OPTIONS.some((option) => option.value === metadataType)
  ) {
    return metadataType;
  }
  if (Array.isArray(value)) {
    return "array";
  }
  if (value && typeof value === "object") {
    return "object";
  }
  if (typeof value === "number") {
    return "number";
  }
  if (typeof value === "boolean") {
    return "boolean";
  }
  return "string";
}

function getWorkflowVariableEntries(
  variables?: Record<string, any>,
  metadata?: Record<string, any>,
): WorkflowVariableEntry[] {
  const variableMetadata = getWorkflowVariableMetadata(metadata);
  return Object.entries(variables ?? {}).map(([key, value]) => {
    const meta = variableMetadata[key] ?? {};
    const label = typeof meta.label === "string" ? meta.label : key;
    return {
      key,
      definition: {
        type: inferWorkflowVariableType(value, meta.type),
        label,
        value,
        description: typeof meta.description === "string" ? meta.description : "",
      },
    };
  });
}

function stringifyWorkflowRunInputDefault(value: unknown, type: string) {
  if (value === undefined || value === null) {
    return type === "boolean" ? false : "";
  }

  if (type === "object" || type === "array") {
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  }

  if (type === "boolean") {
    return Boolean(value);
  }

  return String(value);
}

function buildWorkflowRunInputDefaults(entries: WorkflowInputEntry[]) {
  return entries.reduce<Record<string, any>>((values, entry) => {
    values[entry.key] = stringifyWorkflowRunInputDefault(
      entry.definition.default,
      entry.definition.type,
    );
    return values;
  }, {});
}

function hasWorkflowInputDefaultValue(value: unknown) {
  return value !== undefined && value !== null && value !== "";
}

function formatWorkflowInputDefaultSummary(value: unknown) {
  if (!hasWorkflowInputDefaultValue(value)) {
    return "No default value set";
  }

  if (typeof value === "object") {
    const serialized = JSON.stringify(value);
    return `Default - ${serialized.length > 58 ? `${serialized.slice(0, 58)}...` : serialized}`;
  }

  const serialized = String(value);
  return `Default - ${serialized.length > 58 ? `${serialized.slice(0, 58)}...` : serialized}`;
}

function formatWorkflowVariableValueSummary(value: unknown) {
  if (typeof value === "object" && value !== null) {
    const serialized = JSON.stringify(value);
    return `Value - ${serialized.length > 58 ? `${serialized.slice(0, 58)}...` : serialized}`;
  }

  if (value === "") {
    return 'Value - ""';
  }

  const serialized = String(value ?? "");
  return `Value - ${serialized.length > 58 ? `${serialized.slice(0, 58)}...` : serialized}`;
}

function getWorkflowInputDefaultEditorValue(value: unknown, type: string) {
  if (!hasWorkflowInputDefaultValue(value)) {
    if (type === "array") {
      return [];
    }
    if (type === "object") {
      return {};
    }
    if (type === "boolean") {
      return false;
    }
    return "";
  }

  if (type === "object" || type === "array") {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return type === "array" ? [] : {};
      }
    }
    return value;
  }

  if (type === "boolean") {
    return Boolean(value);
  }

  return String(value);
}

function getWorkflowVariableInitialValue(type: string) {
  if (type === "array") {
    return [];
  }
  if (type === "object") {
    return {};
  }
  if (type === "boolean") {
    return false;
  }
  if (type === "number") {
    return 0;
  }
  return "";
}

function getWorkflowVariableEditorValue(value: unknown, type: string) {
  if (value === undefined || value === null) {
    return getWorkflowVariableInitialValue(type);
  }
  if (type === "object" || type === "array") {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return getWorkflowVariableInitialValue(type);
      }
    }
    return value;
  }
  if (type === "boolean") {
    return Boolean(value);
  }
  return String(value);
}

function parseWorkflowRunInputValue(value: any, type: string) {
  if (type === "boolean") {
    return Boolean(value);
  }

  if (type === "number") {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new Error("Enter a valid number.");
    }
    return numericValue;
  }

  if (type === "object" || type === "array") {
    const trimmedValue = String(value ?? "").trim();
    if (!trimmedValue) {
      return type === "array" ? [] : {};
    }
    const parsed = JSON.parse(trimmedValue);
    if (type === "array" && !Array.isArray(parsed)) {
      throw new Error("Enter a valid JSON array.");
    }
    if (type === "object" && !isPlainObjectValue(parsed)) {
      throw new Error("Enter a valid JSON object.");
    }
    return parsed;
  }

  return value ?? "";
}

function normalizeWorkflowTriggerDefinition(value: any) {
  const configuration =
    value?.configuration && typeof value.configuration === "object" && !Array.isArray(value.configuration)
      ? value.configuration
      : {};

  return {
    id: value?.id ? String(value.id) : "",
    name: value?.name ? String(value.name) : "",
    type: value?.type ? String(value.type) : "schedule",
    disabled: Boolean(value?.disabled),
    configuration,
    metadata:
      value?.metadata && typeof value.metadata === "object" && !Array.isArray(value.metadata)
        ? value.metadata
        : undefined,
  };
}

function getWorkflowTriggerCronExpression(
  trigger: ReturnType<typeof normalizeWorkflowTriggerDefinition>,
) {
  return String(
    trigger.configuration.cronExpression ?? trigger.configuration.cron ?? "0 9 * * *",
  );
}

function normalizeWorkflowDefinition(parsed: Record<string, any>): WorkflowDefinitionDsl {
  return {
    ...createEmptyWorkflowDefinition(),
    ...(parsed ?? {}),
    nodes: parsed.nodes,
    triggers: parsed.triggers ?? [],
  };
}

function validateWorkflowDefinitionSchema(
  value: unknown,
  nodeTypes: WorkflowNodeMetadataResponse[],
  options: {
    workflowKey?: string;
    requireWorkflowKey?: boolean;
    requireRootNode?: boolean;
  } = {},
): string[] {
  const errors: string[] = [];
  const nodeTypeMap = new Map(nodeTypes.map((item) => [item.type, item]));
  const seenNodeIds = new Set<string>();
  const validNodeKinds = new Set(["task", "control", "subflow"]);
  const canonicalChildKeys = ["tasks", "then", "else", "defaults"];
  const unsupportedChildKeys = ["children", "branches", "nodes"];

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["Workflow definition YAML must resolve to an object."];
  }

  const definition = value as Record<string, any>;

  if (options.requireWorkflowKey && !String(options.workflowKey ?? "").trim()) {
    errors.push("Workflow key is required.");
  }

  if (!Array.isArray(definition.nodes)) {
    errors.push("Workflow definition YAML must include a nodes array.");
  } else if (options.requireRootNode && !definition.nodes.length) {
    errors.push("Workflow definition must contain at least one root node.");
  }

  if (
    definition.triggers !== undefined &&
    definition.triggers !== null &&
    !Array.isArray(definition.triggers)
  ) {
    errors.push("Workflow definition triggers must be an array when provided.");
  }

  const validateNodeSequence = (nodes: unknown, scopeLabel: string) => {
    if (!Array.isArray(nodes)) {
      errors.push(`${scopeLabel} must be an array.`);
      return;
    }

    nodes.forEach((nodeValue, index) => {
      const prefix = `${scopeLabel} node ${index + 1}`;
      if (!nodeValue || typeof nodeValue !== "object" || Array.isArray(nodeValue)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }

      const node = nodeValue as WorkflowNodeRecord;
      unsupportedChildKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          errors.push(
            `${prefix} uses unsupported child key "${key}". Use "tasks", "then", "else", "defaults", or "cases" instead.`,
          );
        }
      });

      canonicalChildKeys.forEach((key) => {
        if (
          node[key] !== undefined &&
          node[key] !== null &&
          !Array.isArray(node[key])
        ) {
          errors.push(`${prefix} field "${key}" must be an array when provided.`);
        }
      });

      if (
        node.cases !== undefined &&
        node.cases !== null &&
        (typeof node.cases !== "object" || Array.isArray(node.cases))
      ) {
        errors.push(`${prefix} field "cases" must be an object of arrays when provided.`);
      } else if (node.cases && typeof node.cases === "object") {
        Object.entries(node.cases).forEach(([caseKey, caseNodes]) => {
          if (!Array.isArray(caseNodes)) {
            errors.push(`${prefix} case "${caseKey}" must be an array.`);
          }
        });
      }

      if (!node.id) {
        errors.push(`${prefix} is missing an id.`);
      } else if (seenNodeIds.has(String(node.id))) {
        errors.push(`Duplicate workflow node id "${node.id}".`);
      } else {
        seenNodeIds.add(String(node.id));
      }

      if (!node.kind) {
        errors.push(`${prefix} is missing a kind.`);
      } else if (!validNodeKinds.has(String(node.kind))) {
        errors.push(
          `${prefix} has unsupported kind "${node.kind}". Expected task, control, or subflow.`,
        );
      }

      if (!node.type) {
        errors.push(`${prefix} is missing a type.`);
      }

      const nodeType = node.type ? nodeTypeMap.get(String(node.type)) : undefined;
      if (node.type && nodeTypes.length && !nodeType) {
        errors.push(`Node "${node.id ?? prefix}" uses unregistered type "${node.type}".`);
      }

      if (node.kind && nodeType && node.kind !== nodeType.kind) {
        errors.push(
          `Node "${node.id}" kind "${node.kind}" does not match registered type "${node.type}" kind "${nodeType.kind}".`,
        );
      }

      const configuration = node.configuration ?? {};
      if (
        node.configuration !== undefined &&
        node.configuration !== null &&
        (typeof node.configuration !== "object" || Array.isArray(node.configuration))
      ) {
        errors.push(`Node "${node.id ?? prefix}" configuration must be an object.`);
      }

      (nodeType?.authoring?.configurationFields ?? []).forEach((field) => {
        if (!field.required) {
          return;
        }

        if (
          configuration &&
          typeof configuration === "object" &&
          !isConfigurationFieldVisibleForValidation(field, configuration)
        ) {
          return;
        }

        const valueForField =
          configuration && typeof configuration === "object"
            ? getFieldValue(configuration, field.path ?? field.key)
            : undefined;
        const isEmptyArray = Array.isArray(valueForField) && valueForField.length === 0;
        const isMissing =
          valueForField === undefined ||
          valueForField === null ||
          valueForField === "" ||
          isEmptyArray;

        if (isMissing) {
          errors.push(
            `Node "${node.id}" is missing required field "${field.label ?? field.key}".`,
          );
        }
      });

      (nodeType?.authoring?.childSlots ?? []).forEach((slot) => {
        const slotNodes =
          slot.kind === "case-collection"
            ? Object.values(node.cases ?? {}).flat()
            : Array.isArray(node[slot.key])
              ? node[slot.key]
              : [];
        const slotCount =
          slot.kind === "case-collection"
            ? Object.keys(node.cases ?? {}).length
            : slotNodes.length;
        if (slot.required && slotCount === 0) {
          errors.push(
            `Node "${node.id}" requires at least one child node in "${slot.label ?? slot.key}".`,
          );
        }
        if (slot.minItems && slotCount < slot.minItems) {
          errors.push(
            `Node "${node.id}" requires at least ${slot.minItems} nodes in "${slot.label ?? slot.key}".`,
          );
        }
      });

      validateNodeSequence(node.tasks ?? [], `${node.id ?? prefix} tasks`);
      validateNodeSequence(node.then ?? [], `${node.id ?? prefix} then`);
      validateNodeSequence(node.else ?? [], `${node.id ?? prefix} else`);
      validateNodeSequence(node.defaults ?? [], `${node.id ?? prefix} defaults`);
      Object.entries(node.cases ?? {}).forEach(([caseKey, caseNodes]) => {
        validateNodeSequence(caseNodes, `${node.id ?? prefix} case "${caseKey}"`);
      });
    });
  };

  if (Array.isArray(definition.nodes)) {
    validateNodeSequence(definition.nodes, "root");
  }

  if (Array.isArray(definition.triggers)) {
    const triggerIds = new Set<string>();
    const activeScheduleTriggers = definition.triggers.filter(
      (trigger) => trigger?.type === "schedule" && !trigger.disabled,
    );

    definition.triggers.forEach((trigger, index) => {
      const prefix = `Trigger ${index + 1}`;
      if (!trigger || typeof trigger !== "object" || Array.isArray(trigger)) {
        errors.push(`${prefix} must be an object.`);
        return;
      }

      if (!trigger.id) {
        errors.push(`${prefix} is missing an id.`);
      } else if (triggerIds.has(String(trigger.id))) {
        errors.push(`Duplicate workflow trigger id "${trigger.id}".`);
      } else {
        triggerIds.add(String(trigger.id));
      }

      if (!["schedule", "webhook"].includes(String(trigger.type))) {
        errors.push(`${prefix} has unsupported type "${trigger.type}".`);
      }

      if (trigger.type === "schedule") {
        const cronExpression = trigger.configuration?.cronExpression ?? trigger.configuration?.cron;
        if (!cronExpression || !isValidSimpleCronExpression(String(cronExpression))) {
          errors.push(`${prefix} requires a five-field CRON expression.`);
        }
      }
    });

    if (activeScheduleTriggers.length) {
      Object.entries(definition.inputs ?? {}).forEach(([inputKey, inputDefinition]) => {
        if (!workflowInputHasDefault(inputDefinition)) {
          errors.push(
            `Input "${inputKey}" requires a default value before enabling a scheduled trigger.`,
          );
        }
      });
    }
  }

  return errors;
}

function parseWorkflowDefinitionYaml(
  definitionYaml: WorkflowDefinitionRecord["definitionYaml"],
  nodeTypes: WorkflowNodeMetadataResponse[],
): WorkflowDefinitionParseResult {
  if (!definitionYaml) {
    const definition = createEmptyWorkflowDefinition();
    return {
      ok: true,
      definition,
      yaml: serializeWorkflowDefinitionYaml(definition),
    };
  }

  let parsed: unknown = definitionYaml;
  const yaml =
    typeof definitionYaml === "string"
      ? definitionYaml
      : serializeWorkflowDefinitionYaml(definitionYaml);

  if (typeof definitionYaml === "string") {
    try {
      parsed = YAML.parse(definitionYaml);
    } catch (error: any) {
      return {
        ok: false,
        errors: [`Invalid workflow YAML: ${error?.message ?? "Unable to parse YAML."}`],
        yaml,
      };
    }
  }

  const errors = validateWorkflowDefinitionSchema(parsed, nodeTypes);
  if (errors.length) {
    return {
      ok: false,
      errors,
      yaml,
    };
  }

  return {
    ok: true,
    definition: normalizeWorkflowDefinition(parsed as Record<string, any>),
    yaml,
  };
}

function flattenWorkflowNodeIds(nodes: WorkflowNodeRecord[]): string[] {
  return nodes.flatMap((node) => [
    String(node.id),
    ...flattenWorkflowNodeIds(node.tasks ?? []),
    ...flattenWorkflowNodeIds(node.then ?? []),
    ...flattenWorkflowNodeIds(node.else ?? []),
    ...flattenWorkflowNodeIds(node.defaults ?? []),
    ...Object.values(node.cases ?? {}).flatMap((caseNodes) =>
      flattenWorkflowNodeIds(caseNodes),
    ),
  ]);
}

function flattenWorkflowNodes(nodes: WorkflowNodeRecord[]): WorkflowNodeRecord[] {
  return nodes.flatMap((node) => [
    node,
    ...flattenWorkflowNodes(node.tasks ?? []),
    ...flattenWorkflowNodes(node.then ?? []),
    ...flattenWorkflowNodes(node.else ?? []),
    ...flattenWorkflowNodes(node.defaults ?? []),
    ...Object.values(node.cases ?? {}).flatMap((caseNodes) =>
      flattenWorkflowNodes(caseNodes),
    ),
  ]);
}

function buildExecutionOutputEntries(
  outputPayload: unknown,
  nodes: WorkflowNodeRecord[],
): WorkflowExecutionOutputEntry[] {
  const normalizedValue = normalizeJsonDisplayValue(outputPayload);

  if (normalizedValue === null || normalizedValue === undefined) {
    return [];
  }

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

function buildNodeId(type: string, definition: WorkflowDefinitionDsl) {
  const suffix = type.split(".").pop() ?? "node";
  const base = suffix.replace(/[^a-zA-Z0-9]+/g, "");
  let attempt = base.charAt(0).toLowerCase() + base.slice(1);
  let counter = 1;
  const nodeIds = new Set(flattenWorkflowNodeIds(definition.nodes));

  while (nodeIds.has(attempt)) {
    counter += 1;
    attempt = `${base.charAt(0).toLowerCase() + base.slice(1)}${counter}`;
  }

  return attempt;
}

function countNodes(nodes: WorkflowNodeRecord[]): number {
  return nodes.reduce(
    (sum, node) =>
      sum +
      1 +
      countNodes(node.tasks ?? []) +
      countNodes(node.then ?? []) +
      countNodes(node.else ?? []) +
      countNodes(node.defaults ?? []) +
      Object.values(node.cases ?? {}).reduce(
        (caseSum, caseNodes) => caseSum + countNodes(caseNodes),
        0,
      ),
    0,
  );
}

function countTriggers(triggers?: Array<Record<string, any>>): number {
  return Array.isArray(triggers) ? triggers.length : 0;
}

function buildWorkflowInputExample(inputs?: Record<string, any>) {
  return Object.entries(inputs ?? {}).reduce<Record<string, any>>(
    (acc, [key, inputDefinition]) => {
      const normalized = normalizeWorkflowInputDefinition(inputDefinition);

      if (workflowInputHasDefault(normalized.default)) {
        acc[key] = normalized.default;
        return acc;
      }

      if (normalized.type === "number") {
        acc[key] = 123;
      } else if (normalized.type === "boolean") {
        acc[key] = true;
      } else if (normalized.type === "date") {
        acc[key] = "2026-07-21";
      } else if (normalized.type === "object") {
        acc[key] = { example: true };
      } else if (normalized.type === "array") {
        acc[key] = ["example"];
      } else {
        acc[key] = `<${key}>`;
      }

      return acc;
    },
    {},
  );
}

function formatExecutionDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatExecutionLogTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function parseExecutionTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function getNumericDurationMs(value?: number | string | null) {
  const numericValue =
    typeof value === "string" ? Number(value) : typeof value === "number" ? value : null;

  return typeof numericValue === "number" && Number.isFinite(numericValue)
    ? numericValue
    : null;
}

function formatDurationMs(value?: number | string | null) {
  const numericValue = getNumericDurationMs(value);

  if (numericValue == null || Number.isNaN(numericValue) || numericValue <= 0) {
    return "Not available";
  }

  if (numericValue < 1000) {
    return `${numericValue} ms`;
  }

  const seconds = numericValue / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(seconds >= 10 ? 0 : 1)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function getExecutionStatusCategory(status?: string | null) {
  const normalized = (status ?? "").trim().toLowerCase();

  if (["success", "succeeded", "completed", "complete"].includes(normalized)) {
    return "success";
  }
  if (["failed", "error", "errored", "cancelled", "canceled"].includes(normalized)) {
    return "failed";
  }
  if (["running", "in_progress", "in-progress", "started", "processing"].includes(normalized)) {
    return "inProgress";
  }
  if (["created", "pending", "queued", "scheduled"].includes(normalized)) {
    return "pending";
  }

  return "other";
}

function workflowLogLevelTone(level?: string | null) {
  const value = (level ?? "").toLowerCase();
  if (value === "error" || value === "fatal") {
    return "danger";
  }
  if (value === "warn" || value === "warning") {
    return "warn";
  }
  if (value === "info") {
    return "success";
  }
  return undefined;
}

function buildWorkflowExecutionQueryString(options: {
  workflowDefinitionId: number;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const queryData: Record<string, any> = {
    limit: options.limit ?? WORKFLOW_EXECUTION_PAGE_SIZE,
    offset: options.offset ?? 0,
    sort: ["startedAt:desc", "id:desc"],
    filters: {
      workflowDefinition: {
        id: {
          $eq: options.workflowDefinitionId,
        },
      },
    },
  };

  if (options.status && options.status !== "all") {
    queryData.filters.status = {
      $eqi: options.status,
    };
  }

  if (options.search?.trim()) {
    queryData.filters.executionIdentifier = {
      $containsi: options.search.trim(),
    };
  }

  if (options.startDate || options.endDate) {
    queryData.filters.startedAt = {};
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      startDate.setHours(0, 0, 0, 0);
      queryData.filters.startedAt.$gte = startDate.toISOString();
    }
    if (options.endDate) {
      const endDate = new Date(options.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryData.filters.startedAt.$lte = endDate.toISOString();
    }
  }

  return qs.stringify(queryData, { encodeValuesOnly: true });
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

function buildWorkflowStepExecutionQueryString(options: {
  workflowExecutionId: number;
}) {
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

function buildTriggerDocsModel(trigger: Record<string, any>): WorkflowDocsModel {
  const triggerEntries = Object.entries(trigger ?? {}).filter(
    ([key]) => !["id", "type", "description", "disabled", "name", "label"].includes(key),
  );

  return {
    title: trigger.label ?? trigger.name ?? trigger.id ?? "Trigger",
    subtitle: trigger.type ?? "Trigger",
    summary:
      trigger.description ??
      "Workflow trigger that can launch the workflow on a schedule or external event.",
    badges: ["trigger", trigger.disabled ? "disabled" : "enabled"].filter(Boolean),
    definitions: [
      {
        key: "behavior",
        label: "Behavior",
        content: trigger.disabled
          ? "This trigger is currently disabled and will not launch workflow executions until it is enabled."
          : "This trigger is currently enabled and may launch workflow executions based on its configuration.",
      },
      {
        key: "configuration",
        label: "Configuration",
        content: `\`\`\`yaml\n${YAML.stringify(trigger)}\`\`\``,
      },
    ],
    outputs: triggerEntries.map(([key, value]) => ({
      key,
      label: key,
      description:
        typeof value === "object"
          ? "Structured trigger configuration value."
          : `Current value: ${String(value)}`,
      valueType: Array.isArray(value)
        ? "array"
        : typeof value === "boolean"
          ? "boolean"
          : typeof value === "number"
            ? "number"
            : typeof value === "object"
              ? "object"
              : "string",
    })),
  };
}

function findNodeById(
  nodes: WorkflowNodeRecord[],
  nodeId: string,
): WorkflowNodeRecord | undefined {
  for (const node of nodes) {
    if (String(node.id) === nodeId) {
      return node;
    }

    const fromChildren =
      findNodeById(node.tasks ?? [], nodeId) ??
      findNodeById(node.then ?? [], nodeId) ??
      findNodeById(node.else ?? [], nodeId) ??
      findNodeById(node.defaults ?? [], nodeId) ??
      Object.values(node.cases ?? {})
        .map((caseNodes) => findNodeById(caseNodes, nodeId))
        .find(Boolean);

    if (fromChildren) {
      return fromChildren;
    }
  }

  return undefined;
}

function createExpressionSuggestion(
  group: WorkflowExpressionSuggestion["group"],
  label: string,
  path: string,
  detail?: string,
  description?: string,
): WorkflowExpressionSuggestion {
  return {
    group,
    label,
    insertText: `{{ ${path} }}`,
    detail,
    description,
  };
}

function inferWorkflowValueType(value: any) {
  if (Array.isArray(value)) {
    return "array";
  }
  if (value === null || value === undefined) {
    return undefined;
  }
  return typeof value === "object" ? "object" : typeof value;
}

function getNodeOutputSuggestions(
  node: WorkflowNodeRecord,
  nodeTypesByType: Map<string, WorkflowNodeMetadataResponse>,
  options: {
    prefix?: string;
    labelPrefix?: string;
    includeParallelTaskOutputs?: boolean;
  } = {},
): WorkflowExpressionSuggestion[] {
  const nodeId = String(node.id ?? "").trim();
  if (!nodeId) {
    return [];
  }

  const nodeType = nodeTypesByType.get(String(node.type ?? ""));
  const outputDefinitions = nodeType?.authoring?.outputs ?? [];
  const prefix = options.prefix ?? `outputs.${nodeId}`;
  const labelPrefix = options.labelPrefix ?? nodeId;
  const suggestions = outputDefinitions
    .filter((output) => output.includeInRuntimeContext !== false)
    .map((output) => {
      const outputPath = output.path ?? output.key;
      return createExpressionSuggestion(
        "Outputs",
        `${labelPrefix}.${outputPath}`,
        `${prefix}.${outputPath}`,
        output.valueType,
        output.description,
      );
    });

  if (node.type === "parallel" && options.includeParallelTaskOutputs) {
    (node.tasks ?? []).forEach((task, index) => {
      suggestions.push(
        ...getNodeOutputSuggestions(task, nodeTypesByType, {
          prefix: `${prefix}.tasks.${index}.outputs.${task.id}`,
          labelPrefix: `${labelPrefix}.tasks.${index}.${task.id}`,
        }),
      );
    });
  }

  return suggestions;
}

function buildWorkflowExpressionSuggestions(
  definition: WorkflowDefinitionDsl,
  nodeTypes: WorkflowNodeMetadataResponse[],
  currentNodeId: string,
  workflowSecrets: WorkflowSecretSuggestionRecord[] = [],
): WorkflowExpressionSuggestion[] {
  const nodeTypesByType = new Map(nodeTypes.map((nodeType) => [nodeType.type, nodeType]));
  const suggestions: WorkflowExpressionSuggestion[] = [];
  const seenInsertText = new Set<string>();

  const addSuggestion = (suggestion: WorkflowExpressionSuggestion) => {
    if (seenInsertText.has(suggestion.insertText)) {
      return;
    }
    seenInsertText.add(suggestion.insertText);
    suggestions.push(suggestion);
  };

  Object.entries(definition.inputs ?? {}).forEach(([inputKey, inputDefinition]) => {
    const definitionObject =
      inputDefinition && typeof inputDefinition === "object" && !Array.isArray(inputDefinition)
        ? inputDefinition
        : {};
    addSuggestion(
      createExpressionSuggestion(
        "Inputs",
        inputKey,
        `inputs.${inputKey}`,
        definitionObject.type ?? inferWorkflowValueType(inputDefinition),
        definitionObject.description,
      ),
    );
  });

  const variableDefinitions =
    definition.metadata?.variableDefinitions &&
    typeof definition.metadata.variableDefinitions === "object" &&
    !Array.isArray(definition.metadata.variableDefinitions)
      ? definition.metadata.variableDefinitions
      : {};

  Object.entries(definition.variables ?? {}).forEach(([variableKey, variableValue]) => {
    const variableDefinition = variableDefinitions[variableKey] ?? {};
    addSuggestion(
      createExpressionSuggestion(
        "Variables",
        variableDefinition.label ?? variableKey,
        `variables.${variableKey}`,
        variableDefinition.type ?? inferWorkflowValueType(variableValue),
        variableDefinition.description,
      ),
    );
  });

  workflowSecrets
    .filter((secret) => String(secret.status ?? "active") === "active")
    .forEach((secret) => {
      const key = String(secret.key ?? "").trim();
      if (!key) {
        return;
      }
      addSuggestion(
        createExpressionSuggestion(
          "Secrets",
          secret.displayName ? `${secret.displayName} (${key})` : key,
          `secrets.${key}`,
          secret.valueType ?? "secret",
          secret.description,
        ),
      );
    });

  const addNodeOutputs = (node: WorkflowNodeRecord) => {
    getNodeOutputSuggestions(node, nodeTypesByType, {
      includeParallelTaskOutputs: true,
    }).forEach(addSuggestion);
  };

  const visitSequence = (nodes: WorkflowNodeRecord[]): boolean => {
    for (const node of nodes ?? []) {
      if (String(node.id) === currentNodeId) {
        return true;
      }

      if (node.type === "parallel" && Array.isArray(node.tasks)) {
        const foundInParallelBranch = node.tasks.some((task) => visitSequence([task]));
        if (foundInParallelBranch) {
          return true;
        }
      } else {
        const childSequences = [
          node.tasks,
          node.then,
          node.else,
          node.defaults,
          ...Object.values(node.cases ?? {}),
        ].filter(Array.isArray) as WorkflowNodeRecord[][];

        for (const childSequence of childSequences) {
          if (visitSequence(childSequence)) {
            return true;
          }
        }
      }

      addNodeOutputs(node);
    }

    return false;
  };

  visitSequence(definition.nodes ?? []);

  return suggestions;
}

function getFirstNodeId(nodes: WorkflowNodeRecord[]): string {
  return nodes[0]?.id ?? "";
}

function updateNodeById(
  nodes: WorkflowNodeRecord[],
  nodeId: string,
  updater: (node: WorkflowNodeRecord) => WorkflowNodeRecord,
): WorkflowNodeRecord[] {
  return nodes.map((node) => {
    if (String(node.id) === nodeId) {
      return updater(node);
    }

    return {
      ...node,
      tasks: node.tasks ? updateNodeById(node.tasks, nodeId, updater) : node.tasks,
      then: node.then ? updateNodeById(node.then, nodeId, updater) : node.then,
      else: node.else ? updateNodeById(node.else, nodeId, updater) : node.else,
      defaults: node.defaults
        ? updateNodeById(node.defaults, nodeId, updater)
        : node.defaults,
      cases: node.cases
        ? Object.fromEntries(
            Object.entries(node.cases).map(([caseKey, caseNodes]) => [
              caseKey,
              updateNodeById(caseNodes, nodeId, updater),
            ]),
          )
        : node.cases,
    };
  });
}

function removeNodeById(
  nodes: WorkflowNodeRecord[],
  nodeId: string,
): WorkflowNodeRecord[] {
  return nodes
    .filter((node) => String(node.id) !== nodeId)
    .map((node) => ({
      ...node,
      tasks: node.tasks ? removeNodeById(node.tasks, nodeId) : node.tasks,
      then: node.then ? removeNodeById(node.then, nodeId) : node.then,
      else: node.else ? removeNodeById(node.else, nodeId) : node.else,
      defaults: node.defaults
        ? removeNodeById(node.defaults, nodeId)
        : node.defaults,
      cases: node.cases
        ? Object.fromEntries(
            Object.entries(node.cases).map(([caseKey, caseNodes]) => [
              caseKey,
              removeNodeById(caseNodes, nodeId),
            ]),
          )
        : node.cases,
    }));
}

function insertAt<T>(items: T[], index: number, item: T): T[] {
  const safeIndex = Math.max(0, Math.min(index, items.length));
  return [...items.slice(0, safeIndex), item, ...items.slice(safeIndex)];
}

function insertNodeIntoDefinition(
  definition: WorkflowDefinitionDsl,
  target: WorkflowInsertTarget,
  nodeToInsert: WorkflowNodeRecord,
): WorkflowDefinitionDsl {
  if (target.scope === "root") {
    return {
      ...definition,
      nodes: insertAt(definition.nodes, target.index, nodeToInsert),
    };
  }

  return {
    ...definition,
    nodes: updateNodeById(definition.nodes, target.parentNodeId, (node) => {
      if (target.scope === "case") {
        const cases = node.cases ?? {};
        const caseNodes = Array.isArray(cases[target.caseKey])
          ? cases[target.caseKey]
          : [];
        return {
          ...node,
          cases: {
            ...cases,
            [target.caseKey]: insertAt(caseNodes, target.index, nodeToInsert),
          },
        };
      }

      const slotNodes = Array.isArray(node[target.slotKey])
        ? (node[target.slotKey] as WorkflowNodeRecord[])
        : [];
      return {
        ...node,
        [target.slotKey]: insertAt(slotNodes, target.index, nodeToInsert),
      };
    }),
  };
}

function getNodesForInsertTarget(
  nodes: WorkflowNodeRecord[],
  target: WorkflowInsertTarget | null,
): WorkflowNodeRecord[] {
  if (!target) {
    return nodes;
  }

  if (target.scope === "root") {
    return nodes;
  }

  const parentNode = findNodeById(nodes, target.parentNodeId);
  if (!parentNode) {
    return [];
  }

  if (target.scope === "case") {
    const cases = parentNode.cases ?? {};
    return Array.isArray(cases[target.caseKey]) ? cases[target.caseKey] : [];
  }

  return Array.isArray(parentNode[target.slotKey])
    ? (parentNode[target.slotKey] as WorkflowNodeRecord[])
    : [];
}

function getExpressionBoundaryNodeIdForInsertTarget(
  nodes: WorkflowNodeRecord[],
  target: WorkflowInsertTarget | null,
) {
  const sequence = getNodesForInsertTarget(nodes, target);
  const nextNode = target ? sequence[target.index] : undefined;

  return nextNode?.id ? String(nextNode.id) : "__workflow_pending_insert__";
}

function getFieldValue(value: Record<string, any>, pathOrKey: string) {
  const parts = pathOrKey.split(".");
  let current: any = value;
  for (const part of parts) {
    current = current?.[part];
    if (current === undefined) {
      return undefined;
    }
  }
  return current;
}

function isConfigurationFieldVisibleForValidation(
  field: WorkflowNodeConfigurationFieldDefinition,
  configuration: Record<string, any>,
) {
  const visibleWhen = field.uiSchema?.visibleWhen as
    | {
        field?: string;
        path?: string;
        equals?: any;
        notEquals?: any;
        includes?: any[];
      }
    | undefined;

  if (!visibleWhen) {
    return true;
  }

  const dependencyPath = visibleWhen.path ?? visibleWhen.field;
  if (!dependencyPath) {
    return true;
  }

  const dependencyValue = getFieldValue(configuration, dependencyPath);

  if ("equals" in visibleWhen) {
    return dependencyValue === visibleWhen.equals;
  }

  if ("notEquals" in visibleWhen) {
    return dependencyValue !== visibleWhen.notEquals;
  }

  if (Array.isArray(visibleWhen.includes)) {
    return visibleWhen.includes.includes(dependencyValue);
  }

  return true;
}

function validateWorkflowDefinitionClient(
  definition: WorkflowDefinitionDsl,
  nodeTypes: WorkflowNodeMetadataResponse[],
  workflowKey: string,
): string[] {
  return validateWorkflowDefinitionSchema(definition, nodeTypes, {
    workflowKey,
    requireWorkflowKey: true,
    requireRootNode: true,
  });
}

export function WorkflowDefinitionEditorPage() {
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const entityApi = React.useMemo(
    () => createSolidEntityApi("workflowDefinition"),
    [],
  );
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
  const workflowSecretApi = React.useMemo(
    () => createSolidEntityApi("workflowSecret"),
    [],
  );
  const {
    useCreateSolidEntityMutation,
    useGetSolidEntityByIdQuery,
    useUpdateSolidEntityMutation,
  } = entityApi;
  const {
    useLazyGetSolidEntitiesQuery: useLazyGetWorkflowExecutionsQuery,
  } = workflowExecutionApi;
  const {
    useLazyGetSolidEntitiesQuery: useLazyGetWorkflowExecutionLogsQuery,
  } = workflowExecutionLogApi;
  const {
    useLazyGetSolidEntitiesQuery: useLazyGetWorkflowStepExecutionsQuery,
  } = workflowStepExecutionApi;
  const {
    useGetSolidEntitiesQuery: useGetWorkflowSecretsQuery,
  } = workflowSecretApi;

  const workflowDefinitionId = params.id ?? "";

  const {
    data: workflowDefinitionResponse,
    isLoading: isWorkflowDefinitionLoading,
    refetch,
  } = useGetSolidEntityByIdQuery(
    { id: workflowDefinitionId, qs: "populate[0]=moduleMetadata" },
    { skip: !workflowDefinitionId || workflowDefinitionId === "new" },
  );
  const [createWorkflowDefinition, { isLoading: isCreating }] =
    useCreateSolidEntityMutation();
  const [updateWorkflowDefinition, { isLoading: isSaving }] =
    useUpdateSolidEntityMutation();
  const [validateWorkflowDefinition, { isLoading: isServerValidating }] =
    useValidateWorkflowDefinitionMutation();
  const [executeWorkflowDefinition, { isLoading: isExecuting }] =
    useExecuteWorkflowDefinitionMutation();
  const [triggerGetWorkflowExecutions, workflowExecutionsQuery] =
    useLazyGetWorkflowExecutionsQuery();
  const [triggerGetWorkflowExecutionPresence, workflowExecutionPresenceQuery] =
    useLazyGetWorkflowExecutionsQuery();
  const [triggerGetWorkflowExecutionLogs, workflowExecutionLogsQuery] =
    useLazyGetWorkflowExecutionLogsQuery();
  const [triggerGetWorkflowStepExecutions, workflowStepExecutionsQuery] =
    useLazyGetWorkflowStepExecutionsQuery();
  const { data: moduleMetadataResponse } = useGetmodulesQuery(
    "offset=0&limit=100&sort[0]=displayName%3Aasc",
  );
  const { data: workflowSecretsResponse } = useGetWorkflowSecretsQuery(
    "offset=0&limit=1000&fields[0]=id&fields[1]=key&fields[2]=displayName&fields[3]=description&fields[4]=valueType&fields[5]=status&filters[status][$eq]=active&sort[0]=key%3Aasc",
  );

  const {
    data: nodeTypes = [],
    isLoading: isNodeTypesLoading,
    isError: isNodeTypesError,
  } = useGetWorkflowNodeTypesQuery();

  const record = workflowDefinitionResponse?.data as
    | WorkflowDefinitionRecord
    | undefined;
  const moduleRecords = React.useMemo(
    () => ((moduleMetadataResponse?.records ?? []) as Record<string, any>[]),
    [moduleMetadataResponse?.records],
  );
  const selectableModuleRecords = React.useMemo(
    () => moduleRecords.filter(isWorkflowModuleSelectable),
    [moduleRecords],
  );
  const workflowSecretRecords = React.useMemo(
    () => ((workflowSecretsResponse?.records ?? []) as WorkflowSecretSuggestionRecord[]),
    [workflowSecretsResponse?.records],
  );

  const [workflowKey, setWorkflowKey] = React.useState("");
  const [workflowDisplayName, setWorkflowDisplayName] = React.useState("");
  const [workflowModule, setWorkflowModule] = React.useState<Record<string, any> | null>(null);
  const [workflowModuleSuggestions, setWorkflowModuleSuggestions] = React.useState<
    Record<string, any>[]
  >([]);
  const [workflowNamespace, setWorkflowNamespace] = React.useState("");
  const [workflowDescription, setWorkflowDescription] = React.useState("");
  const [workflowStatus, setWorkflowStatus] = React.useState("draft");
  const [workflowTags, setWorkflowTags] = React.useState<string[]>([]);
  const [workflowTagDraft, setWorkflowTagDraft] = React.useState("");
  const [workflowIdentityErrors, setWorkflowIdentityErrors] =
    React.useState<WorkflowIdentityErrors>({});
  const [triggerGuideMode, setTriggerGuideMode] =
    React.useState<WorkflowTriggerGuideMode>("curl");
  const [runInputsOpen, setRunInputsOpen] = React.useState(false);
  const [runInputValues, setRunInputValues] = React.useState<Record<string, any>>({});
  const [runInputErrors, setRunInputErrors] = React.useState<Record<string, string>>({});
  const [defaultValueEditorInputKey, setDefaultValueEditorInputKey] =
    React.useState<string | null>(null);
  const [defaultValueEditorDraft, setDefaultValueEditorDraft] = React.useState<any>("");
  const [defaultValueEditorJsonText, setDefaultValueEditorJsonText] = React.useState("");
  const [defaultValueEditorError, setDefaultValueEditorError] = React.useState("");
  const [defaultValueEditorResetToken, setDefaultValueEditorResetToken] =
    React.useState("default-value-editor");
  const [variableValueEditorKey, setVariableValueEditorKey] =
    React.useState<string | null>(null);
  const [variableValueEditorDraft, setVariableValueEditorDraft] = React.useState<any>("");
  const [variableValueEditorJsonText, setVariableValueEditorJsonText] = React.useState("");
  const [variableValueEditorError, setVariableValueEditorError] = React.useState("");
  const [variableValueEditorResetToken, setVariableValueEditorResetToken] =
    React.useState("variable-value-editor");
  const [definitionDraft, setDefinitionDraft] = React.useState<WorkflowDefinitionDsl>(
    createEmptyWorkflowDefinition(),
  );
  const [codeValue, setCodeValue] = React.useState(
    serializeWorkflowDefinitionYaml(createEmptyWorkflowDefinition()),
  );
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string>("");
  const [selectedTriggerId, setSelectedTriggerId] = React.useState<string>("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [pendingInsertTarget, setPendingInsertTarget] =
    React.useState<WorkflowInsertTarget | null>(null);
  const [topologyDocsOpen, setTopologyDocsOpen] = React.useState(false);
  const [topologyDocsNodeTypeKey, setTopologyDocsNodeTypeKey] =
    React.useState<string>("");
  const [topologyDocsModel, setTopologyDocsModel] =
    React.useState<WorkflowDocsModel | undefined>();
  const [detailTab, setDetailTab] = React.useState<WorkflowDetailTab>(
    "overview",
  );
  const [topologyViewOpen, setTopologyViewOpen] = React.useState(true);
  const [topologyYamlViewOpen, setTopologyYamlViewOpen] = React.useState(false);
  const [topologySplitPercent, setTopologySplitPercent] = React.useState(
    readStoredTopologySplitPercent,
  );
  const topologySplitRef = React.useRef<HTMLDivElement | null>(null);
  const [overviewStartDate, setOverviewStartDate] = React.useState<Date | null>(null);
  const [overviewEndDate, setOverviewEndDate] = React.useState<Date | null>(null);
  const [executionPage, setExecutionPage] = React.useState(1);
  const [executionStatusFilter, setExecutionStatusFilter] = React.useState("all");
  const [executionSearchFilter, setExecutionSearchFilter] = React.useState("");
  const [executionWorkspaceTab, setExecutionWorkspaceTab] =
    React.useState<"summary" | "list">("summary");
  const [selectedExecution, setSelectedExecution] =
    React.useState<WorkflowExecutionRecord | null>(null);
  const [selectedExecutionTab, setSelectedExecutionTab] = React.useState("summary");
  const [selectedExecutionOutputMode, setSelectedExecutionOutputMode] =
    React.useState<"visual" | "json">("visual");
  const [expandedExecutionOutputKey, setExpandedExecutionOutputKey] =
    React.useState<string | null>(null);
  const [executionLogLevelFilter, setExecutionLogLevelFilter] = React.useState("all");
  const [executionLogSearch, setExecutionLogSearch] = React.useState("");
  const [expandedExecutionLogId, setExpandedExecutionLogId] =
    React.useState<number | null>(null);
  const [expandedTimelineStepId, setExpandedTimelineStepId] =
    React.useState<number | null>(null);
  const [validationState, setValidationState] = React.useState<ValidationState>({
    status: "idle",
    errors: [],
  });

  React.useEffect(() => {
    setDetailTab("overview");
  }, [workflowDefinitionId]);

  React.useEffect(() => {
    setOverviewStartDate(null);
    setOverviewEndDate(null);
    setExecutionPage(1);
    setExecutionStatusFilter("all");
    setExecutionSearchFilter("");
    setExecutionWorkspaceTab("summary");
    setSelectedExecution(null);
    setSelectedExecutionTab("summary");
    setSelectedExecutionOutputMode("visual");
    setExecutionLogLevelFilter("all");
    setExecutionLogSearch("");
    setExpandedExecutionLogId(null);
    setExpandedTimelineStepId(null);
  }, [workflowDefinitionId]);

  React.useEffect(() => {
    if (workflowDefinitionId === "new") {
      if (!selectableModuleRecords.length) {
        return;
      }

      setWorkflowModule((current) =>
        (current && isWorkflowModuleSelectable(current) ? current : null) ??
        selectableModuleRecords[0] ??
        null,
      );
      return;
    }

    if (!record) {
      return;
    }

    const selectedModule =
      record.moduleMetadata ??
      moduleRecords.find(
        (module) =>
          module.id === record.moduleMetadataId ||
          module.name === record.moduleMetadataUserKey,
      ) ??
      null;

    if (selectedModule && isWorkflowModuleSelectable(selectedModule)) {
      setWorkflowModule(selectedModule);
    } else if (selectedModule) {
      setWorkflowModule(null);
      setWorkflowIdentityErrors((current) => ({
        ...current,
        moduleMetadata: "Workflows cannot be saved to Solid Core. Select an application module.",
      }));
    }
  }, [moduleRecords, record, selectableModuleRecords, workflowDefinitionId]);

  React.useEffect(() => {
    if (workflowDefinitionId === "new") {
      const emptyDefinition = createEmptyWorkflowDefinition();
      setWorkflowKey("");
      setWorkflowDisplayName("");
      setWorkflowNamespace("");
      setWorkflowDescription("");
      setWorkflowStatus("draft");
      setWorkflowTags([]);
      setWorkflowTagDraft("");
      setWorkflowIdentityErrors({});
      setDefinitionDraft(emptyDefinition);
      setCodeValue(serializeWorkflowDefinitionYaml(emptyDefinition));
      setCodeError(null);
      setSelectedNodeId("");
      setSelectedTriggerId("");
      setValidationState({ status: "idle", errors: [] });
    }
  }, [workflowDefinitionId]);

  React.useEffect(() => {
    if (workflowDefinitionId === "new") {
      return;
    }

    if (!record || (isNodeTypesLoading && !nodeTypes.length)) {
      return;
    }

    const parsed = parseWorkflowDefinitionYaml(record.definitionYaml, nodeTypes);
    setWorkflowKey(record.key ?? "");
    setWorkflowDisplayName(record.displayName ?? "");
    setWorkflowNamespace(record.namespace ?? "");
    setWorkflowStatus(record.status ?? "draft");
    setWorkflowTags(formatWorkflowTags(record.tags));
    setWorkflowTagDraft("");
    setWorkflowIdentityErrors({});
    setSelectedNodeId("");
    setSelectedTriggerId("");
    setCodeValue(parsed.yaml);

    if (!parsed.ok) {
      const nextError = parsed.errors.join("\n");
      setWorkflowDescription(record.description ?? "");
      setDefinitionDraft(createEmptyWorkflowDefinition());
      setCodeError(nextError);
      setValidationState({
        status: "invalid",
        source: "client",
        message: "Workflow definition YAML is invalid.",
        errors: parsed.errors,
      });
      setDetailTab("topology");
      setTopologyYamlViewOpen(true);
      return;
    }

    setWorkflowDescription(record.description ?? parsed.definition.description ?? "");
    setDefinitionDraft(parsed.definition);
    setCodeError(null);
    setSelectedNodeId(getFirstNodeId(parsed.definition.nodes));
    setValidationState({ status: "idle", errors: [] });
  }, [isNodeTypesLoading, nodeTypes, record, workflowDefinitionId]);

  React.useEffect(() => {
    if (!selectedNodeId) {
      return;
    }

    if (!findNodeById(definitionDraft.nodes, selectedNodeId)) {
      setSelectedNodeId(getFirstNodeId(definitionDraft.nodes));
    }
  }, [definitionDraft.nodes, selectedNodeId]);

  React.useEffect(() => {
    if (!selectedTriggerId) {
      return;
    }

    const exists = (definitionDraft.triggers ?? []).some(
      (trigger) => String(trigger.id) === selectedTriggerId,
    );
    if (!exists) {
      setSelectedTriggerId("");
    }
  }, [definitionDraft.triggers, selectedTriggerId]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      TOPOLOGY_SPLIT_STORAGE_KEY,
      String(Math.round(topologySplitPercent)),
    );
  }, [topologySplitPercent]);

  const selectedNode = React.useMemo(
    () => findNodeById(definitionDraft.nodes, selectedNodeId),
    [definitionDraft.nodes, selectedNodeId],
  );

  const selectedNodeType = React.useMemo(() => {
    if (!selectedNode?.type) {
      return undefined;
    }
    return nodeTypes.find((nodeType) => nodeType.type === selectedNode.type);
  }, [nodeTypes, selectedNode]);

  const selectedNodeExpressionSuggestions = React.useMemo(
    () =>
      selectedNodeId
        ? buildWorkflowExpressionSuggestions(
            definitionDraft,
            nodeTypes,
            selectedNodeId,
            workflowSecretRecords,
          )
        : [],
    [definitionDraft, nodeTypes, selectedNodeId, workflowSecretRecords],
  );

  const addNodeExpressionSuggestions = React.useMemo(
    () =>
      pendingInsertTarget
        ? buildWorkflowExpressionSuggestions(
            definitionDraft,
            nodeTypes,
            getExpressionBoundaryNodeIdForInsertTarget(
              definitionDraft.nodes,
              pendingInsertTarget,
            ),
            workflowSecretRecords,
          )
        : [],
    [definitionDraft, nodeTypes, pendingInsertTarget, workflowSecretRecords],
  );

  const validateWorkflowIdentity = React.useCallback(() => {
    const errors: WorkflowIdentityErrors = {};
    const displayName = workflowDisplayName.trim();
    const key = workflowKey.trim();
    const namespace = workflowNamespace.trim();
    const pendingTags = parseWorkflowTagInput(workflowTagDraft);
    const tags = [...workflowTags, ...pendingTags];

    if (!displayName) {
      errors.displayName = "Workflow name is required.";
    }

    if (!workflowModule?.id && !workflowModule?.name) {
      errors.moduleMetadata = "Module is required.";
    } else if (!isWorkflowModuleSelectable(workflowModule)) {
      errors.moduleMetadata = "Workflows cannot be saved to Solid Core. Select an application module.";
    }

    if (!key) {
      errors.key = "Key is required.";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
      errors.key = "Key can only contain lowercase letters, numbers, and hyphens.";
    }

    if (namespace && !/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(namespace)) {
      errors.namespace =
        "Namespace can only contain lowercase letters, numbers, dots, and hyphens.";
    }

    if (tags.some((tag) => !/^[\w.-]+$/.test(tag))) {
      errors.tags = "Tags can only contain letters, numbers, underscores, dots, and hyphens.";
    }

    setWorkflowIdentityErrors(errors);
    return errors;
  }, [
    workflowDisplayName,
    workflowKey,
    workflowModule,
    workflowNamespace,
    workflowTagDraft,
    workflowTags,
  ]);

  const hasWorkflowIdentityErrors = (errors: WorkflowIdentityErrors) =>
    Object.keys(errors).length > 0;

  const handleWorkflowDisplayNameChange = (nextDisplayName: string) => {
    setWorkflowDisplayName(nextDisplayName);

    if (workflowDefinitionId === "new") {
      setWorkflowKey(slugifyWorkflowKey(nextDisplayName));
    }

    setWorkflowIdentityErrors((current) => ({
      ...current,
      displayName: undefined,
      key: undefined,
    }));
  };

  const handleWorkflowNamespaceChange = (nextNamespace: string) => {
    setWorkflowNamespace(nextNamespace);
    setWorkflowIdentityErrors((current) => ({ ...current, namespace: undefined }));
  };

  const searchWorkflowModules = React.useCallback(
    ({ query }: { query: string }) => {
      const normalizedQuery = query.trim().toLowerCase();
      const nextSuggestions = normalizedQuery
        ? selectableModuleRecords.filter((module) =>
            [module.displayName, module.name]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
          )
        : selectableModuleRecords;
      setWorkflowModuleSuggestions(nextSuggestions);
    },
    [selectableModuleRecords],
  );

  const handleWorkflowModuleChange = ({ value }: { value: any }) => {
    if (value && !isWorkflowModuleSelectable(value)) {
      setWorkflowModule(null);
      setWorkflowIdentityErrors((current) => ({
        ...current,
        moduleMetadata: "Workflows cannot be saved to Solid Core. Select an application module.",
      }));
      return;
    }

    setWorkflowModule(value ?? null);
    setWorkflowIdentityErrors((current) => ({ ...current, moduleMetadata: undefined }));
  };

  const commitWorkflowTags = React.useCallback((value = workflowTagDraft) => {
    const nextTags = parseWorkflowTagInput(value);
    if (!nextTags.length) {
      setWorkflowTagDraft("");
      return;
    }

    setWorkflowTags((current) => {
      const seen = new Set(current.map((tag) => tag.toLowerCase()));
      const merged = [...current];
      nextTags.forEach((tag) => {
        const normalizedKey = tag.toLowerCase();
        if (!seen.has(normalizedKey)) {
          seen.add(normalizedKey);
          merged.push(tag);
        }
      });
      return merged;
    });
    setWorkflowTagDraft("");
    setWorkflowIdentityErrors((current) => ({ ...current, tags: undefined }));
  }, [workflowTagDraft]);

  const removeWorkflowTag = (tagToRemove: string) => {
    setWorkflowTags((current) => current.filter((tag) => tag !== tagToRemove));
    setWorkflowIdentityErrors((current) => ({ ...current, tags: undefined }));
  };

  const handleWorkflowTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitWorkflowTags();
      return;
    }

    if (event.key === "Backspace" && !workflowTagDraft && workflowTags.length) {
      event.preventDefault();
      setWorkflowTags((current) => current.slice(0, -1));
    }
  };

  const topologyDocsNodeType = React.useMemo(() => {
    if (!topologyDocsNodeTypeKey) {
      return undefined;
    }
    return nodeTypes.find((nodeType) => nodeType.type === topologyDocsNodeTypeKey);
  }, [nodeTypes, topologyDocsNodeTypeKey]);

  const workflowStats = React.useMemo(
    () => ({
      nodeCount: countNodes(definitionDraft.nodes),
      triggerCount: countTriggers(definitionDraft.triggers),
      inputCount:
        definitionDraft.inputs && typeof definitionDraft.inputs === "object"
          ? Array.isArray(definitionDraft.inputs)
            ? definitionDraft.inputs.length
            : Object.keys(definitionDraft.inputs).length
          : 0,
    }),
    [definitionDraft],
  );

  const numericWorkflowDefinitionId = React.useMemo(() => {
    const candidate = record?.id ?? Number(workflowDefinitionId);
    const parsedCandidate =
      typeof candidate === "number" ? candidate : Number(candidate);
    return Number.isFinite(parsedCandidate) ? parsedCandidate : null;
  }, [record?.id, workflowDefinitionId]);

  const validationTag = React.useMemo(() => {
    if (validationState.status === "valid") {
      return { tone: "success" as const, label: "Validated" };
    }
    if (validationState.status === "invalid") {
      return { tone: "danger" as const, label: "Needs fixes" };
    }
    if (validationState.status === "validating") {
      return { tone: undefined, label: "Validating" };
    }
    return { tone: undefined, label: "Not validated" };
  }, [validationState.status]);

  const loadWorkflowExecutions = React.useCallback(async (page = executionPage) => {
    if (!numericWorkflowDefinitionId) {
      return;
    }

    await triggerGetWorkflowExecutions(
      buildWorkflowExecutionQueryString({
        workflowDefinitionId: numericWorkflowDefinitionId,
        startDate: overviewStartDate,
        endDate: overviewEndDate,
        status: executionStatusFilter,
        search: executionSearchFilter,
        limit: WORKFLOW_EXECUTION_PAGE_SIZE,
        offset: (page - 1) * WORKFLOW_EXECUTION_PAGE_SIZE,
      }),
    );
  }, [
    executionPage,
    executionSearchFilter,
    executionStatusFilter,
    numericWorkflowDefinitionId,
    overviewEndDate,
    overviewStartDate,
    triggerGetWorkflowExecutions,
  ]);

  const loadWorkflowExecutionPresence = React.useCallback(async () => {
    if (!numericWorkflowDefinitionId || workflowDefinitionId === "new") {
      return;
    }

    await triggerGetWorkflowExecutionPresence(
      buildWorkflowExecutionQueryString({
        workflowDefinitionId: numericWorkflowDefinitionId,
        limit: 1,
      }),
    );
  }, [
    numericWorkflowDefinitionId,
    triggerGetWorkflowExecutionPresence,
    workflowDefinitionId,
  ]);

  React.useEffect(() => {
    void loadWorkflowExecutionPresence();
  }, [loadWorkflowExecutionPresence]);

  React.useEffect(() => {
    if (
      detailTab !== "executions" ||
      !numericWorkflowDefinitionId ||
      workflowDefinitionId === "new"
    ) {
      return;
    }

    void loadWorkflowExecutions();
  }, [
    detailTab,
    loadWorkflowExecutions,
    numericWorkflowDefinitionId,
    workflowDefinitionId,
  ]);

  const refreshWorkflowExecutionData = React.useCallback(async () => {
    if (!numericWorkflowDefinitionId || workflowDefinitionId === "new") {
      return;
    }

    setExecutionPage(1);
    await Promise.all([loadWorkflowExecutionPresence(), loadWorkflowExecutions(1)]);
  }, [
    loadWorkflowExecutionPresence,
    loadWorkflowExecutions,
    numericWorkflowDefinitionId,
    workflowDefinitionId,
  ]);

  const executionRecords = React.useMemo(
    () => ((workflowExecutionsQuery.data?.records ?? []) as WorkflowExecutionRecord[]),
    [workflowExecutionsQuery.data?.records],
  );
  const executionTotalRecords = workflowExecutionsQuery.data?.meta?.totalRecords ?? 0;
  const executionTotalPages = Math.max(
    1,
    Math.ceil(executionTotalRecords / WORKFLOW_EXECUTION_PAGE_SIZE),
  );
  const executionPageStart = executionTotalRecords
    ? (executionPage - 1) * WORKFLOW_EXECUTION_PAGE_SIZE + 1
    : 0;
  const executionPageEnd = Math.min(
    executionPage * WORKFLOW_EXECUTION_PAGE_SIZE,
    executionTotalRecords,
  );
  const openExecutionDetails = React.useCallback((execution: WorkflowExecutionRecord) => {
    navigate(`/admin/core/solid-core/workflow-execution/detail/${execution.id}`);
  }, [navigate]);

  const loadSelectedExecutionLogs = React.useCallback(async () => {
    if (!selectedExecution?.id) {
      return;
    }

    await triggerGetWorkflowExecutionLogs(
      buildWorkflowExecutionLogQueryString({
        workflowExecutionId: selectedExecution.id,
        level: executionLogLevelFilter,
        search: executionLogSearch,
      }),
    );
  }, [
    executionLogLevelFilter,
    executionLogSearch,
    selectedExecution?.id,
    triggerGetWorkflowExecutionLogs,
  ]);

  React.useEffect(() => {
    if (!selectedExecution?.id) {
      return;
    }

    void loadSelectedExecutionLogs();
  }, [loadSelectedExecutionLogs, selectedExecution?.id]);

  const loadSelectedExecutionSteps = React.useCallback(async () => {
    if (!selectedExecution?.id) {
      return;
    }

    await triggerGetWorkflowStepExecutions(
      buildWorkflowStepExecutionQueryString({
        workflowExecutionId: selectedExecution.id,
      }),
    );
  }, [selectedExecution?.id, triggerGetWorkflowStepExecutions]);

  React.useEffect(() => {
    if (!selectedExecution?.id) {
      return;
    }

    void loadSelectedExecutionSteps();
  }, [loadSelectedExecutionSteps, selectedExecution?.id]);

  const executionLogRecords = React.useMemo(
    () => ((workflowExecutionLogsQuery.data?.records ?? []) as WorkflowExecutionLogRecord[]),
    [workflowExecutionLogsQuery.data?.records],
  );

  const executionStepRecords = React.useMemo(
    () => ((workflowStepExecutionsQuery.data?.records ?? []) as WorkflowStepExecutionRecord[]),
    [workflowStepExecutionsQuery.data?.records],
  );

  const executionTimeline = React.useMemo(() => {
    if (!selectedExecution) {
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
      parseExecutionTimestamp(selectedExecution.startedAt) ??
      parseExecutionTimestamp(selectedExecution.createdAt) ??
      Date.now();
    const executionFinish =
      parseExecutionTimestamp(selectedExecution.finishedAt) ??
      (getNumericDurationMs(selectedExecution.durationMs) != null
        ? executionStart + (getNumericDurationMs(selectedExecution.durationMs) ?? 0)
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

    const startMs = Math.min(
      executionStart,
      ...normalizedSteps.map((item) => item.startedAt),
    );
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
  }, [executionStepRecords, selectedExecution]);

  const renderOutputPrimitive = React.useCallback((value: unknown) => {
    if (typeof value === "string" && isUrlLike(value)) {
      return (
        <a href={value} target="_blank" rel="noreferrer">
          {value}
        </a>
      );
    }

    return formatOutputVisualValue(value);
  }, []);

  const renderOutputVisual = React.useCallback(
    (
      value: unknown,
      options: {
        hideSummary?: boolean;
      } = {},
    ): React.ReactNode => {
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
              {normalizedValue.length > 25 ? (
                <p className="workflow-editor-output-note">
                  Showing the first 25 rows. Switch to JSON to inspect the full payload.
                </p>
              ) : null}
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

      const entries = Object.entries(normalizedValue);
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
                <div
                  key={key}
                  className={`workflow-editor-output-field ${isNested ? "is-nested" : ""}`}
                >
                  <span>{key}</span>
                  {isNested ? (
                    <pre>{formatReadonlyJson(item)}</pre>
                  ) : (
                    <strong>{renderOutputPrimitive(item)}</strong>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    },
    [renderOutputPrimitive],
  );

  const selectedExecutionModalTabs = React.useMemo(() => {
    if (!selectedExecution) {
      return [];
    }

    const summaryContent = (
      <div className="workflow-editor-execution-detail-summary">
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Status</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {selectedExecution.status ?? "Unknown"}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Execution Identifier</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {selectedExecution.executionIdentifier ?? "-"}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Workflow</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {selectedExecution.workflowDisplayName ??
              workflowDisplayName ??
              record?.displayName ??
              "-"}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Workflow Key</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {selectedExecution.workflowKey ?? workflowKey ?? "-"}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Trigger Type</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {selectedExecution.triggerType ?? "manual"}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Started</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {formatExecutionDate(selectedExecution.startedAt || selectedExecution.createdAt)}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Finished</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {formatExecutionDate(selectedExecution.finishedAt)}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Duration</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {formatDurationMs(selectedExecution.durationMs)}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Definition Version</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {selectedExecution.definitionVersion ?? "-"}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Definition Checksum</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {selectedExecution.definitionChecksum ?? "-"}
          </div>
        </div>
        <div className="workflow-editor-execution-detail-kv">
          <div className="workflow-editor-execution-detail-kv__label">Requested By</div>
          <div className="workflow-editor-execution-detail-kv__value">
            {selectedExecution.requestedByUserId ?? "-"}
          </div>
        </div>
      </div>
    );

    const timelineContent = (
      <div className="workflow-editor-execution-timeline">
        <div className="workflow-editor-execution-timeline__hero">
          <div>
            <h4>Execution Timeline</h4>
            <p>
              Step-level timing across this execution. Parallel work appears as
              overlapping bars; sequential work appears left-to-right.
            </p>
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
              <strong>
                {executionTimeline.slowestStep?.nodeName ??
                  executionTimeline.slowestStep?.nodeId ??
                  "-"}
              </strong>
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
                    <div
                      key={row.step.id}
                      className={`workflow-editor-execution-gantt-row workflow-editor-execution-gantt-row--${row.status} ${isExpanded ? "is-expanded" : ""}`}
                    >
                      <button
                        type="button"
                        className="workflow-editor-execution-gantt-row__main"
                        aria-expanded={isExpanded}
                        onClick={() =>
                          setExpandedTimelineStepId((current) =>
                            current === row.step.id ? null : row.step.id,
                          )
                        }
                      >
                        <span className="workflow-editor-execution-gantt-row__toggle">
                          <ChevronRight size={14} />
                        </span>
                      <span
                        className="workflow-editor-execution-gantt-row__identity"
                        style={{ "--workflow-step-depth": row.depth } as React.CSSProperties}
                      >
                        <strong>{row.label}</strong>
                        <span>{row.step.nodeType ?? row.step.nodeKind ?? "step"}</span>
                      </span>
                        <span className="workflow-editor-execution-gantt-row__track">
                          <span
                            className="workflow-editor-execution-gantt-row__bar"
                            style={{
                              left: `${row.startOffsetPercent}%`,
                              width: `${row.widthPercent}%`,
                            }}
                          />
                        </span>
                        <SolidTag tone={workflowLogLevelTone(row.status) as any}>
                          {row.step.status ?? "unknown"}
                        </SolidTag>
                        <span className="workflow-editor-execution-gantt-row__duration">
                          {formatDurationMs(row.durationMs)}
                        </span>
                      </button>

                      {isExpanded ? (
                        <div className="workflow-editor-execution-gantt-row__details">
                          <div className="workflow-editor-execution-step-inspector">
                            <div className="workflow-editor-execution-step-inspector__header">
                              <div>
                                <span>Step Detail</span>
                                <h4>{row.label}</h4>
                              </div>
                              <button
                                type="button"
                                aria-label="Collapse step detail"
                                onClick={() => setExpandedTimelineStepId(null)}
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="workflow-editor-execution-step-inspector__meta">
                              <div>
                                <span>Status</span>
                                <strong>{row.step.status ?? "unknown"}</strong>
                              </div>
                              <div>
                                <span>Node Id</span>
                                <strong>{row.step.nodeId ?? "-"}</strong>
                              </div>
                              <div>
                                <span>Node Type</span>
                                <strong>{row.step.nodeType ?? "-"}</strong>
                              </div>
                              <div>
                                <span>Attempt</span>
                                <strong>{row.step.attemptNumber ?? 1}</strong>
                              </div>
                              <div>
                                <span>Started</span>
                                <strong>{formatExecutionDate(row.step.startedAt)}</strong>
                              </div>
                              <div>
                                <span>Finished</span>
                                <strong>{formatExecutionDate(row.step.finishedAt)}</strong>
                              </div>
                              <div>
                                <span>Duration</span>
                                <strong>{formatDurationMs(row.durationMs)}</strong>
                              </div>
                              <div>
                                <span>Step Key</span>
                                <strong>{row.step.stepExecutionKey ?? "-"}</strong>
                              </div>
                            </div>

                            {row.step.errorSummary ? (
                              <div className="workflow-editor-execution-step-inspector__error">
                                {row.step.errorSummary}
                              </div>
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
            <p>
              This execution does not have persisted step execution records yet. Once
              step lifecycle records are present, this tab renders a proportional
              Gantt-style timeline automatically.
            </p>
          </div>
        )}
      </div>
    );

    const logLevelCounts = executionLogRecords.reduce<Record<string, number>>(
      (counts, log) => {
        const key = (log.level ?? "unknown").toLowerCase();
        counts[key] = (counts[key] ?? 0) + 1;
        return counts;
      },
      {},
    );
    const logsContent = (
      <div className="workflow-editor-execution-logs">
        <div className="workflow-editor-execution-logs__hero">
          <div>
            <h4>Execution Log Stream</h4>
            <p>
              Runtime messages emitted while this execution was processed, ordered by
              sequence and occurrence time.
            </p>
          </div>
          <div className="workflow-editor-execution-logs__stats">
            <span>{workflowExecutionLogsQuery.isFetching ? "Loading" : `${executionLogRecords.length} logs`}</span>
            {Object.entries(logLevelCounts).map(([level, count]) => (
              <SolidTag key={level} tone={workflowLogLevelTone(level) as any}>
                {level}: {count}
              </SolidTag>
            ))}
          </div>
        </div>

        <div className="workflow-editor-execution-logs__filters">
          <div className="workflow-editor-execution-logs__search">
            <Search size={14} />
            <SolidInput
              value={executionLogSearch}
              placeholder="Search message, node, source"
              onChange={(event) => {
                setExecutionLogSearch(event.target.value);
                setExpandedExecutionLogId(null);
              }}
            />
          </div>
          <SolidSelect
            value={executionLogLevelFilter}
            options={WORKFLOW_LOG_LEVEL_OPTIONS}
            onChange={(event) => {
              setExecutionLogLevelFilter(event.value ?? "all");
              setExpandedExecutionLogId(null);
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
              const isSelected = expandedExecutionLogId === log.id;
              return (
                <div
                  key={log.id}
                  className={`workflow-editor-execution-log-row workflow-editor-execution-log-row--${(log.level ?? "info").toLowerCase()} ${isSelected ? "is-selected" : ""}`}
                >
                  <button
                    type="button"
                    className="workflow-editor-execution-log-row__main"
                    aria-expanded={isSelected}
                    onClick={() =>
                      setExpandedExecutionLogId((current) =>
                        current === log.id ? null : log.id,
                      )
                    }
                  >
                    <span className="workflow-editor-execution-log-row__toggle">
                      <ChevronRight size={14} />
                    </span>
                    <span className="workflow-editor-execution-log-row__sequence">
                      {log.sequenceNumber ?? log.id}
                    </span>
                    <span className="workflow-editor-execution-log-row__time">
                      {formatExecutionLogTime(log.occurredAt || log.createdAt)}
                    </span>
                    <SolidTag tone={workflowLogLevelTone(log.level) as any}>
                      {log.level ?? "info"}
                    </SolidTag>
                    <span className="workflow-editor-execution-log-row__node">
                      {log.nodeId ?? log.source ?? "runtime"}
                    </span>
                    <span className="workflow-editor-execution-log-row__message">
                      {log.message ?? "No message"}
                    </span>
                    {log.eventType ? (
                      <span className="workflow-editor-execution-log-row__event">
                        {log.eventType}
                      </span>
                    ) : null}
                  </button>
                  {isSelected ? (
                    <div className="workflow-editor-execution-log-row__details">
                      <div className="workflow-editor-execution-log-inspector">
                        <div className="workflow-editor-execution-log-inspector__header">
                          <div>
                            <span>Log Detail</span>
                            <h4>{log.message ?? "No message"}</h4>
                          </div>
                          <button
                            type="button"
                            aria-label="Collapse log detail"
                            onClick={() => setExpandedExecutionLogId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="workflow-editor-execution-log-inspector__meta">
                          <div>
                            <span>Level</span>
                            <strong>{log.level ?? "info"}</strong>
                          </div>
                          <div>
                            <span>Sequence</span>
                            <strong>{log.sequenceNumber ?? log.id}</strong>
                          </div>
                          <div>
                            <span>Occurred</span>
                            <strong>
                              {formatExecutionDate(log.occurredAt || log.createdAt)}
                            </strong>
                          </div>
                          <div>
                            <span>Node</span>
                            <strong>{log.nodeId ?? "-"}</strong>
                          </div>
                          <div>
                            <span>Node Type</span>
                            <strong>{log.nodeType ?? "-"}</strong>
                          </div>
                          <div>
                            <span>Source</span>
                            <strong>{log.source ?? "-"}</strong>
                          </div>
                          <div>
                            <span>Event Type</span>
                            <strong>{log.eventType ?? "-"}</strong>
                          </div>
                          <div>
                            <span>Log Key</span>
                            <strong>{log.logKey ?? "-"}</strong>
                          </div>
                        </div>

                        {log.context || log.metadata ? (
                          <div className="workflow-editor-execution-log-inspector__payloads">
                            <div>
                              <h5>Context</h5>
                              <SolidCodeEditor
                                language="json"
                                height="180px"
                                fontSize={12}
                                readOnly
                                value={formatReadonlyJson(log.context)}
                              />
                            </div>
                            <div>
                              <h5>Metadata</h5>
                              <SolidCodeEditor
                                language="json"
                                height="180px"
                                fontSize={12}
                                readOnly
                                value={formatReadonlyJson(log.metadata)}
                              />
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
            <p>
              This execution has no log entries matching the current filters. Try another
              level or clear the search text.
            </p>
          </div>
        )}
      </div>
    );

    const selectedExecutionOutputEntries = buildExecutionOutputEntries(
      selectedExecution.outputPayload,
      definitionDraft.nodes,
    );

    const outputContent = (
      <div className="workflow-editor-output-viewer">
        <div className="workflow-editor-output-viewer__toolbar">
          <div>
            <h4>Execution Output</h4>
            <p>Inspect node outputs visually or switch to the raw JSON payload.</p>
          </div>
          <div className="workflow-editor-view-toggle" aria-label="Output view">
            <button
              type="button"
              className={`workflow-editor-view-toggle__button ${selectedExecutionOutputMode === "visual" ? "is-active" : ""}`}
              aria-label="Show visual output"
              title="Visual output"
              onClick={() => setSelectedExecutionOutputMode("visual")}
            >
              <Layers3 size={14} />
            </button>
            <button
              type="button"
              className={`workflow-editor-view-toggle__button ${selectedExecutionOutputMode === "json" ? "is-active" : ""}`}
              aria-label="Show JSON output"
              title="JSON output"
              onClick={() => setSelectedExecutionOutputMode("json")}
            >
              <Braces size={14} />
            </button>
          </div>
        </div>

        {selectedExecutionOutputMode === "json" ? (
          <div className="workflow-editor-output-json-editor">
            <SolidJsonEditor
              value={normalizeJsonDisplayValue(selectedExecution.outputPayload)}
              resetToken={`execution-output-${selectedExecution.id}-${selectedExecutionOutputMode}`}
              readOnly
              className="sdix-json-editor workflow-editor-output-json-host"
            />
          </div>
        ) : selectedExecutionOutputEntries.length ? (
          <div className="workflow-editor-output-node-list">
            {selectedExecutionOutputEntries.map((entry, index) => {
              const isExpanded = expandedExecutionOutputKey === entry.key;

              return (
                <div
                  key={entry.key}
                  className={`workflow-editor-output-node-row ${isExpanded ? "is-expanded" : ""}`}
                >
                  <button
                    type="button"
                    className="workflow-editor-output-node-row__header"
                    aria-expanded={isExpanded}
                    onClick={() =>
                      setExpandedExecutionOutputKey((current) =>
                        current === entry.key ? null : entry.key,
                      )
                    }
                  >
                    <span className="workflow-editor-output-node-row__toggle">
                      <ChevronRight size={15} />
                    </span>
                    <span className="workflow-editor-output-node-row__sequence">
                      {index + 1}
                    </span>
                    <span className="workflow-editor-output-node-row__identity">
                      <strong>{entry.label}</strong>
                    </span>
                    <span className="workflow-editor-output-node-row__node-key">
                      {entry.nodeId ?? entry.key}
                    </span>
                    {entry.nodeType ? <SolidTag>{entry.nodeType}</SolidTag> : null}
                    <span className="workflow-editor-output-node-row__summary">
                      {summarizeOutputValue(entry.value)}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="workflow-editor-output-node-row__body">
                      <div className="workflow-editor-output-node-detail">
                        <div className="workflow-editor-output-node-detail__header">
                          <div>
                            <span>Output Detail</span>
                            <h4>{entry.label}</h4>
                          </div>
                          <button
                            type="button"
                            aria-label="Collapse output detail"
                            onClick={() => setExpandedExecutionOutputKey(null)}
                          >
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
    );

    return [
      {
        value: "summary",
        label: "Summary",
        content: summaryContent,
      },
      {
        value: "timeline",
        label: "Timeline",
        content: timelineContent,
      },
      {
        value: "logs",
        label: "Logs",
        content: logsContent,
      },
      {
        value: "input",
        label: "Input",
        content: (
          <SolidCodeEditor
            language="json"
            height="calc(100vh - 260px)"
            fontSize={12}
            readOnly
            value={formatReadonlyJson(selectedExecution.inputPayload)}
          />
        ),
      },
      {
        value: "output",
        label: "Output",
        content: outputContent,
      },
      {
        value: "error",
        label: "Error",
        content: (
          <div className="workflow-editor-execution-detail-error">
            <div className="workflow-editor-execution-detail-kv">
              <div className="workflow-editor-execution-detail-kv__label">Error Summary</div>
              <div className="workflow-editor-execution-detail-kv__value">
                {selectedExecution.errorSummary ?? "-"}
              </div>
            </div>
            <SolidCodeEditor
              language="json"
              height="calc(100vh - 320px)"
              fontSize={12}
              readOnly
              value={formatReadonlyJson(selectedExecution.errorDetails)}
            />
          </div>
        ),
      },
      {
        value: "definition",
        label: "Definition",
        content: (
          <SolidCodeEditor
            language="yaml"
            height="calc(100vh - 260px)"
            fontSize={12}
            readOnly
            value={formatReadonlyYaml(selectedExecution.definitionSnapshot)}
          />
        ),
      },
    ];
  }, [
    executionLogLevelFilter,
    executionLogRecords,
    executionLogSearch,
    executionTimeline,
    expandedExecutionOutputKey,
    expandedExecutionLogId,
    expandedTimelineStepId,
    definitionDraft.nodes,
    record?.displayName,
    renderOutputVisual,
    selectedExecution,
    selectedExecutionOutputMode,
    workflowDisplayName,
    workflowExecutionLogsQuery.isFetching,
    workflowStepExecutionsQuery.isFetching,
    workflowKey,
  ]);

  const hasExecutions = React.useMemo(
    () => (workflowExecutionPresenceQuery.data?.meta?.totalRecords ?? 0) > 0,
    [workflowExecutionPresenceQuery.data?.meta?.totalRecords],
  );

  const executionOverview = React.useMemo(() => {
    const totals = {
      total: executionRecords.length,
      success: 0,
      failed: 0,
      inProgress: 0,
      pending: 0,
      other: 0,
      totalDurationMs: 0,
      durationCount: 0,
    };

    for (const execution of executionRecords) {
      const category = getExecutionStatusCategory(execution.status);
      totals[category] += 1;

      const durationValue =
        typeof execution.durationMs === "string"
          ? Number(execution.durationMs)
          : execution.durationMs;
      if (
        typeof durationValue === "number" &&
        Number.isFinite(durationValue) &&
        durationValue > 0
      ) {
        totals.totalDurationMs += durationValue;
        totals.durationCount += 1;
      }
    }

    const terminalCount = totals.success + totals.failed;
    const successRatio = terminalCount ? Math.round((totals.success / terminalCount) * 100) : 0;
    const failedRatio = terminalCount ? Math.round((totals.failed / terminalCount) * 100) : 0;

    return {
      ...totals,
      successRatio,
      failedRatio,
      averageDurationMs: totals.durationCount
        ? Math.round(totals.totalDurationMs / totals.durationCount)
        : null,
      latestExecution: executionRecords[0],
    };
  }, [executionRecords]);

  const syncDraftToCode = React.useCallback((nextDraft: WorkflowDefinitionDsl) => {
    setDefinitionDraft(nextDraft);
    setCodeValue(serializeWorkflowDefinitionYaml(nextDraft));
    setCodeError(null);
    setValidationState({ status: "idle", errors: [] });
  }, []);

  const handleCodeChange = (nextValue: string | undefined) => {
    const safeValue = nextValue ?? "";
    setCodeValue(safeValue);

    const parsed = parseWorkflowDefinitionYaml(safeValue, nodeTypes);
    if (!parsed.ok) {
      const nextError = parsed.errors.join("\n");
      setCodeError(nextError);
      setValidationState({
        status: "invalid",
        source: "client",
        message: "Definition YAML is invalid.",
        errors: parsed.errors,
      });
      return;
    }

    setDefinitionDraft(parsed.definition);
    setCodeError(null);
    setValidationState({ status: "idle", errors: [] });
  };

  const startTopologySplitResize = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      const container = topologySplitRef.current;
      if (!container) {
        return;
      }

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        if (!rect.width) {
          return;
        }

        const nextPercent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
        setTopologySplitPercent(Math.min(78, Math.max(22, nextPercent)));
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [],
  );

  const createNodeFromType = (nodeType: WorkflowNodeMetadataResponse): WorkflowNodeRecord => {
    const nextNode: WorkflowNodeRecord = {
      id: buildNodeId(nodeType.type, definitionDraft),
      kind: nodeType.kind,
      type: nodeType.type,
      name: nodeType.label ?? nodeType.type,
      description: nodeType.description ?? "",
      configuration: nodeType.authoring?.defaultConfiguration ?? {},
    };

    (nodeType.authoring?.childSlots ?? []).forEach((slot) => {
      if (slot.kind === "case-collection") {
        nextNode[slot.key] = nextNode[slot.key] ?? {
          true: [],
          false: [],
        };
        return;
      }

      nextNode[slot.key] = nextNode[slot.key] ?? [];
    });

    return nextNode;
  };

  const validateCurrentDefinition = React.useCallback(
    async (options?: { showSuccessToast?: boolean }) => {
      const identityErrors = validateWorkflowIdentity();
      if (hasWorkflowIdentityErrors(identityErrors)) {
        setDetailTab("overview");
        return {
          valid: false,
          errors: Object.values(identityErrors).filter(Boolean) as string[],
          fieldErrors: true,
        };
      }

      if (codeError) {
        const nextState: ValidationState = {
          status: "invalid",
          source: "client",
          message: "Definition YAML is invalid.",
          errors: [codeError],
        };
        setValidationState(nextState);
        setDetailTab("topology");
        return { valid: false, errors: nextState.errors };
      }

      setValidationState({
        status: "validating",
        errors: [],
        message: "Validating workflow definition...",
      });

      const clientErrors = validateWorkflowDefinitionClient(
        {
          ...definitionDraft,
          description: workflowDescription,
        },
        nodeTypes,
        workflowKey,
      );

      if (clientErrors.length) {
        const nextState: ValidationState = {
          status: "invalid",
          source: "client",
          message: "Client-side validation failed.",
          errors: clientErrors,
        };
        setValidationState(nextState);
        setDetailTab("topology");
        return { valid: false, errors: clientErrors };
      }

      try {
        const response: any = await validateWorkflowDefinition({
          definitionYaml: serializeWorkflowDefinitionYaml({
            ...definitionDraft,
            description: workflowDescription,
          }),
        }).unwrap();

        const nextState: ValidationState = {
          status: "valid",
          source: "server",
          message: response?.message ?? "Workflow definition is valid.",
          errors: [],
        };
        setValidationState(nextState);

        if (options?.showSuccessToast) {
          dispatch(
            showToast({
              severity: "success",
              summary: "Validation passed",
              detail: nextState.message,
            }),
          );
        }

        return { valid: true, errors: [] };
      } catch (error: any) {
        const detail =
          error?.data?.message ??
          error?.message ??
          "Workflow validation failed on the server.";
        const nextState: ValidationState = {
          status: "invalid",
          source: "server",
          message: detail,
          errors: [detail],
        };
        setValidationState(nextState);
        setDetailTab("topology");
        return { valid: false, errors: [detail] };
      }
    },
    [
      codeError,
      definitionDraft,
      dispatch,
      nodeTypes,
      validateWorkflowDefinition,
      validateWorkflowIdentity,
      workflowDescription,
      workflowKey,
      workflowModule,
      workflowNamespace,
      workflowStatus,
      workflowTagDraft,
      workflowTags,
    ],
  );

  const handleInsertNode = (target: WorkflowInsertTarget) => {
    setPendingInsertTarget(target);
    setDetailTab("topology");
  };

  const handleAddNodeSubmit = (nextNode: WorkflowNodeRecord) => {
    if (!pendingInsertTarget) {
      return;
    }

    const nextDraft = insertNodeIntoDefinition(
      definitionDraft,
      pendingInsertTarget,
      nextNode,
    );
    syncDraftToCode(nextDraft);
    setSelectedNodeId(nextNode.id);
    setSelectedTriggerId("");
    setPendingInsertTarget(null);
    setDetailTab("topology");
  };

  const handleUpdateSelectedNode = (nextNode: WorkflowNodeRecord) => {
    if (!selectedNode) {
      return;
    }

    const nextDraft = {
      ...definitionDraft,
      nodes: updateNodeById(definitionDraft.nodes, selectedNode.id, () => nextNode),
    };

    syncDraftToCode(nextDraft);
    setSelectedNodeId(nextNode.id);
  };

  const handleRemoveNode = (nodeId: string) => {
    const nextDraft = {
      ...definitionDraft,
      nodes: removeNodeById(definitionDraft.nodes, nodeId),
    };
    syncDraftToCode(nextDraft);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(getFirstNodeId(nextDraft.nodes));
    }
  };

  const handleSave = async () => {
    const validation = await validateCurrentDefinition();
    if (!validation.valid) {
      if (!(validation as any).fieldErrors) {
        dispatch(
          showToast({
            severity: "error",
            summary: "Validation failed",
            detail: validation.errors[0] ?? "Fix validation errors before saving.",
          }),
        );
      }
      return;
    }

    const payload = {
      key: workflowKey,
      displayName: workflowDisplayName,
      moduleMetadataId: workflowModule?.id,
      moduleMetadataUserKey: workflowModule?.name,
      namespace: workflowNamespace || null,
      description: workflowDescription,
      status: workflowStatus,
      definitionYaml: serializeWorkflowDefinitionYaml({
        ...definitionDraft,
        description: workflowDescription,
      }),
      tags: serializeJsonDtoValue(
        [...workflowTags, ...parseWorkflowTagInput(workflowTagDraft)],
        [],
      ),
    };

    try {
      if (record?.id) {
        await updateWorkflowDefinition({
          id: record.id,
          data: payload,
        }).unwrap();
        dispatch(
          showToast({
            severity: "success",
            summary: "Saved",
            detail: "Workflow definition updated successfully.",
          }),
        );
        refetch();
      } else {
        const result: any = await createWorkflowDefinition(payload).unwrap();
        const createdId = result?.data?.id ?? result?.id;
        dispatch(
          showToast({
            severity: "success",
            summary: "Created",
            detail: "Workflow definition created successfully.",
          }),
        );
        if (createdId) {
          navigate(
            `/admin/core/solid-core/workflow-definition/editor/${createdId}`,
            { replace: true },
          );
        }
      }
    } catch (error: any) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Save failed",
          detail:
            error?.data?.message ??
            error?.message ??
            "Failed to save workflow definition.",
        }),
      );
    }
  };

  const workflowInputEntries = React.useMemo(
    () => getWorkflowInputEntries(definitionDraft.inputs),
    [definitionDraft.inputs],
  );
  const workflowVariableEntries = React.useMemo(
    () => getWorkflowVariableEntries(definitionDraft.variables, definitionDraft.metadata),
    [definitionDraft.metadata, definitionDraft.variables],
  );
  const workflowExecutionReference =
    workflowDefinitionId && workflowDefinitionId !== "new"
      ? workflowDefinitionId
      : "{workflowDefinitionId}";
  const workflowExecutionKeyReference = workflowKey || "{workflowKey}";
  const workflowExecutionInputExample = React.useMemo(
    () => buildWorkflowInputExample(definitionDraft.inputs),
    [definitionDraft.inputs],
  );
  const workflowExecutionRequestBody = React.useMemo(
    () => ({
      input: workflowExecutionInputExample,
      triggerType: "api",
    }),
    [workflowExecutionInputExample],
  );
  const workflowCurlExample = React.useMemo(
    () =>
      [
        `curl -X POST "http://localhost:3000/api/workflow-definition/${workflowExecutionReference}/execute" \\`,
        `  -H "Authorization: Bearer <access-token>" \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -d '${JSON.stringify(workflowExecutionRequestBody, null, 2)}'`,
      ].join("\n"),
    [workflowExecutionReference, workflowExecutionRequestBody],
  );
  const workflowApiExample = React.useMemo(
    () =>
      [
        `import { Injectable } from "@nestjs/common";`,
        `import { WorkflowInvocationService } from "@solidxai/core";`,
        ``,
        `@Injectable()`,
        `export class CustomerWorkflowSubscriber {`,
        `  constructor(private readonly workflows: WorkflowInvocationService) {}`,
        ``,
        `  async handleCustomerEvent() {`,
        `    return this.workflows.executeByKey(`,
        `      "${workflowExecutionKeyReference}",`,
        `      ${JSON.stringify(workflowExecutionRequestBody, null, 6).replace(/\n/g, "\n      ")},`,
        `    );`,
        `  }`,
        `}`,
      ].join("\n"),
    [workflowExecutionKeyReference, workflowExecutionRequestBody],
  );
  const defaultValueEditorEntry = React.useMemo(
    () =>
      workflowInputEntries.find((entry) => entry.key === defaultValueEditorInputKey) ??
      null,
    [defaultValueEditorInputKey, workflowInputEntries],
  );
  const variableValueEditorEntry = React.useMemo(
    () =>
      workflowVariableEntries.find((entry) => entry.key === variableValueEditorKey) ??
      null,
    [variableValueEditorKey, workflowVariableEntries],
  );

  const copyWorkflowTriggerExample = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      dispatch(
        showToast({
          severity: "success",
          summary: "Copied",
          detail: "Workflow trigger example copied to clipboard.",
        }),
      );
    } catch {
      dispatch(
        showToast({
          severity: "error",
          summary: "Copy failed",
          detail: "Unable to copy the workflow trigger example.",
        }),
      );
    }
  };

  const executeWorkflowWithInput = async (input?: Record<string, any>) => {
    if (!record?.id) {
      dispatch(
        showToast({
          severity: "warn",
          summary: "Save first",
          detail: "Create the workflow definition before launching execution.",
        }),
      );
      return;
    }

    const validation = await validateCurrentDefinition();
    if (!validation.valid) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Execution blocked",
          detail: validation.errors[0] ?? "Workflow validation failed.",
        }),
      );
      return;
    }

    try {
      const response: any = await executeWorkflowDefinition({
        id: record.id,
        ...(input ? { input } : {}),
      }).unwrap();
      dispatch(
        showToast({
          severity: response?.status === "failed" ? "error" : "success",
          summary:
            response?.status === "failed"
              ? "Execution failed"
              : "Execution started",
          detail:
            response?.executionIdentifier ??
            response?.errorSummary ??
            "Workflow execution request completed.",
        }),
      );
      void refreshWorkflowExecutionData();
    } catch (error: any) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Execution failed",
          detail:
            error?.data?.message ??
            error?.message ??
            "Failed to execute workflow definition.",
        }),
      );
    }
  };

  const handleExecute = async () => {
    if (!record?.id) {
      dispatch(
        showToast({
          severity: "warn",
          summary: "Save first",
          detail: "Create the workflow definition before launching execution.",
        }),
      );
      return;
    }

    const validation = await validateCurrentDefinition();
    if (!validation.valid) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Execution blocked",
          detail: validation.errors[0] ?? "Workflow validation failed.",
        }),
      );
      return;
    }

    if (workflowInputEntries.length) {
      setRunInputValues(buildWorkflowRunInputDefaults(workflowInputEntries));
      setRunInputErrors({});
      setRunInputsOpen(true);
      return;
    }

    await executeWorkflowWithInput();
  };

  const handleRunInputsSubmit = async () => {
    const errors: Record<string, string> = {};
    const input: Record<string, any> = {};

    for (const entry of workflowInputEntries) {
      const rawValue = runInputValues[entry.key];
      const isEmpty =
        entry.definition.type === "boolean"
          ? false
          : rawValue === undefined || rawValue === null || String(rawValue).trim() === "";

      if (entry.definition.required && isEmpty) {
        errors[entry.key] = "This input is required.";
        continue;
      }

      if (!entry.definition.required && isEmpty) {
        continue;
      }

      try {
        input[entry.key] = parseWorkflowRunInputValue(
          rawValue,
          entry.definition.type,
        );
      } catch (error: any) {
        errors[entry.key] = error?.message ?? "Enter a valid value.";
      }
    }

    setRunInputErrors(errors);
    if (Object.keys(errors).length) {
      return;
    }

    setRunInputsOpen(false);
    await executeWorkflowWithInput(input);
  };

  const identityFieldClass = (field: keyof WorkflowIdentityErrors) =>
    `workflow-editor-field ${workflowIdentityErrors[field] ? "is-invalid" : ""}`;

  const renderWorkflowTagsInput = () => (
    <div
      className={`workflow-editor-tag-input ${workflowIdentityErrors.tags ? "is-invalid" : ""}`}
    >
      {workflowTags.map((tag) => (
        <span key={tag} className="workflow-editor-tag-pill">
          <span>{tag}</span>
          <button
            type="button"
            aria-label={`Remove ${tag}`}
            onClick={() => removeWorkflowTag(tag)}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      <SolidInput
        value={workflowTagDraft}
        placeholder={workflowTags.length ? "Add tag" : "Type tag and press Enter"}
        onChange={(event) => {
          setWorkflowTagDraft(event.target.value);
          setWorkflowIdentityErrors((current) => ({ ...current, tags: undefined }));
        }}
        onKeyDown={handleWorkflowTagKeyDown}
        onBlur={() => commitWorkflowTags()}
      />
    </div>
  );

  const renderWorkflowIdentityForm = () => (
    <SolidPanel header="Workflow Identity">
      <div className="workflow-editor-create-form">
        <div className={identityFieldClass("moduleMetadata")}>
          <label>Module</label>
          <SolidAutocomplete
            value={workflowModule}
            suggestions={workflowModuleSuggestions}
            completeMethod={searchWorkflowModules}
            onChange={handleWorkflowModuleChange}
            dropdown
            forceSelection
            field="displayName"
            placeholder="Select module"
            className="workflow-editor-autocomplete"
            inputClassName={workflowIdentityErrors.moduleMetadata ? "is-invalid" : undefined}
          />
          {workflowIdentityErrors.moduleMetadata ? (
            <div className="workflow-editor-field-error">
              {workflowIdentityErrors.moduleMetadata}
            </div>
          ) : null}
        </div>

        <div className={identityFieldClass("displayName")}>
          <label>Workflow Name</label>
          <SolidInput
            value={workflowDisplayName}
            placeholder="Send Welcome Email"
            className={workflowIdentityErrors.displayName ? "is-invalid" : undefined}
            onChange={(event) => handleWorkflowDisplayNameChange(event.target.value)}
          />
          {workflowIdentityErrors.displayName ? (
            <div className="workflow-editor-field-error">
              {workflowIdentityErrors.displayName}
            </div>
          ) : null}
        </div>

        <div className={identityFieldClass("key")}>
          <label>Key</label>
          <SolidInput
            value={workflowKey}
            readOnly
            placeholder="generated-from-workflow-name"
            className={workflowIdentityErrors.key ? "is-invalid" : undefined}
          />
          {workflowIdentityErrors.key ? (
            <div className="workflow-editor-field-error">{workflowIdentityErrors.key}</div>
          ) : null}
        </div>

        <div className={identityFieldClass("namespace")}>
          <label>Namespace</label>
          <SolidInput
            value={workflowNamespace}
            placeholder="customer.onboarding"
            className={workflowIdentityErrors.namespace ? "is-invalid" : undefined}
            onChange={(event) => handleWorkflowNamespaceChange(event.target.value)}
          />
          {workflowIdentityErrors.namespace ? (
            <div className="workflow-editor-field-error">
              {workflowIdentityErrors.namespace}
            </div>
          ) : null}
        </div>

        <div className="workflow-editor-field">
          <label>Status</label>
          <SolidSelect
            value={workflowStatus}
            options={WORKFLOW_STATUS_OPTIONS}
            onChange={(event) => setWorkflowStatus(event.value ?? "draft")}
          />
        </div>

        <div className={identityFieldClass("tags")}>
          <label>Tags</label>
          {renderWorkflowTagsInput()}
          {workflowIdentityErrors.tags ? (
            <div className="workflow-editor-field-error">{workflowIdentityErrors.tags}</div>
          ) : null}
        </div>

        <div className="workflow-editor-field workflow-editor-field--wide">
          <label>Description</label>
          <SolidTextarea
            value={workflowDescription}
            placeholder="Describe what this workflow does and when it should run."
            onChange={(event) => setWorkflowDescription(event.target.value)}
          />
        </div>
      </div>
    </SolidPanel>
  );

  const overviewContent = (
    <div className="workflow-editor-overview workflow-editor-overview--create">
      {renderWorkflowIdentityForm()}
    </div>
  );

  const renderOptionalAuthoringEmptyState = ({
    icon,
    title,
    body,
    examples,
    primaryLabel,
    onPrimaryClick,
  }: {
    icon: React.ReactNode;
    title: string;
    body: string;
    examples: string[];
    primaryLabel: string;
    onPrimaryClick: () => void;
  }) => (
    <div className="workflow-editor-optional-state">
      <div className="workflow-editor-placeholder__icon">{icon}</div>
      <div className="workflow-editor-optional-state__copy">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <div className="workflow-editor-optional-state__examples">
        {examples.map((example) => (
          <SolidTag key={example}>{example}</SolidTag>
        ))}
      </div>
      <div className="workflow-editor-optional-state__actions">
        <SolidButton onClick={onPrimaryClick}>{primaryLabel}</SolidButton>
        <SolidButton variant="outline" onClick={() => setDetailTab("topology")}>
          Configure Flow
        </SolidButton>
      </div>
    </div>
  );

  const triggerEntries = (definitionDraft.triggers ?? []).map((trigger, index) => ({
    index,
    trigger: normalizeWorkflowTriggerDefinition(trigger),
  }));
  const scheduledTriggerEntries = triggerEntries.filter(
    ({ trigger }) => trigger.type === "schedule",
  );

  const updateWorkflowInputs = (nextInputs: Record<string, any>) => {
    syncDraftToCode({
      ...definitionDraft,
      inputs: nextInputs,
    });
  };

  const addWorkflowInput = () => {
    const nextKey = buildUniqueWorkflowInputKey("Input", Object.keys(definitionDraft.inputs ?? {}));
    updateWorkflowInputs({
      ...(definitionDraft.inputs ?? {}),
      [nextKey]: {
        type: "string",
        label: "Input",
        required: false,
        default: "",
        description: "",
      },
    });
  };

  const updateWorkflowInputLabel = (currentKey: string, nextLabel: string) => {
    const currentInputs = definitionDraft.inputs ?? {};
    const nextKey = buildUniqueWorkflowInputKey(
      nextLabel || currentKey,
      Object.keys(currentInputs).filter((key) => key !== currentKey),
    );

    if (!nextKey) {
      return;
    }

    const nextInputs: Record<string, any> = {};
    Object.entries(currentInputs).forEach(([key, value]) => {
      nextInputs[key === currentKey
        ? nextKey
        : key] = key === currentKey
          ? {
              ...normalizeWorkflowInputDefinition(value),
              label: nextLabel,
            }
          : value;
    });
    updateWorkflowInputs(nextInputs);
  };

  const updateWorkflowInput = (key: string, patch: Record<string, any>) => {
    const currentInputs = definitionDraft.inputs ?? {};
    updateWorkflowInputs({
      ...currentInputs,
      [key]: {
        ...normalizeWorkflowInputDefinition(currentInputs[key]),
        ...patch,
      },
    });
  };

  const closeDefaultValueEditor = () => {
    setDefaultValueEditorInputKey(null);
    setDefaultValueEditorDraft("");
    setDefaultValueEditorJsonText("");
    setDefaultValueEditorError("");
  };

  const openDefaultValueEditor = (key: string) => {
    const definition = normalizeWorkflowInputDefinition((definitionDraft.inputs ?? {})[key]);
    const editorValue = getWorkflowInputDefaultEditorValue(
      definition.default,
      definition.type,
    );

    setDefaultValueEditorInputKey(key);
    setDefaultValueEditorDraft(editorValue);
    setDefaultValueEditorJsonText(
      definition.type === "object" || definition.type === "array"
        ? JSON.stringify(editorValue, null, 2)
        : "",
    );
    setDefaultValueEditorError("");
    setDefaultValueEditorResetToken(`default-value-editor-${key}-${Date.now()}`);
  };

  const saveDefaultValueEditor = () => {
    if (!defaultValueEditorEntry) {
      return;
    }

    const type = defaultValueEditorEntry.definition.type;
    let nextDefaultValue: any = defaultValueEditorDraft;

    try {
      if (type === "object" || type === "array") {
        const trimmedText = defaultValueEditorJsonText.trim();
        nextDefaultValue = trimmedText
          ? JSON.parse(trimmedText)
          : type === "array"
            ? []
            : {};

        if (type === "array" && !Array.isArray(nextDefaultValue)) {
          throw new Error("Default value must be a JSON array.");
        }

        if (type === "object" && !isPlainObjectValue(nextDefaultValue)) {
          throw new Error("Default value must be a JSON object.");
        }
      } else if (isWorkflowExpressionString(nextDefaultValue)) {
        nextDefaultValue = String(nextDefaultValue).trim();
      } else if (type === "number") {
        if (nextDefaultValue === "" || nextDefaultValue === null || nextDefaultValue === undefined) {
          nextDefaultValue = "";
        } else {
          const numericValue = Number(nextDefaultValue);
          if (!Number.isFinite(numericValue)) {
            throw new Error("Default value must be a valid number.");
          }
          nextDefaultValue = numericValue;
        }
      } else if (type === "boolean") {
        nextDefaultValue = Boolean(nextDefaultValue);
      } else {
        nextDefaultValue = nextDefaultValue ?? "";
      }
    } catch (error: any) {
      setDefaultValueEditorError(
        error?.message ? String(error.message) : "Default value is invalid.",
      );
      return;
    }

    updateWorkflowInput(defaultValueEditorEntry.key, { default: nextDefaultValue });
    closeDefaultValueEditor();
  };

  const clearDefaultValueEditor = () => {
    if (!defaultValueEditorEntry) {
      return;
    }

    updateWorkflowInput(defaultValueEditorEntry.key, { default: "" });
    closeDefaultValueEditor();
  };

  const removeWorkflowInput = (keyToRemove: string) => {
    const nextInputs = { ...(definitionDraft.inputs ?? {}) };
    delete nextInputs[keyToRemove];
    updateWorkflowInputs(nextInputs);
  };

  const updateWorkflowVariables = (
    nextVariables: Record<string, any>,
    nextVariableMetadata?: Record<string, any>,
  ) => {
    const currentMetadata = definitionDraft.metadata ?? {};
    const variableDefinitions =
      nextVariableMetadata ?? getWorkflowVariableMetadata(currentMetadata);
    syncDraftToCode({
      ...definitionDraft,
      variables: nextVariables,
      metadata: {
        ...currentMetadata,
        variableDefinitions,
      },
    });
  };

  const addWorkflowVariable = () => {
    const nextKey = buildUniqueWorkflowVariableKey(
      "Variable",
      Object.keys(definitionDraft.variables ?? {}),
    );
    updateWorkflowVariables(
      {
        ...(definitionDraft.variables ?? {}),
        [nextKey]: "",
      },
      {
        ...getWorkflowVariableMetadata(definitionDraft.metadata),
        [nextKey]: {
          label: "Variable",
          type: "string",
          description: "",
        },
      },
    );
  };

  const updateWorkflowVariableLabel = (currentKey: string, nextLabel: string) => {
    const currentVariables = definitionDraft.variables ?? {};
    const currentVariableMetadata = getWorkflowVariableMetadata(definitionDraft.metadata);
    const existingKeys = Object.keys(currentVariables).filter((key) => key !== currentKey);
    const nextKey = camelizeWorkflowInputKey(nextLabel)
      ? buildUniqueWorkflowVariableKey(nextLabel, existingKeys)
      : currentKey;

    if (!nextKey) {
      return;
    }

    const nextVariables: Record<string, any> = {};
    const nextVariableMetadata: Record<string, any> = {};

    Object.entries(currentVariables).forEach(([key, value]) => {
      const outputKey = key === currentKey ? nextKey : key;
      nextVariables[outputKey] = value;
      nextVariableMetadata[outputKey] = {
        ...(currentVariableMetadata[key] ?? {}),
        label: key === currentKey ? nextLabel : currentVariableMetadata[key]?.label,
      };
    });

    updateWorkflowVariables(nextVariables, nextVariableMetadata);
  };

  const updateWorkflowVariable = (key: string, patch: Record<string, any>) => {
    const currentVariables = definitionDraft.variables ?? {};
    const currentVariableMetadata = getWorkflowVariableMetadata(definitionDraft.metadata);
    const currentEntry =
      workflowVariableEntries.find((entry) => entry.key === key)?.definition ?? {
        type: inferWorkflowVariableType(currentVariables[key], currentVariableMetadata[key]?.type),
        label: key,
        description: "",
      };
    const nextType = patch.type ?? currentEntry.type;
    const nextValue = patch.value !== undefined
      ? patch.value
      : patch.type && patch.type !== currentEntry.type
        ? getWorkflowVariableInitialValue(nextType)
        : currentVariables[key];

    updateWorkflowVariables(
      {
        ...currentVariables,
        [key]: nextValue,
      },
      {
        ...currentVariableMetadata,
        [key]: {
          ...(currentVariableMetadata[key] ?? {}),
          label: patch.label ?? currentEntry.label,
          type: nextType,
          description: patch.description ?? currentEntry.description,
        },
      },
    );
  };

  const removeWorkflowVariable = (keyToRemove: string) => {
    const nextVariables = { ...(definitionDraft.variables ?? {}) };
    const nextVariableMetadata = {
      ...getWorkflowVariableMetadata(definitionDraft.metadata),
    };
    delete nextVariables[keyToRemove];
    delete nextVariableMetadata[keyToRemove];
    updateWorkflowVariables(nextVariables, nextVariableMetadata);
  };

  const closeVariableValueEditor = () => {
    setVariableValueEditorKey(null);
    setVariableValueEditorDraft("");
    setVariableValueEditorJsonText("");
    setVariableValueEditorError("");
  };

  const openVariableValueEditor = (key: string) => {
    const entry = workflowVariableEntries.find((variableEntry) => variableEntry.key === key);
    if (!entry) {
      return;
    }

    const editorValue = getWorkflowVariableEditorValue(
      entry.definition.value,
      entry.definition.type,
    );

    setVariableValueEditorKey(key);
    setVariableValueEditorDraft(editorValue);
    setVariableValueEditorJsonText(
      entry.definition.type === "object" || entry.definition.type === "array"
        ? JSON.stringify(editorValue, null, 2)
        : "",
    );
    setVariableValueEditorError("");
    setVariableValueEditorResetToken(`variable-value-editor-${key}-${Date.now()}`);
  };

  const saveVariableValueEditor = () => {
    if (!variableValueEditorEntry) {
      return;
    }

    const type = variableValueEditorEntry.definition.type;
    let nextValue: any = variableValueEditorDraft;

    try {
      if (type === "object" || type === "array") {
        const trimmedText = variableValueEditorJsonText.trim();
        nextValue = trimmedText
          ? JSON.parse(trimmedText)
          : getWorkflowVariableInitialValue(type);

        if (type === "array" && !Array.isArray(nextValue)) {
          throw new Error("Variable value must be a JSON array.");
        }

        if (type === "object" && !isPlainObjectValue(nextValue)) {
          throw new Error("Variable value must be a JSON object.");
        }
      } else if (isWorkflowExpressionString(nextValue)) {
        nextValue = String(nextValue).trim();
      } else if (type === "number") {
        const numericValue = Number(nextValue);
        if (!Number.isFinite(numericValue)) {
          throw new Error("Variable value must be a valid number.");
        }
        nextValue = numericValue;
      } else if (type === "boolean") {
        nextValue = Boolean(nextValue);
      } else {
        nextValue = nextValue ?? "";
      }
    } catch (error: any) {
      setVariableValueEditorError(
        error?.message ? String(error.message) : "Variable value is invalid.",
      );
      return;
    }

    updateWorkflowVariable(variableValueEditorEntry.key, { value: nextValue });
    closeVariableValueEditor();
  };

  const renderDefaultValueEditorField = () => {
    if (!defaultValueEditorEntry) {
      return null;
    }

    const type = defaultValueEditorEntry.definition.type;

    if (type === "object" || type === "array") {
      return (
        <SolidJsonEditor
          value={defaultValueEditorDraft}
          resetToken={defaultValueEditorResetToken}
          className="workflow-editor-default-dialog__json-editor"
          onValueChange={(value) => {
            setDefaultValueEditorDraft(value);
            setDefaultValueEditorError("");
          }}
          onTextChange={(text) => setDefaultValueEditorJsonText(text)}
          onErrorChange={(message) => setDefaultValueEditorError(message ?? "")}
        />
      );
    }

    if (type === "boolean") {
      return (
        <SolidCheckbox
          checked={Boolean(defaultValueEditorDraft)}
          label="Use true as the default value"
          onChange={(event) => {
            setDefaultValueEditorDraft(event.currentTarget.checked);
            setDefaultValueEditorError("");
          }}
        />
      );
    }

    return (
      <WorkflowExpressionAutocompleteField
        value={String(defaultValueEditorDraft ?? "")}
        placeholder={type === "date" ? "Select date" : "Enter default value"}
        suggestions={selectedNodeExpressionSuggestions}
        onChange={(value) => {
          setDefaultValueEditorDraft(value);
          setDefaultValueEditorError("");
        }}
      />
    );
  };

  const renderVariableValueEditorField = () => {
    if (!variableValueEditorEntry) {
      return null;
    }

    const type = variableValueEditorEntry.definition.type;

    if (type === "object" || type === "array") {
      return (
        <SolidJsonEditor
          value={variableValueEditorDraft}
          resetToken={variableValueEditorResetToken}
          className="workflow-editor-default-dialog__json-editor"
          onValueChange={(value) => {
            setVariableValueEditorDraft(value);
            setVariableValueEditorError("");
          }}
          onTextChange={(text) => setVariableValueEditorJsonText(text)}
          onErrorChange={(message) => setVariableValueEditorError(message ?? "")}
        />
      );
    }

    if (type === "boolean") {
      return (
        <SolidCheckbox
          checked={Boolean(variableValueEditorDraft)}
          label="Use true as the variable value"
          onChange={(event) => {
            setVariableValueEditorDraft(event.currentTarget.checked);
            setVariableValueEditorError("");
          }}
        />
      );
    }

    return (
      <WorkflowExpressionAutocompleteField
        value={String(variableValueEditorDraft ?? "")}
        placeholder={type === "date" ? "Select date" : "Enter variable value"}
        suggestions={selectedNodeExpressionSuggestions}
        onChange={(value) => {
          setVariableValueEditorDraft(value);
          setVariableValueEditorError("");
        }}
      />
    );
  };

  const updateWorkflowTriggers = (nextTriggers: Array<Record<string, any>>) => {
    syncDraftToCode({
      ...definitionDraft,
      triggers: nextTriggers,
    });
  };

  const addWorkflowTrigger = () => {
    const nextId = buildUniqueWorkflowKey(
      "trigger",
      (definitionDraft.triggers ?? []).map((trigger) => String(trigger.id ?? "")),
    );
    updateWorkflowTriggers([
      ...(definitionDraft.triggers ?? []),
      {
        id: nextId,
        name: "Trigger",
        type: "schedule",
        disabled: false,
        configuration: {
          cronExpression: "0 9 * * *",
          timezone: "UTC",
        },
      },
    ]);
  };

  const updateWorkflowTrigger = (index: number, patch: Record<string, any>) => {
    const nextTriggers = (definitionDraft.triggers ?? []).map((trigger, triggerIndex) => {
      if (triggerIndex !== index) {
        return trigger;
      }

      const currentTrigger = normalizeWorkflowTriggerDefinition(trigger);
      const nextTrigger = {
        ...currentTrigger,
        ...patch,
      };

      if (patch.type && patch.type !== currentTrigger.type) {
        nextTrigger.configuration =
          patch.type === "schedule"
            ? { cronExpression: "0 9 * * *", timezone: "UTC" }
            : { method: "POST", path: `/${currentTrigger.id || "trigger"}` };
      }

      return nextTrigger;
    });
    updateWorkflowTriggers(nextTriggers);
  };

  const updateWorkflowTriggerConfiguration = (
    index: number,
    patch: Record<string, any>,
  ) => {
    const currentTrigger = normalizeWorkflowTriggerDefinition(
      (definitionDraft.triggers ?? [])[index],
    );
    const nextConfiguration = {
      ...currentTrigger.configuration,
      ...patch,
    };

    if (patch.cronExpression !== undefined) {
      delete nextConfiguration.cron;
    }

    updateWorkflowTrigger(index, {
      configuration: nextConfiguration,
    });
  };

  const removeWorkflowTrigger = (indexToRemove: number) => {
    updateWorkflowTriggers(
      (definitionDraft.triggers ?? []).filter((_, index) => index !== indexToRemove),
    );
  };

  const renderTriggerConfigurationFields = (
    trigger: ReturnType<typeof normalizeWorkflowTriggerDefinition>,
    index: number,
  ) => {
    const cronExpression = getWorkflowTriggerCronExpression(trigger);
    const cronParts = splitCronExpression(cronExpression);
    const timezone = String(trigger.configuration.timezone ?? "UTC");
    const setCronPart = (key: keyof typeof cronParts, value: string) => {
      updateWorkflowTriggerConfiguration(index, {
        timezone: "UTC",
        cronExpression: joinCronExpression({
          ...cronParts,
          [key]: value.trim() || "*",
        }),
      });
    };
    const inputsMissingDefaults = Object.entries(definitionDraft.inputs ?? {})
      .filter(([, inputDefinition]) => !workflowInputHasDefault(inputDefinition))
      .map(([inputKey]) => inputKey);

    return (
      <div className="workflow-editor-cron-builder workflow-editor-field--wide">
        <div className="workflow-editor-cron-builder__header">
          <div>
            <label>Schedule</label>
            <p>Define when this workflow should run. Times are evaluated in UTC.</p>
          </div>
          <div className="workflow-editor-cron-builder__header-meta">
            <span>Generated expression</span>
            <code>{cronExpression}</code>
            <span>Timezone</span>
            <code>{timezone}</code>
          </div>
        </div>
        <div className="workflow-editor-cron-builder__grid">
          {WORKFLOW_CRON_FIELD_HELP.map((field) => (
            <div className="workflow-editor-cron-builder__part" key={field.key}>
              <label>{field.label}</label>
              <SolidInput
                value={cronParts[field.key]}
                placeholder={field.placeholder}
                onChange={(event) => setCronPart(field.key, event.target.value)}
              />
              <span>{field.help}</span>
            </div>
          ))}
        </div>
        <div className="workflow-editor-cron-builder__examples">
          {WORKFLOW_CRON_EXAMPLES.map((example) => (
            <SolidButton
              key={example.value}
              variant="outline"
              size="small"
              onClick={() =>
                updateWorkflowTriggerConfiguration(index, {
                  cronExpression: example.value,
                  timezone: "UTC",
                })
              }
            >
              {example.label}
            </SolidButton>
          ))}
        </div>
        <div
          className={`workflow-editor-cron-builder__explanation${
            isValidSimpleCronExpression(cronExpression) ? "" : " is-invalid"
          }`}
        >
          {describeWorkflowCronExpression(cronExpression, timezone)}
        </div>
        {inputsMissingDefaults.length ? (
          <div className="workflow-editor-cron-builder__warning">
            Scheduled workflows run without a user present. Add default values for:
            {" "}
            {inputsMissingDefaults.join(", ")}.
          </div>
        ) : null}
      </div>
    );
  };

  const inputsContent = workflowInputEntries.length ? (
    <div className="workflow-editor-authoring-tab">
      <div className="workflow-editor-authoring-header">
        <div>
          <h3>Inputs</h3>
          <p>Define values that callers can provide when this workflow runs.</p>
        </div>
        <SolidButton onClick={addWorkflowInput}>Add Input</SolidButton>
      </div>

      <div className="workflow-editor-input-table">
        <div className="workflow-editor-input-table__header" role="row">
          <span>Label</span>
          <span>Type</span>
          <span>Required</span>
          <span>Description</span>
          <span className="workflow-editor-input-table__actions-header">Actions</span>
        </div>
        {workflowInputEntries.map(({ key, definition }, index) => (
          <div className="workflow-editor-input-table__row" key={`input-row-${index}`} role="row">
            <div className="workflow-editor-input-table__label-cell">
              <SolidInput
                value={definition.label}
                placeholder="Customer ID"
                onChange={(event) => updateWorkflowInputLabel(key, event.target.value)}
              />
              <span>
                We will use input field with name <strong>{key}</strong>.
              </span>
            </div>
            <div className="workflow-editor-input-table__type-cell">
              <div className="workflow-editor-input-table__type-row">
                <SolidSelect
                  value={definition.type}
                  options={WORKFLOW_INPUT_TYPE_OPTIONS}
                  onChange={(event) =>
                    updateWorkflowInput(key, { type: event.value ?? "string" })
                  }
                />
                <button
                  type="button"
                  className="workflow-editor-input-table__default-button"
                  aria-label={`Configure default value for ${key}`}
                  title="Configure default value"
                  onClick={() => openDefaultValueEditor(key)}
                >
                  <Braces size={14} />
                </button>
              </div>
              <span
                className={`workflow-editor-input-table__default-summary${
                  hasWorkflowInputDefaultValue(definition.default) ? "" : " is-empty"
                }`}
              >
                {formatWorkflowInputDefaultSummary(definition.default)}
              </span>
            </div>
            <div className="workflow-editor-input-table__required">
              <SolidCheckbox
                checked={definition.required}
                label=""
                onChange={(event) =>
                  updateWorkflowInput(key, { required: event.currentTarget.checked })
                }
              />
            </div>
            <SolidInput
              value={definition.description}
              placeholder="Describe this input"
              onChange={(event) =>
                updateWorkflowInput(key, { description: event.target.value })
              }
            />
            <button
              type="button"
              className="workflow-editor-input-table__delete"
              aria-label={`Remove ${key}`}
              title="Remove input"
              onClick={() => removeWorkflowInput(key)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  ) : (
    renderOptionalAuthoringEmptyState({
      icon: <Braces size={20} />,
      title: "No inputs defined",
      body:
        "Inputs are optional. Add them when this workflow needs values at run time, such as a customer id, email, date range, or amount. If this workflow can run with fixed configuration or values produced inside the flow, you can skip inputs and configure the flow directly.",
      examples: ["customerId", "email", "startDate", "approvalAmount"],
      primaryLabel: "Add Input",
      onPrimaryClick: addWorkflowInput,
    })
  );

  const variablesContent = workflowVariableEntries.length ? (
    <div className="workflow-editor-authoring-tab">
      <div className="workflow-editor-authoring-header">
        <div>
          <h3>Variables</h3>
          <p>Define reusable values owned by this workflow.</p>
        </div>
        <SolidButton onClick={addWorkflowVariable}>Add Variable</SolidButton>
      </div>

      <div className="workflow-editor-input-table workflow-editor-variable-table">
        <div className="workflow-editor-input-table__header" role="row">
          <span>Name</span>
          <span>Type & value</span>
          <span>Description</span>
          <span className="workflow-editor-input-table__actions-header">Actions</span>
        </div>
        {workflowVariableEntries.map(({ key, definition }, index) => (
          <div className="workflow-editor-input-table__row" key={`variable-row-${index}`} role="row">
            <div className="workflow-editor-input-table__label-cell">
              <SolidInput
                value={definition.label}
                placeholder="API Base URL"
                onChange={(event) => updateWorkflowVariableLabel(key, event.target.value)}
              />
              <span>
                We will use variable <strong>{key}</strong>.
              </span>
            </div>
            <div className="workflow-editor-input-table__type-cell">
              <div className="workflow-editor-input-table__type-row">
                <SolidSelect
                  value={definition.type}
                  options={WORKFLOW_INPUT_TYPE_OPTIONS}
                  onChange={(event) =>
                    updateWorkflowVariable(key, { type: event.value ?? "string" })
                  }
                />
                <button
                  type="button"
                  className="workflow-editor-input-table__default-button"
                  aria-label={`Configure value for ${key}`}
                  title="Configure value"
                  onClick={() => openVariableValueEditor(key)}
                >
                  <Braces size={14} />
                </button>
              </div>
              <span className="workflow-editor-input-table__default-summary">
                {formatWorkflowVariableValueSummary(definition.value)}
              </span>
            </div>
            <SolidInput
              value={definition.description}
              placeholder="Describe this variable"
              onChange={(event) =>
                updateWorkflowVariable(key, { description: event.target.value })
              }
            />
            <button
              type="button"
              className="workflow-editor-input-table__delete"
              aria-label={`Remove ${key}`}
              title="Remove variable"
              onClick={() => removeWorkflowVariable(key)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  ) : (
    renderOptionalAuthoringEmptyState({
      icon: <Braces size={20} />,
      title: "No variables defined",
      body:
        "Variables are optional workflow-owned values. Use them for constants shared across nodes, such as base URLs, thresholds, labels, or feature flags. Callers do not provide variables when executing the workflow.",
      examples: ["apiBaseUrl", "retryDelayMs", "notificationChannel", "featureEnabled"],
      primaryLabel: "Add Variable",
      onPrimaryClick: addWorkflowVariable,
    })
  );

  const renderWorkflowTriggerCodeExample = (value: string) => (
    <div className="workflow-editor-trigger-guide-code">
      <pre>
        <code>{value}</code>
      </pre>
      <SolidButton
        variant="outline"
        size="small"
        onClick={() => void copyWorkflowTriggerExample(value)}
      >
        <Copy size={14} />
        Copy
      </SolidButton>
    </div>
  );

  const scheduledTriggersContent = scheduledTriggerEntries.length ? (
    <div className="workflow-editor-authoring-list">
      {scheduledTriggerEntries.map(({ trigger, index }) => (
        <SolidPanel key={`${trigger.id}-${index}`} header={trigger.name || trigger.id}>
          <div className="workflow-editor-form-grid">
            <div className="workflow-editor-field">
              <label>Id</label>
              <SolidInput
                value={trigger.id}
                onChange={(event) =>
                  updateWorkflowTrigger(index, {
                    id: slugifyWorkflowKey(event.target.value) || trigger.id,
                  })
                }
              />
            </div>
            <div className="workflow-editor-field">
              <label>Name</label>
              <SolidInput
                value={trigger.name}
                onChange={(event) =>
                  updateWorkflowTrigger(index, { name: event.target.value })
                }
              />
            </div>
            <div className="workflow-editor-field">
              <SolidCheckbox
                checked={trigger.disabled}
                label="Disabled"
                onChange={(event) =>
                  updateWorkflowTrigger(index, {
                    disabled: event.currentTarget.checked,
                  })
                }
              />
            </div>
            {renderTriggerConfigurationFields(trigger, index)}
          </div>
          <div className="workflow-editor-authoring-card-actions">
            <SolidButton
              variant="ghost"
              size="small"
              onClick={() => removeWorkflowTrigger(index)}
            >
              Remove Trigger
            </SolidButton>
          </div>
        </SolidPanel>
      ))}
    </div>
  ) : (
    renderOptionalAuthoringEmptyState({
      icon: <Activity size={20} />,
      title: "No scheduled triggers configured",
      body:
        "Scheduled triggers are optional. Add one when this workflow should run automatically on a CRON cadence. Scheduled workflows run without a user present, so every required input must have a default value.",
      examples: ["Every weekday at 09:00", "Every 15 minutes", "Every Monday at 02:00"],
      primaryLabel: "Add Scheduled Trigger",
      onPrimaryClick: addWorkflowTrigger,
    })
  );

  const triggersContent = (
    <div className="workflow-editor-authoring-tab workflow-editor-trigger-guide">
      <div className="workflow-editor-authoring-header">
        <div>
          <h3>Triggers</h3>
          <p>
            Choose how this workflow should be started. Only scheduled triggers are saved
            into YAML; CURL and API are authenticated execution examples.
          </p>
        </div>
        {triggerGuideMode === "scheduled" && scheduledTriggerEntries.length ? (
          <SolidButton onClick={addWorkflowTrigger}>Add Scheduled Trigger</SolidButton>
        ) : null}
      </div>

      <div className="workflow-editor-trigger-guide-mode" role="radiogroup" aria-label="Trigger type">
        {WORKFLOW_TRIGGER_GUIDE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={triggerGuideMode === option.value}
            className={`workflow-editor-trigger-guide-mode__button${
              triggerGuideMode === option.value ? " is-active" : ""
            }`}
            onClick={() => setTriggerGuideMode(option.value)}
          >
            <span>{option.label}</span>
            <small>{option.description}</small>
          </button>
        ))}
      </div>

      {triggerGuideMode === "curl" ? (
        <div className="workflow-editor-trigger-guide-card">
          <div>
            <h4>Run With CURL</h4>
            <p>
              Use this from scripts, Postman, or external systems that can call private
              SolidX APIs with a bearer token. The request creates a normal workflow
              execution with <code>triggerType</code> set to <code>api</code>.
            </p>
          </div>
          {renderWorkflowTriggerCodeExample(workflowCurlExample)}
        </div>
      ) : null}

      {triggerGuideMode === "api" ? (
        <div className="workflow-editor-trigger-guide-card">
          <div>
            <h4>Run From SolidX Code</h4>
            <p>
              Inject the workflow invocation service inside a SolidX subscriber, service,
              scheduled job, or controller when workflow execution is part of application
              logic.
            </p>
          </div>
          {renderWorkflowTriggerCodeExample(workflowApiExample)}
        </div>
      ) : null}

      {triggerGuideMode === "scheduled" ? scheduledTriggersContent : null}
    </div>
  );

  const executionsContent =
    workflowDefinitionId === "new" || !hasExecutions ? (
      <div className="workflow-editor-overview workflow-editor-overview--empty">
        <div className="workflow-editor-overview-cta">
          <div className="workflow-editor-overview-cta__art">
            <Workflow size={28} />
          </div>
          <div className="workflow-editor-overview-cta__copy">
            <h2>{workflowDisplayName || record?.displayName || workflowKey || "Workflow"}</h2>
            <p>
              Run the workflow once to unlock execution history, operational KPIs,
              and workflow activity for this definition.
            </p>
          </div>
          <div className="workflow-editor-overview-cta__actions">
            <SolidButton
              leftIcon={<Play size={16} />}
              loading={isExecuting}
              onClick={() => void handleExecute()}
            >
              Execute Workflow
            </SolidButton>
            <SolidButton variant="outline" onClick={() => setDetailTab("topology")}>
              Open Topology
            </SolidButton>
          </div>
        </div>
      </div>
    ) : (
      <div className="workflow-editor-executions">
        <div
          className="workflow-editor-execution-subtabs"
          role="tablist"
          aria-label="Execution workspace views"
        >
          <button
            type="button"
            className={`workflow-editor-execution-subtabs__button${
              executionWorkspaceTab === "summary" ? " is-active" : ""
            }`}
            role="tab"
            aria-selected={executionWorkspaceTab === "summary"}
            onClick={() => setExecutionWorkspaceTab("summary")}
          >
            Summary
          </button>
          <button
            type="button"
            className={`workflow-editor-execution-subtabs__button${
              executionWorkspaceTab === "list" ? " is-active" : ""
            }`}
            role="tab"
            aria-selected={executionWorkspaceTab === "list"}
            onClick={() => setExecutionWorkspaceTab("list")}
          >
            List
          </button>
        </div>

        {executionWorkspaceTab === "list" ? (
          <div className="workflow-editor-overview-filterbar">
          <div className="workflow-editor-overview-filterbar__left">
            <div className="workflow-editor-overview-filter">
              <label>Date From</label>
              <SolidDatePicker
                selected={overviewStartDate}
                onChange={(date: Date | null) => {
                  setOverviewStartDate(date);
                  setExecutionPage(1);
                }}
                placeholderText="Start date"
              />
            </div>
            <div className="workflow-editor-overview-filter">
              <label>Date To</label>
              <SolidDatePicker
                selected={overviewEndDate}
                onChange={(date: Date | null) => {
                  setOverviewEndDate(date);
                  setExecutionPage(1);
                }}
                placeholderText="End date"
              />
            </div>
            <div className="workflow-editor-overview-filter">
              <label>Status</label>
              <SolidSelect
                value={executionStatusFilter}
                options={WORKFLOW_EXECUTION_STATUS_OPTIONS}
                onChange={(event) => {
                  setExecutionStatusFilter(event.value ?? "all");
                  setExecutionPage(1);
                }}
              />
            </div>
            <div className="workflow-editor-overview-filter workflow-editor-overview-filter--search">
              <label>Execution</label>
              <SolidInput
                value={executionSearchFilter}
                placeholder="Search identifier"
                onChange={(event) => {
                  setExecutionSearchFilter(event.target.value);
                  setExecutionPage(1);
                }}
              />
            </div>
            {(overviewStartDate ||
              overviewEndDate ||
              executionStatusFilter !== "all" ||
              executionSearchFilter) && (
              <SolidButton
                size="small"
                variant="ghost"
                onClick={() => {
                  setOverviewStartDate(null);
                  setOverviewEndDate(null);
                  setExecutionStatusFilter("all");
                  setExecutionSearchFilter("");
                  setExecutionPage(1);
                }}
              >
                Clear
              </SolidButton>
            )}
          </div>
          </div>
        ) : null}

        {executionWorkspaceTab === "summary" ? (
          <>
            <div className="workflow-editor-overview-stats">
          <div className="workflow-editor-overview-stat">
            <span className="workflow-editor-overview-stat-label">Success Ratio</span>
            <strong className="workflow-editor-overview-stat-value">
              {executionOverview.successRatio}%
            </strong>
            <span className="workflow-editor-overview-stat-meta">
              {executionOverview.success} successful runs
            </span>
          </div>
          <div className="workflow-editor-overview-stat">
            <span className="workflow-editor-overview-stat-label">Failed Ratio</span>
            <strong className="workflow-editor-overview-stat-value">
              {executionOverview.failedRatio}%
            </strong>
            <span className="workflow-editor-overview-stat-meta">
              {executionOverview.failed} failed runs
            </span>
          </div>
          <div className="workflow-editor-overview-stat">
            <span className="workflow-editor-overview-stat-label">In Progress</span>
            <strong className="workflow-editor-overview-stat-value">
              {executionOverview.inProgress}
            </strong>
            <span className="workflow-editor-overview-stat-meta">
              Currently running executions
            </span>
          </div>
          <div className="workflow-editor-overview-stat">
            <span className="workflow-editor-overview-stat-label">Pending</span>
            <strong className="workflow-editor-overview-stat-value">
              {executionOverview.pending}
            </strong>
            <span className="workflow-editor-overview-stat-meta">
              Created or queued executions
            </span>
          </div>
            </div>

            <div className="workflow-editor-overview-grid">
          <SolidPanel header="Workflow Summary">
            <div className="workflow-editor-overview-section">
              <div className="workflow-editor-overview-kv">
                <span>Workflow</span>
                <strong>{workflowDisplayName || record?.displayName || workflowKey}</strong>
              </div>
              <div className="workflow-editor-overview-kv">
                <span>Total Executions</span>
                <strong>{workflowExecutionPresenceQuery.data?.meta?.totalRecords ?? 0}</strong>
              </div>
              <div className="workflow-editor-overview-kv">
                <span>Executions In Range</span>
                <strong>{workflowExecutionsQuery.data?.meta?.totalRecords ?? 0}</strong>
              </div>
              <div className="workflow-editor-overview-kv">
                <span>Average Duration</span>
                <strong>{formatDurationMs(executionOverview.averageDurationMs)}</strong>
              </div>
              <div className="workflow-editor-overview-description">
                {workflowDescription ||
                  record?.description ||
                  definitionDraft.description ||
                  "No workflow description has been added yet."}
              </div>
            </div>
          </SolidPanel>

          <SolidPanel header="Latest Execution">
            {executionOverview.latestExecution ? (
              <div className="workflow-editor-overview-section">
                <div className="workflow-editor-overview-kv">
                  <span>Status</span>
                  <strong>{executionOverview.latestExecution.status ?? "Unknown"}</strong>
                </div>
                <div className="workflow-editor-overview-kv">
                  <span>Started</span>
                  <strong>
                    {formatExecutionDate(executionOverview.latestExecution.startedAt)}
                  </strong>
                </div>
                <div className="workflow-editor-overview-kv">
                  <span>Finished</span>
                  <strong>
                    {formatExecutionDate(executionOverview.latestExecution.finishedAt)}
                  </strong>
                </div>
                <div className="workflow-editor-overview-kv">
                  <span>Trigger Type</span>
                  <strong>{executionOverview.latestExecution.triggerType ?? "manual"}</strong>
                </div>
              </div>
            ) : (
              <div className="workflow-editor-empty-state workflow-editor-empty-state--compact">
                No executions match the current date filter.
              </div>
            )}
          </SolidPanel>

            </div>
          </>
        ) : null}

        {executionWorkspaceTab === "list" ? (
          <SolidPanel header="Executions">
          {workflowExecutionsQuery.isFetching && !executionRecords.length ? (
            <div className="workflow-editor-loading">
              <SolidSpinner />
            </div>
          ) : executionRecords.length ? (
            <div className="workflow-editor-execution-table-wrap">
              <table className="workflow-editor-execution-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Execution Identifier</th>
                    <th>Status</th>
                    <th>Trigger</th>
                    <th>Started</th>
                    <th>Finished</th>
                    <th>Duration</th>
                    <th>Error</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {executionRecords.map((execution) => {
                    const statusCategory = getExecutionStatusCategory(execution.status);

                    return (
                      <tr
                        key={execution.id}
                        className="workflow-editor-execution-table__row"
                        tabIndex={0}
                        role="button"
                        onClick={() => openExecutionDetails(execution)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openExecutionDetails(execution);
                          }
                        }}
                      >
                        <td>{execution.id}</td>
                        <td className="workflow-editor-execution-table__identifier">
                          {execution.executionIdentifier ?? "-"}
                        </td>
                        <td>
                          <SolidTag
                            className={`workflow-editor-execution-status-pill workflow-editor-execution-status-pill--${statusCategory}`}
                          >
                            {execution.status ?? "Unknown"}
                          </SolidTag>
                        </td>
                        <td>{execution.triggerType ?? "manual"}</td>
                        <td>{formatExecutionDate(execution.startedAt || execution.createdAt)}</td>
                        <td>{formatExecutionDate(execution.finishedAt)}</td>
                        <td>{formatDurationMs(execution.durationMs)}</td>
                        <td className="workflow-editor-execution-table__error">
                          {execution.errorSummary ?? "-"}
                        </td>
                        <td>
                          <SolidButton
                            size="small"
                            variant="outline"
                            onClick={(event) => {
                              event.stopPropagation();
                              openExecutionDetails(execution);
                            }}
                          >
                            View
                          </SolidButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="workflow-editor-execution-pagination">
                <span>
                  Showing {executionPageStart}-{executionPageEnd} of {executionTotalRecords}
                </span>
                <div className="workflow-editor-execution-pagination__actions">
                  <SolidButton
                    size="small"
                    variant="outline"
                    disabled={executionPage <= 1}
                    onClick={() => setExecutionPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </SolidButton>
                  <SolidTag>
                    Page {executionPage} of {executionTotalPages}
                  </SolidTag>
                  <SolidButton
                    size="small"
                    variant="outline"
                    disabled={executionPage >= executionTotalPages}
                    onClick={() =>
                      setExecutionPage((current) =>
                        Math.min(executionTotalPages, current + 1),
                      )
                    }
                  >
                    Next
                  </SolidButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="workflow-editor-empty-state workflow-editor-empty-state--compact">
              No executions match the current filters.
            </div>
          )}
          </SolidPanel>
        ) : null}
      </div>
    );

  const topologyCanvasView = (
    <div className="workflow-editor-canvas-shell">
      {codeError ? (
        <div className="workflow-editor-definition-error">
          <div className="workflow-editor-definition-error__icon">
            <Braces size={20} />
          </div>
          <div className="workflow-editor-definition-error__content">
            <h3>Workflow definition YAML is invalid</h3>
            <p>
              The topology cannot be rendered until the saved YAML parses and matches
              the current workflow schema.
            </p>
            <pre>{codeError}</pre>
            {!topologyYamlViewOpen ? (
              <SolidButton
                size="small"
                variant="outline"
                onClick={() => setTopologyYamlViewOpen(true)}
              >
                Show YAML
              </SolidButton>
            ) : null}
          </div>
        </div>
      ) : (
        <WorkflowFlowCanvas
          definition={definitionDraft}
          nodeTypes={nodeTypes}
          selectedNodeId={selectedNodeId}
          selectedTriggerId={selectedTriggerId}
          activePaletteNodeType={undefined}
          onSelectNode={(nodeId) => {
            setSelectedNodeId(nodeId);
            setSelectedTriggerId("");
          }}
          onSelectTrigger={(triggerId) => {
            setSelectedTriggerId(triggerId);
            setSelectedNodeId("");
          }}
          onEditNode={(nodeId) => {
            setSelectedNodeId(nodeId);
            setSelectedTriggerId("");
            setEditorOpen(true);
          }}
          onDeleteNode={handleRemoveNode}
          onViewDocs={(nodeId) => {
            const node = findNodeById(definitionDraft.nodes, nodeId);
            if (node?.type) {
              setSelectedNodeId(nodeId);
              setSelectedTriggerId("");
              setTopologyDocsNodeTypeKey(node.type);
              setTopologyDocsModel(undefined);
              setTopologyDocsOpen(true);
            }
          }}
          onViewTriggerDocs={(triggerId) => {
            const trigger = (definitionDraft.triggers ?? []).find(
              (item) => String(item.id) === triggerId,
            );
            setSelectedTriggerId(triggerId);
            setSelectedNodeId("");
            setTopologyDocsNodeTypeKey("");
            setTopologyDocsModel(trigger ? buildTriggerDocsModel(trigger) : undefined);
            setTopologyDocsOpen(true);
          }}
          onInsertNode={handleInsertNode}
        />
      )}
    </div>
  );

  const topologyYamlEditorView = (
    <div className="workflow-editor-topology-code">
      <div className="workflow-editor-topology-code__header">
        <span>Definition YAML</span>
        {codeError ? (
          <SolidTag tone="danger">Invalid</SolidTag>
        ) : (
          <SolidTag tone="success">Synced</SolidTag>
        )}
      </div>
      <SolidCodeEditor
        language="yaml"
        height="100%"
        fontSize={12}
        value={codeValue}
        onChange={handleCodeChange}
      />
      {codeError ? (
        <pre className="workflow-editor-error workflow-editor-error--block">
          {codeError}
        </pre>
      ) : null}
    </div>
  );

  const topologyContent = (
    <div className="workflow-editor-topology-tab">
      <div className="workflow-editor-topology-actionbar">
        <div className="workflow-editor-topology-actionbar__left" />
        <div className="workflow-editor-view-toggle" aria-label="Topology views">
          <button
            type="button"
            className={`workflow-editor-view-toggle__button ${topologyViewOpen ? "is-active" : ""}`}
            aria-label={topologyViewOpen ? "Hide topology view" : "Show topology view"}
            title={topologyViewOpen ? "Hide topology view" : "Show topology view"}
            onClick={() => setTopologyViewOpen((current) => !current)}
          >
            <Layers3 size={14} />
          </button>
          <button
            type="button"
            className={`workflow-editor-view-toggle__button ${topologyYamlViewOpen ? "is-active" : ""}`}
            aria-label={topologyYamlViewOpen ? "Hide YAML editor" : "Show YAML editor"}
            title={topologyYamlViewOpen ? "Hide YAML editor" : "Show YAML editor"}
            onClick={() => setTopologyYamlViewOpen((current) => !current)}
          >
            <Braces size={14} />
          </button>
        </div>
      </div>

      {topologyViewOpen && topologyYamlViewOpen ? (
        <div
          ref={topologySplitRef}
          className="workflow-editor-topology-split"
          style={{
            gridTemplateColumns: `${topologySplitPercent}% 0.45rem minmax(0, 1fr)`,
          }}
        >
          <div className="workflow-editor-topology-pane">{topologyCanvasView}</div>
          <div
            className="workflow-editor-topology-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize topology and YAML views"
            onMouseDown={startTopologySplitResize}
          />
          <div className="workflow-editor-topology-pane">{topologyYamlEditorView}</div>
        </div>
      ) : topologyViewOpen ? (
        <div className="workflow-editor-topology-single">{topologyCanvasView}</div>
      ) : topologyYamlViewOpen ? (
        <div className="workflow-editor-topology-single">{topologyYamlEditorView}</div>
      ) : (
        <div className="workflow-editor-placeholder">
          <div className="workflow-editor-placeholder__icon">
            <Layers3 size={20} />
          </div>
          <div className="workflow-editor-placeholder__copy">
            <h3>No topology view selected</h3>
            <p>Use the view toggles above to show the topology canvas or YAML editor.</p>
          </div>
        </div>
      )}
    </div>
  );

  const detailTabs = [
    { value: "overview", label: "Overview", content: overviewContent },
    {
      value: "inputs",
      label: "Inputs",
      content: inputsContent,
    },
    {
      value: "variables",
      label: "Variables",
      content: variablesContent,
    },
    {
      value: "topology",
      label: "Topology",
      content: topologyContent,
    },
    {
      value: "executions",
      label: "Executions",
      content: executionsContent,
    },
    {
      value: "triggers",
      label: "Triggers",
      content: triggersContent,
    },
  ] as const;

  const handleDetailTabChange = (value: string) => {
    const nextTab = value as WorkflowDetailTab;
    if (workflowDefinitionId === "new" && nextTab !== "overview") {
      const errors = validateWorkflowIdentity();
      if (hasWorkflowIdentityErrors(errors)) {
        setDetailTab("overview");
        return;
      }
    }

    setDetailTab(nextTab);
  };

  if (isWorkflowDefinitionLoading || isNodeTypesLoading) {
    return (
      <div className="workflow-editor-page workflow-editor-page--loading">
        <SolidSpinner />
      </div>
    );
  }

  if (isNodeTypesError) {
    return (
      <div className="workflow-editor-page">
        <div className="workflow-editor-empty-state">
          Failed to load workflow node types.
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-editor-page">
      <div className="workflow-editor-header">
        <div className="workflow-editor-header-main">
          <SolidButton
            size="small"
            variant="ghost"
            leftIcon={<ArrowLeft size={16} />}
            onClick={() =>
              navigate("/admin/core/solid-core/workflow-definition/list")
            }
          >
            Back
          </SolidButton>
        </div>
        <div className="workflow-editor-header-actions">
          <SolidButton
            size="small"
            variant="outline"
            leftIcon={<ShieldCheck size={16} />}
            loading={isServerValidating}
            onClick={() => void validateCurrentDefinition({ showSuccessToast: true })}
          >
            Validate
          </SolidButton>
          <SolidButton
            size="small"
            variant="outline"
            leftIcon={<Play size={16} />}
            loading={isExecuting}
            onClick={() => void handleExecute()}
          >
            Run
          </SolidButton>
          <SolidButton
            size="small"
            leftIcon={<Save size={16} />}
            loading={isSaving || isCreating}
            onClick={handleSave}
          >
            Save
          </SolidButton>
        </div>
      </div>

      <div className="workflow-editor-detail-tabs">
        <SolidTabGroup
          tabs={detailTabs.map((tab) => ({
            value: tab.value,
            label: tab.label,
            content: tab.content,
          }))}
          value={detailTab}
          onValueChange={handleDetailTabChange}
          listClassName="workflow-editor-detail-tabs__list"
          panelClassName="workflow-editor-detail-tabs__panel"
        />
      </div>

      <SolidDialog
        open={Boolean(defaultValueEditorEntry)}
        onOpenChange={(open) => {
          if (!open) {
            closeDefaultValueEditor();
          }
        }}
        header={
          defaultValueEditorEntry
            ? `Default Value - ${defaultValueEditorEntry.definition.label || defaultValueEditorEntry.key}`
            : "Default Value"
        }
        className="workflow-editor-default-dialog"
        style={{ width: "min(560px, 94vw)" }}
        footer={
          <div className="workflow-editor-default-dialog__footer">
            <SolidButton
              type="button"
              variant="secondary"
              onClick={clearDefaultValueEditor}
            >
              Clear Default
            </SolidButton>
            <div>
              <SolidButton
                type="button"
                variant="secondary"
                onClick={closeDefaultValueEditor}
              >
                Cancel
              </SolidButton>
              <SolidButton
                type="button"
                onClick={saveDefaultValueEditor}
              >
                Save Default
              </SolidButton>
            </div>
          </div>
        }
      >
        <SolidDialogBody>
          {defaultValueEditorEntry ? (
            <div className="workflow-editor-default-dialog__body">
              <p>
                This value is used when callers do not provide{" "}
                <code>{defaultValueEditorEntry.key}</code>.
              </p>
              {renderDefaultValueEditorField()}
              {defaultValueEditorError ? (
                <div className="workflow-editor-field-error">
                  {defaultValueEditorError}
                </div>
              ) : null}
            </div>
          ) : null}
        </SolidDialogBody>
      </SolidDialog>

      <SolidDialog
        open={Boolean(variableValueEditorEntry)}
        onOpenChange={(open) => {
          if (!open) {
            closeVariableValueEditor();
          }
        }}
        header={
          variableValueEditorEntry
            ? `Variable Value - ${variableValueEditorEntry.definition.label || variableValueEditorEntry.key}`
            : "Variable Value"
        }
        className="workflow-editor-default-dialog"
        style={{ width: "min(520px, 92vw)" }}
        footer={
          <div className="workflow-editor-default-dialog__footer">
            <SolidButton
              type="button"
              variant="secondary"
              onClick={closeVariableValueEditor}
            >
              Cancel
            </SolidButton>
            <SolidButton
              type="button"
              onClick={saveVariableValueEditor}
            >
              Save Value
            </SolidButton>
          </div>
        }
      >
        <SolidDialogBody>
          {variableValueEditorEntry ? (
            <div className="workflow-editor-default-dialog__body">
              <p>
                Nodes can reference this value as{" "}
                <code>{`{{ variables.${variableValueEditorEntry.key} }}`}</code>.
              </p>
              {renderVariableValueEditorField()}
              {variableValueEditorError ? (
                <div className="workflow-editor-field-error">
                  {variableValueEditorError}
                </div>
              ) : null}
            </div>
          ) : null}
        </SolidDialogBody>
      </SolidDialog>

      <SolidDialog
        open={runInputsOpen}
        onOpenChange={(open) => {
          if (!isExecuting) {
            setRunInputsOpen(open);
          }
        }}
        header="Run Workflow"
        className="workflow-editor-run-input-dialog"
        style={{ width: "min(620px, 94vw)" }}
        footer={
          <div className="workflow-editor-run-input-dialog__footer">
            <SolidButton
              type="button"
              variant="secondary"
              disabled={isExecuting}
              onClick={() => setRunInputsOpen(false)}
            >
              Cancel
            </SolidButton>
            <SolidButton
              type="button"
              loading={isExecuting}
              onClick={() => void handleRunInputsSubmit()}
            >
              Run Workflow
            </SolidButton>
          </div>
        }
      >
        <SolidDialogBody>
          <form
            className="workflow-editor-run-input-dialog__form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleRunInputsSubmit();
            }}
          >
            <div className="workflow-editor-run-input-dialog__intro">
              <h3>{workflowDisplayName || record?.displayName || workflowKey || "Workflow"}</h3>
              <p>Provide the runtime inputs required for this execution.</p>
            </div>

            {workflowInputEntries.map(({ key, definition }) => {
              const fieldId = `workflow-run-input-${key}`;
              const fieldError = runInputErrors[key];
              const label = definition.label || key;
              const type = definition.type || "string";

              return (
                <div
                  key={key}
                  className={`workflow-editor-run-input-field ${fieldError ? "is-invalid" : ""}`}
                >
                  {type === "boolean" ? (
                    <SolidCheckbox
                      checked={Boolean(runInputValues[key])}
                      label={`${label}${definition.required ? " *" : ""}`}
                      onChange={(event) => {
                        setRunInputValues((current) => ({
                          ...current,
                          [key]: event.currentTarget.checked,
                        }));
                        setRunInputErrors((current) => ({ ...current, [key]: "" }));
                      }}
                    />
                  ) : (
                    <>
                      <label htmlFor={fieldId}>
                        {label}
                        {definition.required ? <span> *</span> : null}
                      </label>
                      {type === "object" || type === "array" ? (
                        <SolidTextarea
                          id={fieldId}
                          value={runInputValues[key] ?? ""}
                          placeholder={type === "array" ? "[]" : "{}"}
                          rows={5}
                          onChange={(event) => {
                            setRunInputValues((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }));
                            setRunInputErrors((current) => ({ ...current, [key]: "" }));
                          }}
                        />
                      ) : (
                        <SolidInput
                          id={fieldId}
                          type={type === "number" ? "number" : type === "date" ? "date" : "text"}
                          value={runInputValues[key] ?? ""}
                          onChange={(event) => {
                            setRunInputValues((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }));
                            setRunInputErrors((current) => ({ ...current, [key]: "" }));
                          }}
                        />
                      )}
                    </>
                  )}
                  {definition.description ? (
                    <p className="workflow-editor-run-input-field__help">
                      {definition.description}
                    </p>
                  ) : null}
                  {fieldError ? (
                    <div className="workflow-editor-field-error">{fieldError}</div>
                  ) : null}
                </div>
              );
            })}
          </form>
        </SolidDialogBody>
      </SolidDialog>

      {selectedNode && selectedNodeType ? (
        <WorkflowNodeEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          nodeType={selectedNodeType}
          nodeValue={selectedNode}
          expressionSuggestions={selectedNodeExpressionSuggestions}
          onNodeSubmit={(nextValue) => {
            handleUpdateSelectedNode(nextValue);
            setEditorOpen(false);
          }}
          title={`${selectedNode.name ?? selectedNode.id} · ${selectedNodeType.label ?? selectedNodeType.type}`}
        />
      ) : null}

      <WorkflowAddNodeDialog
        open={!!pendingInsertTarget}
        nodeTypes={nodeTypes}
        expressionSuggestions={addNodeExpressionSuggestions}
        onOpenChange={(open) => {
          if (!open) {
            setPendingInsertTarget(null);
          }
        }}
        createNodeValue={createNodeFromType}
        onSubmit={handleAddNodeSubmit}
      />

      <SolidDialog
        open={topologyDocsOpen}
        onOpenChange={(open) => {
          setTopologyDocsOpen(open);
          if (!open) {
            setTopologyDocsNodeTypeKey("");
            setTopologyDocsModel(undefined);
          }
        }}
        header="Node Documentation"
        className="workflow-editor-topology-docs-dialog"
        style={{ width: "min(920px, 94vw)", maxWidth: "96vw" }}
      >
        <SolidDialogBody>
          <div className="workflow-editor-topology-docs-dialog__body">
            {topologyDocsNodeType || topologyDocsModel ? (
              <WorkflowNodeDocsPanel
                nodeType={topologyDocsNodeType}
                docsModel={topologyDocsModel}
              />
            ) : (
              <div className="workflow-editor-empty-state workflow-editor-empty-state--compact">
                Documentation is not available for this topology item yet.
              </div>
            )}
          </div>
        </SolidDialogBody>
      </SolidDialog>

    </div>
  );
}
