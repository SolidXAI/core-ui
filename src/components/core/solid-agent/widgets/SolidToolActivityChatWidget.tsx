import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { formatDuration } from "../agentFormat";
import { asArray, getChatWidgetData } from "./chatWidgetUtils";
import { SolidProgressStepIcon } from "./SolidProgressChatWidget";

type ToolLine = { name: string; summary?: string; status?: "running" | "done" | "error"; duration_ms?: number };

/**
 * `event_data: { widget: "tool-activity", title?, tools: [{ name, summary?, status?, duration_ms? }] }`.
 * A summary of several tool calls in one card (individual calls use DefaultToolCallChatWidget).
 */
export const SolidToolActivityChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<{ title?: string; tools?: ToolLine[] }>(eventData);
    const tools = asArray<ToolLine>(data.tools);
    return (
        <div className={styles.card}>
            <div className={styles.cardHead}>{data.title ?? `Used ${tools.length} tool${tools.length === 1 ? "" : "s"}`}</div>
            <div className={styles.cardBody}>
                {tools.map((tool, index) => (
                    <div key={index} className={styles.stepRow}>
                        <SolidProgressStepIcon status={tool.status === "running" ? "running" : tool.status === "error" ? "error" : "done"} />
                        <span style={{ fontWeight: 600 }}>{tool.name}</span>
                        <span className={styles.toolSummary}>{tool.summary}</span>
                        <span className={styles.toolMeta}>{formatDuration(tool.duration_ms)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

Object.assign(SolidToolActivityChatWidget, { getExtensionMetadata: () => ({
    agentWidget: { name: "tool-activity", description: "Summarize tool calls and their results.", propsSchema: { type: "object", properties: { title: { type: "string" }, tools: { type: "array", items: { type: "object", properties: { name: { type: "string" }, summary: { type: "string" }, status: { type: "string", enum: ["running", "done", "error"] }, duration_ms: { type: "number" } }, required: ["name"] } } } } },
}) });
