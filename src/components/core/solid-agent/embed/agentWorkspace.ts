export type AgentWorkspaceMode = "docked" | "floating" | "fullscreen";

export type AgentWorkspaceAgent = {
    name: string;
    title: string;
};

export type AgentWorkspaceState = {
    mode: AgentWorkspaceMode;
    agents: AgentWorkspaceAgent[];
    selectedAgentName: string;
};

export type AgentWorkspaceAction = "dock" | "float" | "fullscreen" | "restore" | "close" | "selectAgent";

export type AgentWorkspaceControls = AgentWorkspaceState & {
    onAction: (action: AgentWorkspaceAction, agentName?: string) => void;
};

export function parseAgentWorkspaceState(value: unknown): AgentWorkspaceState | null {
    if (!value || typeof value !== "object") return null;
    const state = value as Partial<AgentWorkspaceState>;
    if (state.mode !== "docked" && state.mode !== "floating" && state.mode !== "fullscreen") return null;
    if (!Array.isArray(state.agents) || state.agents.length > 50 || typeof state.selectedAgentName !== "string") return null;
    if (!state.agents.every((agent) => agent && typeof agent.name === "string" && agent.name.length <= 128
        && typeof agent.title === "string" && agent.title.length <= 256)) return null;
    if (!state.agents.some((agent) => agent.name === state.selectedAgentName)) return null;
    return state as AgentWorkspaceState;
}
