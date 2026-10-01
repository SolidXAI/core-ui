import React from "react";
import styles from "./SolidAgent.module.css";
import { SolidAgentChat } from "./SolidAgentChat";
import { useAgentAvailability } from "./useAgentAvailability";
import type { AgentRuntimeType } from "./types";

type Props = {
    /**
     * Which agent runtime to connect to: "solidx" (setting solidxAgentBackendUrl, shares the
     * launcher's conversation) or "agentHub" (setting solidxAgentHubBackendUrl, its own conversation).
     */
    agentRuntime?: AgentRuntimeType;
    /** Container height; the chat fills it. */
    height?: number | string;
    suggestions?: string[];
    className?: string;
};

const AGENT_LABEL: Record<AgentRuntimeType, string> = { solidx: "SolidX Agent", agentHub: "SolidX Agent Hub" };

/**
 * The agent chat rendered inside a page (a tab or form widget) instead of the floating window.
 * With agentRuntime "solidx" it shares the same connection and thread as the launcher.
 */
export function SolidAgentEmbedded({ agentRuntime = "solidx", height = 560, suggestions, className }: Props) {
    const { ready, enabled, agentUrls, canUse } = useAgentAvailability();
    if (!ready) return null;
    const agentUrl = agentUrls[agentRuntime] ?? null;
    if (!enabled || !canUse) {
        return <div className={styles.root} style={{ padding: 16, color: "var(--solid-agent-muted)" }}>The SolidX Agent is not available for your account.</div>;
    }
    if (!agentUrl) {
        return (
            <div className={styles.root} style={{ padding: 16, color: "var(--solid-agent-muted)" }}>
                No backend URL is configured for the {AGENT_LABEL[agentRuntime]}.
            </div>
        );
    }
    return (
        <div
            className={`${styles.root} ${className ?? ""}`}
            style={{ height, display: "flex", flexDirection: "column", border: "1px solid var(--solid-agent-border)", borderRadius: 12, overflow: "hidden", background: "var(--solid-agent-bg)" }}
        >
            {/* key: switching type remounts the chat onto the other backend's conversation. */}
            <SolidAgentChat key={agentRuntime} agentUrl={agentUrl} agentRuntime={agentRuntime} embedded suggestions={suggestions} />
        </div>
    );
}
