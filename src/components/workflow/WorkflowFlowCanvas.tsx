import React from "react";
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  type EdgeProps,
  type Edge,
  Handle,
  MarkerType,
  type Node,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { BookOpen, CircleHelp, Pencil, Plus, Trash2 } from "lucide-react";
import type {
  WorkflowNodeChildSlotDefinition,
  WorkflowNodeMetadataResponse,
} from "../../types/workflow-node";
import { normalizeSolidIconName, SolidButton, SolidIcon, SolidTag } from "../shad-cn-ui";
import "@xyflow/react/dist/style.css";
import "./WorkflowFlowCanvas.css";

type WorkflowNodeRecord = Record<string, any>;
type WorkflowTriggerRecord = Record<string, any>;
type WorkflowSequenceSlotKey = "tasks" | "then" | "else" | "defaults";

type WorkflowInsertScope =
  | { scope: "root" }
  | {
      scope: "slot";
      parentNodeId: string;
      slotKey: WorkflowSequenceSlotKey;
    }
  | {
      scope: "case";
      parentNodeId: string;
      caseKey: string;
    };

export type WorkflowInsertTarget =
  | {
      scope: "root";
      index: number;
    }
  | {
      scope: "slot";
      parentNodeId: string;
      slotKey: WorkflowSequenceSlotKey;
      index: number;
    }
  | {
      scope: "case";
      parentNodeId: string;
      caseKey: string;
      index: number;
    };

type WorkflowCanvasNodeData =
  | {
      kind: "group";
      label: string;
      tone?: "control" | "loop" | "trigger";
      workflowNode?: WorkflowNodeRecord;
      nodeType?: WorkflowNodeMetadataResponse;
      onViewDocs?: (nodeId: string) => void;
    }
  | {
      kind: "workflow-node";
      workflowNode: WorkflowNodeRecord;
      nodeType?: WorkflowNodeMetadataResponse;
      selected?: boolean;
      onSelectNode: (nodeId: string) => void;
      onEditNode: (nodeId: string) => void;
      onDeleteNode: (nodeId: string) => void;
      onViewDocs: (nodeId: string) => void;
    }
  | {
      kind: "workflow-trigger";
      trigger: WorkflowTriggerRecord;
      selected?: boolean;
      onSelectTrigger: (triggerId: string) => void;
      onViewDocs: (triggerId: string) => void;
    }
  | {
      kind: "insert";
      enabled?: boolean;
      selectedTypeLabel?: string;
      onInsert: () => void;
    }
  | {
      kind: "junction";
    }
  | {
      kind: "section-label";
      label: string;
    };

type WorkflowFlowCanvasProps = {
  definition: { nodes: WorkflowNodeRecord[]; triggers?: WorkflowTriggerRecord[] };
  nodeTypes: WorkflowNodeMetadataResponse[];
  selectedNodeId?: string;
  selectedTriggerId?: string;
  activePaletteNodeType?: WorkflowNodeMetadataResponse;
  onSelectNode: (nodeId: string) => void;
  onSelectTrigger: (triggerId: string) => void;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onViewDocs: (nodeId: string) => void;
  onViewTriggerDocs: (triggerId: string) => void;
  onInsertNode: (target: WorkflowInsertTarget) => void;
};

const DIMENSIONS = {
  workflowWidth: 248,
  workflowHeight: 118,
  triggerWidth: 248,
  triggerHeight: 108,
  insertWidth: 40,
  insertHeight: 40,
  junctionWidth: 8,
  junctionHeight: 8,
  sectionLabelWidth: 104,
  sectionLabelHeight: 28,
  groupPaddingX: 36,
  groupPaddingTop: 58,
  groupPaddingBottom: 36,
  loopGroupPaddingX: 70,
  loopGroupPaddingTop: 62,
  loopGroupPaddingBottom: 44,
  sequenceInsertToNodeGap: 88,
  sequenceNodeToInsertGap: 48,
  controlNodeToChildGap: 78,
  controlBranchLabelGap: 42,
  controlBranchGap: 120,
  controlJoinGap: 92,
  groupExteriorEdgeGap: 44,
};

type WorkflowLayoutResult = {
  entryIds: string[];
  exitIds: string[];
  endY: number;
  width: number;
};

type GraphBuildContext = {
  backgroundNodes: Node<WorkflowCanvasNodeData>[];
  nodes: Node<WorkflowCanvasNodeData>[];
  edges: Edge[];
  nodeTypeMap: Map<string, WorkflowNodeMetadataResponse>;
  activePaletteNodeType?: WorkflowNodeMetadataResponse;
  selectedNodeId?: string;
  selectedTriggerId?: string;
  onSelectNode: (nodeId: string) => void;
  onSelectTrigger: (triggerId: string) => void;
  onEditNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onViewDocs: (nodeId: string) => void;
  onViewTriggerDocs: (triggerId: string) => void;
  onInsertNode: (target: WorkflowInsertTarget) => void;
};

function normalizeChildSlots(
  node: WorkflowNodeRecord,
  nodeType?: WorkflowNodeMetadataResponse,
): WorkflowNodeChildSlotDefinition[] {
  if (nodeType?.authoring?.childSlots?.length) {
    return nodeType.authoring.childSlots;
  }

  const slots: WorkflowNodeChildSlotDefinition[] = [];
  if (node.cases && typeof node.cases === "object" && !Array.isArray(node.cases)) {
    slots.push({ key: "cases", label: "Cases", kind: "case-collection" });
    if (Array.isArray(node.defaults)) {
      slots.push({ key: "defaults", label: "Default", kind: "sequence" });
    }
  } else if (Array.isArray(node.then) || Array.isArray(node.else)) {
    slots.push({ key: "then", label: "Then", kind: "sequence" });
    slots.push({ key: "else", label: "Else", kind: "sequence" });
  } else if (Array.isArray(node.tasks)) {
    slots.push({ key: "tasks", label: "Tasks", kind: "sequence" });
  }

  return slots;
}

