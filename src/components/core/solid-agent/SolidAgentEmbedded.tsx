import React from "react";
import styles from "./SolidAgent.module.css";
import { SolidAgentChat } from "./SolidAgentChat";
import { useAgentAvailability } from "./useAgentAvailability";
import type { AgentRuntimeType } from "./types";
import { withAgentId } from "./client/agentUrls";
import { useAdminInputContext, type AgentInputContext } from "./useAdminInputContext";
import type { AgentInputDefinition } from "./embed/agentEmbedProtocol";

type SharedProps = {
    title?: string;
    /** Additional key/value context sent with each message to the agent. */
    inputContext?: AgentInputContext;
    /** Values for the AgentHub agent's declared requiredInputs. */
    inputs?: Record<string, unknown>;
    /** AgentHub input schema; used by the admin test surface when no values were supplied. */
    requiredInputs?: AgentInputDefinition[];
    /** External bootstrap: the standalone route registers credentials for this private URL. */
    externalEmbed?: { agentUrl: string; onInputsLocked?: (locked: boolean) => void };
    /** Container height; the chat fills it. */
    height?: number | string;
    suggestions?: string[];
    className?: string;
    /** Adds the standard chat window controls with actions managed by the embedding surface. */
    windowControls?: {
        mode: "docked" | "maximized";
        onDock: () => void;
        onMaximize: () => void;
        onRestore: () => void;
        onClose: () => void;
    };
};

type Props = SharedProps & (
    | {
        /** SolidX runtime (setting solidxAgentBackendUrl); agent ID is optional. */
        agentRuntime?: "solidx";
        agentId?: number;
    }
    | {
        /** AgentHub runtime (setting solidxAgentHubBackendUrl); an agent ID is required. */
        agentRuntime: "agentHub";
        agentId: number;
    }
);

const AGENT_LABEL: Record<AgentRuntimeType, string> = { solidx: "SolidX Agent", agentHub: "AgentHub Agent" };

/**
 * The agent chat rendered inside a page (a tab or form widget) instead of the floating window.
 * With agentRuntime "solidx" it shares the same connection and thread as the launcher.
 */
export function SolidAgentEmbedded(props: Props) {
    const { agentRuntime = "solidx", agentId, inputContext: suppliedInputContext, height = 560, suggestions, className, windowControls } = props;
    const title = props.title ?? AGENT_LABEL[agentRuntime];
    const { ready, enabled, agentUrls, canUse } = useAgentAvailability(!props.externalEmbed);
    const inferredInputContext = useAdminInputContext();
    const inputContext = props.externalEmbed ? (suppliedInputContext ?? {}) : { ...inferredInputContext, ...(suppliedInputContext ?? {}) };
    if (!props.externalEmbed && !ready) return null;
    const backendUrl = agentUrls[agentRuntime] ?? null;
    // The chat URL names the agent, so each agent has its own login.
    const agentUrl = props.externalEmbed?.agentUrl ?? (backendUrl ? withAgentId(backendUrl, agentId) : null);
    if (!props.externalEmbed && (!enabled || !canUse)) {
        return <div className={styles.root} style={{ padding: 16, color: "var(--solid-agent-muted)" }}>{title} is not available for your account.</div>;
    }
    if (agentRuntime === "agentHub" && agentId === undefined) {
        return <div className={styles.root} style={{ padding: 16, color: "var(--solid-agent-muted)" }}>No agent is selected for the {AGENT_LABEL[agentRuntime]}.</div>;
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
            <SolidAgentChat key={agentUrl} agentUrl={agentUrl} agentRuntime={agentRuntime} title={title} inputContext={inputContext}
                inputs={props.inputs} requiredInputs={props.requiredInputs} externalEmbed={!!props.externalEmbed} onInputsLocked={props.externalEmbed?.onInputsLocked}
                embedded suggestions={suggestions} windowControls={windowControls} />
        </div>
    );
}
