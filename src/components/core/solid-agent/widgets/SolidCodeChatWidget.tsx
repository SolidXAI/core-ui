import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { SolidAgentCopyButton } from "../SolidAgentMarkdown";
import { getChatWidgetData } from "./chatWidgetUtils";

/** `event_data: { widget: "code", code, language?, filename? }` — a code block with copy. */
export const SolidCodeChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<{ code?: string; language?: string; filename?: string }>(eventData);
    const code = String(data.code ?? "");
    return (
        <div className={styles.card}>
            <div className={styles.cardHead}>
                <span className={styles.mono} style={{ flex: 1 }}>{data.filename ?? data.language ?? "code"}</span>
                <SolidAgentCopyButton text={code} label="Copy code" />
            </div>
            <pre className={styles.pre} style={{ borderRadius: 0 }}>{code}</pre>
        </div>
    );
};
