import { eventBus } from "../../../../helpers/eventBus";
import { getAgentChatWidgetCatalog } from "../../../../helpers/registry";
import {
    agentConnectionChanged,
    agentEventReceived,
    agentHistoryLoaded,
    agentThreadReset,
    agentUserMessageAdded,
    type AgentState,
} from "../../../../redux/features/agentSlice";
import { historyToItems, isSameAssistantContent, normalizeAgentFrame } from "../agentEvents";
import { parseWidgetContent } from "../thread/inlineWidget";
import { SOLID_AGENT_EVENTS } from "../sdk/solidAgent";
import { emitBeforeUserMessageSend, type BeforeUserMessageSendContribution } from "./beforeUserMessageSend";
import { emitAgentPublicEvent, type AgentPublicEventName, type AgentPublicEventPayloads } from "./agentPublicEvents";
import { AgentEventTypes, type AgentRuntimeType, type AgentAttachment, type AgentChatEvent, type AgentContext, type AgentMessageContext, type AgentSessionOptions, type AgentWireFrame } from "../types";
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

export function getStoredProvider(): string {
    try {
        return localStorage.getItem("solid-agent.provider") || "solidx";
    } catch {
        return "solidx";
    }
}

export function getStoredModel(provider: string): string | null {
    try {
        return localStorage.getItem(`solid-agent.model.${provider}`);
    } catch {
        return null;
    }
}

export function setStoredProviderAndModel(provider: string, model?: string) {
    try {
        localStorage.setItem("solid-agent.provider", provider);
        if (model) localStorage.setItem(`solid-agent.model.${provider}`, model);
    } catch {
        // Storage blocked
    }
}

export function getStoredThinking(provider: string): boolean {
    try {
        const saved = localStorage.getItem(`solid-agent.thinking.${provider}`);
        return saved === "true";
    } catch {
        return false;
    }
}

export function getStoredReasoning(provider: string): string | null {
    try {
        return localStorage.getItem(`solid-agent.reasoning.${provider}`);
    } catch {
        return null;
    }
}

export function getStoredFast(provider: string): boolean {
    try {
        const saved = localStorage.getItem(`solid-agent.fast.${provider}`);
        return saved === "true";
    } catch {
        return false;
    }
}

export function getStoredSpeed(provider: string): string | null {
    try {
        return localStorage.getItem(`solid-agent.speed.${provider}`);
    } catch {
        return null;
    }
}

export function setStoredSessionOptions(
    provider: string,
    opts: { thinking?: boolean; reasoning?: string | null; fast?: boolean; speed?: string | null },
) {
    try {
        if (opts.thinking !== undefined) localStorage.setItem(`solid-agent.thinking.${provider}`, String(opts.thinking));
        if (opts.reasoning !== undefined) {
            opts.reasoning ? localStorage.setItem(`solid-agent.reasoning.${provider}`, opts.reasoning) : localStorage.removeItem(`solid-agent.reasoning.${provider}`);
        }
        if (opts.fast !== undefined) localStorage.setItem(`solid-agent.fast.${provider}`, String(opts.fast));
        if (opts.speed !== undefined) {
            opts.speed ? localStorage.setItem(`solid-agent.speed.${provider}`, opts.speed) : localStorage.removeItem(`solid-agent.speed.${provider}`);
        }
    } catch {
        // Storage blocked
    }
}

export class AgentRuntime {
    readonly socket: AgentSocket;
    private pendingDelta = "";
    private frame: number | null = null;
    private unsubscribers: Array<() => void> = [];
    private lastContext: AgentContext | undefined;
    private responseStarted = false;
    private hadPriorSession = false;
    private preparationControllers = new Set<AbortController>();
    private historySessionId: string | null = null;
    private historyGeneration = 0;
    private loadingHistoryPages = new Map<string, number>();
    private loadedHistoryPages = new Set<string>();

    private readonly sessionKey: string;

