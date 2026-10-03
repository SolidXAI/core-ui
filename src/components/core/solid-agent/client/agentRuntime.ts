import { eventBus } from "../../../../helpers/eventBus";
import {
    agentConnectionChanged,
    agentEventReceived,
    agentHistoryLoaded,
    agentThreadReset,
    agentUserMessageAdded,
    type AgentState,
} from "../../../../redux/features/agentSlice";
import { historyToItems, normalizeAgentFrame } from "../agentEvents";
import { SOLID_AGENT_EVENTS } from "../sdk/solidAgent";
import { AgentEventTypes, type AgentRuntimeType, type AgentAttachment, type AgentChatEvent, type AgentContext, type AgentWireFrame } from "../types";
import { resolveAttachmentMedia } from "./agentAttachmentMedia";
import { clearAllAgentAuth } from "./agentAuth";
import { fetchSessionHistory, uploadAgentAttachments } from "./agentRest";
import { AgentSocket } from "./agentSocket";
import { agentIdOf } from "./agentUrls";

/**
 * A live connection to one agent backend. The "solidx" runtime is shared by the floating window and
 * any embedded chat of that type (ensureAgentRuntime); other types get their own runtime per
 * embedded chat (see useAgentChat). Owns the AgentSocket, normalises frames to `{ eventType, eventData }`, batches LlmToken
 * deltas to one dispatch per animation frame, loads history on session start, and emits the
 * public SDK events on the event bus.
 */

type Dispatch = (action: any) => any;
type GetAgentState = () => AgentState | undefined;

/** Keep the original SolidX storage key; Agent Hub keeps one per agent (its agent URL names the agent). */
function sessionKey(agentRuntime: AgentRuntimeType, agentUrl: string) {
    if (agentRuntime === "solidx") return "solid-agent.session_id";
    const agentId = agentIdOf(agentUrl);
    return agentId === undefined ? `solid-agent.${agentRuntime}.session_id` : `solid-agent.${agentRuntime}.${agentId}.session_id`;
}

