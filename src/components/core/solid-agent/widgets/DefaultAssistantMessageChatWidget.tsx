import styles from "./solidChatWidgets.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { SolidAgentMarkdown, SolidAgentMessageCopyButton } from "../SolidAgentMarkdown";
import { formatChatTime } from "./chatWidgetUtils";

/**
 * Default widget for `LlmComplete` / streamed `LlmToken` / `TurnCompleteEvent` text: the agent's
 * reply as markdown in a bordered bubble, with a blinking cursor while it streams.
 */
export const DefaultAssistantMessageChatWidget = ({ eventData, live, timestamp }: SolidChatWidgetProps) => {
    const content = String(eventData.content ?? "");
    return (
        <div className={styles.BubbleGroup}>
            <div className={`${styles.Bubble} ${styles.BubbleAssistant} ${live ? styles.BubbleStreaming : ""}`}>
                <SolidAgentMarkdown text={content} />
                {live && <span className={styles.StreamingCursor} />}
            </div>
            <div className={`${styles.BubbleMeta} ${styles.BubbleMetaAssistant}`}>
                <span className={styles.Timestamp}>{formatChatTime(timestamp)}</span>
                <SolidAgentMessageCopyButton text={content} />
            </div>
        </div>
    );
};