function isLoopNode(
  workflowNode: WorkflowNodeRecord,
  nodeType?: WorkflowNodeMetadataResponse,
) {
  const nodeTypeId = String(workflowNode.type ?? nodeType?.type ?? "").toLowerCase();
  const category = String(nodeType?.category ?? "").toLowerCase();
  const nodeTypeTags = nodeType?.tags;
  const tags = Array.isArray(nodeTypeTags)
    ? nodeTypeTags.map((tag) => String(tag).toLowerCase())
    : [];

  return (
    nodeTypeId === "foreach" ||
    nodeTypeId === "for.each" ||
    nodeTypeId === "loopuntil" ||
    nodeTypeId === "loop.until" ||
    category.includes("loop") ||
    tags.includes("loop") ||
    tags.includes("iteration")
  );
}

function getSequenceSlotNodes(
  workflowNode: WorkflowNodeRecord,
  slotKey: string,
): WorkflowNodeRecord[] {
  if (Array.isArray(workflowNode[slotKey])) {
    return workflowNode[slotKey];
  }

  if (slotKey === "tasks") {
    return [];
  }

  return [];
}

function getSwitchCaseEntries(
  workflowNode: WorkflowNodeRecord,
): Array<{ key: string; label: string; nodes: WorkflowNodeRecord[]; scope: WorkflowInsertScope }> {
  const cases =
    workflowNode.cases &&
    typeof workflowNode.cases === "object" &&
    !Array.isArray(workflowNode.cases)
      ? workflowNode.cases
      : {};

  const entries: Array<{
    key: string;
    label: string;
    nodes: WorkflowNodeRecord[];
    scope: WorkflowInsertScope;
  }> = Object.entries(cases).map(([caseKey, nodes]) => ({
    key: `case-${caseKey}`,
    label: caseKey,
    nodes: Array.isArray(nodes) ? nodes : [],
    scope: {
      scope: "case" as const,
      parentNodeId: String(workflowNode.id),
      caseKey,
    },
  }));

  if (Array.isArray(workflowNode.defaults)) {
    entries.push({
      key: "default",
      label: "Default",
      nodes: workflowNode.defaults,
      scope: {
        scope: "slot" as const,
        parentNodeId: String(workflowNode.id),
        slotKey: "defaults" as const,
      },
    });
  }

  return entries;
}

function getNodeRect(node: Node<WorkflowCanvasNodeData>) {
  let width = Number(node.style?.width ?? 0);
  let height = Number(node.style?.height ?? 0);

  if (node.type === "workflow") {
    width = DIMENSIONS.workflowWidth;
    height = DIMENSIONS.workflowHeight;
  } else if (node.type === "trigger") {
    width = DIMENSIONS.triggerWidth;
    height = DIMENSIONS.triggerHeight;
  } else if (node.type === "insert") {
    width = DIMENSIONS.insertWidth;
    height = DIMENSIONS.insertHeight;
  } else if (node.type === "junction") {
    width = DIMENSIONS.junctionWidth;
    height = DIMENSIONS.junctionHeight;
  } else if (node.type === "sectionLabel") {
    width = DIMENSIONS.sectionLabelWidth;
    height = DIMENSIONS.sectionLabelHeight;
  }

  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + width,
    bottom: node.position.y + height,
  };
}

function createEdge(
  source: string,
  target: string,
  options: {
    marker?: boolean;
    kind?: "default" | "merge" | "split";
    busY?: number;
    splitMode?: "fromJunction";
  } = {},
): Edge {
  const edgeKind = options.kind ?? (options.marker === false ? "merge" : "default");
  const data =
    options.busY == null && options.splitMode == null
      ? undefined
      : {
          busY: options.busY,
          splitMode: options.splitMode,
        };

  return {
    id: `${source}->${target}`,
    source,
    target,
    type:
      edgeKind === "merge"
        ? "workflowMerge"
        : edgeKind === "split"
          ? "workflowSplit"
          : "smoothstep",
    data,
    markerEnd:
      options.marker === false
        ? undefined
        : {
            type: MarkerType.ArrowClosed,
            width: 12,
            height: 12,
            color: "rgba(203, 213, 225, 0.94)",
          },
    style: {
      stroke: "rgba(203, 213, 225, 0.94)",
      strokeWidth: 2,
      strokeDasharray: "6 7",
    },
    animated: true,
    zIndex: 1,
  };
}

function WorkflowMergeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  const mergeY = targetY;
  const path = `M ${sourceX} ${sourceY} V ${mergeY} H ${targetX}`;

  return (
    <BaseEdge
      id={id}
      path={path}
      style={style}
      interactionWidth={18}
    />
  );
}

function WorkflowSplitEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  if (data?.splitMode === "fromJunction") {
    const path = `M ${sourceX} ${sourceY} H ${targetX} V ${targetY}`;

    return (
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={style}
        interactionWidth={18}
      />
    );
  }

  const requestedBusY =
    typeof data?.busY === "number"
      ? data.busY
      : sourceY + Math.max(24, (targetY - sourceY) * 0.42);
  const minBusY = Math.min(sourceY, targetY) + 12;
  const maxBusY = Math.max(sourceY, targetY) - 12;
  const busY =
    maxBusY > minBusY
      ? Math.min(maxBusY, Math.max(minBusY, requestedBusY))
      : (sourceY + targetY) / 2;
  const path = `M ${sourceX} ${sourceY} V ${busY} H ${targetX} V ${targetY}`;

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={style}
      interactionWidth={18}
    />
  );
}