    constructor(
        readonly agentUrl: string,
        private dispatch: Dispatch,
        private getState: GetAgentState,
        readonly agentRuntime: AgentRuntimeType = "solidx",
        private persistSession = true,
    ) {
        this.sessionKey = sessionKey(agentRuntime, agentUrl);
        const initialProvider = getStoredProvider();
        const initialModel = getStoredModel(initialProvider);
        const initialOptions: AgentSessionOptions = {
            thinking: getStoredThinking(initialProvider),
            reasoning: getStoredReasoning(initialProvider) ?? undefined,
            fast: getStoredFast(initialProvider),
            speed: getStoredSpeed(initialProvider) ?? undefined,
        };
        this.socket = new AgentSocket(
            agentUrl,
            persistSession ? readSessionId(this.sessionKey) : null,
            agentRuntime === "agentHub",
            initialProvider,
            initialModel,
            initialOptions,
            agentRuntime === "agentHub" ? getAgentChatWidgetCatalog() : [],
        );
        this.socket.setOnSessionExpired(() => {
            if (this.persistSession) writeSessionId(this.sessionKey, null);
            this.dispatch(agentThreadReset());
        });
        this.hadPriorSession = !!this.socket.currentSessionId;
        this.unsubscribers.push(
            this.socket.onEvent((frame) => this.handleFrame(frame)),
            this.socket.onStatus((status) => {
                queueMicrotask(() => this.dispatch(agentConnectionChanged(status)));
            }),
            this.socket.onStatus((status) => this.publish("onConnectionStateChanged", { state: status })),
            this.socket.onSent((action) => {
                if (action.action === "message") this.publish("onAfterUserMessageSend", { sessionId: action.session_id, source: action.source ?? "composer", deliveryStage: "sent" });
            }),
        );
        this.socket.connect();
    }

    updateStore(dispatch: Dispatch, getState: GetAgentState) {
        this.dispatch = dispatch;
        this.getState = getState;
    }

    /**
     * Uploads files into SolidX media storage first, then sends their IDs with the socket message.
     */
    async sendMessage(
        text: string,
        context?: AgentContext,
        attachments: AgentAttachment[] = [],
        inputs?: Record<string, unknown>,
        beforeSend?: (request: { text: string; source: "composer" | "sdk" | "prefill" | "widget"; attachments: Array<{ name: string; mimeType: string; size: number }> }, signal: AbortSignal) => Promise<AgentMessageContext | AgentContext | undefined>,
        source: "composer" | "sdk" | "prefill" | "widget" = "composer",
        widgetReply?: { widgetId: string; value: unknown },
    ) {
        const content = text;
        if (!content.trim() && !attachments.length) return;
        const controller = new AbortController();
        this.preparationControllers.add(controller);
        let messageContext: AgentMessageContext | undefined;
        let contributedInputContext: AgentContext | undefined;
        try {
            const request = {
                text: content,
                source,
                attachments: attachments.map(({ meta }) => ({ name: meta.name, mimeType: meta.mimeType, size: meta.size })),
            };
            const contributions: BeforeUserMessageSendContribution[] = this.agentRuntime === "solidx"
                ? await emitBeforeUserMessageSend(request, controller.signal)
                : [];
            if (beforeSend) contributions.push(await beforeSend(request, controller.signal));
            for (const contribution of contributions) {
                if (contribution && typeof contribution === "object" && "schemaVersion" in contribution
                    && contribution.schemaVersion === 1 && "namespaces" in contribution) {
                    const incoming = contribution as AgentMessageContext;
                    messageContext = {
                        schemaVersion: 1,
                        namespaces: { ...(messageContext?.namespaces ?? {}), ...incoming.namespaces },
                    };
                } else if (contribution && typeof contribution === "object") {
                    contributedInputContext = { ...(contributedInputContext ?? {}), ...contribution };
                }
            }
        } catch (error) {
            this.publish("onUserMessageFailed", { stage: "context", code: "context_preparation_failed", retryable: true });
            throw error;
        } finally {
            this.preparationControllers.delete(controller);
        }
        if (controller.signal.aborted) throw new Error("Message preparation was cancelled.");
        const uploaded = attachments.length
            ? await uploadAgentAttachments(this.agentUrl, attachments.map((item) => item.file))
            : [];
        if (uploaded.length !== attachments.length) {
            this.publish("onUserMessageFailed", { stage: "upload", code: "attachment_upload_failed", retryable: true });
            throw new Error("SolidX did not confirm every uploaded file. Please retry.");
        }
        this.publish("onUserMessageQueued", { source, hasAttachments: attachments.length > 0,
            contextNamespaces: messageContext ? Object.keys(messageContext.namespaces) : [] });
        this.responseStarted = false;
        if (context) this.lastContext = context;
        const displayAttachments = attachments.map((item, index) => ({
            ...item.meta,
            ...(uploaded[index] ? { mediaId: uploaded[index].id } : {}),
        }));
        this.dispatch(agentUserMessageAdded({ text: content, attachments: displayAttachments, messageContext }));
        this.socket.send({
            action: "message",
            session_id: this.socket.currentSessionId ?? "",
            content,
            source,
            context: contributedInputContext
                ? { ...(context ?? this.lastContext ?? {}), ...contributedInputContext }
                : context ?? this.lastContext,
            ...(messageContext ? { message_context: messageContext } : {}),
            ...(this.agentRuntime === "agentHub" && inputs ? { inputs } : {}),
            ...(attachments.length ? { attachments: uploaded } : {}),
            ...(widgetReply ? { widget_reply: widgetReply } : {}),
        });
    }

