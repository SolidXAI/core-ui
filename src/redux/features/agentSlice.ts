import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { applyAgentEvent, createThreadState, nextItemId, type AgentThreadState } from "../../components/core/solid-agent/agentEvents";
import {
    AgentEventTypes,
    type AgentAttachmentMeta,
    type AgentChatEvent,
    type AgentChatItem,
    type AgentConnection,
    type AgentContext,
    type AgentMode,
    type SolidAgentOpenOptions,
} from "../../components/core/solid-agent/types";

/**
 * State of the SolidX Agent chat: window mode, connection, and the single global thread.
 * The socket lives outside Redux (AgentRuntime); every normalised event is dispatched as
 * `agentEventReceived` and applied by the shared reducer in solid-agent/agentEvents.ts.
 */

export type AgentPrefill = { prompt: string; context?: AgentContext; autoSend?: boolean; nonce: number };

export type AgentState = AgentThreadState & {
    open: boolean;
    mode: AgentMode;
    connection: AgentConnection;
    prefill: AgentPrefill | null;
    hasMoreHistory: boolean;
    historyPage: number;
    /** Context of the last prompt sent from outside the chat (e.g. a Test Hub button). */
    context: AgentContext | null;
};

const initialState: AgentState = {
    ...createThreadState(),
    open: false,
    mode: "bubble",
    connection: "idle",
    prefill: null,
    hasMoreHistory: false,
    historyPage: 1,
    context: null,
};

const agentSlice = createSlice({
    name: "solidAgent",
    initialState,
    reducers: {
        agentOpenRequested(state, action: PayloadAction<SolidAgentOpenOptions | undefined>) {
            const options = action.payload ?? {};
            state.open = true;
            state.mode = options.mode ?? (state.mode === "bubble" ? "compact" : state.mode);
            if (options.prompt) {
                state.prefill = { prompt: options.prompt, context: options.context, autoSend: options.autoSend, nonce: Date.now() };
            }
            if (options.context) state.context = options.context;
        },
        agentClosed(state) {
            state.open = false;
            state.mode = "bubble";
        },
        agentModeChanged(state, action: PayloadAction<AgentMode>) {
            state.mode = action.payload;
            state.open = action.payload !== "bubble";
        },
        agentPrefillConsumed(state) {
            state.prefill = null;
        },
        agentConnectionChanged(state, action: PayloadAction<AgentConnection>) {
            state.connection = action.payload;
            if (action.payload !== "open" && state.working) {
                // A turn cannot finish on a dropped socket; unblock the composer.
                state.working = false;
                state.thinking = false;
            }
        },
        agentUserMessageAdded(state, action: PayloadAction<{ text: string; attachments?: AgentAttachmentMeta[] }>) {
            const { text, attachments } = action.payload;
            state.items.push({
                id: nextItemId("u"),
                at: Date.now(),
                eventType: AgentEventTypes.userMessage,
                eventData: attachments?.length ? { content: text, attachments } : { content: text },
            });
            state.working = true;
            state.thinking = true;
            state.turnStreamed = false;
            state.streamingId = null;
            state.liveToolId = null;
            state.authError = null;
        },
        agentThreadReset(state) {
            Object.assign(state, createThreadState(), { commands: state.commands, hasMoreHistory: false, historyPage: 1 });
        },
        agentHistoryLoaded(state, action: PayloadAction<{ items: AgentChatItem[]; hasMore: boolean; page: number }>) {
            const { items, hasMore, page } = action.payload;
            // History is always older than anything already in the thread.
            state.items = [...items, ...state.items];
            state.hasMoreHistory = hasMore;
            state.historyPage = page;
        },
        agentEventReceived(state, action: PayloadAction<AgentChatEvent>) {
            applyAgentEvent(state, action.payload);
        },
    },
});

export const {
    agentOpenRequested,
    agentClosed,
    agentModeChanged,
    agentPrefillConsumed,
    agentConnectionChanged,
    agentUserMessageAdded,
    agentThreadReset,
    agentHistoryLoaded,
    agentEventReceived,
} = agentSlice.actions;

export default agentSlice.reducer;