function resolveWorkflowNodeIcon(nodeType?: WorkflowNodeMetadataResponse) {
  return normalizeSolidIconName(nodeType?.ui?.icon ?? nodeType?.icon) ?? "si-th-large";
}

function estimateSequenceWidth(
  sequence: WorkflowNodeRecord[],
  nodeTypeMap: Map<string, WorkflowNodeMetadataResponse>,
): number {
  if (!sequence.length) {
    return DIMENSIONS.insertWidth;
  }

  return sequence.reduce((maxWidth, workflowNode) => {
    const nodeType = nodeTypeMap.get(String(workflowNode.type));
    const nodeWidth = estimateWorkflowNodeWidth(workflowNode, nodeTypeMap, nodeType);
    return Math.max(maxWidth, nodeWidth);
  }, DIMENSIONS.workflowWidth);
}

function estimateWorkflowNodeWidth(
  workflowNode: WorkflowNodeRecord,
  nodeTypeMap: Map<string, WorkflowNodeMetadataResponse>,
  nodeType?: WorkflowNodeMetadataResponse,
): number {
  const slotDefinitions = normalizeChildSlots(workflowNode, nodeType);

  const branchSlots = slotDefinitions.filter(
    (slot) => slot.key === "then" || slot.key === "else",
  );
  if (branchSlots.length >= 2) {
    const branchGap = DIMENSIONS.controlBranchGap;
    const branchWidths = branchSlots.map((slot) =>
      estimateSequenceWidth(
        Array.isArray(workflowNode[slot.key]) ? workflowNode[slot.key] : [],
        nodeTypeMap,
      ),
    );
    const totalBranchWidth =
      branchWidths.reduce((sum, width) => sum + width, 0) +
      branchGap * Math.max(branchWidths.length - 1, 0);
    return Math.max(DIMENSIONS.workflowWidth, totalBranchWidth);
  }

  if (slotDefinitions.some((slot) => slot.kind === "case-collection")) {
    const caseEntries = getSwitchCaseEntries(workflowNode);
    const branchGap = DIMENSIONS.controlBranchGap;
    const branchWidths = caseEntries.map((entry) =>
      estimateSequenceWidth(entry.nodes, nodeTypeMap),
    );
    const totalBranchWidth =
      branchWidths.reduce((sum, width) => sum + width, 0) +
      branchGap * Math.max(branchWidths.length - 1, 0);
    return Math.max(DIMENSIONS.workflowWidth, totalBranchWidth);
  }

  if (slotDefinitions.length === 1 && slotDefinitions[0].kind === "sequence") {
    const slot = slotDefinitions[0];
    const slotKey = slot.key as WorkflowSequenceSlotKey;
    const childNodes = getSequenceSlotNodes(workflowNode, slotKey);
    if (slot.layout === "parallel") {
      const childWidths = childNodes.map((childNode: WorkflowNodeRecord) =>
        estimateWorkflowNodeWidth(
          childNode,
          nodeTypeMap,
          nodeTypeMap.get(String(childNode.type)),
        ),
      );
      const totalChildWidth =
        childWidths.reduce((sum, width) => sum + width, 0) +
        DIMENSIONS.controlBranchGap * Math.max(childWidths.length - 1, 0);
      return Math.max(DIMENSIONS.workflowWidth, totalChildWidth);
    }

    return Math.max(
      DIMENSIONS.workflowWidth,
      estimateSequenceWidth(childNodes, nodeTypeMap),
    );
  }

  return DIMENSIONS.workflowWidth;
}