    /** Answers a widget. Sent as text too, so agents without widget_reply support still understand it. */
    async replyToWidget(widgetId: string, widget: string, value: unknown,
        beforeSend?: Parameters<AgentRuntime["sendMessage"]>[4]) {
        const text = typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : JSON.stringify(value);
        await this.sendMessage(text, this.lastContext, [], undefined, beforeSend, "widget", { widgetId, value });
        // The text message uses the shared preparation path. Keep the structured widget
        // value as a separate event for consumers that handle widget replies.
        eventBus.emit(SOLID_AGENT_EVENTS.widgetAction, { widgetId, widget, value, agentType: this.agentRuntime });
    }

    cancel() {
        const sessionId = this.socket.currentSessionId;
        if (sessionId) {
            this.publish("onCancelRequested", { sessionId });
            this.socket.send({ action: "cancel", session_id: sessionId });
        }
    }

    newChat(provider?: string, model?: string, opts?: AgentSessionOptions) {
        this.publish("onNewChatRequested", { sessionId: this.socket.currentSessionId });
        this.hadPriorSession = false;
        this.resetHistoryLoads();
        if (this.persistSession) writeSessionId(this.sessionKey, null);
        if (provider) setStoredProviderAndModel(provider, model);
        if (provider && opts) setStoredSessionOptions(provider, opts);
        this.lastContext = undefined;
        this.dispatch(agentThreadReset());
        this.socket.newSession({ ...(provider ? { provider, model } : {}), ...(opts || {}) });
    }

    updateModel(model: string, provider?: string, opts?: AgentSessionOptions) {
        const activeProvider = provider ?? this.socket.currentProvider ?? getStoredProvider();
        setStoredProviderAndModel(activeProvider, model);
        if (opts) setStoredSessionOptions(activeProvider, opts);
        this.socket.updateSession({ provider: activeProvider, model, ...(opts || {}) });
    }

    updateSessionOptions(opts: AgentSessionOptions) {
        const activeProvider = this.socket.currentProvider ?? getStoredProvider();
        setStoredSessionOptions(activeProvider, opts);
        this.socket.updateSession(opts);
    }

    resume(sessionId: string, provider?: string, model?: string, opts?: AgentSessionOptions) {
        this.hadPriorSession = true;
        this.resetHistoryLoads();
        if (this.persistSession) writeSessionId(this.sessionKey, sessionId);
        if (provider) setStoredProviderAndModel(provider, model);
        if (provider && opts) setStoredSessionOptions(provider, opts);
        this.dispatch(agentThreadReset());
        this.socket.resume(sessionId, { ...(provider ? { provider, model } : {}), ...(opts || {}) });
    }

