import { eventBus } from "../../../../helpers/eventBus";
import { getSolidStoreDispatch } from "../../../../redux/store/solidEntityApiPool";
import { agentClosed, agentModeChanged, agentOpenRequested } from "../../../../redux/features/agentSlice";
import type { AgentContext, AgentRuntimeType, SolidAgentOpenOptions } from "../types";

/**
 * Imperative API for the SolidX Agent chat, usable from any component, hook or extension
 * function (same idea as `showToast`). The chat itself is rendered once by SolidAgentHost.
 *
 *   solidAgent.open({ prompt: "Author a login scenario", autoSend: true, context: { module: "test-hub", recordId: 2 } });
 */

export const SOLID_AGENT_EVENTS = {
    turnComplete: "solidAgent:turnComplete",
    widgetAction: "solidAgent:widgetAction",
    sessionChanged: "solidAgent:sessionChanged",
    liveFrame: "solidAgent:liveFrame",
    liveStatus: "solidAgent:liveStatus",
} as const;

export type SolidAgentEventName = keyof typeof SOLID_AGENT_EVENTS;

export type SolidAgentEventPayloads = {
    turnComplete: { sessionId: string | null; content?: string };
    widgetAction: { widgetId: string; widget: string; value: unknown };
    sessionChanged: { sessionId: string | null; agentType?: AgentRuntimeType; provider?: string; model?: string | null };
    /** One picture of an authoring browser session (a "ui session"), sent while someone is subscribed to it. */
    liveFrame: { uiSessionId: string; data: string; meta: { w?: number; h?: number; ts?: number } };
    /**
     * Whether a session's live picture is on. `live: true` after a subscribe the agent accepted; `live: false` when it
     * refused (an unknown or closed session, or live preview turned off) or when the session ended.
     */
    liveStatus: { uiSessionId: string; live: boolean; reason?: string };
};

/**
 * Internal: the SDK asks the chat runtime to subscribe to or unsubscribe from a session's live frames. Kept off
 * SOLID_AGENT_EVENTS so the runtime and this file do not import each other.
 */
export const LIVE_REQUEST_EVENT = "solidAgent:liveRequest";
export type LiveRequestPayload = { uiSessionId: string; subscribe: boolean };

function dispatch(action: any) {
    const storeDispatch = getSolidStoreDispatch();
    if (!storeDispatch) {
        console.warn("[solidAgent] The Solid store is not ready yet; call solidAgent after the app has mounted.");
        return;
    }
    storeDispatch(action);
}

export const solidAgent = {
    /** Opens the chat window, optionally prefilling (and sending) a prompt with page context. */
    open(options?: SolidAgentOpenOptions) {
        dispatch(agentOpenRequested(options));
    },
    /** Sends a prompt straight away (opens the window if it is closed). */
    send(prompt: string, context?: AgentContext) {
        dispatch(agentOpenRequested({ prompt, context, autoSend: true }));
    },
    /** Collapses the window back to the floating bubble; the session keeps running. */
    minimize() {
        dispatch(agentModeChanged("bubble"));
    },
    close() {
        dispatch(agentClosed());
    },
    /**
     * Starts streaming the live picture of an authoring browser session into this chat. Frames arrive as the
     * "liveFrame" event. Only subscribed sessions are streamed, and streaming stops after the last unsubscribe.
     */
    liveSubscribe(uiSessionId: string) {
        eventBus.emit(LIVE_REQUEST_EVENT, { uiSessionId, subscribe: true } satisfies LiveRequestPayload);
    },
    liveUnsubscribe(uiSessionId: string) {
        eventBus.emit(LIVE_REQUEST_EVENT, { uiSessionId, subscribe: false } satisfies LiveRequestPayload);
    },
    /** Subscribes to chat events; returns an unsubscribe function. */
    on<E extends SolidAgentEventName>(event: E, handler: (payload: SolidAgentEventPayloads[E]) => void) {
        return eventBus.on(SOLID_AGENT_EVENTS[event], handler);
    },
};
