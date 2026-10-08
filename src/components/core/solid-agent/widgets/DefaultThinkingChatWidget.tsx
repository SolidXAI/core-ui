import { Sparkles } from "lucide-react";
import styles from "./solidChatWidgets.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";

/**
 * Default widget for an active `AgentStarted` / `StepStarted`: a compact shimmer status,
 * rendered by the thread only while the agent is thinking.
 */
export const DefaultThinkingChatWidget = (_props: SolidChatWidgetProps) => {
    return (
        <div className={styles.ThinkingBubble} role="status">
            <Sparkles size={14} className={styles.ThinkingSparkle} aria-hidden="true" />
            <span className={styles.ThinkingLabel}>Thinking…</span>
        </div>
    );
};

Object.assign(DefaultThinkingChatWidget, { getExtensionMetadata: () => ({
    chatInteraction: { role: "event-renderer", agentSelectable: false },
}) });