function readSessionId(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeSessionId(key: string, id: string | null) {
    try {
        id ? localStorage.setItem(key, id) : localStorage.removeItem(key);
    } catch {
        // Storage blocked (private mode); the session just won't survive a reload.
    }
}

export class AgentRuntime {
    readonly socket: AgentSocket;
    private pendingDelta = "";
    private frame: number | null = null;
    private unsubscribers: Array<() => void> = [];
    private lastContext: AgentContext | undefined;

    private readonly sessionKey: string;

    constructor(
        readonly agentUrl: string,
        private dispatch: Dispatch,
        private getState: GetAgentState,
        readonly agentRuntime: AgentRuntimeType = "solidx",
    ) {
        this.sessionKey = sessionKey(agentRuntime, agentUrl);
        this.socket = new AgentSocket(agentUrl, readSessionId(this.sessionKey), agentRuntime === "agentHub");
        this.unsubscribers.push(
            this.socket.onEvent((frame) => this.handleFrame(frame)),
            this.socket.onStatus((status) => this.dispatch(agentConnectionChanged(status))),
        );
        this.socket.connect();
    }

    /**
     * Uploads files into SolidX media storage first, then sends their IDs with the socket message.
     */
    async sendMessage(text: string, context?: AgentContext, attachments: AgentAttachment[] = []) {
        const content = text.trim();
        if (!content && !attachments.length) return;
        const uploaded = attachments.length
            ? await uploadAgentAttachments(this.agentUrl, attachments.map((item) => item.file))
            : [];
        if (uploaded.length !== attachments.length) {
            throw new Error("SolidX did not confirm every uploaded file. Please retry.");
        }
        if (context) this.lastContext = context;
        const displayAttachments = attachments.map((item, index) => ({
            ...item.meta,
            ...(uploaded[index] ? { mediaId: uploaded[index].id } : {}),
        }));
        this.dispatch(agentUserMessageAdded({ text: content, attachments: displayAttachments }));
        this.socket.send({
            action: "message",
            session_id: this.socket.currentSessionId ?? "",
            content,
            context: context ?? this.lastContext,
            ...(attachments.length ? { attachments: uploaded } : {}),
        });
    }

    /** Answers a widget. Sent as text too, so agents without widget_reply support still understand it. */
    replyToWidget(widgetId: string, widget: string, value: unknown) {
        const text = typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : JSON.stringify(value);
        this.dispatch(agentUserMessageAdded({ text }));
        this.socket.send({
            action: "message",
            session_id: this.socket.currentSessionId ?? "",
            content: text,
            context: this.lastContext,
            widget_reply: { widgetId, value },
        });
        eventBus.emit(SOLID_AGENT_EVENTS.widgetAction, { widgetId, widget, value, agentType: this.agentRuntime });
    }

    cancel() {
        const sessionId = this.socket.currentSessionId;
        if (sessionId) this.socket.send({ action: "cancel", session_id: sessionId });
    }

    newChat() {
        writeSessionId(this.sessionKey, null);
        this.lastContext = undefined;
        this.dispatch(agentThreadReset());
        this.socket.newSession();
    }

    resume(sessionId: string) {
        writeSessionId(this.sessionKey, sessionId);
        this.dispatch(agentThreadReset());
        this.socket.resume(sessionId);
    }

    async loadOlder() {
        const state = this.getState();
        if (!state?.historySessionId || !state.hasMoreHistory) return;
        await this.loadHistory(state.historySessionId, state.historyPage + 1);
    }

    dispose() {
        this.unsubscribers.forEach((off) => off());
        if (this.frame != null) cancelAnimationFrame(this.frame);
        this.socket.close();
    }

    private async loadHistory(historySessionId: string, page: number) {
        try {
            const result = await fetchSessionHistory(this.agentUrl, historySessionId, page);
            if (!result) return;
            // Attached files are stored in Solid media storage; resolve their URLs before showing.
            const items = await resolveAttachmentMedia(historyToItems(result.messages ?? []));
            this.dispatch(agentHistoryLoaded({ items, hasMore: !!result.has_more, page }));
        } catch {
            // History is a convenience; the live session still works without it.
        }
    }

    private handleFrame(frame: AgentWireFrame) {
        const event = normalizeAgentFrame(frame);

        // Stream text is batched per animation frame unless it carries a widget of its own.
        if (event.eventType === AgentEventTypes.llmToken && !event.eventData.widget) {
            this.pendingDelta += event.eventData.delta ?? "";
            if (this.frame == null) this.frame = requestAnimationFrame(() => this.flushTokens());
            return;
        }
        // Keep order: any buffered text lands before the next event.
        this.flushTokens();
        this.dispatch(agentEventReceived(event));
        this.emitSdkEvents(event);
    }

    private emitSdkEvents(event: AgentChatEvent) {
        if (event.eventType === AgentEventTypes.sessionStarted) {
            const sessionId = event.frame.session_id ?? event.eventData.session_id ?? null;
            writeSessionId(this.sessionKey, sessionId);
            eventBus.emit(SOLID_AGENT_EVENTS.sessionChanged, { sessionId, agentType: this.agentRuntime });
            const state = this.getState();
            const historyId = event.frame.history_session_id ?? event.eventData.history_session_id ?? sessionId;
            if (state && state.items.length === 0 && historyId) void this.loadHistory(historyId, 1);
        } else if (event.eventType === AgentEventTypes.turnComplete || event.eventType === AgentEventTypes.turnCompleteLegacy) {
            eventBus.emit(SOLID_AGENT_EVENTS.turnComplete, {
                sessionId: this.socket.currentSessionId,
                agentType: this.agentRuntime,
                content: event.eventData.content ?? event.frame.content,
            });
        }
    }

    private flushTokens() {
        if (this.frame != null) {
            cancelAnimationFrame(this.frame);
            this.frame = null;
        }
        if (!this.pendingDelta) return;
        const delta = this.pendingDelta;
        this.pendingDelta = "";
        this.dispatch(agentEventReceived(normalizeAgentFrame({ event_type: AgentEventTypes.llmToken, event_data: { delta } })));
    }
}

let runtime: AgentRuntime | null = null;

/** Returns the shared "solidx" runtime, creating (or re-pointing) it for `agentUrl`. */
export function ensureAgentRuntime(agentUrl: string, dispatch: Dispatch, getState: GetAgentState): AgentRuntime {
    if (runtime && runtime.agentUrl === agentUrl) return runtime;
    runtime?.dispose();
    runtime = new AgentRuntime(agentUrl, dispatch, getState);
    return runtime;
}

export function getAgentRuntime(): AgentRuntime | null {
    return runtime;
}

/** Closes the connection and forgets this tab's agent logins (e.g. on logout). */
export function disposeAgentRuntime() {
    runtime?.dispose();
    runtime = null;
    clearAllAgentAuth();
}