    async loadOlder() {
        const state = this.getState();
        if (!state?.historySessionId || !state.hasMoreHistory) return;
        await this.loadHistory(state.historySessionId, state.historyPage + 1);
    }

    private resetHistoryLoads() {
        this.historyGeneration += 1;
        this.historySessionId = null;
        this.loadingHistoryPages.clear();
        this.loadedHistoryPages.clear();
    }

    dispose() {
        this.preparationControllers.forEach((controller) => controller.abort());
        this.preparationControllers.clear();
        this.resetHistoryLoads();
        this.unsubscribers.forEach((off) => off());
        if (this.frame != null) cancelAnimationFrame(this.frame);
        this.socket.close();
    }

    private async loadHistory(historySessionId: string, page: number) {
        const key = `${historySessionId}:${page}`;
        if (this.loadingHistoryPages.has(key) || this.loadedHistoryPages.has(key)) return;
        const generation = this.historyGeneration;
        this.loadingHistoryPages.set(key, generation);
        try {
            const result = await fetchSessionHistory(this.agentUrl, historySessionId, page);
            this.loadedHistoryPages.add(key);
            if (!result) return;
            // Attached files are stored in Solid media storage; resolve their URLs before showing.
            const rawItems = historyToItems(result.messages ?? []);
            const items = this.persistSession ? await resolveAttachmentMedia(rawItems) : rawItems;
            if (generation !== this.historyGeneration || this.getState()?.historySessionId !== historySessionId) return;
            const sessionUsage = result.session_usage;
            this.dispatch(agentHistoryLoaded({
                items,
                hasMore: !!result.has_more,
                page,
                ...(sessionUsage ? {
                    usage: {
                        totalCost: sessionUsage.total_cost ?? 0,
                        totalInputTokens: sessionUsage.total_input_tokens ?? 0,
                        totalOutputTokens: sessionUsage.total_output_tokens ?? 0,
                        totalTokens: sessionUsage.total_tokens ?? 0,
                        contextTokens: sessionUsage.total_input_tokens ?? 0,
                        contextLimit: 0,
                    },
                } : {}),
            }));
        } catch {
            // History is a convenience; the live session still works without it.
            this.loadedHistoryPages.add(key);
        } finally {
            if (this.loadingHistoryPages.get(key) === generation) this.loadingHistoryPages.delete(key);
        }
    }

