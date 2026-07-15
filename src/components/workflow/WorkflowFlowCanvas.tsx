import React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  Handle,
  MarkerType,
  MiniMap,
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

type WorkflowInsertScope =
  | { scope: "root" }
  | {
      scope: "slot";
      parentNodeId: string;
      slotKey: "children" | "nodes" | "then" | "else";
    }
  | {
      scope: "branch";
      parentNodeId: string;
      branchId: string;
    };

export type WorkflowInsertTarget =
  | {
      scope: "root";
      index: number;
    }
  | {
      scope: "slot";
      parentNodeId: string;
      slotKey: "children" | "nodes" | "then" | "else";
      index: number;
    }
  | {
      scope: "branch";
      parentNodeId: string;
      branchId: string;
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
      readOnly?: boolean;
      onSelectNode: (nodeId: string) => void;
      onEditNode: (nodeId: string) => void;
      onDeleteNode: (nodeId: string) => void;
      onViewDocs: (nodeId: string) => void;
    }
  | {
      kind: "workflow-trigger";
      trigger: WorkflowTriggerRecord;
      selected?: boolean;
      readOnly?: boolean;
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
  onAddBranch: (parentNodeId: string) => void;
  readOnly?: boolean;
};

const DIMENSIONS = {
  workflowWidth: 248,
  workflowHeight: 118,
  triggerWidth: 248,
  triggerHeight: 108,
  insertWidth: 160,
  insertHeight: 40,
  sectionLabelWidth: 104,
  sectionLabelHeight: 28,
  groupPaddingX: 28,
  groupPaddingTop: 42,
  groupPaddingBottom: 22,
  loopGroupPaddingX: 70,
  loopGroupPaddingTop: 46,
  loopGroupPaddingBottom: 34,
  controlChildLabelOffsetY: 138,
  controlChildStartOffsetY: 150,
};

type WorkflowLayoutResult = {
  entryId: string;
  exitId: string;
  endY: number;
  width: number;
};

type GraphBuildContext = {
  backgroundNodes: Node<WorkflowCanvasNodeData>[];
  nodes: Node<WorkflowCanvasNodeData>[];
  edges: Edge[];
  nodeTypeMap: Map<string, WorkflowNodeMetadataResponse>;
  readOnly?: boolean;
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
  onAddBranch: (parentNodeId: string) => void;
};

