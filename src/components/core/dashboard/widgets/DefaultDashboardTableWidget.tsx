import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";

type DashboardTableColumn = {
  field: string;
  label: string;
}

const normalizeColumns = (columns: any[]): DashboardTableColumn[] =>
    columns
      .map((column) => {
        if (typeof column === "string") {
          return {
            field: column,
            label: column,
          };
        }

        const field = column?.field ?? column?.name ?? column?.key;
        if (!field) return null;

        return {
          field,
          label: column?.label ?? column?.displayName ?? field,
        };
      })
      .filter(Boolean) as DashboardTableColumn[];

export function DefaultDashboardTableWidget({ runtime }: DashboardWidgetComponentProps) {
  const columns = normalizeColumns(Array.isArray(runtime?.data?.columns) ? runtime.data.columns : [])
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
                  key={`${index}-${column}`}
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
