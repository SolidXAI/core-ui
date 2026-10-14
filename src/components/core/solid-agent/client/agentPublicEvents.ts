import type { AgentConnection, AgentRuntimeType } from "../types";

export type AgentPublicEventPayloads = {
    onConnectionStateChanged: { state: AgentConnection };
    onAfterUserMessageSend: { sessionId: string | null; source: "composer" | "sdk" | "prefill" | "widget"; deliveryStage: "sent" };
    onUserMessageFailed: { stage: "context" | "upload"; code: string; retryable: boolean };
    onUserMessageQueued: { source: "composer" | "sdk" | "prefill" | "widget"; hasAttachments: boolean; contextNamespaces: string[] };
    onCancelRequested: { sessionId: string };
    onNewChatRequested: { sessionId: string | null };
    onSessionStarted: { sessionId: string | null };
    onSessionResumed: { sessionId: string | null };
    onSessionEnded: { sessionId: string | null; reason: unknown };
    onAgentTurnStarted: { sessionId: string | null };
    onAgentResponseStarted: { sessionId: string | null };
    onAgentResponseCompleted: { sessionId: string | null };
    onAgentTurnCompleted: { sessionId: string | null; outcome: "completed" };
    onError: { stage: "runtime"; code: string; retryable: boolean };
    onHumanInputRequested: { sessionId: string | null; requestId: unknown; displayPayload?: string };
    onApprovalRequested: { sessionId: string | null; requestId: unknown; displayPayload?: string };
    onTurnCancelled: { sessionId: string | null };
};

export type AgentPublicEventName = keyof AgentPublicEventPayloads;
export type AgentPublicEvent = {
    [E in AgentPublicEventName]: { event: E; payload: AgentPublicEventPayloads[E]; agentType: AgentRuntimeType }
}[AgentPublicEventName];
export type AgentPublicEventListener = (event: AgentPublicEvent) => void;

const listeners = new Set<AgentPublicEventListener>();

export function onAgentPublicEvent(listener: AgentPublicEventListener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function emitAgentPublicEvent<E extends AgentPublicEventName>(
    event: E,
    payload: AgentPublicEventPayloads[E],
    agentType: AgentRuntimeType,
) {
    const notification = { event, payload, agentType } as AgentPublicEvent;
    for (const listener of Array.from(listeners)) {
        try {
            listener(notification);
        } catch (error) {
            console.error("[solid-agent] Public event listener failed", error);
        }
    }

    // Preserve the existing same-window event contract while consumers migrate to the typed bus.
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("solid-agent-embed:public-event", {
            detail: { event, payload, agentType },
        }));
    }
}
