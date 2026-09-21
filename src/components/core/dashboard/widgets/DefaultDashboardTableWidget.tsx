import type { DashboardTableColumn, DashboardWidgetComponentProps } from "../../../../types/dashboard";

const acronymLabels: Record<string, string> = {
  api: "API",
  id: "ID",
  isbn: "ISBN",
  mq: "MQ",
  sla: "SLA",
  ui: "UI",
  url: "URL",
};

const formatColumnHeader = (column: string): string => {
  return `${column ?? ""}`
    .replace(/\./g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      return acronymLabels[lower] ?? `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
    })
    .join(" ");
};

type NormalizedDashboardTableColumn = {
  field: string;
  header: string;
};

const normalizeColumn = (column: DashboardTableColumn): NormalizedDashboardTableColumn => {
  if (typeof column === "string") {
    return {
      field: column,
      header: formatColumnHeader(column),
    };
  }

  return {
    field: column.field,
    header: column.header ?? formatColumnHeader(column.field),
  };
};

export function DefaultDashboardTableWidget({ runtime }: DashboardWidgetComponentProps) {
  const rawColumns: DashboardTableColumn[] = Array.isArray(runtime?.data?.columns) ? runtime.data.columns : [];
  const columns = rawColumns.map(normalizeColumn);
  const records: Record<string, any>[] = Array.isArray(runtime?.data?.records) ? runtime.data.records : [];

  return (
    <div style={{ overflow: "auto", maxHeight: "100%" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.field}
                style={{ textAlign: "left", borderBottom: "1px solid #eceff3", padding: "6px 8px", fontSize: "0.84rem" }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.slice(0, 25).map((record, index) => (
            <tr key={`record-${index}`}>
              {columns.map((column) => (
                <td
                  key={`${index}-${column.field}`}
                  style={{ textAlign: "left", borderBottom: "1px solid #f3f4f6", padding: "6px 8px", fontSize: "0.83rem", whiteSpace: "nowrap" }}
                >
                  {`${record?.[column.field] ?? ""}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
