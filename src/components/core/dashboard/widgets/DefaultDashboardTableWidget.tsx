import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";

type DashboardTableColumn = {
  field: string;
  label: string;
};

const getColumnField = (column: any): string => {
  if (typeof column === "string") return column;
  return `${column?.attrs?.name ?? column?.attrs?.field ?? column?.field ?? column?.name ?? column?.key ?? ""}`;
};

const getColumnLabel = (column: any, field: string): string => {
  if (typeof column === "string") return field;
  return `${column?.attrs?.label ?? column?.label ?? column?.header ?? column?.displayName ?? field}`;
};

const normalizeColumns = (columns: any[]): DashboardTableColumn[] =>
  columns
    .map((column) => {
      const field = getColumnField(column);
      if (!field) return null;

      return {
        field,
        label: getColumnLabel(column, field),
      };
    })
    .filter(Boolean) as DashboardTableColumn[];

const getConfiguredColumns = (definition: any, runtime: any, records: Record<string, any>[]): DashboardTableColumn[] => {
  const columnSource =
    definition?.attrs?.columns ??
    definition?.providerContext?.columns ??
    definition?.columns ??
    definition?.table?.columns ??
    definition?.ui?.columns ??
    runtime?.data?.columns;

  if (Array.isArray(columnSource) && columnSource.length > 0) {
    return normalizeColumns(columnSource);
  }

  const firstRecord = records[0];
  return firstRecord && typeof firstRecord === "object" ? normalizeColumns(Object.keys(firstRecord)) : [];
};

export function DefaultDashboardTableWidget({ definition, runtime }: DashboardWidgetComponentProps) {
  const records: Record<string, any>[] = Array.isArray(runtime?.data?.records) ? runtime.data.records : [];
  const columns = getConfiguredColumns(definition, runtime, records);

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
                {column.label}
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