function WorkflowCanvasNodeRenderer({ data }: { data: WorkflowCanvasNodeData }) {
  if (data.kind === "group") {
    return (
      <div
        className={`workflow-flow-group-node workflow-flow-group-node--${data.tone ?? "control"}`}
      >
        <div className="workflow-flow-group-node__header">
          <span>{data.label}</span>
          {data.workflowNode ? (
            <button
              type="button"
              className="workflow-flow-help-button nodrag nopan nowheel"
              aria-label={`Open ${data.nodeType?.label ?? data.label} documentation`}
              title="Documentation"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                data.onViewDocs?.(String(data.workflowNode?.id));
              }}
            >
              <CircleHelp size={12} />
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (data.kind === "insert") {
    return (
      <div className="workflow-flow-insert-node">
        <button
          type="button"
          onClick={data.onInsert}
          className="workflow-flow-insert-node__button"
          aria-label={
            data.enabled
              ? `Add ${data.selectedTypeLabel ?? "node"}`
              : "Pick a node type to insert"
          }
          title={
            data.enabled
              ? `Add ${data.selectedTypeLabel ?? "node"}`
              : "Pick a node type to insert"
          }
        >
          <Plus size={16} />
        </button>
        <Handle
          type="target"
          position={Position.Top}
          className="workflow-flow-insert-node__handle workflow-flow-insert-node__handle--top"
          isConnectable={false}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="workflow-flow-insert-node__handle workflow-flow-insert-node__handle--bottom"
          isConnectable={false}
        />
      </div>
    );
  }

  if (data.kind === "junction") {
    return (
      <div className="workflow-flow-junction-node">
        <Handle
          type="target"
          position={Position.Top}
          className="workflow-flow-junction-node__handle workflow-flow-junction-node__handle--top"
          isConnectable={false}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="workflow-flow-junction-node__handle workflow-flow-junction-node__handle--bottom"
          isConnectable={false}
        />
      </div>
    );
  }

  if (data.kind === "section-label") {
    return <div className="workflow-flow-section-label">{data.label}</div>;
  }

  if (data.kind === "workflow-trigger") {
    const triggerTitle = data.trigger.name ?? data.trigger.label ?? data.trigger.id;

    return (
      <div
        className={`workflow-flow-node-card workflow-flow-node-card--trigger ${data.selected ? "is-selected" : ""}`}
        onClick={() => data.onSelectTrigger(String(data.trigger.id))}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            data.onSelectTrigger(String(data.trigger.id));
          }
        }}
      >
        <div className="workflow-flow-node-card__header">
          <div className="workflow-flow-node-card__header-main">
            <div className="workflow-flow-node-card__icon-shell">
              <SolidIcon name="si-calendar" size={16} aria-hidden />
            </div>
            <div>
              <div className="workflow-flow-node-card__title">
                {triggerTitle}
              </div>
              <div className="workflow-flow-node-card__subtitle">
                {data.trigger.type ?? "Trigger"}
              </div>
            </div>
          </div>
          <div className="workflow-flow-node-card__tags">
            {data.trigger.disabled ? <SolidTag tone="warn">disabled</SolidTag> : <SolidTag>trigger</SolidTag>}
          </div>
        </div>
        {data.trigger.description ? (
          <div className="workflow-flow-node-card__description">
            {data.trigger.description}
          </div>
        ) : null}
        <div className="workflow-flow-node-card__actions">
          <SolidButton
            size="small"
            variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              data.onViewDocs(String(data.trigger.id));
            }}
          >
            <BookOpen size={14} />
          </SolidButton>
        </div>
        <Handle
          type="target"
          position={Position.Top}
          className="workflow-flow-node-card__handle workflow-flow-node-card__handle--top"
          isConnectable={false}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          className="workflow-flow-node-card__handle workflow-flow-node-card__handle--bottom"
          isConnectable={false}
        />
      </div>
    );
  }

  const { workflowNode, nodeType, selected } = data;
  const iconName = resolveWorkflowNodeIcon(nodeType);
  const nodeTitle = workflowNode.name ?? workflowNode.id;
  const nodeTypeLabel = nodeType?.label ?? workflowNode.type ?? workflowNode.kind ?? "node";

  return (
    <div
      className={`workflow-flow-node-card ${selected ? "is-selected" : ""}`}
      onClick={() => data.onSelectNode(String(workflowNode.id))}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          data.onSelectNode(String(workflowNode.id));
        }
      }}
    >
      <div className="workflow-flow-node-card__typebar">
        <span>{nodeTypeLabel}</span>
        <span className="workflow-flow-node-card__quick-actions">
          <button
            type="button"
            className="workflow-flow-icon-button nodrag nopan nowheel"
            aria-label={`Edit ${nodeTitle}`}
            title="Edit"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              data.onEditNode(String(workflowNode.id));
            }}
          >
            <Pencil size={12} />
          </button>
          <button
            type="button"
            className="workflow-flow-icon-button workflow-flow-icon-button--danger nodrag nopan nowheel"
            aria-label={`Delete ${nodeTitle}`}
            title="Delete"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              data.onDeleteNode(String(workflowNode.id));
            }}
          >
            <Trash2 size={12} />
          </button>
          <button
            type="button"
            className="workflow-flow-icon-button nodrag nopan nowheel"
            aria-label={`Open ${nodeTypeLabel} documentation`}
            title="Documentation"
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              data.onViewDocs(String(workflowNode.id));
            }}
          >
            <CircleHelp size={12} />
          </button>
        </span>
      </div>
      <div className="workflow-flow-node-card__body">
        <div className="workflow-flow-node-card__header-main">
          <div className="workflow-flow-node-card__icon-shell">
            <SolidIcon name={iconName} size={16} aria-hidden />
          </div>
          <div>
            <div className="workflow-flow-node-card__title">
              {nodeTitle}
            </div>
          </div>
        </div>
      </div>

      {workflowNode.description ? (
        <div className="workflow-flow-node-card__description">
          {workflowNode.description}
        </div>
      ) : null}

      <Handle
        type="target"
        position={Position.Top}
        className="workflow-flow-node-card__handle workflow-flow-node-card__handle--top"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="workflow-flow-node-card__handle workflow-flow-node-card__handle--bottom"
        isConnectable={false}
      />
    </div>
  );
}

const canvasNodeTypes: any = {
  group: WorkflowCanvasNodeRenderer,
  workflow: WorkflowCanvasNodeRenderer,
  trigger: WorkflowCanvasNodeRenderer,
  insert: WorkflowCanvasNodeRenderer,
  junction: WorkflowCanvasNodeRenderer,
  sectionLabel: WorkflowCanvasNodeRenderer,
};

const canvasEdgeTypes = {
  workflowMerge: WorkflowMergeEdge,
  workflowSplit: WorkflowSplitEdge,
};

