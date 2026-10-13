import { eventBus } from "../../../../helpers/eventBus";
import { getSolidStoreDispatch } from "../../../../redux/store/solidEntityApiPool";
import { agentClosed, agentModeChanged, agentOpenRequested } from "../../../../redux/features/agentSlice";
import type { AgentContext, SolidAgentOpenOptions } from "../types";

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
} as const;

export type SolidAgentEventName = keyof typeof SOLID_AGENT_EVENTS;

export type SolidAgentEventPayloads = {
    turnComplete: { sessionId: string | null; content?: string };
    widgetAction: { widgetId: string; widget: string; value: unknown };
    sessionChanged: { sessionId: string | null };
};

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
    /** Subscribes to chat events; returns an unsubscribe function. */
    on<E extends SolidAgentEventName>(event: E, handler: (payload: SolidAgentEventPayloads[E]) => void) {
        return eventBus.on(SOLID_AGENT_EVENTS[event], handler);
    },
};
