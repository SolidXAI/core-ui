import styles from "./solidChatWidgets.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";

/**
 * Default widget for an active `AgentStarted` / `StepStarted`: three bouncing dots with
 * "Thinking…". Rendered by the thread only while the agent is thinking.
 */
export const DefaultThinkingChatWidget = (_props: SolidChatWidgetProps) => {
    return (
        <div className={styles.ThinkingBubble} role="status">
            <div className={styles.ThinkingDots}>
                <span className={styles.ThinkingDot} />
                <span className={styles.ThinkingDot} />
                <span className={styles.ThinkingDot} />
            </div>
            <span className={styles.ThinkingLabel}>Thinking…</span>
        </div>
    );
};