function pushGroupNode(
  ctx: GraphBuildContext,
  id: string,
  label: string,
  tone: "control" | "loop" | "trigger",
  subset: Node<WorkflowCanvasNodeData>[],
  workflowNode?: WorkflowNodeRecord,
  nodeType?: WorkflowNodeMetadataResponse,
) {
  if (!subset.length) {
    return undefined;
  }

  const bounds = subset.reduce(
    (acc, node) => {
      const rect = getNodeRect(node);
      return {
        left: Math.min(acc.left, rect.left),
        top: Math.min(acc.top, rect.top),
        right: Math.max(acc.right, rect.right),
        bottom: Math.max(acc.bottom, rect.bottom),
      };
    },
    {
      left: Number.POSITIVE_INFINITY,
      top: Number.POSITIVE_INFINITY,
      right: Number.NEGATIVE_INFINITY,
      bottom: Number.NEGATIVE_INFINITY,
    },
  );

  const paddingX =
    tone === "loop" ? DIMENSIONS.loopGroupPaddingX : DIMENSIONS.groupPaddingX;
  const paddingTop =
    tone === "loop" ? DIMENSIONS.loopGroupPaddingTop : DIMENSIONS.groupPaddingTop;
  const paddingBottom =
    tone === "loop" ? DIMENSIONS.loopGroupPaddingBottom : DIMENSIONS.groupPaddingBottom;

  const groupTop = bounds.top - paddingTop;
  const groupBottom = bounds.bottom + paddingBottom;

  ctx.backgroundNodes.push({
    id,
    type: "group",
    position: {
      x: bounds.left - paddingX,
      y: groupTop,
    },
    draggable: false,
    selectable: false,
    style: {
      width: bounds.right - bounds.left + paddingX * 2,
      height: bounds.bottom - bounds.top + paddingTop + paddingBottom,
      zIndex: 0,
    },
    data: {
      kind: "group",
      label,
      tone,
      workflowNode,
      nodeType,
      onViewDocs: ctx.onViewDocs,
    },
  });

  return {
    top: groupTop,
    bottom: groupBottom,
  };
}

