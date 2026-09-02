import React, { useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpDown, ArrowUpWideNarrow } from "lucide-react";
import { SolidSelect } from "../../shad-cn-ui/SolidSelect";

export type DataTableStateEvent = {
  sortField?: string;
  sortOrder?: 1 | -1 | 0;
};

type HeaderRenderer = React.ReactNode | (() => React.ReactNode);
type BodyRenderer = (rowData: any) => React.ReactNode;

export type SolidColumnProps = {
  field?: string;
  header?: HeaderRenderer;
  body?: BodyRenderer;
  sortable?: boolean;
  selectionMode?: "multiple" | "single" | null;
  headerStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  className?: string;
  headerClassName?: string;
  frozen?: boolean;
  alignFrozen?: "left" | "right";
  frozenBackground?: string;
  [key: string]: any;
};

export function Column(_props: SolidColumnProps) {
  return null;
}

type SolidDataTableProps = {
  value: any[];
  children: React.ReactNode;
  size?: "small" | "normal" | "large";
  viewportHeight?: string;
  dataKey?: string;
  emptyMessage?: React.ReactNode;
  rows?: number;
  first?: number;
  totalRecords?: number;
  rowsPerPageOptions?: number[];
  onPage?: (event: { first: number; rows: number }) => void;
  onSort?: (event: DataTableStateEvent) => void;
  sortField?: string;
  sortOrder?: 1 | -1 | 0;
  removableSort?: boolean;
  selection?: any[];
  selectionMode?: "checkbox" | null;
  onSelectionChange?: (event: { value: any[] }) => void;
  onRowClick?: (event: { data: any }) => void;
  resizableColumns?: boolean;
  rowClassName?: (rowData: any) => string;
  tableClassName?: string;
  paginatorClassName?: string;
  currentPageReportTemplate?: string;
  [key: string]: any;
};

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(" ");

const MIN_COLUMN_WIDTH = 64;

type ColumnResizeState = {
  key: string;
  startX: number;
  startWidth: number;
};

function renderHeaderNode(header?: HeaderRenderer) {
  if (typeof header === "function") return header();
  return header ?? null;
}

