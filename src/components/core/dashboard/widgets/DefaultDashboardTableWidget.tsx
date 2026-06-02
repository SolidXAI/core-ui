import type { DashboardWidgetComponentProps } from "../../../../types/dashboard";

export function DefaultDashboardTableWidget({ runtime }: DashboardWidgetComponentProps) {
  const columns: string[] = Array.isArray(runtime?.data?.columns) ? runtime.data.columns : [];
  const records: Record<string, any>[] = Array.isArray(runtime?.data?.records) ? runtime.data.records : [];

  return (
    <div style={{ overflow: "auto", maxHeight: "100%" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                style={{ textAlign: "left", borderBottom: "1px solid #eceff3", padding: "6px 8px", fontSize: "0.84rem" }}
              >
                {column}
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
                  {`${record?.[column] ?? ""}`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
