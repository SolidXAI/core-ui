import React from "react";

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
  [key: string]: any;
};

export function Column(_props: SolidColumnProps) {
  return null;
}

type SolidDataTableProps = {
  value: any[];
  children: React.ReactNode;
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
  rowClassName?: (rowData: any) => string;
  tableClassName?: string;
  paginatorClassName?: string;
  currentPageReportTemplate?: string;
  [key: string]: any;
};

const cx = (...parts: Array<string | undefined | false>) => parts.filter(Boolean).join(" ");

function renderHeaderNode(header?: HeaderRenderer) {
  if (typeof header === "function") return header();
  return header ?? null;
}

function normalizeColumns(children: React.ReactNode): React.ReactElement<SolidColumnProps>[] {
  return React.Children.toArray(children).filter((child): child is React.ReactElement<SolidColumnProps> => {
    return React.isValidElement(child);
  });
}

function resolveSortIcon(active: boolean, order: 1 | -1 | 0): string {
  if (!active || order === 0) return "pi pi-sort-alt";
  return order === 1 ? "pi pi-sort-amount-up-alt" : "pi pi-sort-amount-down";
}

function nextSortOrder(active: boolean, order: 1 | -1 | 0, removableSort = true): 1 | -1 | 0 {
  if (!active || order === 0) return 1;
  if (order === 1) return -1;
  return removableSort ? 0 : 1;
}

export function SolidDataTable({
  value,
  children,
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
  rowClassName,
  tableClassName,
  paginatorClassName,
  currentPageReportTemplate = "{first} - {last} of {totalRecords}",
}: SolidDataTableProps) {
  const columns = normalizeColumns(children);
  const pageRows = value ?? [];

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

  return (
    <div
      className="solid-data-table-root w-full h-full min-h-0"
      style={{
        display: "grid",
        gridTemplateRows: "minmax(0, 1fr) auto",
        height: viewportHeight || "100%",
        maxHeight: viewportHeight || "100%",
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <div
        className="solid-data-table-viewport min-h-0 rounded-md border border-border/60 bg-background"
        style={{
          minHeight: 0,
          height: "100%",
          overflowX: "auto",
          overflowY: "auto",
        }}
      >
        <table className={cx("w-full text-sm border-collapse", tableClassName)}>
          <thead className="bg-muted/30 sticky top-0 z-2">
            <tr>
              {columns.map((column, index) => {
                const props = column.props;
                const isSelectionColumn = props.selectionMode === "multiple";
                const isSortable = Boolean(props.sortable && props.field && !isSelectionColumn);
                const isActiveSort = isSortable && sortField === props.field;
                const iconClass = resolveSortIcon(Boolean(isActiveSort), sortOrder);
                return (
                  <th
                    key={`header-${index}`}
                    className={cx("px-2.5 py-1.5 text-left font-medium text-foreground whitespace-nowrap border-b border-border/50", props.headerClassName)}
                    style={{ ...props.style, ...props.headerStyle }}
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
                        {isSortable ? <i className={iconClass} aria-hidden="true" /> : null}
                      </button>
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
                    className={cx("border-t border-border/50 hover:bg-muted/20", rowClassName?.(rowData))}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest("button,a,input,label,[data-no-row-click='true']")) return;
                      onRowClick?.({ data: rowData });
                    }}
                  >
                    {columns.map((column, index) => {
                      const props = column.props;
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
                        <td key={`cell-${key}-${index}`} className={cx("px-2.5 py-1.5 align-top text-foreground", props.className)} style={props.style}>
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
          className={cx("w-full solid-table-paginator flex items-center justify-end gap-3 text-sm rounded-md border border-border/60 px-3 py-1.5 bg-background", paginatorClassName)}
          style={{
            alignSelf: "end",
          }}
        >
          <div className="solid-paginator-meta flex items-center gap-2 ml-auto">
            <span className="solid-paginator-label">Rows</span>
            <select
              value={rows}
              onChange={(e) => onPage({ first: 0, rows: Number(e.target.value) })}
              className="solid-paginator-select"
            >
              {rowsPerPageOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
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
