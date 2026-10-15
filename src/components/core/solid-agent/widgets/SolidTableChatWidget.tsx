import { useMemo, useState } from "react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { asArray, getChatWidgetData } from "./chatWidgetUtils";

type Column = string | { key: string; label?: string };
type TableData = { title?: string; columns?: Column[]; rows?: Record<string, unknown>[] };

/** `event_data: { widget: "table", title?, columns?, rows }` — small sortable table. */
export const SolidTableChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<TableData>(eventData);
    const rows = asArray<Record<string, unknown>>(data.rows);
    const columns = (data.columns?.length ? data.columns : Object.keys(rows[0] ?? {})).map((column) =>
        typeof column === "string" ? { key: column, label: column } : { key: column.key, label: column.label ?? column.key },
    );
    const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
    const sorted = useMemo(() => {
        if (!sort) return rows;
        return [...rows].sort((a, b) => String(a[sort.key] ?? "").localeCompare(String(b[sort.key] ?? ""), undefined, { numeric: true }) * sort.dir);
    }, [rows, sort]);

    return (
        <div className={styles.card}>
            {data.title && <div className={styles.cardHead}>{data.title}</div>}
            <div className={styles.tableWrap}>
                <table className={styles.dataTable}>
                    <thead>
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    aria-sort={sort?.key === column.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
                                    onClick={() => setSort((prev) => ({ key: column.key, dir: prev?.key === column.key && prev.dir === 1 ? -1 : 1 }))}
                                >
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((column) => (
                                    <td key={column.key}>
                                        {typeof row[column.key] === "object" ? JSON.stringify(row[column.key]) : String(row[column.key] ?? "")}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

Object.assign(SolidTableChatWidget, { getExtensionMetadata: () => ({
    agentWidget: { name: "table", description: "Show rows and columns for records, query results, or comparisons.", propsSchema: { type: "object", properties: { title: { type: "string" }, columns: { type: "array", items: { anyOf: [{ type: "string" }, { type: "object", properties: { key: { type: "string" }, label: { type: "string" } }, required: ["key"] }] } }, rows: { type: "array", items: { type: "object", additionalProperties: true } } } } },
}) });
