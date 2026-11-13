import React from "react";
import { ExternalLink, Maximize2, Minimize2, PanelRight, X } from "lucide-react";
import type { AgentWorkspaceControls } from "./embed/agentWorkspace";
import { AgentWorkspaceAgentSelector } from "./AgentWorkspaceAgentSelector";
import styles from "./SolidAgent.module.css";

export function AgentWorkspaceHeaderActions({ mode, agents, selectedAgentName, onAction }: AgentWorkspaceControls) {
    return (
        <>
            {agents.length > 1 && <AgentWorkspaceAgentSelector compact agents={agents} selectedAgentName={selectedAgentName}
                onSelect={(agentName) => onAction("selectAgent", agentName)} />}
            {mode !== "docked" && (
                <button type="button" className={styles.iconBtn} title="Dock to the right" aria-label="Dock to the right" onClick={() => onAction("dock")}>
                    <PanelRight size={16} />
                </button>
            )}
            {mode !== "floating" && (
                <button type="button" className={styles.iconBtn} title="Float chat" aria-label="Float chat" onClick={() => onAction("float")}>
                    <ExternalLink size={16} />
                </button>
            )}
            <button type="button" className={styles.iconBtn} title={mode === "fullscreen" ? "Restore chat" : "Full screen"}
                aria-label={mode === "fullscreen" ? "Restore chat" : "Full screen"}
                onClick={() => onAction(mode === "fullscreen" ? "restore" : "fullscreen")}>
                {mode === "fullscreen" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button type="button" className={styles.iconBtn} title="Close chat" aria-label="Close chat" onClick={() => onAction("close")}>
                <X size={16} />
            </button>
        </>
    );
}
