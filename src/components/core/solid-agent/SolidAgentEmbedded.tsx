import React from "react";
import styles from "./SolidAgent.module.css";
import { SolidAgentChat } from "./SolidAgentChat";
import { useAgentAvailability } from "./useAgentAvailability";

type Props = {
    /** Container height; the chat fills it. */
    height?: number | string;
    suggestions?: string[];
    className?: string;
};

/**
 * The agent chat rendered inside a page (a tab or form widget) instead of the floating window.
 * Shares the same connection and thread as the launcher.
 */
export function SolidAgentEmbedded({ height = 560, suggestions, className }: Props) {
    const { ready, enabled, agentUrl, canUse } = useAgentAvailability();
    if (!ready) return null;
    if (!enabled || !canUse || !agentUrl) {
        return <div className={styles.root} style={{ padding: 16, color: "var(--muted)" }}>The SolidX Agent is not available for your account.</div>;
    }
    return (
        <div
            className={`${styles.root} ${className ?? ""}`}
            style={{ height, display: "flex", flexDirection: "column", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--card)" }}
        >
            <SolidAgentChat agentUrl={agentUrl} embedded suggestions={suggestions} />
        </div>
    );
}