function normalizeChildSlots(
  node: WorkflowNodeRecord,
  nodeType?: WorkflowNodeMetadataResponse,
): WorkflowNodeChildSlotDefinition[] {
  if (nodeType?.authoring?.childSlots?.length) {
    return nodeType.authoring.childSlots;
  }

  const slots: WorkflowNodeChildSlotDefinition[] = [];
  if (Array.isArray(node.then) || Array.isArray(node.else)) {
    slots.push({ key: "then", label: "Then", kind: "sequence" });
    slots.push({ key: "else", label: "Else", kind: "sequence" });
  } else if (Array.isArray(node.branches)) {
    slots.push({ key: "branches", label: "Branches", kind: "branch-collection" });
  } else if (Array.isArray(node.children) || Array.isArray(node.nodes)) {
    slots.push({ key: "children", label: "Children", kind: "sequence" });
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

function getNodeRect(node: Node<WorkflowCanvasNodeData>) {
  const width =
    node.type === "workflow"
      ? DIMENSIONS.workflowWidth
      : node.type === "trigger"
        ? DIMENSIONS.triggerWidth
        : node.type === "insert"
          ? DIMENSIONS.insertWidth
          : node.type === "sectionLabel"
            ? DIMENSIONS.sectionLabelWidth
            : Number(node.style?.width ?? 0);

  const height =
    node.type === "workflow"
      ? DIMENSIONS.workflowHeight
      : node.type === "trigger"
        ? DIMENSIONS.triggerHeight
        : node.type === "insert"
          ? DIMENSIONS.insertHeight
          : node.type === "sectionLabel"
            ? DIMENSIONS.sectionLabelHeight
            : Number(node.style?.height ?? 0);

  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + width,
    bottom: node.position.y + height,
  };
}

function createEdge(source: string, target: string): Edge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
    style: {
      stroke: "rgba(191, 219, 254, 0.88)",
      strokeWidth: 2,
      strokeDasharray: "5 5",
    },
    zIndex: 2,
  };
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
    const branchGap = 60;
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

  if (slotDefinitions.length === 1 && slotDefinitions[0].kind === "sequence") {
    const slotKey = slotDefinitions[0].key as "children" | "nodes" | "then" | "else";
    return Math.max(
      DIMENSIONS.workflowWidth,
      estimateSequenceWidth(
        Array.isArray(workflowNode[slotKey]) ? workflowNode[slotKey] : [],
        nodeTypeMap,
      ),
    );
  }

  if (slotDefinitions.length === 1 && slotDefinitions[0].kind === "branch-collection") {
    const branchGap = 56;
    const branches = Array.isArray(workflowNode.branches) ? workflowNode.branches : [];
    const branchWidths = branches.map((branch: any) =>
      estimateSequenceWidth(Array.isArray(branch.nodes) ? branch.nodes : [], nodeTypeMap),
    );
    const totalBranchWidth =
      branchWidths.reduce((sum, width) => sum + width, 0) +
      branchGap * Math.max(branchWidths.length - 1, 0);
    return Math.max(DIMENSIONS.workflowWidth, totalBranchWidth);
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
        >
          <Plus size={16} />
        </button>
        <div className="workflow-flow-insert-node__label">
          {data.enabled
            ? `Add ${data.selectedTypeLabel ?? "node"}`
            : "Pick a node type to insert"}
        </div>
      </div>
    );
  }

  if (data.kind === "section-label") {
    return <div className="workflow-flow-section-label">{data.label}</div>;
  }

  if (data.kind === "workflow-trigger") {
    const triggerTitle = data.readOnly
      ? String(data.trigger.id)
      : data.trigger.name ?? data.trigger.label ?? data.trigger.id;

    return (
      <div
        className={`workflow-flow-node-card workflow-flow-node-card--trigger ${data.selected ? "is-selected" : ""} ${data.readOnly ? "is-readonly workflow-flow-node-card--readonly-compact" : ""}`}
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
              {!data.readOnly ? (
                <div className="workflow-flow-node-card__subtitle">
                  {data.trigger.type ?? "Trigger"}
                </div>
              ) : null}
            </div>
          </div>
          {!data.readOnly ? (
            <div className="workflow-flow-node-card__tags">
              {data.trigger.disabled ? <SolidTag tone="warn">disabled</SolidTag> : <SolidTag>trigger</SolidTag>}
            </div>
          ) : null}
        </div>
        {!data.readOnly && data.trigger.description ? (
          <div className="workflow-flow-node-card__description">
            {data.trigger.description}
          </div>
        ) : null}
        {!data.readOnly ? (
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

  const { workflowNode, nodeType, selected } = data;
  const iconName = resolveWorkflowNodeIcon(nodeType);
  const nodeTitle = data.readOnly ? String(workflowNode.id) : workflowNode.name ?? workflowNode.id;
  const nodeTypeLabel = nodeType?.label ?? workflowNode.type ?? workflowNode.kind ?? "node";

  return (
    <div
      className={`workflow-flow-node-card ${selected ? "is-selected" : ""} ${data.readOnly ? "is-readonly workflow-flow-node-card--readonly-compact" : ""}`}
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
          {!data.readOnly ? (
            <>
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
            </>
          ) : null}
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

      {!data.readOnly && workflowNode.description ? (
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
  sectionLabel: WorkflowCanvasNodeRenderer,
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
    return;
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

  ctx.backgroundNodes.push({
    id,
    type: "group",
    position: {
      x: bounds.left - paddingX,
      y: bounds.top - paddingTop,
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
    position: { x, y },
    draggable: false,
    selectable: false,
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
    data: {
      kind: "workflow-node",
      workflowNode,
      nodeType,
      selected: ctx.selectedNodeId === String(workflowNode.id),
      readOnly: ctx.readOnly,
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
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    data: {
      kind: "workflow-trigger",
      trigger,
      selected: ctx.selectedTriggerId === String(trigger.id),
      readOnly: ctx.readOnly,
      onSelectTrigger: ctx.onSelectTrigger,
      onViewDocs: ctx.onViewTriggerDocs,
    },
  });
}

type ReadOnlySequenceLayoutResult = {
  entryIds: string[];
  exitIds: string[];
  endY: number;
  width: number;
};

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
): WorkflowLayoutResult {
  let cursorY = startY;
  let previousGraphNodeId: string | null = null;
  let maxWidth = DIMENSIONS.workflowWidth;

  const initialInsertId = `insert-${JSON.stringify(scope)}-0`;
  pushInsertNode(ctx, initialInsertId, laneX, cursorY, {
    ...scope,
    index: 0,
  } as WorkflowInsertTarget);
  previousGraphNodeId = initialInsertId;
  let exitId = initialInsertId;

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

    cursorY += 82;
    pushWorkflowNode(ctx, workflowNode, laneX - 56, cursorY);
    if (previousGraphNodeId) {
      ctx.edges.push(createEdge(previousGraphNodeId, String(workflowNode.id)));
    }

    let deepestY = cursorY;
    let connectionSources: string[] = [String(workflowNode.id)];

    const branchSlots = slotDefinitions.filter(
      (slot) => slot.key === "then" || slot.key === "else",
    );

    if (branchSlots.length >= 2) {
      const branchGap = 60;
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
        const labelX = branchLaneX + 24;
        const labelY = cursorY + 60;
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
          cursorY + 82,
          {
            scope: "slot",
            parentNodeId: String(workflowNode.id),
            slotKey,
          },
        );
        ctx.edges.push(createEdge(String(workflowNode.id), childLayout.entryId));
        deepestY = Math.max(deepestY, childLayout.endY);
        maxWidth = Math.max(maxWidth, childLayout.width);
        return childLayout;
      });

      connectionSources = branchLayouts.map((layout) => layout.exitId);
    } else if (slotDefinitions.length === 1 && slotDefinitions[0].kind === "sequence") {
      const slot = slotDefinitions[0];
      const slotKey = slot.key as "children" | "nodes" | "then" | "else";
      const childNodes = Array.isArray(workflowNode[slotKey]) ? workflowNode[slotKey] : [];
      if (slot.label) {
        const isLoop = isLoopNode(workflowNode, nodeType);
        pushSectionLabelNode(
          ctx,
          `${workflowNode.id}-${slotKey}-label`,
          laneX + 24,
          cursorY + (isLoop ? DIMENSIONS.controlChildLabelOffsetY : 132),
          isLoop ? slot.label ?? "Loop Body" : slot.label,
        );
      }
      const childLayout = buildSequenceGraph(
        childNodes,
        ctx,
        laneX,
        cursorY + DIMENSIONS.controlChildStartOffsetY,
        {
          scope: "slot",
          parentNodeId: String(workflowNode.id),
          slotKey,
        },
      );
      ctx.edges.push(createEdge(String(workflowNode.id), childLayout.entryId));
      deepestY = Math.max(deepestY, childLayout.endY);
      maxWidth = Math.max(maxWidth, childLayout.width);
      connectionSources = [childLayout.exitId];
    } else if (slotDefinitions.length === 1 && slotDefinitions[0].kind === "branch-collection") {
      const branches = Array.isArray(workflowNode.branches) ? workflowNode.branches : [];
      const branchGap = 56;
      const branchWidths = branches.map((branch: any) =>
        estimateSequenceWidth(Array.isArray(branch.nodes) ? branch.nodes : [], ctx.nodeTypeMap),
      );
      const totalBranchWidth =
        branchWidths.reduce((sum, width) => sum + width, 0) +
        branchGap * Math.max(branchWidths.length - 1, 0);
      const branchStartX = laneX - totalBranchWidth / 2;

      const branchLayouts = branches.map((branch: any, branchIndex) => {
        const beforeWidth = branchWidths
          .slice(0, branchIndex)
          .reduce((sum, width) => sum + width, 0);
        const branchLaneX =
          branchStartX +
          beforeWidth +
          branchGap * branchIndex +
          branchWidths[branchIndex] / 2;
        pushSectionLabelNode(
          ctx,
          `${workflowNode.id}-${branch.id}-label`,
          branchLaneX + 24,
          cursorY + 60,
          branch.name ?? branch.id,
        );
        const branchLayout = buildSequenceGraph(
          Array.isArray(branch.nodes) ? branch.nodes : [],
          ctx,
          branchLaneX,
          cursorY + 82,
          {
            scope: "branch",
            parentNodeId: String(workflowNode.id),
            branchId: String(branch.id),
          },
        );
        ctx.edges.push(createEdge(String(workflowNode.id), branchLayout.entryId));
        deepestY = Math.max(deepestY, branchLayout.endY);
        maxWidth = Math.max(maxWidth, branchLayout.width);
        return branchLayout;
      });

      connectionSources = branchLayouts.length
        ? branchLayouts.map((layout) => layout.exitId)
        : [String(workflowNode.id)];
    }

    if (isControlNode) {
      pushGroupNode(
        ctx,
        `group-${String(workflowNode.id)}`,
        workflowNode.name ?? workflowNode.id,
        isLoopNode(workflowNode, nodeType) ? "loop" : "control",
        ctx.nodes.slice(subtreeStartIndex),
        workflowNode,
        nodeType,
      );
    }

    cursorY = Math.max(cursorY + 82, deepestY + (isControlNode ? 40 : 0));
    const afterInsertId = `insert-${JSON.stringify(scope)}-${index + 1}-${workflowNode.id}`;
    pushInsertNode(ctx, afterInsertId, laneX, cursorY, {
      ...scope,
      index: index + 1,
    } as WorkflowInsertTarget);
    connectionSources.forEach((sourceId) => {
      ctx.edges.push(createEdge(sourceId, afterInsertId));
    });
    previousGraphNodeId = afterInsertId;
    exitId = afterInsertId;
  }

  return {
    entryId: initialInsertId,
    exitId,
    endY: cursorY,
    width: maxWidth,
  };
}

function buildReadOnlySequenceGraph(
  sequence: WorkflowNodeRecord[],
  ctx: GraphBuildContext,
  laneX: number,
  startY: number,
): ReadOnlySequenceLayoutResult {
  let cursorY = startY;
  let previousExitIds: string[] = [];
  let entryIds: string[] = [];
  let maxWidth = sequence.length ? DIMENSIONS.workflowWidth : 0;

  for (const workflowNode of sequence) {
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

    cursorY += 82;
    pushWorkflowNode(ctx, workflowNode, laneX - 56, cursorY);

    if (!entryIds.length) {
      entryIds = [String(workflowNode.id)];
    }
    previousExitIds.forEach((sourceId) => {
      ctx.edges.push(createEdge(sourceId, String(workflowNode.id)));
    });

    let deepestY = cursorY;
    let exitIds: string[] = [String(workflowNode.id)];

    const branchSlots = slotDefinitions.filter(
      (slot) => slot.key === "then" || slot.key === "else",
    );

    if (branchSlots.length >= 2) {
      const branchGap = 60;
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

      const branchLayouts = branchSlots
        .map((slot, branchIndex) => {
          const slotKey = slot.key as "then" | "else";
          const childNodes = Array.isArray(workflowNode[slotKey])
            ? workflowNode[slotKey]
            : [];
          const beforeWidth = branchWidths
            .slice(0, branchIndex)
            .reduce((sum, width) => sum + width, 0);
          const branchLaneX =
            branchStartX +
            beforeWidth +
            branchGap * branchIndex +
            branchWidths[branchIndex] / 2;
          pushSectionLabelNode(
            ctx,
            `${workflowNode.id}-${slotKey}-label`,
            branchLaneX + 24,
            cursorY + 60,
            slot.label ?? slotKey,
          );
          const childLayout = buildReadOnlySequenceGraph(
            childNodes,
            ctx,
            branchLaneX,
            cursorY + 82,
          );
          childLayout.entryIds.forEach((entryId) => {
            ctx.edges.push(createEdge(String(workflowNode.id), entryId));
          });
          deepestY = Math.max(deepestY, childLayout.endY);
          maxWidth = Math.max(maxWidth, childLayout.width);
          return childLayout;
        })
        .filter((layout) => layout.entryIds.length);

      exitIds = branchLayouts.length
        ? branchLayouts.flatMap((layout) => layout.exitIds)
        : [String(workflowNode.id)];
    } else if (slotDefinitions.length === 1 && slotDefinitions[0].kind === "sequence") {
      const slot = slotDefinitions[0];
      const slotKey = slot.key as "children" | "nodes" | "then" | "else";
      const childNodes = Array.isArray(workflowNode[slotKey]) ? workflowNode[slotKey] : [];
      if (slot.label) {
        const isLoop = isLoopNode(workflowNode, nodeType);
        pushSectionLabelNode(
          ctx,
          `${workflowNode.id}-${slotKey}-label`,
          laneX + 24,
          cursorY + (isLoop ? DIMENSIONS.controlChildLabelOffsetY : 132),
          isLoop ? slot.label ?? "Loop Body" : slot.label,
        );
      }
      const childLayout = buildReadOnlySequenceGraph(
        childNodes,
        ctx,
        laneX,
        cursorY + DIMENSIONS.controlChildStartOffsetY,
      );
      childLayout.entryIds.forEach((entryId) => {
        ctx.edges.push(createEdge(String(workflowNode.id), entryId));
      });
      deepestY = Math.max(deepestY, childLayout.endY);
      maxWidth = Math.max(maxWidth, childLayout.width);
      exitIds = childLayout.exitIds.length ? childLayout.exitIds : [String(workflowNode.id)];
    } else if (slotDefinitions.length === 1 && slotDefinitions[0].kind === "branch-collection") {
      const branches = Array.isArray(workflowNode.branches) ? workflowNode.branches : [];
      const branchGap = 56;
      const branchWidths = branches.map((branch: any) =>
        estimateSequenceWidth(Array.isArray(branch.nodes) ? branch.nodes : [], ctx.nodeTypeMap),
      );
      const totalBranchWidth =
        branchWidths.reduce((sum, width) => sum + width, 0) +
        branchGap * Math.max(branchWidths.length - 1, 0);
      const branchStartX = laneX - totalBranchWidth / 2;

      const branchLayouts = branches
        .map((branch: any, branchIndex) => {
          const beforeWidth = branchWidths
            .slice(0, branchIndex)
            .reduce((sum, width) => sum + width, 0);
          const branchLaneX =
            branchStartX +
            beforeWidth +
            branchGap * branchIndex +
            branchWidths[branchIndex] / 2;
          pushSectionLabelNode(
            ctx,
            `${workflowNode.id}-${branch.id}-label`,
            branchLaneX + 24,
            cursorY + 60,
            branch.name ?? branch.id,
          );
          const branchLayout = buildReadOnlySequenceGraph(
            Array.isArray(branch.nodes) ? branch.nodes : [],
            ctx,
            branchLaneX,
            cursorY + 82,
          );
          branchLayout.entryIds.forEach((entryId) => {
            ctx.edges.push(createEdge(String(workflowNode.id), entryId));
          });
          deepestY = Math.max(deepestY, branchLayout.endY);
          maxWidth = Math.max(maxWidth, branchLayout.width);
          return branchLayout;
        })
        .filter((layout) => layout.entryIds.length);

      exitIds = branchLayouts.length
        ? branchLayouts.flatMap((layout) => layout.exitIds)
        : [String(workflowNode.id)];
    }

    if (isControlNode) {
      pushGroupNode(
        ctx,
        `group-${String(workflowNode.id)}`,
        workflowNode.name ?? workflowNode.id,
        isLoopNode(workflowNode, nodeType) ? "loop" : "control",
        ctx.nodes.slice(subtreeStartIndex),
        workflowNode,
        nodeType,
      );
    }

    cursorY = Math.max(cursorY + 82, deepestY + (isControlNode ? 40 : 0));
    previousExitIds = exitIds;
  }

  return {
    entryIds,
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
    readOnly: props.readOnly,
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
    onAddBranch: props.onAddBranch,
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

  if (props.readOnly) {
    const readOnlyLayout = buildReadOnlySequenceGraph(
      definition.nodes ?? [],
      ctx,
      80,
      startY,
    );
    if (previousTriggerId) {
      const triggerSourceId = previousTriggerId;
      readOnlyLayout.entryIds.forEach((entryId) => {
        ctx.edges.push(createEdge(triggerSourceId, entryId));
      });
    }
  } else {
    buildSequenceGraph(definition.nodes ?? [], ctx, 80, startY, { scope: "root" });
    if (previousTriggerId) {
      const firstRootInsertId = `insert-${JSON.stringify({ scope: "root" })}-0`;
      ctx.edges.push(createEdge(previousTriggerId, firstRootInsertId));
    }
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
        onAddBranch: props.onAddBranch,
        readOnly: props.readOnly,
      }),
    [
      props.activePaletteNodeType,
      props.definition,
      props.nodeTypes,
      props.onAddBranch,
      props.onDeleteNode,
      props.onEditNode,
      props.onInsertNode,
      props.onSelectNode,
      props.onSelectTrigger,
      props.onViewDocs,
      props.onViewTriggerDocs,
      props.readOnly,
      props.selectedNodeId,
      props.selectedTriggerId,
    ],
  );

  return (
    <div
      className={`workflow-flow-canvas ${props.readOnly ? "workflow-flow-canvas--readonly" : ""}`}
    >
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={canvasNodeTypes}
        fitView
        fitViewOptions={{
          padding: props.readOnly ? 0.28 : 0.24,
          maxZoom: props.readOnly ? 0.92 : 1,
        }}
        minZoom={0.25}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ zIndex: 2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={!props.readOnly}
        panOnDrag
        zoomOnDoubleClick={false}
      >
        {!props.readOnly ? (
          <MiniMap pannable zoomable className="workflow-flow-canvas__minimap" />
        ) : null}
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