    private handleFrame(frame: AgentWireFrame) {
        const event = normalizeAgentFrame(frame);
        if (event.eventType === AgentEventTypes.sessionStarted) {
            const sessionId = frame.session_id ?? event.eventData.session_id ?? null;
            this.publish(this.hadPriorSession ? "onSessionResumed" : "onSessionStarted", { sessionId });
            this.hadPriorSession = true;
        }
        else if (event.eventType === AgentEventTypes.sessionEnded) this.publish("onSessionEnded", { sessionId: this.socket.currentSessionId, reason: event.eventData.reason ?? "ended" });
        else if (event.eventType === AgentEventTypes.agentStarted) this.publish("onAgentTurnStarted", { sessionId: this.socket.currentSessionId });
        else if ((event.eventType === AgentEventTypes.llmToken || event.eventType === AgentEventTypes.llmComplete)
            && !event.eventData.widget && !this.responseStarted) {
            this.responseStarted = true;
            this.publish("onAgentResponseStarted", { sessionId: this.socket.currentSessionId });
        }
        else if (event.eventType === AgentEventTypes.turnComplete || event.eventType === AgentEventTypes.turnCompleteLegacy) {
            this.publish("onAgentResponseCompleted", { sessionId: this.socket.currentSessionId });
            const completedContent = event.eventData.content ?? event.frame.content;
            const inline = parseWidgetContent(completedContent);
            if (inline?.widget === "navigation-intent" && inline.data.schemaVersion === 1
                && inline.data.kind === "navigation" && typeof inline.data.domain === "string"
                && inline.data.payload && typeof inline.data.payload === "object" && !Array.isArray(inline.data.payload)) {
                this.publish("onAgentNavigationRequested", {
                    schemaVersion: 1,
                    kind: "navigation",
                    domain: inline.data.domain,
                    payload: inline.data.payload as Record<string, unknown>,
                    ...(typeof inline.data.message === "string" ? { message: inline.data.message } : {}),
                    sessionId: this.socket.currentSessionId,
                });
            }
            this.publish("onAgentTurnCompleted", { sessionId: this.socket.currentSessionId, outcome: "completed" });
        } else if (event.eventType === AgentEventTypes.agentError || event.eventType === AgentEventTypes.error) {
            this.publish("onError", { stage: "runtime", code: "agent_error", retryable: false });
        } else if (event.eventType === "HumanRequestCreated") {
            const approval = event.eventData.kind === "approval";
            this.publish(approval ? "onApprovalRequested" : "onHumanInputRequested", {
                sessionId: this.socket.currentSessionId,
                requestId: event.eventData.request_id,
                ...(typeof event.eventData.question === "string" ? { displayPayload: event.eventData.question.slice(0, 1024) } : {}),
            });
        } else if (event.eventType === AgentEventTypes.executionCancelled || event.eventType === AgentEventTypes.executionCancelledLegacy) {
            this.publish("onTurnCancelled", { sessionId: this.socket.currentSessionId });
        }

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

    private publish<E extends AgentPublicEventName>(event: E, payload: AgentPublicEventPayloads[E]) {
        emitAgentPublicEvent(event, payload, this.agentRuntime);
    }

    private lastTurnCompleteContent: string | null = null;
    private lastTurnCompleteTime = 0;

    private emitSdkEvents(event: AgentChatEvent) {
        if (event.eventType === AgentEventTypes.userMessage || event.eventType === AgentEventTypes.agentStarted) {
            this.lastTurnCompleteContent = null;
            this.lastTurnCompleteTime = 0;
        } else if (event.eventType === AgentEventTypes.sessionStarted || event.eventType === AgentEventTypes.sessionUpdated) {
            const sessionId = event.frame.session_id ?? event.eventData.session_id ?? null;
            const provider = event.frame.provider ?? event.eventData.provider ?? this.socket.currentProvider;
            const model = event.frame.model ?? event.eventData.model ?? this.socket.currentModel;
            if (this.persistSession && sessionId) writeSessionId(this.sessionKey, sessionId);
            if (provider) setStoredProviderAndModel(provider, model ?? undefined);
            eventBus.emit(SOLID_AGENT_EVENTS.sessionChanged, { sessionId, agentType: this.agentRuntime, provider, model });
            const state = this.getState();
            const historyId = event.frame.history_session_id ?? event.eventData.history_session_id ?? sessionId;
            if (historyId !== this.historySessionId) {
                this.resetHistoryLoads();
                this.historySessionId = historyId;
            }
            if (event.eventType === AgentEventTypes.sessionStarted && state && state.items.length === 0 && historyId) {
                void this.loadHistory(historyId, 1);
            }
        } else if (event.eventType === AgentEventTypes.turnComplete || event.eventType === AgentEventTypes.turnCompleteLegacy) {
            const content = event.eventData.content ?? event.frame.content;
            const now = Date.now();
            if (now - this.lastTurnCompleteTime < 1500 && isSameAssistantContent(this.lastTurnCompleteContent ?? undefined, typeof content === "string" ? content : undefined)) {
                return;
            }
            this.lastTurnCompleteTime = now;
            this.lastTurnCompleteContent = typeof content === "string" ? content : null;
            eventBus.emit(SOLID_AGENT_EVENTS.turnComplete, {
                sessionId: this.socket.currentSessionId,
                agentType: this.agentRuntime,
                content,
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
    if (runtime && runtime.agentUrl === agentUrl) {
        runtime.updateStore(dispatch, getState);
        return runtime;
    }
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
