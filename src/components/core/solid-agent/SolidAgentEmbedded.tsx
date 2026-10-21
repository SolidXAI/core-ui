import React from "react";
import { MessageSquareText, X } from "lucide-react";
import styles from "./SolidAgent.module.css";
import { SolidAgentChat } from "./SolidAgentChat";
import { useAgentAvailability } from "./useAgentAvailability";
import type { AgentRuntimeType } from "./types";
import { withAgentId } from "./client/agentUrls";
import { useAdminInputContext, type AgentInputContext } from "./useAdminInputContext";
import type { AgentInputDefinition } from "./embed/agentEmbedProtocol";
import type { BeforeUserMessageSendRequest, EmbedMessageContext } from "./embed/agentEmbedProtocol";

type SharedProps = {
    title?: string;
    /** Additional key/value context sent with each message to the agent. */
    inputContext?: AgentInputContext;
    /** Values for the AgentHub agent's declared requiredInputs. */
    inputs?: Record<string, unknown>;
    /** AgentHub input schema; used by the admin test surface when no values were supplied. */
    requiredInputs?: AgentInputDefinition[];
    /** External bootstrap: the standalone route registers credentials for this private URL. */
    externalEmbed?: {
        agentUrl: string;
        onInputsLocked?: (locked: boolean) => void;
        beforeSend?: (request: BeforeUserMessageSendRequest, signal: AbortSignal) => Promise<EmbedMessageContext>;
    };
    /** Container height; the chat fills it. */
    height?: number | string;
    suggestions?: string[];
    className?: string;
    /** AgentHub configuration version to display in the header. */
    agentVersion?: number;
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
    const { ready, enabled, loadFailed, agentUrls, canUse } = useAgentAvailability(!props.externalEmbed);
    const inferredInputContext = useAdminInputContext();
    const inputContext = props.externalEmbed ? (suppliedInputContext ?? {}) : { ...inferredInputContext, ...(suppliedInputContext ?? {}) };
    if (!props.externalEmbed && !ready) return null;
    const backendUrl = agentUrls[agentRuntime] ?? null;
    // The chat URL names the agent, so each agent has its own login.
    const agentUrl = props.externalEmbed?.agentUrl ?? (backendUrl ? withAgentId(backendUrl, agentId) : null);
    const unavailable = !props.externalEmbed && loadFailed
        ? { heading: "Could not check agent availability", detail: "The agent settings could not be loaded. Close this window and try again." }
        : !props.externalEmbed && !enabled
        ? { heading: "Agent chat is disabled", detail: "Enable SolidX Agent Enabled in Settings to test this agent." }
        : !props.externalEmbed && !canUse
            ? { heading: "Permission required", detail: "Your account needs the agent:invoke permission to test this agent." }
            : agentRuntime === "agentHub" && agentId === undefined
                ? { heading: "No agent selected", detail: "Select an agent to start a test conversation." }
                : !agentUrl
                    ? { heading: "Backend URL is missing", detail: `Configure the ${agentRuntime === "agentHub" ? "SolidX Agent Hub" : "SolidX Agent"} Backend URL in Settings to use this agent.` }
                    : null;
    if (unavailable) {
        return (
            <div className={`${styles.root} ${styles.unavailableRoot} ${className ?? ""}`} style={{ height }}>
                {windowControls && (
                    <div className={styles.unavailableHeader}>
                        <strong>{title}</strong>
                        <button type="button" className={styles.iconBtn} aria-label="Close test agent" title="Close test agent" onClick={windowControls.onClose}>
                            <X size={16} />
                        </button>
                    </div>
                )}
                <div className={styles.unavailableBody}>
                    <div className={styles.unavailableCard} role="status">
                        <span className={styles.unavailableIcon}><MessageSquareText size={21} /></span>
                        <h3 className={styles.unavailableTitle}>{unavailable.heading}</h3>
                        <p className={styles.unavailableDescription}>{unavailable.detail}</p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div
            className={`${styles.root} ${className ?? ""}`}
            style={{ height, display: "flex", flexDirection: "column", border: "1px solid var(--solid-agent-border)", borderRadius: 12, overflow: "hidden", background: "var(--solid-agent-bg)" }}
        >
            {/* key: switching type remounts the chat onto the other backend's conversation. */}
            <SolidAgentChat key={agentUrl} agentUrl={agentUrl!} agentRuntime={agentRuntime} title={title} agentVersion={props.agentVersion} inputContext={inputContext}
                inputs={props.inputs} requiredInputs={props.requiredInputs} externalEmbed={!!props.externalEmbed} onInputsLocked={props.externalEmbed?.onInputsLocked}
                beforeSend={props.externalEmbed?.beforeSend}
                embedded suggestions={suggestions} windowControls={windowControls} />
        </div>
    );
}
