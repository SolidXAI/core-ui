import { Minimize2 } from "lucide-react";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import styles from "./solidChatWidgets.module.css";

function formatTokens(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
    return String(Math.round(value));
}

/**
 * Default widget for AgentHub's `ContextCompacted` event: a divider where the runtime shrank the
 * model's working context. The chat transcript itself is unchanged.
 */
export const DefaultContextCompactedChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const before = Number(eventData.tokens_before);
    const after = Number(eventData.tokens_after);
    const sizes = before > 0 && after >= 0 ? `${formatTokens(before)} → ${formatTokens(after)} tokens` : "";
    const what = eventData.strategy === "summarize" ? "earlier conversation summarized" : "older tool results archived";
    const label = `Context compacted: ${what}`;
    const title = "The agent compacted its working context to stay within the model's context window. "
        + "Your messages are unchanged, and the agent can still look up the archived originals.";
    return (
        <div className={styles.ContextCompacted} role="separator" aria-label={sizes ? `${label}, ${sizes}` : label} title={title}>
            <span className={styles.ContextCompactedLine} aria-hidden="true" />
            <span className={styles.ContextCompactedLabel} aria-hidden="true">
                <Minimize2 size={12} />
                <span>{label}</span>
                {sizes && <span className={styles.ContextCompactedSizes}>{sizes}</span>}
            </span>
            <span className={styles.ContextCompactedLine} aria-hidden="true" />
        </div>
    );
};

Object.assign(DefaultContextCompactedChatWidget, { getExtensionMetadata: () => ({
    chatInteraction: { role: "event-renderer", agentSelectable: false },
}) });
