import React, { useMemo } from "react";
import { ArrowDownWideNarrow, ArrowUpDown, ArrowUpWideNarrow, ChevronRight, Minus } from "lucide-react";

export type SolidTreeNode = {
  key?: string | number;
  data?: any;
  children?: SolidTreeNode[];
  leaf?: boolean;
  [key: string]: any;
};

export type SolidTreeSelectionKey = {
  checked?: boolean;
  partialChecked?: boolean;
  [key: string]: any;
};

export type SolidTreeSelectionKeys = Record<string, SolidTreeSelectionKey>;

type HeaderRenderer = React.ReactNode | (() => React.ReactNode);
type BodyRenderer = (node: SolidTreeNode, options?: { depth: number; rowIndex: number }) => React.ReactNode;

export type SolidTreeColumnProps = {
  field?: string;
  header?: HeaderRenderer;
  body?: BodyRenderer;
  sortable?: boolean;
  headerStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  align?: "left" | "center" | "right";
  alignHeader?: "left" | "center" | "right";
  expander?: boolean | ((node: SolidTreeNode) => boolean);
  frozen?: boolean;
  alignFrozen?: "left" | "right";
  [key: string]: any;
};

type SolidTreeTableProps = {
  value?: SolidTreeNode[];
  children: React.ReactNode;
  loading?: boolean;
  expandedKeys?: Record<string, boolean>;
  onToggle?: (event: { value: Record<string, boolean> }) => void;
  onExpand?: (event: { node: SolidTreeNode }) => void;
  tableClassName?: string;
  tableStyle?: React.CSSProperties;
  emptyMessage?: React.ReactNode;
  selectionMode?: "checkbox" | null;
  selectionKeys?: SolidTreeSelectionKeys;
  onSelectionChange?: (event: {
    value: SolidTreeSelectionKeys;
    originalEvent: React.MouseEvent<HTMLInputElement>;
  }) => void;
  sortField?: string;
  sortOrder?: 1 | -1 | 0;
  removableSort?: boolean;
  onSort?: (event: { sortField?: string; sortOrder?: 1 | -1 | 0 }) => void;
  onRowClick?: (event: { node: SolidTreeNode; originalEvent: React.MouseEvent<HTMLTableRowElement> }) => void;
};

