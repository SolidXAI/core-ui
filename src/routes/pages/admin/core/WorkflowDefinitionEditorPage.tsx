import {
  Activity,
  ArrowLeft,
  BookOpen,
  Braces,
  Workflow,
  Layers3,
  Play,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import qs from "qs";
import YAML from "yaml";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
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
  WorkflowNodeEditorDialog,
} from "../../../../components/workflow/WorkflowNodeSchemaEditor";
import type { WorkflowNodeMetadataResponse } from "../../../../types/workflow-node";
import {
  SolidButton,
  SolidCodeEditor,
  SolidDatePicker,
  SolidDialog,
  SolidDialogBody,
  SolidDialogFooter,
  SolidInput,
  SolidPanel,
  SolidSpinner,
  SolidTabGroup,
  SolidTag,
  SolidTextarea,
} from "../../../../components/shad-cn-ui";
import "./WorkflowDefinitionEditorPage.css";

type WorkflowDefinitionRecord = {
  id: number;
  key?: string;
  displayName?: string;
  description?: string;
  definitionYaml?: WorkflowDefinitionDsl | string | null;
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

type ValidationState = {
  status: "idle" | "validating" | "valid" | "invalid";
  source?: "client" | "server";
  message?: string;
  errors: string[];
};

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
  | "topology"
  | "executions"
  | "revisions"
  | "triggers"
  | "logs"
  | "metrics";

type WorkflowExecutionRecord = {
  id: number;
  status?: string | null;
  triggerType?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  durationMs?: number | string | null;
  createdAt?: string | null;
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

function readStoredTopologySplitPercent() {
  if (typeof window === "undefined") {
    return 62;
  }

  const storedValue = Number(window.localStorage.getItem(TOPOLOGY_SPLIT_STORAGE_KEY));
  return Number.isFinite(storedValue) ? Math.min(78, Math.max(22, storedValue)) : 62;
}

function serializeWorkflowDefinitionYaml(definition: WorkflowDefinitionDsl) {
  return YAML.stringify(definition);
}

function parseYamlValue<T>(value: string, fallback: T): T {
  if (!value.trim()) {
    return fallback;
  }

  const parsed = YAML.parse(value);
  return (parsed ?? fallback) as T;
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

function formatDurationMs(value?: number | string | null) {
  const numericValue =
    typeof value === "string" ? Number(value) : typeof value === "number" ? value : null;

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

function buildWorkflowExecutionQueryString(options: {
  workflowDefinitionId: number;
  startDate?: Date | null;
  endDate?: Date | null;
  limit?: number;
}) {
  const queryData: Record<string, any> = {
    limit: options.limit ?? 100,
    offset: 0,
    sort: ["startedAt:desc", "id:desc"],
    filters: {
      workflowDefinition: {
        id: {
          $eq: options.workflowDefinitionId,
        },
      },
    },
  };

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

function buildWorkflowDocsModel(definition: WorkflowDefinitionDsl): WorkflowDocsModel {
  return {
    title: "Workflow Definition",
    subtitle: "Workflow-level settings",
    summary:
      "Top-level inputs, variables, triggers, and description live here. Use workflow settings when the change is not about a single node.",
    badges: ["workflow", "settings"],
    definitions: [
      {
        key: "inputs",
        label: "Inputs",
        content: `\`\`\`yaml\n${YAML.stringify(definition.inputs ?? {})}\`\`\``,
      },
      {
        key: "variables",
        label: "Variables",
        content: `\`\`\`yaml\n${YAML.stringify(definition.variables ?? {})}\`\`\``,
      },
      {
        key: "triggers",
        label: "Triggers",
        content: `\`\`\`yaml\n${YAML.stringify(definition.triggers ?? [])}\`\`\``,
      },
    ],
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
  const {
    useCreateSolidEntityMutation,
    useGetSolidEntityByIdQuery,
    useUpdateSolidEntityMutation,
  } = entityApi;
  const {
    useLazyGetSolidEntitiesQuery: useLazyGetWorkflowExecutionsQuery,
  } = workflowExecutionApi;

  const workflowDefinitionId = params.id ?? "";
  const moduleName = params.moduleName ?? "solid-core";

  const {
    data: workflowDefinitionResponse,
    isLoading: isWorkflowDefinitionLoading,
    refetch,
  } = useGetSolidEntityByIdQuery(
    { id: workflowDefinitionId, qs: "" },
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

  const {
    data: nodeTypes = [],
    isLoading: isNodeTypesLoading,
    isError: isNodeTypesError,
  } = useGetWorkflowNodeTypesQuery();

  const record = workflowDefinitionResponse?.data as
    | WorkflowDefinitionRecord
    | undefined;

  const [workflowKey, setWorkflowKey] = React.useState("");
  const [workflowDisplayName, setWorkflowDisplayName] = React.useState("");
  const [workflowDescription, setWorkflowDescription] = React.useState("");
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
  const [workflowSettingsOpen, setWorkflowSettingsOpen] = React.useState(false);
  const [workflowInputsValue, setWorkflowInputsValue] = React.useState("{}");
  const [workflowVariablesValue, setWorkflowVariablesValue] = React.useState("{}");
  const [workflowTriggersValue, setWorkflowTriggersValue] = React.useState("[]");
  const [docsNodeTypeKey, setDocsNodeTypeKey] = React.useState<string>("");
  const [pendingInsertTarget, setPendingInsertTarget] =
    React.useState<WorkflowInsertTarget | null>(null);
  const [topologyDocsOpen, setTopologyDocsOpen] = React.useState(false);
  const [topologyDocsNodeTypeKey, setTopologyDocsNodeTypeKey] =
    React.useState<string>("");
  const [topologyDocsModel, setTopologyDocsModel] =
    React.useState<WorkflowDocsModel | undefined>();
  const [detailTab, setDetailTab] = React.useState<WorkflowDetailTab>(
    workflowDefinitionId === "new" ? "topology" : "overview",
  );
  const [topologyViewOpen, setTopologyViewOpen] = React.useState(true);
  const [topologyYamlViewOpen, setTopologyYamlViewOpen] = React.useState(false);
  const [topologySplitPercent, setTopologySplitPercent] = React.useState(
    readStoredTopologySplitPercent,
  );
  const topologySplitRef = React.useRef<HTMLDivElement | null>(null);
  const [overviewStartDate, setOverviewStartDate] = React.useState<Date | null>(null);
  const [overviewEndDate, setOverviewEndDate] = React.useState<Date | null>(null);
  const [validationState, setValidationState] = React.useState<ValidationState>({
    status: "idle",
    errors: [],
  });

  React.useEffect(() => {
    setDetailTab(workflowDefinitionId === "new" ? "topology" : "overview");
  }, [workflowDefinitionId]);

  React.useEffect(() => {
    setOverviewStartDate(null);
    setOverviewEndDate(null);
  }, [workflowDefinitionId]);

  React.useEffect(() => {
    if (workflowDefinitionId === "new") {
      const emptyDefinition = createEmptyWorkflowDefinition();
      setWorkflowKey("");
      setWorkflowDisplayName("");
      setWorkflowDescription("");
      setDefinitionDraft(emptyDefinition);
      setCodeValue(serializeWorkflowDefinitionYaml(emptyDefinition));
      setCodeError(null);
      setSelectedNodeId("");
      setSelectedTriggerId("");
      setValidationState({ status: "idle", errors: [] });
      return;
    }

    if (!record || (isNodeTypesLoading && !nodeTypes.length)) {
      return;
    }

    const parsed = parseWorkflowDefinitionYaml(record.definitionYaml, nodeTypes);
    setWorkflowKey(record.key ?? "");
    setWorkflowDisplayName(record.displayName ?? "");
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

  React.useEffect(() => {
    if (!workflowSettingsOpen) {
      return;
    }

    setWorkflowInputsValue(YAML.stringify(definitionDraft.inputs ?? {}));
    setWorkflowVariablesValue(YAML.stringify(definitionDraft.variables ?? {}));
    setWorkflowTriggersValue(YAML.stringify(definitionDraft.triggers ?? []));
  }, [definitionDraft, workflowSettingsOpen]);

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

  const selectedTrigger = React.useMemo(
    () =>
      (definitionDraft.triggers ?? []).find(
        (trigger) => String(trigger.id) === selectedTriggerId,
      ),
    [definitionDraft.triggers, selectedTriggerId],
  );

  const docsNodeType = React.useMemo(() => {
    if (docsNodeTypeKey) {
      return nodeTypes.find((nodeType) => nodeType.type === docsNodeTypeKey);
    }
    return selectedTrigger ? undefined : selectedNodeType;
  }, [
    docsNodeTypeKey,
    nodeTypes,
    selectedNodeType,
    selectedTrigger,
  ]);

  const docsModel = React.useMemo(() => {
    if (selectedTrigger) {
      return buildTriggerDocsModel(selectedTrigger);
    }
    if (!selectedNode && !selectedTrigger) {
      return buildWorkflowDocsModel(definitionDraft);
    }
    return undefined;
  }, [definitionDraft, selectedNode, selectedTrigger]);

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

  const loadWorkflowExecutions = React.useCallback(async () => {
    if (!numericWorkflowDefinitionId) {
      return;
    }

    await triggerGetWorkflowExecutions(
      buildWorkflowExecutionQueryString({
        workflowDefinitionId: numericWorkflowDefinitionId,
        startDate: overviewStartDate,
        endDate: overviewEndDate,
      }),
    );
  }, [
    numericWorkflowDefinitionId,
    overviewEndDate,
    overviewStartDate,
    triggerGetWorkflowExecutions,
  ]);

  React.useEffect(() => {
    if (!numericWorkflowDefinitionId || workflowDefinitionId === "new") {
      return;
    }

    void triggerGetWorkflowExecutionPresence(
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
    if (
      detailTab !== "overview" ||
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

  const executionRecords = React.useMemo(
    () => ((workflowExecutionsQuery.data?.records ?? []) as WorkflowExecutionRecord[]),
    [workflowExecutionsQuery.data?.records],
  );

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

  const overviewDateFilterLabel = React.useMemo(() => {
    if (!overviewStartDate && !overviewEndDate) {
      return "All dates";
    }

    const formatDateOnly = (value: Date | null) =>
      value
        ? value.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : null;

    const start = formatDateOnly(overviewStartDate);
    const end = formatDateOnly(overviewEndDate);

    if (start && end) {
      return `${start} - ${end}`;
    }
    if (start) {
      return `From ${start}`;
    }
    return `Until ${end}`;
  }, [overviewEndDate, overviewStartDate]);

  const syncDraftToCode = React.useCallback((nextDraft: WorkflowDefinitionDsl) => {
    setDefinitionDraft(nextDraft);
    setCodeValue(serializeWorkflowDefinitionYaml(nextDraft));
    setCodeError(null);
    setValidationState({ status: "idle", errors: [] });
  }, []);

  const handleSaveWorkflowSettings = React.useCallback(() => {
    try {
      const nextInputs = parseYamlValue<Record<string, any>>(workflowInputsValue, {});
      const nextVariables = parseYamlValue<Record<string, any>>(workflowVariablesValue, {});
      const nextTriggers = parseYamlValue<Array<Record<string, any>>>(workflowTriggersValue, []);

      if (!Array.isArray(nextTriggers)) {
        throw new Error("Triggers must be a YAML sequence.");
      }

      const nextDraft: WorkflowDefinitionDsl = {
        ...definitionDraft,
        description: workflowDescription,
        inputs: nextInputs,
        variables: nextVariables,
        triggers: nextTriggers,
      };

      syncDraftToCode(nextDraft);
      setWorkflowSettingsOpen(false);
      dispatch(
        showToast({
          severity: "success",
          summary: "Workflow settings updated",
          detail: "Inputs, variables, and triggers were updated in the draft.",
        }),
      );
    } catch (error: any) {
      dispatch(
        showToast({
          severity: "error",
          summary: "Invalid workflow settings",
          detail:
            error?.message ??
            "Fix the workflow-level YAML blocks before saving the settings.",
        }),
      );
    }
  }, [
    definitionDraft,
    dispatch,
    syncDraftToCode,
    workflowDescription,
    workflowInputsValue,
    workflowTriggersValue,
    workflowVariablesValue,
  ]);

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
      workflowDescription,
      workflowKey,
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
    setDocsNodeTypeKey(nextNode.type);
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
    setDocsNodeTypeKey(nextNode.type);
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
      dispatch(
        showToast({
          severity: "error",
          summary: "Validation failed",
          detail: validation.errors[0] ?? "Fix validation errors before saving.",
        }),
      );
      return;
    }

    const payload = {
      key: workflowKey,
      displayName: workflowDisplayName,
      description: workflowDescription,
      definitionYaml: serializeWorkflowDefinitionYaml({
        ...definitionDraft,
        description: workflowDescription,
      }),
    };

    try {
      if (record?.id) {
        await updateWorkflowDefinition({
          id: record.id,
          data: {
            ...record,
            ...payload,
          },
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
            `/admin/core/${moduleName}/workflow-definition/editor/${createdId}`,
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

    try {
      const response: any = await executeWorkflowDefinition({ id: record.id }).unwrap();
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

  const renderPlaceholderTab = (label: string, message: string) => (
    <div className="workflow-editor-placeholder">
      <div className="workflow-editor-placeholder__icon">
        <Activity size={20} />
      </div>
      <div className="workflow-editor-placeholder__copy">
        <h3>{label}</h3>
        <p>{message}</p>
      </div>
    </div>
  );

  const overviewContent =
    workflowDefinitionId === "new" ? (
      <div className="workflow-editor-overview workflow-editor-overview--empty">
        <div className="workflow-editor-overview-cta">
          <div className="workflow-editor-overview-cta__art">
            <Save size={26} />
          </div>
          <div className="workflow-editor-overview-cta__copy">
            <h2>Save this workflow to unlock the overview.</h2>
            <p>
              Once this definition exists, the overview tab will switch to execution
              analytics, KPI summaries, and date-based filtering.
            </p>
          </div>
          <div className="workflow-editor-overview-cta__actions">
            <SolidButton leftIcon={<Save size={16} />} onClick={handleSave}>
              Save Workflow
            </SolidButton>
            <SolidButton variant="outline" onClick={() => setDetailTab("topology")}>
              Continue Editing
            </SolidButton>
          </div>
        </div>
      </div>
    ) : !hasExecutions ? (
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
              Open Builder
            </SolidButton>
          </div>
        </div>

        <div className="workflow-editor-overview-guides">
          <div className="workflow-editor-overview-guide-card">
            <h3>Overview</h3>
            <p>Execution KPIs and health snapshots appear here after the first successful run.</p>
          </div>
          <div className="workflow-editor-overview-guide-card">
            <h3>Topology</h3>
            <p>Refine YAML, topology, nodes, inputs, and triggers inside the topology workspace.</p>
          </div>
          <div className="workflow-editor-overview-guide-card">
            <h3>Executions</h3>
            <p>Execution history and drill-downs will become available as runs accumulate.</p>
          </div>
        </div>
      </div>
    ) : (
      <div className="workflow-editor-overview">
        <div className="workflow-editor-overview-filterbar">
          <div className="workflow-editor-overview-filterbar__left">
            <div className="workflow-editor-overview-filter">
              <label>Date From</label>
              <SolidDatePicker
                selected={overviewStartDate}
                onChange={(date: Date | null) => setOverviewStartDate(date)}
                placeholderText="Start date"
              />
            </div>
            <div className="workflow-editor-overview-filter">
              <label>Date To</label>
              <SolidDatePicker
                selected={overviewEndDate}
                onChange={(date: Date | null) => setOverviewEndDate(date)}
                placeholderText="End date"
              />
            </div>
            <SolidButton size="small" variant="outline" onClick={loadWorkflowExecutions}>
              Apply
            </SolidButton>
            {(overviewStartDate || overviewEndDate) && (
              <SolidButton
                size="small"
                variant="ghost"
                onClick={() => {
                  setOverviewStartDate(null);
                  setOverviewEndDate(null);
                }}
              >
                Clear
              </SolidButton>
            )}
          </div>
          <div className="workflow-editor-overview-filterbar__right">
            <SolidTag>{overviewDateFilterLabel}</SolidTag>
            <SolidButton
              size="small"
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              loading={workflowExecutionsQuery.isFetching}
              onClick={loadWorkflowExecutions}
            >
              Refresh
            </SolidButton>
          </div>
        </div>

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

          <SolidPanel header="Recent Executions">
            {workflowExecutionsQuery.isFetching && !executionRecords.length ? (
              <div className="workflow-editor-loading">
                <SolidSpinner />
              </div>
            ) : executionRecords.length ? (
              <div className="workflow-editor-overview-list">
                {executionRecords.slice(0, 6).map((execution, index) => (
                  <div key={execution.id} className="workflow-editor-overview-list-item">
                    <div className="workflow-editor-overview-list-index">{index + 1}</div>
                    <div className="workflow-editor-overview-list-copy">
                      <strong>{execution.status ?? "Unknown"}</strong>
                      <span>{formatExecutionDate(execution.startedAt || execution.createdAt)}</span>
                    </div>
                    <SolidTag>{formatDurationMs(execution.durationMs)}</SolidTag>
                  </div>
                ))}
              </div>
            ) : (
              <div className="workflow-editor-empty-state workflow-editor-empty-state--compact">
                No executions match the current date filter.
              </div>
            )}
          </SolidPanel>

          <SolidPanel header="Actions">
            <div className="workflow-editor-overview-actions">
              <SolidButton
                leftIcon={<Play size={16} />}
                loading={isExecuting}
                onClick={() => void handleExecute()}
              >
                Execute Again
              </SolidButton>
              <SolidButton variant="outline" onClick={() => setDetailTab("topology")}>
                Open Builder
              </SolidButton>
              <SolidButton
                variant="outline"
                leftIcon={<Settings2 size={16} />}
                onClick={() => setWorkflowSettingsOpen(true)}
              >
                Workflow Settings
              </SolidButton>
            </div>
          </SolidPanel>
        </div>
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
            const node = findNodeById(definitionDraft.nodes, nodeId);
            if (node?.type) {
              setDocsNodeTypeKey(node.type);
            }
          }}
          onSelectTrigger={(triggerId) => {
            setSelectedTriggerId(triggerId);
            setSelectedNodeId("");
            setDocsNodeTypeKey("");
          }}
          onEditNode={(nodeId) => {
            setSelectedNodeId(nodeId);
            setSelectedTriggerId("");
            const node = findNodeById(definitionDraft.nodes, nodeId);
            if (node?.type) {
              setDocsNodeTypeKey(node.type);
            }
            setEditorOpen(true);
          }}
          onDeleteNode={handleRemoveNode}
          onViewDocs={(nodeId) => {
            const node = findNodeById(definitionDraft.nodes, nodeId);
            if (node?.type) {
              setSelectedNodeId(nodeId);
              setSelectedTriggerId("");
              setDocsNodeTypeKey(node.type);
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
            setDocsNodeTypeKey("");
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
      value: "topology",
      label: "Topology",
      content: topologyContent,
    },
    {
      value: "executions",
      label: "Executions",
      content: renderPlaceholderTab(
        "Executions",
        "Execution history and drill-downs will land here in the next pass.",
      ),
    },
    {
      value: "revisions",
      label: "Revisions",
      content: renderPlaceholderTab(
        "Revisions",
        "Revision history is not wired yet, but the tab shell is ready.",
      ),
    },
    {
      value: "triggers",
      label: "Triggers",
      content: renderPlaceholderTab(
        "Triggers",
        "Trigger management will be added here after the overview pass is settled.",
      ),
    },
    {
      value: "logs",
      label: "Logs",
      content: renderPlaceholderTab(
        "Logs",
        "Workflow-level log browsing will be added in a later pass.",
      ),
    },
    {
      value: "metrics",
      label: "Metrics",
      content: renderPlaceholderTab(
        "Metrics",
        "Metrics will appear here once the backing persistence is introduced.",
      ),
    },
  ] as const;

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
              navigate(`/admin/core/${moduleName}/workflow-definition/list`)
            }
          >
            Back
          </SolidButton>
        </div>
        <div className="workflow-editor-header-actions">
          <SolidButton
            size="small"
            variant="outline"
            leftIcon={<Settings2 size={16} />}
            onClick={() => setWorkflowSettingsOpen(true)}
          >
            Workflow
          </SolidButton>
          <SolidButton
            size="small"
            variant="outline"
            leftIcon={<BookOpen size={16} />}
            onClick={() => {
              setDetailTab("topology");
              if (docsNodeType) {
                setTopologyDocsNodeTypeKey(docsNodeType.type);
                setTopologyDocsModel(undefined);
              } else {
                setTopologyDocsNodeTypeKey("");
                setTopologyDocsModel(docsModel);
              }
              setTopologyDocsOpen(true);
            }}
          >
            Docs
          </SolidButton>
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
          onValueChange={(value) => setDetailTab(value as WorkflowDetailTab)}
          listClassName="workflow-editor-detail-tabs__list"
          panelClassName="workflow-editor-detail-tabs__panel"
        />
      </div>

      {selectedNode && selectedNodeType ? (
        <WorkflowNodeEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          nodeType={selectedNodeType}
          nodeValue={selectedNode}
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

      <SolidDialog
        open={workflowSettingsOpen}
        onOpenChange={setWorkflowSettingsOpen}
        header="Workflow Settings"
        className="solid-workflow-node-editor-dialog solid-workflow-node-editor-dialog--full"
        style={{ width: "min(1200px, 94vw)", maxWidth: "96vw" }}
      >
        <SolidDialogBody>
          <div className="workflow-editor-workflow-settings">
            <SolidPanel header="Workflow Identity">
              <div className="workflow-editor-form-grid">
                <div className="workflow-editor-field">
                  <label>Key</label>
                  <SolidInput
                    value={workflowKey}
                    onChange={(event) => setWorkflowKey(event.target.value)}
                  />
                </div>
                <div className="workflow-editor-field">
                  <label>Display Name</label>
                  <SolidInput
                    value={workflowDisplayName}
                    onChange={(event) => setWorkflowDisplayName(event.target.value)}
                  />
                </div>
              </div>
              <div className="workflow-editor-field">
                <label>Description</label>
                <SolidTextarea
                  value={workflowDescription}
                  onChange={(event) => setWorkflowDescription(event.target.value)}
                />
              </div>
            </SolidPanel>

            <SolidPanel header="Inputs">
              <SolidCodeEditor
                language="yaml"
                height="220px"
                value={workflowInputsValue}
                onChange={(value) => setWorkflowInputsValue(value ?? "{}")}
              />
            </SolidPanel>

            <SolidPanel header="Variables">
              <SolidCodeEditor
                language="yaml"
                height="220px"
                value={workflowVariablesValue}
                onChange={(value) => setWorkflowVariablesValue(value ?? "{}")}
              />
            </SolidPanel>

            <SolidPanel header="Triggers">
              <SolidCodeEditor
                language="yaml"
                height="260px"
                value={workflowTriggersValue}
                onChange={(value) => setWorkflowTriggersValue(value ?? "[]")}
              />
            </SolidPanel>
          </div>
        </SolidDialogBody>
        <SolidDialogFooter>
          <SolidButton
            variant="secondary"
            onClick={() => setWorkflowSettingsOpen(false)}
          >
            Cancel
          </SolidButton>
          <SolidButton onClick={handleSaveWorkflowSettings}>Apply</SolidButton>
        </SolidDialogFooter>
      </SolidDialog>
    </div>
  );
}
