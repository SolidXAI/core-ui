import { AlertCircle } from "lucide-react";
import styles from "./solidChatWidgets.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { getChatWidgetData } from "./chatWidgetUtils";

/**
 * Default widget for `AgentError` / `error`: red "Error" bubble. Also usable by name ("error")
 * with `{ message, retryPrompt }`; Retry posts `retryPrompt` as a new user message.
 */
export const DefaultErrorChatWidget = ({ eventData, sendPrompt }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<{ error?: string; message?: string; retryPrompt?: string }>(eventData);
    return (
        <div className={styles.ErrorBubble} role="alert">
            <div className={styles.ErrorIcon}>
                <AlertCircle size={13} />
            </div>
            <div className={styles.ErrorContent}>
                <p className={styles.ErrorTitle}>Error</p>
                <p className={styles.ErrorText}>{data.error ?? data.message ?? "Unknown error"}</p>
                {data.retryPrompt && (
                    <button type="button" className={styles.CodeCopyBtn} style={{ marginTop: 6, paddingLeft: 0 }} onClick={() => sendPrompt(data.retryPrompt!)}>
                        Retry
                    </button>
                )}
            </div>
        </div>
    );
};

Object.assign(DefaultErrorChatWidget, { getExtensionMetadata: () => ({
    chatInteraction: { role: "event-renderer", agentSelectable: false },
}) });
