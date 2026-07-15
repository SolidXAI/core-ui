import {
  Activity,
  ArrowLeft,
  BookOpen,
  Braces,
  ChevronLeft,
  ChevronRight,
  GitBranchPlus,
  Layers3,
  Play,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  X,
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
  WorkflowNodeEditorDialog,
  WorkflowNodePalette,
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
  children?: WorkflowNodeRecord[];
  nodes?: WorkflowNodeRecord[];
  then?: WorkflowNodeRecord[];
  else?: WorkflowNodeRecord[];
  branches?: Array<{
    id: string;
    name?: string;
    nodes: WorkflowNodeRecord[];
  }>;
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

type WorkflowDetailTab =
  | "overview"
  | "topology"
  | "executions"
  | "edit"
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

function normalizeWorkflowDefinition(
  definitionYaml: WorkflowDefinitionRecord["definitionYaml"],
): WorkflowDefinitionDsl {
  if (!definitionYaml) {
    return createEmptyWorkflowDefinition();
  }

  let parsed: any = definitionYaml;
  if (typeof definitionYaml === "string") {
    try {
      parsed = YAML.parse(definitionYaml);
    } catch {
      return createEmptyWorkflowDefinition();
    }
  }

  return {
    ...createEmptyWorkflowDefinition(),
    ...(parsed ?? {}),
    nodes: Array.isArray((parsed as any)?.nodes) ? (parsed as any).nodes : [],
    triggers: Array.isArray((parsed as any)?.triggers)
      ? (parsed as any).triggers
      : [],
  };
}

function flattenWorkflowNodeIds(nodes: WorkflowNodeRecord[]): string[] {
  return nodes.flatMap((node) => [
    String(node.id),
    ...flattenWorkflowNodeIds(node.children ?? []),
    ...flattenWorkflowNodeIds(node.nodes ?? []),
    ...flattenWorkflowNodeIds(node.then ?? []),
    ...flattenWorkflowNodeIds(node.else ?? []),
    ...(node.branches ?? []).flatMap((branch) =>
      flattenWorkflowNodeIds(branch.nodes ?? []),
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

function buildBranchId(parentNodeId: string, node: WorkflowNodeRecord) {
  const existingIds = new Set((node.branches ?? []).map((branch) => branch.id));
  let counter = (node.branches ?? []).length + 1;
  let nextId = `${parentNodeId}Branch${counter}`;

  while (existingIds.has(nextId)) {
    counter += 1;
    nextId = `${parentNodeId}Branch${counter}`;
  }

  return nextId;
}

function countNodes(nodes: WorkflowNodeRecord[]): number {
  return nodes.reduce(
    (sum, node) =>
      sum +
      1 +
      countNodes(node.children ?? []) +
      countNodes(node.nodes ?? []) +
      countNodes(node.then ?? []) +
      countNodes(node.else ?? []) +
      (node.branches ?? []).reduce(
        (branchSum, branch) => branchSum + countNodes(branch.nodes ?? []),
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
      findNodeById(node.children ?? [], nodeId) ??
      findNodeById(node.nodes ?? [], nodeId) ??
      findNodeById(node.then ?? [], nodeId) ??
      findNodeById(node.else ?? [], nodeId) ??
      (node.branches ?? []).reduce<WorkflowNodeRecord | undefined>(
        (found, branch) => found ?? findNodeById(branch.nodes ?? [], nodeId),
        undefined,
      );

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
      children: node.children
        ? updateNodeById(node.children, nodeId, updater)
        : node.children,
      nodes: node.nodes ? updateNodeById(node.nodes, nodeId, updater) : node.nodes,
      then: node.then ? updateNodeById(node.then, nodeId, updater) : node.then,
      else: node.else ? updateNodeById(node.else, nodeId, updater) : node.else,
      branches: node.branches?.map((branch) => ({
        ...branch,
        nodes: updateNodeById(branch.nodes ?? [], nodeId, updater),
      })),
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
      children: node.children ? removeNodeById(node.children, nodeId) : node.children,
      nodes: node.nodes ? removeNodeById(node.nodes, nodeId) : node.nodes,
      then: node.then ? removeNodeById(node.then, nodeId) : node.then,
      else: node.else ? removeNodeById(node.else, nodeId) : node.else,
      branches: node.branches?.map((branch) => ({
        ...branch,
        nodes: removeNodeById(branch.nodes ?? [], nodeId),
      })),
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
      if (target.scope === "slot") {
        const slotNodes = Array.isArray(node[target.slotKey])
          ? (node[target.slotKey] as WorkflowNodeRecord[])
          : [];
        return {
          ...node,
          [target.slotKey]: insertAt(slotNodes, target.index, nodeToInsert),
        };
      }

      return {
        ...node,
        branches: (node.branches ?? []).map((branch) =>
          branch.id === target.branchId
            ? {
                ...branch,
                nodes: insertAt(branch.nodes ?? [], target.index, nodeToInsert),
              }
            : branch,
        ),
      };
    }),
  };
}

function appendBranchToDefinition(
  definition: WorkflowDefinitionDsl,
  parentNodeId: string,
): WorkflowDefinitionDsl {
  return {
    ...definition,
    nodes: updateNodeById(definition.nodes, parentNodeId, (node) => ({
      ...node,
      branches: [
        ...(node.branches ?? []),
        {
          id: buildBranchId(parentNodeId, node),
          name: `Branch ${(node.branches ?? []).length + 1}`,
          nodes: [],
        },
      ],
    })),
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
  const errors: string[] = [];
  const nodeTypeMap = new Map(nodeTypes.map((item) => [item.type, item]));
  const seenNodeIds = new Set<string>();

  if (!workflowKey.trim()) {
    errors.push("Workflow key is required.");
  }

  if (!Array.isArray(definition.nodes) || !definition.nodes.length) {
    errors.push("Workflow definition must contain at least one root node.");
  }

  const validateNodeSequence = (nodes: WorkflowNodeRecord[], scopeLabel: string) => {
    nodes.forEach((node, index) => {
      const prefix = `${scopeLabel} node ${index + 1}`;

      if (!node.id) {
        errors.push(`${prefix} is missing an id.`);
      } else if (seenNodeIds.has(node.id)) {
        errors.push(`Duplicate workflow node id "${node.id}".`);
      } else {
        seenNodeIds.add(node.id);
      }

      if (!node.type) {
        errors.push(`${prefix} is missing a type.`);
        return;
      }

      const nodeType = nodeTypeMap.get(node.type);
      if (!nodeType) {
        errors.push(`Node "${node.id}" uses unregistered type "${node.type}".`);
        return;
      }

      const configuration = node.configuration ?? {};
      (nodeType.authoring?.configurationFields ?? []).forEach((field) => {
        if (!field.required) {
          return;
        }

        const value = getFieldValue(configuration, field.path ?? field.key);
        const isEmptyArray = Array.isArray(value) && value.length === 0;
        const isMissing =
          value === undefined ||
          value === null ||
          value === "" ||
          isEmptyArray;

        if (isMissing) {
          errors.push(
            `Node "${node.id}" is missing required field "${field.label ?? field.key}".`,
          );
        }
      });

      (nodeType.authoring?.childSlots ?? []).forEach((slot) => {
        if (slot.kind === "branch-collection") {
          const branchCount = Array.isArray(node.branches) ? node.branches.length : 0;
          if (slot.required && branchCount === 0) {
            errors.push(
              `Node "${node.id}" requires at least one branch in "${slot.label ?? slot.key}".`,
            );
          }
          if (slot.minItems && branchCount < slot.minItems) {
            errors.push(
              `Node "${node.id}" requires at least ${slot.minItems} branches in "${slot.label ?? slot.key}".`,
            );
          }
        } else {
          const slotNodes = Array.isArray(node[slot.key]) ? node[slot.key] : [];
          if (slot.required && slotNodes.length === 0) {
            errors.push(
              `Node "${node.id}" requires at least one child node in "${slot.label ?? slot.key}".`,
            );
          }
          if (slot.minItems && slotNodes.length < slot.minItems) {
            errors.push(
              `Node "${node.id}" requires at least ${slot.minItems} nodes in "${slot.label ?? slot.key}".`,
            );
          }
        }
      });

      validateNodeSequence(node.children ?? [], `${node.id} children`);
      validateNodeSequence(node.nodes ?? [], `${node.id} nodes`);
      validateNodeSequence(node.then ?? [], `${node.id} then`);
      validateNodeSequence(node.else ?? [], `${node.id} else`);
      (node.branches ?? []).forEach((branch, branchIndex) => {
        if (!branch.id) {
          errors.push(`Node "${node.id}" has a branch without an id.`);
        }
        validateNodeSequence(
          branch.nodes ?? [],
          `${node.id} branch ${branch.name ?? branch.id ?? branchIndex + 1}`,
        );
      });
    });
  };

  validateNodeSequence(definition.nodes, "root");
  return errors;
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
  const [paletteNodeTypeKey, setPaletteNodeTypeKey] = React.useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = React.useState<string>("");
  const [selectedTriggerId, setSelectedTriggerId] = React.useState<string>("");
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [workflowSettingsOpen, setWorkflowSettingsOpen] = React.useState(false);
  const [workflowInputsValue, setWorkflowInputsValue] = React.useState("{}");
  const [workflowVariablesValue, setWorkflowVariablesValue] = React.useState("{}");
  const [workflowTriggersValue, setWorkflowTriggersValue] = React.useState("[]");
  const [docsOpen, setDocsOpen] = React.useState(false);
  const [docsNodeTypeKey, setDocsNodeTypeKey] = React.useState<string>("");
  const [topologyDocsOpen, setTopologyDocsOpen] = React.useState(false);
  const [topologyDocsNodeTypeKey, setTopologyDocsNodeTypeKey] =
    React.useState<string>("");
  const [topologyDocsModel, setTopologyDocsModel] =
    React.useState<WorkflowDocsModel | undefined>();
  const [detailTab, setDetailTab] = React.useState<WorkflowDetailTab>(
    workflowDefinitionId === "new" ? "edit" : "overview",
  );
  const [activePanel, setActivePanel] = React.useState<"code" | "flow" | "docs">(
    "flow",
  );
  const [toolsOpen, setToolsOpen] = React.useState(false);
  const [codePaneOpen, setCodePaneOpen] = React.useState(false);
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
    setDetailTab(workflowDefinitionId === "new" ? "edit" : "overview");
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

    if (!record) {
      return;
    }

    const normalized = normalizeWorkflowDefinition(record.definitionYaml);
    setWorkflowKey(record.key ?? "");
    setWorkflowDisplayName(record.displayName ?? "");
    setWorkflowDescription(record.description ?? normalized.description ?? "");
    setDefinitionDraft(normalized);
    setCodeValue(serializeWorkflowDefinitionYaml(normalized));
    setCodeError(null);
    setSelectedNodeId(getFirstNodeId(normalized.nodes));
    setSelectedTriggerId("");
    setValidationState({ status: "idle", errors: [] });
  }, [record, workflowDefinitionId]);

  React.useEffect(() => {
    if (!paletteNodeTypeKey && nodeTypes.length) {
      setPaletteNodeTypeKey(nodeTypes[0].type);
    }
  }, [nodeTypes, paletteNodeTypeKey]);

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

  const paletteNodeType = React.useMemo(
    () => nodeTypes.find((nodeType) => nodeType.type === paletteNodeTypeKey),
    [nodeTypes, paletteNodeTypeKey],
  );

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
    return selectedTrigger ? undefined : selectedNodeType ?? paletteNodeType;
  }, [
    docsNodeTypeKey,
    nodeTypes,
    paletteNodeType,
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

    try {
      const parsed = YAML.parse(safeValue);
      const normalized = normalizeWorkflowDefinition(parsed);
      setDefinitionDraft(normalized);
      setCodeError(null);
      setValidationState({ status: "idle", errors: [] });
    } catch (error: any) {
      setCodeError(error?.message ?? "Invalid YAML");
      setValidationState({
        status: "invalid",
        source: "client",
        message: "Definition YAML is invalid.",
        errors: [error?.message ?? "Invalid YAML"],
      });
    }
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
      if (slot.kind === "branch-collection") {
        const branchCount = Math.max(slot.minItems ?? 0, slot.required ? 1 : 0);
        nextNode.branches = Array.from({ length: branchCount }, (_, index) => ({
          id: `${nextNode.id}Branch${index + 1}`,
          name: `Branch ${index + 1}`,
          nodes: [],
        }));
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
        setActivePanel("code");
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
        setActivePanel("flow");
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
        setActivePanel("flow");
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
    if (!paletteNodeType) {
      dispatch(
        showToast({
          severity: "warn",
          summary: "Pick a node type",
          detail: "Select a node type from the palette before inserting into the flow.",
        }),
      );
      return;
    }

    const nextNode = createNodeFromType(paletteNodeType);
    const nextDraft = insertNodeIntoDefinition(definitionDraft, target, nextNode);
    syncDraftToCode(nextDraft);
    setSelectedNodeId(nextNode.id);
    setDocsNodeTypeKey(nextNode.type);
    setEditorOpen(true);
    setActivePanel("flow");
  };

  const handleAddBranch = (parentNodeId: string) => {
    const nextDraft = appendBranchToDefinition(definitionDraft, parentNodeId);
    syncDraftToCode(nextDraft);
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
            <SolidButton variant="outline" onClick={() => setDetailTab("edit")}>
              Continue Editing
            </SolidButton>
          </div>
        </div>
      </div>
    ) : !hasExecutions ? (
      <div className="workflow-editor-overview workflow-editor-overview--empty">
        <div className="workflow-editor-overview-cta">
          <div className="workflow-editor-overview-cta__art">
            <GitBranchPlus size={28} />
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
            <SolidButton variant="outline" onClick={() => setDetailTab("edit")}>
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
            <h3>Edit</h3>
            <p>Refine YAML, topology, nodes, inputs, and triggers inside the builder workspace.</p>
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
              <SolidButton variant="outline" onClick={() => setDetailTab("edit")}>
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

  const hasTopologyGraph =
    definitionDraft.nodes.length || (definitionDraft.triggers?.length ?? 0) > 0;

  const topologyCanvasView = hasTopologyGraph ? (
    <div className="workflow-editor-canvas-shell workflow-editor-canvas-shell--readonly">
      <WorkflowFlowCanvas
        definition={definitionDraft}
        nodeTypes={nodeTypes}
        selectedNodeId={selectedNodeId}
        selectedTriggerId={selectedTriggerId}
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
        onEditNode={() => {}}
        onDeleteNode={() => {}}
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
        onInsertNode={() => {}}
        onAddBranch={() => {}}
        readOnly
      />
    </div>
  ) : (
    <div className="workflow-editor-placeholder workflow-editor-placeholder--topology">
      <div className="workflow-editor-placeholder__icon">
        <Activity size={20} />
      </div>
      <div className="workflow-editor-placeholder__copy">
        <h3>Topology</h3>
        <p>Save or add workflow nodes to generate a read-only topology view.</p>
      </div>
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
      {codeError ? <div className="workflow-editor-error">{codeError}</div> : null}
    </div>
  );

  const topologyContent = (
    <div className="workflow-editor-topology-tab">
      <div className="workflow-editor-topology-actionbar">
        <div className="workflow-editor-topology-actionbar__spacer" />
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
    { value: "edit", label: "Edit", content: null },
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
              setDetailTab("edit");
              setDocsOpen(true);
              setActivePanel("docs");
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
            content: tab.value === "edit" ? null : tab.content,
          }))}
          value={detailTab}
          onValueChange={(value) => setDetailTab(value as WorkflowDetailTab)}
          listClassName="workflow-editor-detail-tabs__list"
          panelClassName="workflow-editor-detail-tabs__panel"
        />
      </div>

      {detailTab === "edit" ? (
        <>
          <div className="workflow-editor-focus-switcher">
            {(["flow", "code", "docs"] as const).map((panel) => (
              <button
                key={panel}
                type="button"
                className={`workflow-editor-focus-pill ${activePanel === panel ? "is-active" : ""}`}
                onClick={() => setActivePanel(panel)}
              >
                {panel === "flow" ? "Flow" : panel === "code" ? "Code" : "Docs"}
              </button>
            ))}
          </div>

          <div
            className={`workflow-editor-shell workflow-editor-shell--two-panel ${codePaneOpen ? "workflow-editor-shell--code-open" : "workflow-editor-shell--code-collapsed"}`}
          >
            <section
              className={`workflow-editor-surface workflow-editor-surface--code ${activePanel === "code" ? "is-active" : ""}`}
            >
              <div className="workflow-editor-surface-header">
                <div>
                  <div className="workflow-editor-surface-eyebrow">Code</div>
                  <h2 className="workflow-editor-surface-title">Definition YAML</h2>
                </div>
                {codeError ? (
                  <SolidTag tone="danger">Invalid YAML</SolidTag>
                ) : (
                  <SolidTag tone="success">Synced</SolidTag>
                )}
              </div>
              <div className="workflow-editor-surface-body">
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

                <SolidPanel header="Definition YAML">
                  <SolidCodeEditor
                    language="yaml"
                    height="calc(100vh - 390px)"
                    value={codeValue}
                    onChange={handleCodeChange}
                  />
                  {codeError ? (
                    <div className="workflow-editor-error">{codeError}</div>
                  ) : null}
                </SolidPanel>
              </div>
            </section>

            <section
              className={`workflow-editor-surface workflow-editor-surface--flow ${activePanel !== "code" ? "is-active" : ""}`}
            >
              <div className="workflow-editor-surface-header">
                <div className="workflow-editor-flow-header-main">
                  <div className="workflow-editor-surface-eyebrow">Flow</div>
                  <div className="workflow-editor-flow-header-title-row">
                    <h2 className="workflow-editor-surface-title">Topology Builder</h2>
                    <SolidTag tone={validationTag.tone}>{validationTag.label}</SolidTag>
                    <SolidTag>{workflowStats.nodeCount} nodes</SolidTag>
                    {workflowStats.triggerCount ? (
                      <SolidTag>{workflowStats.triggerCount} triggers</SolidTag>
                    ) : null}
                    {paletteNodeType?.label ? (
                      <SolidTag>{paletteNodeType.label}</SolidTag>
                    ) : null}
                  </div>
                  <div className="workflow-editor-flow-header-selection">
                    {selectedNode && selectedNodeType ? (
                      <>
                        <strong>{selectedNode.name ?? selectedNode.id}</strong>
                        <span className="workflow-editor-node-card-subtitle">
                          {selectedNodeType.label ?? selectedNode.type}
                        </span>
                      </>
                    ) : selectedTrigger ? (
                      <>
                        <strong>
                          {selectedTrigger.label ??
                            selectedTrigger.name ??
                            selectedTrigger.id}
                        </strong>
                        <span className="workflow-editor-node-card-subtitle">
                          {selectedTrigger.type ?? "Trigger"}
                        </span>
                      </>
                    ) : (
                      <span className="workflow-editor-flow-toolbar__empty">
                        Select a node or trigger to inspect it.
                      </span>
                    )}
                  </div>
                </div>
                <div className="workflow-editor-surface-header-actions">
                  <SolidButton
                    size="small"
                    variant="outline"
                    leftIcon={
                      codePaneOpen ? (
                        <ChevronLeft size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )
                    }
                    onClick={() => setCodePaneOpen((current) => !current)}
                  >
                    {codePaneOpen ? "Hide code" : "Show code"}
                  </SolidButton>
                  <SolidButton
                    size="small"
                    variant="outline"
                    leftIcon={<Braces size={14} />}
                    onClick={() => {
                      setCodePaneOpen(true);
                      setActivePanel("code");
                    }}
                  >
                    Code
                  </SolidButton>
                  <SolidButton
                    size="small"
                    variant="outline"
                    leftIcon={<Layers3 size={14} />}
                    onClick={() => setToolsOpen((current) => !current)}
                  >
                    {toolsOpen ? "Hide library" : "Library"}
                  </SolidButton>
                  <SolidButton
                    size="small"
                    variant="outline"
                    leftIcon={<BookOpen size={14} />}
                    onClick={() => {
                      setDocsOpen(true);
                      setActivePanel("docs");
                    }}
                  >
                    {docsNodeType || docsModel ? "View docs" : "Open docs"}
                  </SolidButton>
                  <SolidButton
                    size="small"
                    variant="outline"
                    leftIcon={<Settings2 size={14} />}
                    onClick={() => setWorkflowSettingsOpen(true)}
                  >
                    Workflow
                  </SolidButton>
                </div>
              </div>
              <div className="workflow-editor-surface-body workflow-editor-surface-body--flow">
                <div className="workflow-editor-flow-workspace">
                  {toolsOpen ? (
                    <aside className="workflow-editor-tools-drawer">
                      <div className="workflow-editor-tools-drawer__header">
                        <div>
                          <div className="workflow-editor-surface-eyebrow">
                            Builder Tools
                          </div>
                          <h3 className="workflow-editor-surface-title">
                            Node Library & Inspector
                          </h3>
                        </div>
                        <SolidButton
                          size="small"
                          variant="ghost"
                          onClick={() => setToolsOpen(false)}
                        >
                          <X size={16} />
                        </SolidButton>
                      </div>

                      <div className="workflow-editor-tools-drawer__body">
                        <SolidPanel header="Node Types">
                          <WorkflowNodePalette
                            nodeTypes={nodeTypes}
                            value={paletteNodeType?.type}
                            onSelect={(nodeType) => {
                              setPaletteNodeTypeKey(nodeType.type);
                              setDocsNodeTypeKey(nodeType.type);
                            }}
                          />
                        </SolidPanel>

                        <SolidPanel header="Selection">
                          {selectedNode && selectedNodeType ? (
                            <div className="workflow-editor-selected-node-summary">
                              <div>
                                <strong>{selectedNode.name ?? selectedNode.id}</strong>
                                <div className="workflow-editor-node-card-subtitle">
                                  {selectedNodeType.label ?? selectedNode.type}
                                </div>
                              </div>
                              <div className="workflow-editor-selected-node-actions">
                                <SolidButton
                                  size="small"
                                  variant="outline"
                                  onClick={() => {
                                    setDocsNodeTypeKey(selectedNode.type);
                                    setDocsOpen(true);
                                    setActivePanel("docs");
                                  }}
                                >
                                  Docs
                                </SolidButton>
                                <SolidButton
                                  size="small"
                                  onClick={() => setEditorOpen(true)}
                                >
                                  Edit
                                </SolidButton>
                              </div>
                            </div>
                          ) : selectedTrigger ? (
                            <div className="workflow-editor-selected-node-summary">
                              <div>
                                <strong>
                                  {selectedTrigger.label ??
                                    selectedTrigger.name ??
                                    selectedTrigger.id}
                                </strong>
                                <div className="workflow-editor-node-card-subtitle">
                                  {selectedTrigger.type ?? "Trigger"}
                                </div>
                              </div>
                              <div className="workflow-editor-selected-node-actions">
                                <SolidButton
                                  size="small"
                                  variant="outline"
                                  onClick={() => {
                                    setDocsOpen(true);
                                    setActivePanel("docs");
                                  }}
                                >
                                  Docs
                                </SolidButton>
                                <SolidButton
                                  size="small"
                                  onClick={() => setWorkflowSettingsOpen(true)}
                                >
                                  Workflow
                                </SolidButton>
                              </div>
                            </div>
                          ) : (
                            <div className="workflow-editor-empty-state workflow-editor-empty-state--compact">
                              Select a node or trigger on the canvas to inspect it.
                            </div>
                          )}
                        </SolidPanel>

                        <SolidPanel header="Validation">
                          <div className="workflow-editor-validation-summary">
                            <div
                              className={`workflow-editor-validation-state workflow-editor-validation-state--${validationState.status}`}
                            >
                              {validationState.message ??
                                "Validation has not been run yet."}
                            </div>
                            {validationState.errors.length ? (
                              <ul className="workflow-editor-validation-list">
                                {validationState.errors.map((error) => (
                                  <li key={error}>{error}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        </SolidPanel>
                      </div>
                    </aside>
                  ) : null}

                  <div className="workflow-editor-flow-main">
                    <div className="workflow-editor-canvas-shell">
                      <WorkflowFlowCanvas
                        definition={definitionDraft}
                        nodeTypes={nodeTypes}
                        selectedNodeId={selectedNodeId}
                        selectedTriggerId={selectedTriggerId}
                        activePaletteNodeType={paletteNodeType}
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
                            setDocsNodeTypeKey(node.type);
                            setDocsOpen(true);
                            setActivePanel("docs");
                          }
                        }}
                        onViewTriggerDocs={(triggerId) => {
                          setSelectedTriggerId(triggerId);
                          setSelectedNodeId("");
                          setDocsNodeTypeKey("");
                          setDocsOpen(true);
                          setActivePanel("docs");
                        }}
                        onInsertNode={handleInsertNode}
                        onAddBranch={handleAddBranch}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {docsOpen ? (
                <aside
                  className={`workflow-editor-docs-drawer ${activePanel === "docs" ? "is-active" : ""}`}
                >
                  <div className="workflow-editor-docs-drawer__header">
                    <div>
                      <div className="workflow-editor-surface-eyebrow">Docs</div>
                      <h3 className="workflow-editor-surface-title">
                        {docsNodeType?.label ?? docsModel?.title ?? "Documentation"}
                      </h3>
                    </div>
                    <SolidButton
                      size="small"
                      variant="ghost"
                      onClick={() => setDocsOpen(false)}
                    >
                      <X size={16} />
                    </SolidButton>
                  </div>
                  <div className="workflow-editor-docs-drawer__body">
                    {docsNodeType || docsModel ? (
                      <WorkflowNodeDocsPanel
                        nodeType={docsNodeType}
                        docsModel={docsModel}
                      />
                    ) : (
                      <div className="workflow-editor-empty-state">
                        Pick a node, trigger, or workflow surface to open its documentation.
                      </div>
                    )}
                  </div>
                </aside>
              ) : null}
            </section>
          </div>
        </>
      ) : null}

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