function normalizeColumns(children: React.ReactNode): React.ReactElement<SolidColumnProps>[] {
  return React.Children.toArray(children).filter((child): child is React.ReactElement<SolidColumnProps> => {
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

function getFrozenCellStyle(
  props: SolidColumnProps,
  baseStyle?: React.CSSProperties,
  isHeader: boolean = false
): React.CSSProperties {
  if (!props.frozen) return baseStyle ?? {};

  const stickyStyle: React.CSSProperties = {
    position: "sticky",
    zIndex: isHeader ? 12 : 3,
    background: props.frozenBackground ?? "var(--card)",
  };

  if (props.alignFrozen === "right") {
    stickyStyle.right = 0;
  } else {
    stickyStyle.left = 0;
  }

  return { ...baseStyle, ...stickyStyle };
}

export function SolidDataTable({
  value,
  children,
  size = "normal",
  viewportHeight,
  dataKey = "id",
  emptyMessage,
  rows = 25,
  first = 0,
  totalRecords = 0,
  rowsPerPageOptions = [10, 25, 50, 100],
  onPage,
  onSort,
  sortField,
  sortOrder = 0,
  removableSort = true,
  selection = [],
  selectionMode,
  onSelectionChange,
  onRowClick,
  resizableColumns = false,
  rowClassName,
  tableClassName,
  paginatorClassName,
  currentPageReportTemplate = "{first} - {last} of {totalRecords}",
}: SolidDataTableProps) {
  const columns = normalizeColumns(children);
  const pageRows = value ?? [];
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const tableRef = useRef<HTMLTableElement | null>(null);
  const resizeStateRef = useRef<ColumnResizeState | null>(null);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      const width = Math.max(
        MIN_COLUMN_WIDTH,
        resizeState.startWidth + event.clientX - resizeState.startX,
      );
      setColumnWidths((current) => ({ ...current, [resizeState.key]: width }));
    };

    const stopResize = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", stopResize);
    document.addEventListener("pointercancel", stopResize);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", stopResize);
      document.removeEventListener("pointercancel", stopResize);
      stopResize();
    };
  }, []);

  const getColumnKey = (column: React.ReactElement<SolidColumnProps>, index: number) =>
    `${column.props.field || "column"}-${index}`;

  const startColumnResize = (
    event: React.PointerEvent<HTMLSpanElement>,
    column: React.ReactElement<SolidColumnProps>,
    index: number,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const header = event.currentTarget.parentElement;
    if (!header) return;

    const key = getColumnKey(column, index);
    const measuredWidths = tableRef.current
      ? Array.from(tableRef.current.querySelectorAll("thead th")).reduce<Record<string, number>>(
        (widths, header, headerIndex) => {
          const measuredWidth = (header as HTMLElement).getBoundingClientRect().width;
          if (measuredWidth > 0) {
            widths[getColumnKey(columns[headerIndex], headerIndex)] = measuredWidth;
          }
          return widths;
        },
        {},
      )
      : {};
    setColumnWidths((current) => ({ ...measuredWidths, ...current }));
    resizeStateRef.current = {
      key,
      startX: event.clientX,
      startWidth: header.getBoundingClientRect().width,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const selectedKeys = new Set((selection || []).map((row: any) => String(row?.[dataKey])));
  const allSelected = pageRows.length > 0 && pageRows.every((row: any) => selectedKeys.has(String(row?.[dataKey])));

  const start = totalRecords === 0 ? 0 : first + 1;
  const end = Math.min(first + rows, totalRecords);
  const currentPage = rows > 0 ? Math.floor(first / rows) + 1 : 1;
  const totalPages = rows > 0 ? Math.max(1, Math.ceil(totalRecords / rows)) : 1;

  const report = currentPageReportTemplate
    .replace("{first}", String(start))
    .replace("{last}", String(end))
    .replace("{totalRecords}", String(totalRecords));

  const emitSelection = (nextSelection: any[]) => {
    onSelectionChange?.({ value: nextSelection });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (!checked) {
      const pageKeys = new Set(pageRows.map((row: any) => String(row?.[dataKey])));
      emitSelection((selection || []).filter((row: any) => !pageKeys.has(String(row?.[dataKey]))));
      return;
    }
    const merged = [...(selection || [])];
    const mergedKeys = new Set(merged.map((row: any) => String(row?.[dataKey])));
    pageRows.forEach((row: any) => {
      const key = String(row?.[dataKey]);
      if (!mergedKeys.has(key)) merged.push(row);
    });
    emitSelection(merged);
  };

  const toggleRowSelection = (rowData: any, checked: boolean) => {
    const key = String(rowData?.[dataKey]);
    if (!checked) {
      emitSelection((selection || []).filter((row: any) => String(row?.[dataKey]) !== key));
      return;
    }
    emitSelection([...(selection || []), rowData]);
  };

  const densityClass =
    size === "small"
      ? "solid-table-density-compact"
      : size === "large"
        ? "solid-table-density-comfortable"
        : "solid-table-density-cozy";
  const isAutoHeight = viewportHeight === "auto";

  return (
    <div
      className={cx("solid-data-table-root w-full min-h-0", densityClass, isAutoHeight && "solid-data-table-root-auto")}
      style={{
        height: viewportHeight || "100%",
        maxHeight: viewportHeight || "100%",
      }}
    >
      <div className={cx("solid-data-table-viewport min-h-0 rounded-md border border-border/60 bg-background", isAutoHeight && "solid-data-table-viewport-auto")}>
        <table
          ref={tableRef}
          className={cx("w-full text-sm border-collapse", tableClassName)}
          style={Object.keys(columnWidths).length > 0 ? { width: "max-content", tableLayout: "fixed" } : undefined}
        >
          {Object.keys(columnWidths).length > 0 && (
            <colgroup>
              {columns.map((column, index) => {
                const width = columnWidths[getColumnKey(column, index)];
                return <col key={`column-width-${index}`} style={width ? { width } : undefined} />;
              })}
            </colgroup>
          )}
          <thead className="solid-data-table-head">
            <tr>
              {columns.map((column, index) => {
                const props = column.props;
                const columnKey = getColumnKey(column, index);
                const columnWidth = columnWidths[columnKey];
                const isSelectionColumn = props.selectionMode === "multiple";
                const isSortable = Boolean(props.sortable && props.field && !isSelectionColumn);
                const isActiveSort = isSortable && sortField === props.field;
                const iconNode = resolveSortIcon(Boolean(isActiveSort), sortOrder);
                return (
                  <th
                    key={`header-${index}`}
                    className={cx(
                      "solid-data-table-th text-left text-foreground whitespace-nowrap",
                      props.frozen ? "solid-tree-sticky-cell" : undefined,
                      props.frozen && props.alignFrozen === "right" ? "solid-tree-sticky-cell-right" : undefined,
                      props.frozen && props.alignFrozen !== "right" ? "solid-tree-sticky-cell-left" : undefined,
                      isSelectionColumn ? "solid-data-table-selection-col" : undefined,
                      props.headerClassName
                    )}
                    style={getFrozenCellStyle(
                      props,
                      {
                        ...props.style,
                        ...props.headerStyle,
                        ...(columnWidth ? { width: columnWidth, minWidth: columnWidth } : {}),
                      },
                      true,
                    )}
                  >
                    {isSelectionColumn ? (
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(e) => toggleSelectAll(e.currentTarget.checked)}
                        aria-label="Select all rows"
                      />
                    ) : (
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
                    )}
                    {resizableColumns && !isSelectionColumn && (
                      <span
                        className="solid-data-table-column-resizer"
                        role="separator"
                        aria-label={`Resize ${typeof props.header === "string" ? props.header : props.field || "column"} column`}
                        onPointerDown={(event) => startColumnResize(event, column, index)}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-muted-foreground" colSpan={Math.max(columns.length, 1)}>
                  {emptyMessage || "No records found"}
                </td>
              </tr>
            ) : (
              pageRows.map((rowData: any) => {
                const key = String(rowData?.[dataKey]);
                const rowSelected = selectedKeys.has(key);
                return (
                  <tr
                    key={key}
                    className={cx("solid-data-table-row", rowClassName?.(rowData))}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest("button,a,input,label,[data-no-row-click='true']")) return;
                      onRowClick?.({ data: rowData });
                    }}
                  >
                    {columns.map((column, index) => {
                      const props = column.props;
                      const columnWidth = columnWidths[getColumnKey(column, index)];
                      const isSelectionColumn = props.selectionMode === "multiple";
                      const content = isSelectionColumn
                        ? (
                          <input
                            type="checkbox"
                            checked={rowSelected}
                            onChange={(e) => toggleRowSelection(rowData, e.currentTarget.checked)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Select row"
                          />
                        )
                        : props.body
                          ? props.body(rowData)
                          : props.field
                            ? rowData?.[props.field]
                            : null;
                      return (
                        <td
                          key={`cell-${key}-${index}`}
                          className={cx(
                            "solid-data-table-td align-middle text-foreground",
                            props.frozen ? "solid-tree-sticky-cell" : undefined,
                            props.frozen && props.alignFrozen === "right" ? "solid-tree-sticky-cell-right" : undefined,
                            props.frozen && props.alignFrozen !== "right" ? "solid-tree-sticky-cell-left" : undefined,
                            isSelectionColumn ? "solid-data-table-selection-col" : undefined,
                            props.className
                          )}
                          style={getFrozenCellStyle(
                            props,
                            {
                              ...props.style,
                              ...(columnWidth ? { width: columnWidth, minWidth: columnWidth } : {}),
                            },
                          )}
                        >
                          {content}
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

      {typeof onPage === "function" ? (
        <div
          className={cx("w-full solid-table-paginator solid-table-paginator-align-end flex items-center justify-end gap-3 text-sm rounded-md border border-border/60 px-2 sm:px-3 py-1.5 bg-background", paginatorClassName)}
        >
          <div className="solid-paginator-meta flex items-center gap-2 sm:ml-auto">
            <span className="solid-paginator-label">Rows</span>
            <SolidSelect
              value={rows}
              onChange={(event) => onPage({ first: 0, rows: Number(event.value) })}
              className="solid-paginator-select"
              options={rowsPerPageOptions.map((option) => ({ label: String(option), value: option }))}
              native={false}
              menuPlacement="top"
            />
            <span className="solid-paginator-report">{report}</span>
          </div>
          <div className="solid-paginator-actions flex items-center gap-2">
            <button
              type="button"
              className="solid-paginator-btn"
              onClick={() => onPage({ first: Math.max(0, first - rows), rows })}
              disabled={currentPage <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              className="solid-paginator-btn"
              onClick={() => onPage({ first: Math.min((totalPages - 1) * rows, first + rows), rows })}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