function pushInsertNode(
  ctx: GraphBuildContext,
  id: string,
  x: number,
  y: number,
  target: WorkflowInsertTarget,
) {
  ctx.nodes.push({
    id,
    type: "insert",
    position: {
      x: x - DIMENSIONS.insertWidth / 2,
      y,
    },
    draggable: false,
    selectable: false,
    style: {
      zIndex: 5,
    },
    data: {
      kind: "insert",
      enabled: !!ctx.activePaletteNodeType,
      selectedTypeLabel: ctx.activePaletteNodeType?.label,
      onInsert: () => ctx.onInsertNode(target),
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });
}

function pushJunctionNode(
  ctx: GraphBuildContext,
  id: string,
  x: number,
  y: number,
) {
  ctx.nodes.push({
    id,
    type: "junction",
    position: {
      x: x - DIMENSIONS.junctionWidth / 2,
      y: y - DIMENSIONS.junctionHeight / 2,
    },
    draggable: false,
    selectable: false,
    style: {
      zIndex: 2,
    },
    data: {
      kind: "junction",
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });
}

function pushWorkflowNode(
  ctx: GraphBuildContext,
  workflowNode: WorkflowNodeRecord,
  x: number,
  y: number,
) {
  const nodeType = ctx.nodeTypeMap.get(String(workflowNode.type));
  ctx.nodes.push({
    id: String(workflowNode.id),
    type: "workflow",
    position: { x, y },
    draggable: false,
    style: {
      zIndex: 4,
    },
    data: {
      kind: "workflow-node",
      workflowNode,
      nodeType,
      selected: ctx.selectedNodeId === String(workflowNode.id),
      onSelectNode: ctx.onSelectNode,
      onEditNode: ctx.onEditNode,
      onDeleteNode: ctx.onDeleteNode,
      onViewDocs: ctx.onViewDocs,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  });
}

function pushTriggerNode(
  ctx: GraphBuildContext,
  trigger: WorkflowTriggerRecord,
  x: number,
  y: number,
) {
  ctx.nodes.push({
    id: `trigger-${String(trigger.id)}`,
    type: "trigger",
    position: { x, y },
    draggable: false,
    selectable: false,
    style: {
      zIndex: 4,
    },
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {
      kind: "workflow-trigger",
      trigger,
      selected: ctx.selectedTriggerId === String(trigger.id),
      onSelectTrigger: ctx.onSelectTrigger,
      onViewDocs: ctx.onViewTriggerDocs,
    },
  });
}

function pushSectionLabelNode(
  ctx: GraphBuildContext,
  id: string,
  x: number,
  y: number,
  label: string,
) {
  ctx.nodes.push({
    id,
    type: "sectionLabel",
    position: { x, y },
    draggable: false,
    selectable: false,
    style: {
      zIndex: 5,
    },
    data: {
      kind: "section-label",
      label,
    },
  });
}

function buildSequenceGraph(
  sequence: WorkflowNodeRecord[],
  ctx: GraphBuildContext,
  laneX: number,
  startY: number,
  scope: WorkflowInsertScope,
  options: {
    idSuffix?: string;
    indexOffset?: number;
    boundaryInserts?: boolean;
  } = {},
): WorkflowLayoutResult {
  let cursorY = startY;
  let maxWidth = DIMENSIONS.workflowWidth;
  const indexOffset = options.indexOffset ?? 0;
  const idSuffix = options.idSuffix ? `-${options.idSuffix}` : "";
  const boundaryInserts = options.boundaryInserts ?? true;

  const entryIds: string[] = [];
  let previousExitIds: string[] = [];

  if (boundaryInserts) {
    const initialInsertId = `insert-${JSON.stringify(scope)}-${indexOffset}${idSuffix}`;
    pushInsertNode(ctx, initialInsertId, laneX, cursorY, {
      ...scope,
      index: indexOffset,
    } as WorkflowInsertTarget);
    entryIds.push(initialInsertId);
    previousExitIds = [initialInsertId];
  }

  for (let index = 0; index < sequence.length; index += 1) {
    const workflowNode = sequence[index];
    const nodeType = ctx.nodeTypeMap.get(String(workflowNode.type));
    const slotDefinitions = normalizeChildSlots(workflowNode, nodeType);
    const isControlNode = nodeType?.kind === "control" || slotDefinitions.length > 0;
    const estimatedNodeWidth = estimateWorkflowNodeWidth(
      workflowNode,
      ctx.nodeTypeMap,
      nodeType,
    );
    maxWidth = Math.max(maxWidth, estimatedNodeWidth);
    const subtreeStartIndex = ctx.nodes.length;
    const groupTone = isLoopNode(workflowNode, nodeType) ? "loop" : "control";
    const controlTopPadding =
      groupTone === "loop" ? DIMENSIONS.loopGroupPaddingTop : DIMENSIONS.groupPaddingTop;
    const nodeGap = isControlNode
      ? controlTopPadding + DIMENSIONS.insertHeight + DIMENSIONS.groupExteriorEdgeGap
      : DIMENSIONS.sequenceInsertToNodeGap;

    cursorY += nodeGap;
    pushWorkflowNode(
      ctx,
      workflowNode,
      laneX - DIMENSIONS.workflowWidth / 2,
      cursorY,
    );
    if (!entryIds.length) {
      entryIds.push(String(workflowNode.id));
    }
    previousExitIds.forEach((sourceId) => {
      ctx.edges.push(createEdge(sourceId, String(workflowNode.id)));
    });

    let deepestY = cursorY;
    const childStartY =
      cursorY + DIMENSIONS.workflowHeight + DIMENSIONS.controlNodeToChildGap;
    let exitIds: string[] = [String(workflowNode.id)];
    let usesMergeJunction = false;

    const branchSlots = slotDefinitions.filter(
      (slot) => slot.key === "then" || slot.key === "else",
    );
    const caseEntries = slotDefinitions.some((slot) => slot.kind === "case-collection")
      ? getSwitchCaseEntries(workflowNode)
      : [];

    if (caseEntries.length > 0) {
      const branchGap = DIMENSIONS.controlBranchGap;
      const branchWidths = caseEntries.map((entry) =>
        estimateSequenceWidth(entry.nodes, ctx.nodeTypeMap),
      );
      const totalBranchWidth =
        branchWidths.reduce((sum, width) => sum + width, 0) +
        branchGap * Math.max(branchWidths.length - 1, 0);
      const branchStartX = laneX - totalBranchWidth / 2;
      const branchLayouts = caseEntries.map((entry, branchIndex) => {
        const beforeWidth = branchWidths
          .slice(0, branchIndex)
          .reduce((sum, width) => sum + width, 0);
        const branchLaneX =
          branchStartX +
          beforeWidth +
          branchGap * branchIndex +
          branchWidths[branchIndex] / 2;
        const labelX = branchLaneX - DIMENSIONS.sectionLabelWidth / 2;
        const labelY = childStartY - DIMENSIONS.controlBranchLabelGap;
        pushSectionLabelNode(
          ctx,
          `${workflowNode.id}-${entry.key}-label`,
          labelX,
          labelY,
          entry.label,
        );
        const childLayout = buildSequenceGraph(
          entry.nodes,
          ctx,
          branchLaneX,
          childStartY,
          entry.scope,
        );
        childLayout.entryIds.forEach((entryId) => {
          ctx.edges.push(createEdge(String(workflowNode.id), entryId));
        });
        deepestY = Math.max(deepestY, childLayout.endY);
        maxWidth = Math.max(maxWidth, childLayout.width);
        return childLayout;
      });

      const branchExitIds = branchLayouts.flatMap((layout) => layout.exitIds);
      exitIds = branchExitIds.length ? branchExitIds : [String(workflowNode.id)];
    } else if (branchSlots.length >= 2) {
      const branchGap = DIMENSIONS.controlBranchGap;
      const branchWidths = branchSlots.map((slot) =>
        estimateSequenceWidth(
          Array.isArray(workflowNode[slot.key]) ? workflowNode[slot.key] : [],
          ctx.nodeTypeMap,
        ),
      );
      const totalBranchWidth =
        branchWidths.reduce((sum, width) => sum + width, 0) +
        branchGap * Math.max(branchWidths.length - 1, 0);
      const branchStartX = laneX - totalBranchWidth / 2;
      const branchLayouts = branchSlots.map((slot, branchIndex) => {
        const slotKey = slot.key as "then" | "else";
        const childNodes = Array.isArray(workflowNode[slotKey]) ? workflowNode[slotKey] : [];
        const beforeWidth = branchWidths
          .slice(0, branchIndex)
          .reduce((sum, width) => sum + width, 0);
        const branchLaneX =
          branchStartX +
          beforeWidth +
          branchGap * branchIndex +
          branchWidths[branchIndex] / 2;
        const labelX = branchLaneX - DIMENSIONS.sectionLabelWidth / 2;
        const labelY = childStartY - DIMENSIONS.controlBranchLabelGap;
        pushSectionLabelNode(
          ctx,
          `${workflowNode.id}-${slotKey}-label`,
          labelX,
          labelY,
          slot.label ?? slotKey,
        );
        const childLayout = buildSequenceGraph(
          childNodes,
          ctx,
          branchLaneX,
          childStartY,
          {
            scope: "slot",
            parentNodeId: String(workflowNode.id),
            slotKey,
          },
        );
        childLayout.entryIds.forEach((entryId) => {
          ctx.edges.push(createEdge(String(workflowNode.id), entryId));
        });
        deepestY = Math.max(deepestY, childLayout.endY);
        maxWidth = Math.max(maxWidth, childLayout.width);
        return childLayout;
      });

      const branchExitIds = branchLayouts.flatMap((layout) => layout.exitIds);
      exitIds = branchExitIds.length ? branchExitIds : [String(workflowNode.id)];
    } else if (slotDefinitions.length === 1 && slotDefinitions[0].kind === "sequence") {
      const slot = slotDefinitions[0];
      const slotKey = slot.key as WorkflowSequenceSlotKey;
      const childNodes = getSequenceSlotNodes(workflowNode, slotKey);
      if (slot.label && slotKey !== "tasks") {
        pushSectionLabelNode(
          ctx,
          `${workflowNode.id}-${slotKey}-label`,
          laneX - DIMENSIONS.sectionLabelWidth / 2,
          childStartY - DIMENSIONS.controlBranchLabelGap,
          slot.label,
        );
      }
      if (slot.layout === "parallel") {
        const childWidths = childNodes.map((childNode: WorkflowNodeRecord) =>
          estimateWorkflowNodeWidth(
            childNode,
            ctx.nodeTypeMap,
            ctx.nodeTypeMap.get(String(childNode.type)),
          ),
        );
        const totalChildWidth =
          childWidths.reduce((sum, width) => sum + width, 0) +
          DIMENSIONS.controlBranchGap * Math.max(childWidths.length - 1, 0);
        const childStartX = laneX - totalChildWidth / 2;
        const collectionInsertId = `insert-${JSON.stringify({
          scope: "slot",
          parentNodeId: String(workflowNode.id),
          slotKey,
        })}-${childNodes.length}-${workflowNode.id}-${slotKey}-collection`;
        const collectionInsertY =
          cursorY +
          DIMENSIONS.workflowHeight +
          Math.round(DIMENSIONS.controlNodeToChildGap * 0.22);
        pushInsertNode(
          ctx,
          collectionInsertId,
          laneX,
          collectionInsertY,
          {
            scope: "slot",
            parentNodeId: String(workflowNode.id),
            slotKey,
            index: childNodes.length,
          },
        );
        maxWidth = Math.max(maxWidth, totalChildWidth);
        const splitJunctionY =
          cursorY +
          DIMENSIONS.workflowHeight +
          Math.round(DIMENSIONS.controlNodeToChildGap * 0.78);
        const splitJunctionId = `${workflowNode.id}-${slotKey}-split`;
        if (childNodes.length > 1) {
          pushJunctionNode(ctx, splitJunctionId, laneX, splitJunctionY);
          ctx.edges.push(createEdge(String(workflowNode.id), collectionInsertId));
          ctx.edges.push(createEdge(collectionInsertId, splitJunctionId, { marker: false }));
          deepestY = Math.max(deepestY, splitJunctionY);
        } else if (childNodes.length === 0) {
          ctx.edges.push(createEdge(String(workflowNode.id), collectionInsertId));
          exitIds = [collectionInsertId];
          deepestY = Math.max(deepestY, collectionInsertY + DIMENSIONS.insertHeight);
        }
        const childLayouts = childNodes.map((childNode: WorkflowNodeRecord, childIndex: number) => {
          const beforeWidth = childWidths
            .slice(0, childIndex)
            .reduce((sum, width) => sum + width, 0);
          const childLaneX =
            childStartX +
            beforeWidth +
            DIMENSIONS.controlBranchGap * childIndex +
            childWidths[childIndex] / 2;
          const childLayout = buildSequenceGraph(
            [childNode],
            ctx,
            childLaneX,
            childStartY,
            {
              scope: "slot",
              parentNodeId: String(workflowNode.id),
              slotKey,
            },
            {
              idSuffix: `${workflowNode.id}-${slotKey}-${childIndex}`,
              indexOffset: childIndex,
              boundaryInserts: false,
            },
          );
          childLayout.entryIds.forEach((entryId) => {
            if (childNodes.length > 1) {
              ctx.edges.push(
                createEdge(splitJunctionId, entryId, {
                  kind: "split",
                  splitMode: "fromJunction",
                }),
              );
              return;
            }

            ctx.edges.push(createEdge(String(workflowNode.id), collectionInsertId));
            ctx.edges.push(createEdge(collectionInsertId, entryId));
          });
          deepestY = Math.max(deepestY, childLayout.endY);
          maxWidth = Math.max(maxWidth, childLayout.width);
          return childLayout;
        });
        const childExitIds = childLayouts.flatMap((layout: WorkflowLayoutResult) => layout.exitIds);
        exitIds = childExitIds.length ? childExitIds : exitIds;
      } else {
        const childLayout = buildSequenceGraph(
          childNodes,
          ctx,
          laneX,
          childStartY,
          {
            scope: "slot",
            parentNodeId: String(workflowNode.id),
            slotKey,
          },
        );
        childLayout.entryIds.forEach((entryId) => {
          ctx.edges.push(createEdge(String(workflowNode.id), entryId));
        });
        deepestY = Math.max(deepestY, childLayout.endY);
        maxWidth = Math.max(maxWidth, childLayout.width);
        exitIds = childLayout.exitIds.length ? childLayout.exitIds : [String(workflowNode.id)];
      }
    }

    if (isControlNode && exitIds.length > 1) {
      const junctionY = Math.max(
        cursorY + DIMENSIONS.workflowHeight + DIMENSIONS.sequenceNodeToInsertGap,
        deepestY + DIMENSIONS.controlJoinGap,
      );
      const junctionId = `junction-${String(workflowNode.id)}`;
      pushJunctionNode(ctx, junctionId, laneX, junctionY);
      exitIds.forEach((sourceId) => {
        ctx.edges.push(createEdge(sourceId, junctionId, { marker: false }));
      });
      exitIds = [junctionId];
      deepestY = Math.max(deepestY, junctionY);
      usesMergeJunction = true;
    }

    const groupBounds = isControlNode
      ? pushGroupNode(
        ctx,
        `group-${String(workflowNode.id)}`,
        workflowNode.name ?? workflowNode.id,
        groupTone,
        ctx.nodes.slice(subtreeStartIndex),
        workflowNode,
        nodeType,
      )
      : undefined;

    const nextInsertY = usesMergeJunction
      ? deepestY + DIMENSIONS.sequenceNodeToInsertGap
      : deepestY + (isControlNode ? DIMENSIONS.sequenceNodeToInsertGap : 0);
    const afterGroupInsertY =
      groupBounds == null
        ? nextInsertY
        : groupBounds.bottom + DIMENSIONS.groupExteriorEdgeGap;
    cursorY = Math.max(
      cursorY + DIMENSIONS.workflowHeight + DIMENSIONS.sequenceNodeToInsertGap,
      afterGroupInsertY,
    );
    if (boundaryInserts) {
      const afterInsertIndex = indexOffset + index + 1;
      const afterInsertId = `insert-${JSON.stringify(scope)}-${afterInsertIndex}-${workflowNode.id}${idSuffix}`;
      pushInsertNode(ctx, afterInsertId, laneX, cursorY, {
        ...scope,
        index: afterInsertIndex,
      } as WorkflowInsertTarget);
      exitIds.forEach((sourceId) => {
        ctx.edges.push(createEdge(sourceId, afterInsertId));
      });
      previousExitIds = [afterInsertId];
    } else {
      previousExitIds = exitIds;
    }
  }

  return {
    entryIds: entryIds.length ? entryIds : previousExitIds,
    exitIds: previousExitIds,
    endY: cursorY,
    width: maxWidth,
  };
}


function buildGraph(
  definition: { nodes: WorkflowNodeRecord[]; triggers?: WorkflowTriggerRecord[] },
  nodeTypes: WorkflowNodeMetadataResponse[],
  props: Omit<WorkflowFlowCanvasProps, "definition" | "nodeTypes">,
) {
  const ctx: GraphBuildContext = {
    backgroundNodes: [],
    nodes: [],
    edges: [],
    nodeTypeMap: new Map(nodeTypes.map((item) => [item.type, item])),
    activePaletteNodeType: props.activePaletteNodeType,
    selectedNodeId: props.selectedNodeId,
    selectedTriggerId: props.selectedTriggerId,
    onSelectNode: props.onSelectNode,
    onSelectTrigger: props.onSelectTrigger,
    onEditNode: props.onEditNode,
    onDeleteNode: props.onDeleteNode,
    onViewDocs: props.onViewDocs,
    onViewTriggerDocs: props.onViewTriggerDocs,
    onInsertNode: props.onInsertNode,
  };

  const triggers = Array.isArray(definition.triggers) ? definition.triggers : [];
  let startY = 0;
  let previousTriggerId: string | null = null;

  if (triggers.length) {
    const triggerStartIndex = ctx.nodes.length;
    let triggerY = 60;
    triggers.forEach((trigger) => {
      const triggerNodeId = `trigger-${String(trigger.id)}`;
      pushTriggerNode(ctx, trigger, 32, triggerY);
      if (previousTriggerId) {
        ctx.edges.push(createEdge(previousTriggerId, triggerNodeId));
      }
      previousTriggerId = triggerNodeId;
      triggerY += 96;
    });
    pushGroupNode(ctx, "group-triggers", "Triggers", "trigger", ctx.nodes.slice(triggerStartIndex));
    startY = triggerY + 2;
  }

  const layout = buildSequenceGraph(
    definition.nodes ?? [],
    ctx,
    80,
    startY,
    { scope: "root" },
  );
  if (previousTriggerId) {
    const triggerSourceId = previousTriggerId;
    layout.entryIds.forEach((entryId) => {
      ctx.edges.push(createEdge(triggerSourceId, entryId));
    });
  }

  return {
    nodes: [...ctx.backgroundNodes, ...ctx.nodes],
    edges: ctx.edges,
  };
}

function WorkflowFlowCanvasInner(props: WorkflowFlowCanvasProps) {
  const graph = React.useMemo(
    () =>
      buildGraph(props.definition, props.nodeTypes, {
        selectedNodeId: props.selectedNodeId,
        selectedTriggerId: props.selectedTriggerId,
        activePaletteNodeType: props.activePaletteNodeType,
        onSelectNode: props.onSelectNode,
        onSelectTrigger: props.onSelectTrigger,
        onEditNode: props.onEditNode,
        onDeleteNode: props.onDeleteNode,
        onViewDocs: props.onViewDocs,
        onViewTriggerDocs: props.onViewTriggerDocs,
        onInsertNode: props.onInsertNode,
      }),
    [
      props.activePaletteNodeType,
      props.definition,
      props.nodeTypes,
      props.onDeleteNode,
      props.onEditNode,
      props.onInsertNode,
      props.onSelectNode,
      props.onSelectTrigger,
      props.onViewDocs,
      props.onViewTriggerDocs,
      props.selectedNodeId,
      props.selectedTriggerId,
    ],
  );

  return (
    <div className="workflow-flow-canvas">
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={canvasNodeTypes}
        edgeTypes={canvasEdgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.16,
          maxZoom: 1.25,
        }}
        minZoom={0.25}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ zIndex: 1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        panOnDrag
        zoomOnDoubleClick={false}
      >
        <Controls showInteractive={false} />
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.45}
          color="rgba(148, 163, 184, 0.34)"
        />
      </ReactFlow>
    </div>
  );
}

export function WorkflowFlowCanvas(props: WorkflowFlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
