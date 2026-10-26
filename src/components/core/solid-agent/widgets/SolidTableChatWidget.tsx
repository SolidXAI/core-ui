import { useMemo, useState } from "react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { asArray, getChatWidgetData } from "./chatWidgetUtils";

type Column = string | { key?: string; label?: string; name?: string; title?: string };
type TableData = {
    title?: string;
    columns?: Column[];
    rows?: unknown[];
    items?: unknown[];
    data?: unknown[];
};

function getCellValue(row: unknown, columnKey: string, colIndex: number): unknown {
    if (row === null || row === undefined) return "";
    if (Array.isArray(row)) {
        return row[colIndex] ?? "";
    }
    if (typeof row === "object") {
        const obj = row as Record<string, unknown>;
        if (columnKey in obj) return obj[columnKey];

        // Normalized matching: ignore case, whitespace, underscores, hyphens
        const normalized = columnKey.toLowerCase().replace(/[\s_-]+/g, "");
        for (const [k, v] of Object.entries(obj)) {
            if (k.toLowerCase().replace(/[\s_-]+/g, "") === normalized) {
                return v;
            }
        }

        // Positional fallback if key wasn't found directly
        const values = Object.values(obj);
        if (colIndex >= 0 && colIndex < values.length && !(columnKey in obj)) {
            return values[colIndex];
        }
        return obj[columnKey] ?? "";
    }
    return colIndex === 0 ? row : "";
}

/** `event_data: { widget: "table", title?, columns?, rows }` — sortable table with support for array rows, object rows, and flexible columns. */
export const SolidTableChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<TableData>(eventData);
    const rawRows: unknown[] = Array.isArray(data)
        ? data
        : asArray<unknown>(data.rows ?? data.items ?? (Array.isArray(data.data) ? data.data : []));

    const columns = useMemo(() => {
        if (Array.isArray(data.columns) && data.columns.length > 0) {
            return data.columns.map((col, idx) => {
                if (typeof col === "string") return { key: col, label: col };
                const key = String(col.key ?? col.name ?? idx);
                const label = String(col.label ?? col.title ?? col.name ?? col.key ?? key);
                return { key, label };
            });
        }
        if (rawRows.length > 0) {
            const firstRow = rawRows[0];
            if (firstRow && typeof firstRow === "object") {
                if (Array.isArray(firstRow)) {
                    return firstRow.map((_, idx) => ({ key: String(idx), label: `Column ${idx + 1}` }));
                }
                return Object.keys(firstRow as Record<string, unknown>).map((key) => ({ key, label: key }));
            }
            if (firstRow !== undefined && firstRow !== null) {
                return [{ key: "value", label: "Value" }];
            }
        }
        return [];
    }, [data.columns, rawRows]);

    const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

    const sorted = useMemo(() => {
        if (!sort) return rawRows;
        const colIndex = columns.findIndex((c) => c.key === sort.key);
        return [...rawRows].sort((a, b) => {
            const valA = getCellValue(a, sort.key, colIndex);
            const valB = getCellValue(b, sort.key, colIndex);
            if (typeof valA === "number" && typeof valB === "number") {
                return (valA - valB) * sort.dir;
            }
            return String(valA ?? "").localeCompare(String(valB ?? ""), undefined, { numeric: true }) * sort.dir;
        });
    }, [rawRows, sort, columns]);

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
                        {sorted.length === 0 ? (
                            <tr>
                                <td colSpan={Math.max(1, columns.length)} style={{ textAlign: "center", color: "var(--agent-muted)", padding: "16px 8px" }}>
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            sorted.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {columns.map((column, colIndex) => {
                                        const val = getCellValue(row, column.key, colIndex);
                                        const display = val === null || val === undefined
                                            ? ""
                                            : typeof val === "object"
                                            ? JSON.stringify(val)
                                            : String(val);
                                        return <td key={column.key}>{display}</td>;
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

Object.assign(SolidTableChatWidget, { getExtensionMetadata: () => ({
    agentWidget: { name: "table", description: "Show rows and columns for records, query results, or comparisons.", propsSchema: { type: "object", properties: { title: { type: "string" }, columns: { type: "array", items: { anyOf: [{ type: "string" }, { type: "object", properties: { key: { type: "string" }, label: { type: "string" } }, required: ["key"] }] } }, rows: { type: "array", items: { type: "object", additionalProperties: true } } } } },
}) });
