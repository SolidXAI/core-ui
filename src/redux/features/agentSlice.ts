import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { applyAgentEvent, createThreadState, nextItemId, type AgentThreadState } from "../../components/core/solid-agent/agentEvents";
import {
    AgentEventTypes,
    type AgentAttachmentMeta,
    type AgentChatEvent,
    type AgentChatItem,
    type AgentConnection,
    type AgentContext,
    type AgentMessageContext,
    type AgentMode,
    type AgentUsageStats,
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
    loadingHistory: boolean;
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
    loadingHistory: false,
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
        agentUserMessageAdded(state, action: PayloadAction<{ text: string; attachments?: AgentAttachmentMeta[]; messageContext?: AgentMessageContext }>) {
            const { text, attachments, messageContext } = action.payload;
            state.items.push({
                id: nextItemId("u"),
                at: Date.now(),
                eventType: AgentEventTypes.userMessage,
                eventData: {
                    content: text,
                    ...(attachments?.length ? { attachments } : {}),
                    ...(messageContext ? { message_context: messageContext } : {}),
                },
            });
            state.working = true;
            state.thinking = true;
            state.turnStreamed = false;
            state.streamingId = null;
            state.liveToolId = null;
            state.authError = null;
        },
        agentThreadReset(state, action: PayloadAction<{ loadingHistory?: boolean; historySessionId?: string | null } | undefined>) {
            Object.assign(state, createThreadState(), {
                commands: state.commands,
                hasMoreHistory: false,
                historyPage: 1,
                historySessionId: action?.payload?.historySessionId ?? null,
                loadingHistory: action?.payload?.loadingHistory ?? false,
            });
        },
        agentHistoryLoadingStarted(state, action: PayloadAction<{ isOlder?: boolean } | undefined>) {
            if (action?.payload?.isOlder) {
                state.loadingOlder = true;
                state.olderHistoryFailed = false;
            } else {
                state.loadingHistory = true;
            }
        },
        agentOlderHistoryFailed(state) {
            state.loadingOlder = false;
            state.olderHistoryFailed = true;
        },
        agentHistoryLoadingChanged(state, action: PayloadAction<boolean>) {
            state.loadingHistory = action.payload;
            if (!action.payload) state.loadingOlder = false;
        },
        agentHistoryLoaded(state, action: PayloadAction<{ items: AgentChatItem[]; hasMore: boolean; page: number; usage?: AgentUsageStats | null }>) {
            const { items, hasMore, page, usage } = action.payload;
            // History is always older than anything already in the thread.
            state.items = [...items, ...state.items];
            state.hasMoreHistory = hasMore;
            state.historyPage = page;
            state.loadingHistory = false;
            state.loadingOlder = false;
            state.olderHistoryFailed = false;
            if (usage && (!state.usage || state.usage.totalTokens === 0)) {
                state.usage = {
                    ...usage,
                    contextLimit: state.usage?.contextLimit || usage.contextLimit || 0,
                };
            }
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
    agentHistoryLoadingStarted,
    agentOlderHistoryFailed,
    agentHistoryLoadingChanged,
    agentHistoryLoaded,
    agentEventReceived,
} = agentSlice.actions;

export default agentSlice.reducer;
