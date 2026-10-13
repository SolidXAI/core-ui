import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { getChatWidgetData } from "./chatWidgetUtils";

/** `event_data: { widget: "json", title?, data }` — collapsible JSON viewer. */
export const SolidJsonChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<{ title?: string; data?: unknown }>(eventData);
    const [open, setOpen] = useState(false);
    const text = useMemo(() => JSON.stringify(data.data ?? data, null, 2), [data]);
    return (
        <div className={styles.card}>
            <button type="button" className={styles.fileRow} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span style={{ flex: 1 }}>{data.title ?? "JSON"}</span>
            </button>
            {open && <pre className={styles.pre} style={{ borderRadius: 0, maxHeight: 320 }}>{text}</pre>}
        </div>
    );
};

Object.assign(SolidJsonChatWidget, { getExtensionMetadata: () => ({
    agentWidget: { name: "json", description: "Show a raw JSON value in a collapsible, copyable viewer.", propsSchema: { type: "object", properties: { title: { type: "string" }, data: {} }, required: ["data"] } },
}) });