type FlattenedTreeRow = {
  node: SolidTreeNode;
  depth: number;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function renderHeaderNode(header?: HeaderRenderer) {
  if (typeof header === "function") return header();
  return header ?? null;
}

export function SolidTreeColumn(_props: SolidTreeColumnProps) {
  return null;
}

export const Column = SolidTreeColumn;

function normalizeColumns(children: React.ReactNode): React.ReactElement<SolidTreeColumnProps>[] {
  return React.Children.toArray(children).filter((child): child is React.ReactElement<SolidTreeColumnProps> => {
    return React.isValidElement(child);
  });
}

function resolveSortIcon(active: boolean, order: 1 | -1 | 0): React.ReactNode {
  if (!active || order === 0) return <ArrowUpDown size={14} aria-hidden="true" />;
  return order === 1
    ? <ArrowUpWideNarrow size={14} aria-hidden="true" />
    : <ArrowDownWideNarrow size={14} aria-hidden="true" />;
}

function nextSortOrder(active: boolean, order: 1 | -1 | 0, removableSort = true): 1 | -1 | 0 {
  if (!active || order === 0) return 1;
  if (order === 1) return -1;
  return removableSort ? 0 : 1;
}

function flattenVisibleNodes(
  nodes: SolidTreeNode[],
  expandedKeys: Record<string, boolean>,
  depth = 0
): FlattenedTreeRow[] {
  return (nodes || []).flatMap((node) => {
    const key = String(node.key ?? "");
    const rows: FlattenedTreeRow[] = [{ node, depth }];
    if (expandedKeys[key] && node.children?.length) {
      rows.push(...flattenVisibleNodes(node.children, expandedKeys, depth + 1));
    }
    return rows;
  });
}

function updateSubtreeSelection(
  node: SolidTreeNode,
  selected: boolean,
  selection: SolidTreeSelectionKeys
) {
  const key = String(node.key ?? "");
  if (!key) return;

  if (selected) {
    selection[key] = {
      ...selection[key],
      checked: true,
      partialChecked: false,
    };
  } else {
    delete selection[key];
  }

  node.children?.forEach((child) => updateSubtreeSelection(child, selected, selection));
}

function reconcileSelection(nodes: SolidTreeNode[], selection: SolidTreeSelectionKeys) {
  const next: SolidTreeSelectionKeys = {};

  const visit = (node: SolidTreeNode): { checked: boolean; partialChecked: boolean } => {
    const key = String(node.key ?? "");
    const existing = selection[key] || {};
    const childStates = (node.children || []).map(visit);

    let checked = Boolean(existing.checked);
    let partialChecked = Boolean(existing.partialChecked);

    if (childStates.length > 0) {
      const allChecked = childStates.every((state) => state.checked);
      const anySelected = childStates.some((state) => state.checked || state.partialChecked);

      checked = allChecked;
      partialChecked = !allChecked && anySelected;
    }

    if (checked || partialChecked) {
      next[key] = {
        ...existing,
        checked,
        partialChecked,
      };
    }

    return { checked, partialChecked };
  };

  nodes.forEach(visit);
  return next;
}

function normalizeTextAlign(value?: "left" | "center" | "right") {
  if (!value) return undefined;
  return value;
}

function parseWidthValue(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (trimmed.endsWith("px")) {
    const parsed = Number.parseFloat(trimmed.replace("px", ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (trimmed.endsWith("rem")) {
    const parsed = Number.parseFloat(trimmed.replace("rem", ""));
    return Number.isFinite(parsed) ? parsed * 16 : null;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function SolidTreeTable({
  value = [],
  children,
  expandedKeys = {},
  onToggle,
  onExpand,
  tableClassName,
  tableStyle,
  emptyMessage,
  selectionMode,
  selectionKeys = {},
  onSelectionChange,
  sortField,
  sortOrder = 0,
  removableSort = true,
  onSort,
  onRowClick,
}: SolidTreeTableProps) {
  const columns = useMemo(() => normalizeColumns(children), [children]);
  const visibleRows = useMemo(() => flattenVisibleNodes(value, expandedKeys), [value, expandedKeys]);
  const selectionWidth = selectionMode === "checkbox" ? 48 : 0;

  const frozenColumnMeta = useMemo(() => {
    const getColumnWidth = (props: SolidTreeColumnProps) =>
      parseWidthValue(props.style?.width)
      ?? parseWidthValue(props.style?.minWidth)
      ?? parseWidthValue(props.headerStyle?.width)
      ?? parseWidthValue(props.headerStyle?.minWidth)
      ?? 160;

    const leftOffsets = new Map<number, number>();
    const rightOffsets = new Map<number, number>();

    let leftOffset = selectionWidth;
    columns.forEach((column, index) => {
      const props = column.props;
      if (props.frozen && (props.alignFrozen ?? "left") === "left") {
        leftOffsets.set(index, leftOffset);
        leftOffset += getColumnWidth(props);
      }
    });

    let rightOffset = 0;
    for (let index = columns.length - 1; index >= 0; index -= 1) {
      const props = columns[index].props;
      if (props.frozen && props.alignFrozen === "right") {
        rightOffsets.set(index, rightOffset);
        rightOffset += getColumnWidth(props);
      }
    }

    return { leftOffsets, rightOffsets };
  }, [columns, selectionWidth]);

  const selectionColSpan = selectionMode === "checkbox" ? 1 : 0;

  const selectedLeafRows = useMemo(() => {
    return visibleRows.filter(({ node }) => Boolean(selectionKeys[String(node.key ?? "")]?.checked));
  }, [visibleRows, selectionKeys]);

  const allVisibleSelected =
    selectionMode === "checkbox" &&
    visibleRows.length > 0 &&
    selectedLeafRows.length === visibleRows.length;

  const getStickyStyles = (
    kind: "selection" | "column",
    index: number | null,
    position: "header" | "body"
  ): React.CSSProperties => {
    if (kind === "selection") {
      return {
        position: "sticky",
        left: 0,
        zIndex: position === "header" ? 7 : 5,
      };
    }

    if (index === null) return {};

    const leftOffset = frozenColumnMeta.leftOffsets.get(index);
    if (leftOffset !== undefined) {
      return {
        position: "sticky",
        left: leftOffset,
        zIndex: position === "header" ? 6 : 4,
      };
    }

    const rightOffset = frozenColumnMeta.rightOffsets.get(index);
    if (rightOffset !== undefined) {
      return {
        position: "sticky",
        right: rightOffset,
        zIndex: position === "header" ? 6 : 4,
      };
    }

    return {};
  };

  return (
    <div className="solid-tree-table-root">
      <div className="solid-data-table-viewport min-h-0 rounded-md border border-border/60 bg-background">
        <div className="relative min-h-full">
          <table className={cx("w-full text-sm border-collapse", tableClassName)} style={tableStyle}>
            <thead className="solid-data-table-head sticky top-0 z-2">
              <tr>
                {selectionMode === "checkbox" ? (
                  <th
                    className="solid-data-table-th solid-data-table-selection-col solid-tree-sticky-cell solid-tree-sticky-cell-left"
                    style={getStickyStyles("selection", null, "header")}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(allVisibleSelected)}
                      onChange={(event) => {
                        const next = { ...selectionKeys };
                        visibleRows.forEach(({ node }) => {
                          updateSubtreeSelection(node, event.currentTarget.checked, next);
                        });
                        const reconciled = reconcileSelection(value, next);
                        onSelectionChange?.({
                          value: reconciled,
                          originalEvent: event as unknown as React.MouseEvent<HTMLInputElement>,
                        });
                      }}
                      aria-label="Select visible rows"
                    />
                  </th>
                ) : null}
                {columns.map((column, index) => {
                  const props = column.props;
                  const isSortable = Boolean(props.sortable && props.field);
                  const isActiveSort = isSortable && sortField === props.field;
                  const iconNode = resolveSortIcon(Boolean(isActiveSort), sortOrder);

                  return (
                    <th
                      key={`tree-header-${index}`}
                      className={cx(
                        "solid-data-table-th text-left text-foreground whitespace-nowrap",
                        props.frozen && (props.alignFrozen ?? "left") === "left" && "solid-tree-sticky-cell solid-tree-sticky-cell-left",
                        props.frozen && props.alignFrozen === "right" && "solid-tree-sticky-cell solid-tree-sticky-cell-right",
                        props.headerClassName
                      )}
                      style={{
                        ...props.style,
                        ...props.headerStyle,
                        textAlign: normalizeTextAlign(props.alignHeader ?? props.align),
                        ...getStickyStyles("column", index, "header"),
                      }}
                    >
                      <button
                        type="button"
                        className={cx("solid-table-header-button", isSortable ? "is-sortable" : undefined)}
                        onClick={() => {
                          if (!isSortable) return;
                          const nextOrder = nextSortOrder(Boolean(isActiveSort), sortOrder, removableSort);
                          onSort?.({
                            sortField: nextOrder === 0 ? undefined : props.field,
                            sortOrder: nextOrder,
                          });
                        }}
                      >
                        {renderHeaderNode(props.header)}
                        {isSortable ? iconNode : null}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-10 text-center text-muted-foreground"
                    colSpan={Math.max(columns.length + selectionColSpan, 1)}
                  >
                    {emptyMessage || "No records found"}
                  </td>
                </tr>
              ) : (
                visibleRows.map(({ node, depth }, rowIndex) => {
                  const key = String(node.key ?? rowIndex);
                  const isSelected = Boolean(selectionKeys[key]?.checked);

                  return (
                    <tr
                      key={key}
                      className={cx("solid-data-table-row solid-tree-table-row", isSelected && "is-selected")}
                      onClick={(event) => {
                        const target = event.target as HTMLElement;
                        if (target.closest("button,a,input,label,[data-no-row-click='true']")) return;
                        onRowClick?.({ node, originalEvent: event });
                      }}
                    >
                      {selectionMode === "checkbox" ? (
                        <td
                          className="solid-data-table-td solid-data-table-selection-col solid-tree-sticky-cell solid-tree-sticky-cell-left"
                          style={getStickyStyles("selection", null, "body")}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            ref={(element) => {
                              if (element) {
                                element.indeterminate = Boolean(selectionKeys[key]?.partialChecked);
                              }
                            }}
                            onChange={(event) => {
                              const next = { ...selectionKeys };
                              updateSubtreeSelection(node, event.currentTarget.checked, next);
                              const reconciled = reconcileSelection(value, next);
                              onSelectionChange?.({
                                value: reconciled,
                                originalEvent: event as unknown as React.MouseEvent<HTMLInputElement>,
                              });
                            }}
                            onClick={(event) => event.stopPropagation()}
                            aria-label="Select row"
                          />
                        </td>
                      ) : null}
                      {columns.map((column, columnIndex) => {
                        const props = column.props;
                        const canExpand =
                          typeof props.expander === "function"
                            ? props.expander(node)
                            : Boolean(props.expander);
                        const isExpanded = Boolean(expandedKeys[key]);
                        const hasChildren = Boolean(node.children?.length);
                        const showExpander = canExpand;
                        const expanderDisabled = node.leaf === true;

                        const content = props.body
                          ? props.body(node, { depth, rowIndex })
                          : props.field
                            ? node?.data?.[props.field]
                            : null;

                        const isExpanderColumn = showExpander && columnIndex === 0;

                        return (
                          <td
                            key={`tree-cell-${key}-${columnIndex}`}
                            className={cx(
                              "solid-data-table-td align-top text-foreground",
                              props.frozen && (props.alignFrozen ?? "left") === "left" && "solid-tree-sticky-cell solid-tree-sticky-cell-left",
                              props.frozen && props.alignFrozen === "right" && "solid-tree-sticky-cell solid-tree-sticky-cell-right",
                              props.className,
                              props.bodyClassName
                            )}
                            style={{
                              ...props.style,
                              textAlign: normalizeTextAlign(props.align),
                              ...getStickyStyles("column", columnIndex, "body"),
                            }}
                          >
                            {isExpanderColumn ? (
                              <div className="solid-tree-cell">
                                <div
                                  className="solid-tree-cell-indent"
                                  style={{ width: `${depth * 1.25}rem` }}
                                  aria-hidden="true"
                                />
                                <button
                                  type="button"
                                  className="solid-tree-expander"
                                  disabled={expanderDisabled}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    if (expanderDisabled) return;

                                    const nextExpanded = { ...expandedKeys };
                                    if (nextExpanded[key]) {
                                      delete nextExpanded[key];
                                    } else {
                                      nextExpanded[key] = true;
                                    }
                                    onToggle?.({ value: nextExpanded });
                                    if (!isExpanded) {
                                      onExpand?.({ node });
                                    }
                                  }}
                                  aria-label={isExpanded ? "Collapse row" : "Expand row"}
                                >
                                  {expanderDisabled ? (
                                    <Minus size={14} aria-hidden="true" />
                                  ) : (
                                    <ChevronRight
                                      size={14}
                                      aria-hidden="true"
                                      className={cx("solid-tree-expander-icon", isExpanded && "is-expanded")}
                                    />
                                  )}
                                </button>
                                <div className="solid-tree-cell-content">{content}</div>
                              </div>
                            ) : (
                              content
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}
