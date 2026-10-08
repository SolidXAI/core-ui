import { useState } from "react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { asArray, getChatWidgetData } from "./chatWidgetUtils";

type ChecklistItem = { id?: string; label: string; checked?: boolean; description?: string };
type ChecklistData = { title?: string; items?: ChecklistItem[]; submitLabel?: string };

/**
 * `event_data: { widget: "checklist", title?, items: [{ id, label, checked?, description? }], submitLabel? }`.
 * Replies with the ids of the ticked items.
 */
export const SolidChecklistChatWidget = ({ eventData, final, reply }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<ChecklistData>(eventData);
    const items = asArray<ChecklistItem>(data.items).map((item, index) => ({ ...item, id: item.id ?? String(index) }));
    const [checked, setChecked] = useState<Set<string>>(() => new Set(items.filter((item) => item.checked).map((item) => item.id)));
    const [sent, setSent] = useState(false);
    const locked = final || sent;

    const toggle = (id: string) =>
        setChecked((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });

    return (
        <div className={styles.card}>
            {data.title && <div className={styles.cardHead}>{data.title}</div>}
            <div className={styles.cardBody}>
                {items.map((item) => (
                    <label key={item.id} className={styles.checkRow}>
                        <input type="checkbox" checked={checked.has(item.id)} disabled={locked} onChange={() => toggle(item.id)} />
                        <span>
                            {item.label}
                            {item.description && <span style={{ display: "block", fontSize: 12, color: "var(--agent-muted)" }}>{item.description}</span>}
                        </span>
                    </label>
                ))}
            </div>
            {!locked && (
                <div className={styles.cardFoot}>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => {
                            setSent(true);
                            reply(Array.from(checked));
                        }}
                    >
                        {data.submitLabel ?? "Continue"}
                    </button>
                </div>
            )}
        </div>
    );
};

Object.assign(SolidChecklistChatWidget, { getExtensionMetadata: () => ({
    agentWidget: { name: "checklist", description: "Present several items the user can tick or confirm.", propsSchema: { type: "object", properties: { title: { type: "string" }, items: { type: "array", items: { type: "object", properties: { id: { type: "string" }, label: { type: "string" }, checked: { type: "boolean" }, description: { type: "string" } }, required: ["label"] } }, submitLabel: { type: "string" } } } },
}) });
