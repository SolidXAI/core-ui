import { eventBus } from "../../../../helpers/eventBus";
import { getAgentChatWidgetCatalog } from "../../../../helpers/registry";
import {
    agentConnectionChanged,
    agentEventReceived,
    agentHistoryLoaded,
    agentHistoryLoadingChanged,
    agentHistoryLoadingStarted,
    agentOlderHistoryFailed,
    agentThreadReset,
    agentToolFilesResolved,
    agentUserMessageAdded,
    type AgentState,
} from "../../../../redux/features/agentSlice";
import { historyToItems, isSameAssistantContent, normalizeAgentFrame } from "../agentEvents";
import { parseWidgetContent } from "../thread/inlineWidget";
import { humanReviewAllowsChoice, humanReviewId } from "../humanReview";
import { SOLID_AGENT_EVENTS } from "../sdk/solidAgent";
import { emitBeforeUserMessageSend, type BeforeUserMessageSendContribution } from "./beforeUserMessageSend";
import { emitAgentPublicEvent, type AgentPublicEventName, type AgentPublicEventPayloads } from "./agentPublicEvents";
import { AgentEventTypes, type AgentRuntimeType, type AgentAttachment, type AgentChatEvent, type AgentContext, type AgentMessageContext, type AgentSessionOptions, type AgentWireFrame } from "../types";
import { fetchToolFileMedia, resolveAttachmentMedia } from "./agentAttachmentMedia";
import { AgentBrowserChannel } from "./agentBrowser";
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

/** Keep the original SolidX key; AgentHub embeds also scope saved sessions to their authenticated user. */
function sessionKey(agentRuntime: AgentRuntimeType, agentUrl: string, ownerKey?: string) {
    if (agentRuntime === "solidx") return "solid-agent.session_id";
    const agentId = agentIdOf(agentUrl);
    const ownerSuffix = ownerKey ? `.${encodeURIComponent(ownerKey)}` : "";
    return agentId === undefined ? `solid-agent.${agentRuntime}${ownerSuffix}.session_id` : `solid-agent.${agentRuntime}.${agentId}${ownerSuffix}.session_id`;
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

/** Linking tool files to their event can lag the live ToolResult frame by a moment. */
const TOOL_FILE_RETRY_MS = [0, 1500, 4000];

export class AgentRuntime {
    readonly socket: AgentSocket;
    /** Live view and control of the session's browser (AgentHub browser tools). */
    readonly browser: AgentBrowserChannel;
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
        sessionOwnerKey?: string,
        agentName?: string,
    ) {
        this.sessionKey = sessionKey(agentRuntime, agentUrl, sessionOwnerKey);
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
            agentRuntime === "agentHub" ? getAgentChatWidgetCatalog(agentName) : [],
        );
        this.browser = new AgentBrowserChannel(this.socket);
        this.socket.setOnSessionExpired(() => {
            this.browser.reset();
            if (this.persistSession) writeSessionId(this.sessionKey, null);
            if (this.frame != null) {
                cancelAnimationFrame(this.frame);
                this.frame = null;
            }
            this.pendingDelta = "";
            this.responseStarted = false;
            this.dispatch(agentThreadReset());
        });
        this.hadPriorSession = !!this.socket.currentSessionId;
        if (this.hadPriorSession && this.getState()?.items.length === 0)
            this.dispatch(agentHistoryLoadingChanged(true));
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
        if (this.getState()?.pendingReview) throw new Error("Answer the agent’s pending request first.");
        if (this.getState()?.reviewResuming) throw new Error("The agent is resuming after your response.");
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
        const state = this.getState();
        const review = state?.pendingReview;
        if (review) {
            if (widgetId !== humanReviewId(review.requestId) || typeof value !== "string") return;
            if (!state?.reviewSubmitting && state?.connection === "open" && humanReviewAllowsChoice(review, value)) {
                this.respondToReview(value, review.kind === "approval" ? "" : value);
            }
            return;
        }
        if (widgetId.startsWith("human-request-")) return;
        const text = typeof value === "string" ? value : Array.isArray(value) ? value.join(", ") : JSON.stringify(value);
        await this.sendMessage(text, this.lastContext, [], undefined, beforeSend, "widget", { widgetId, value });
        // The text message uses the shared preparation path. Keep the structured widget
        // value as a separate event for consumers that handle widget replies.
        eventBus.emit(SOLID_AGENT_EVENTS.widgetAction, { widgetId, widget, value, agentType: this.agentRuntime });
    }

    respondToReview(choice: string, text: string) {
        const state = this.getState();
        const review = state?.pendingReview;
        const sessionId = this.socket.currentSessionId;
        if (!state || !review || state.reviewSubmitting || !sessionId || state.connection !== "open") {
            throw new Error("The review is not ready to accept a response.");
        }
        this.dispatch(agentEventReceived(normalizeAgentFrame({ type: "human_response_submitting" })));
        this.socket.send({ action: "human_response", session_id: sessionId, request_id: review.requestId, choice, text });
    }

    cancel() {
        if (this.frame != null) {
            cancelAnimationFrame(this.frame);
            this.frame = null;
        }
        this.pendingDelta = "";
        const sessionId = this.socket.currentSessionId;
        if (sessionId) {
            this.publish("onCancelRequested", { sessionId });
            this.socket.send({ action: "cancel", session_id: sessionId });
        }
    }

    newChat(provider?: string, model?: string, opts?: AgentSessionOptions) {
        if (this.frame != null) {
            cancelAnimationFrame(this.frame);
            this.frame = null;
        }
        this.pendingDelta = "";
        this.responseStarted = false;
        this.publish("onNewChatRequested", { sessionId: this.socket.currentSessionId });
        this.hadPriorSession = false;
        this.resetHistoryLoads();
        if (this.persistSession) writeSessionId(this.sessionKey, null);
        if (provider) setStoredProviderAndModel(provider, model);
        if (provider && opts) setStoredSessionOptions(provider, opts);
        this.lastContext = undefined;
        this.browser.reset();
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

    resume(sessionId: string, provider?: string, model?: string, opts?: AgentSessionOptions, isRunning?: boolean) {
        if (this.frame != null) {
            cancelAnimationFrame(this.frame);
            this.frame = null;
        }
        this.pendingDelta = "";
        this.responseStarted = false;
        this.hadPriorSession = true;
        this.resetHistoryLoads();
        this.historySessionId = sessionId;
        if (this.persistSession) writeSessionId(this.sessionKey, sessionId);
        if (provider) setStoredProviderAndModel(provider, model);
        if (provider && opts) setStoredSessionOptions(provider, opts);
        this.browser.reset();
        const shouldBeWorking = isRunning ?? this.getState()?.working ?? false;
        this.dispatch(agentThreadReset({ loadingHistory: true, historySessionId: sessionId, working: shouldBeWorking }));
        this.dispatch(agentHistoryLoadingChanged(true));
        this.socket.resume(sessionId, { ...(provider ? { provider, model } : {}), ...(opts || {}) });
        void this.loadHistory(sessionId, 1);
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
        this.browser.dispose();
        this.socket.close();
    }

    private isCurrentHistoryLoad(generation: number, historySessionId: string) {
        return generation === this.historyGeneration && this.getState()?.historySessionId === historySessionId;
    }

    private async loadHistory(historySessionId: string, page: number) {
        const key = `${historySessionId}:${page}`;
        if (this.loadingHistoryPages.has(key) || this.loadedHistoryPages.has(key)) return;
        const generation = this.historyGeneration;
        const isOlder = page > 1;
        this.loadingHistoryPages.set(key, generation);
        this.dispatch(agentHistoryLoadingStarted({ isOlder }));
        try {
            const result = await fetchSessionHistory(this.agentUrl, historySessionId, page);
            if (!result) throw new Error("History page unavailable");
            // Attached files are stored in Solid media storage; resolve their URLs before showing.
            const rawItems = historyToItems(result.messages ?? []);
            const items = this.persistSession ? await resolveAttachmentMedia(rawItems) : rawItems;
            if (!this.isCurrentHistoryLoad(generation, historySessionId)) return;
            this.loadedHistoryPages.add(key);
            const sessionUsage = result.session_usage;
            const isRunning = result.is_running !== undefined ? result.is_running : (result.status ? result.status === "running" : undefined);
            this.dispatch(agentHistoryLoaded({
                items,
                hasMore: !!result.has_more,
                page,
                ...(isRunning !== undefined ? { isRunning } : {}),
                ...(sessionUsage ? {
                    usage: {
                        totalCost: sessionUsage.total_cost ?? 0,
                        totalInputTokens: sessionUsage.total_input_tokens ?? 0,
                        totalOutputTokens: sessionUsage.total_output_tokens ?? 0,
                        totalTokens: sessionUsage.total_tokens ?? 0,
                        contextTokens: (sessionUsage as any).context_tokens ?? sessionUsage.total_input_tokens ?? 0,
                        contextLimit: 0,
                    },
                } : {}),
            }));
        } catch {
            // History is a convenience; the live session still works without it.
            // A failed older page stays retryable from the thread.
            if (!isOlder) this.loadedHistoryPages.add(key);
            else if (this.isCurrentHistoryLoad(generation, historySessionId)) this.dispatch(agentOlderHistoryFailed());
        } finally {
            if (this.loadingHistoryPages.get(key) === generation) this.loadingHistoryPages.delete(key);
            if (this.isCurrentHistoryLoad(generation, historySessionId)) this.dispatch(agentHistoryLoadingChanged(false));
        }
    }

    private handleFrame(frame: AgentWireFrame) {
        const event = normalizeAgentFrame(frame);
        // Browser frames stay out of Redux and the SDK events.
        if (event.eventType.startsWith("browser_") && this.browser.handle(event.eventType, event.eventData)) return;
        if (event.eventType === AgentEventTypes.sessionStarted) {
            const state = this.getState();
            if (state?.pendingReview || state?.reviewResuming) {
                this.resetHistoryLoads();
                this.dispatch(agentThreadReset());
            }
            const sessionId = frame.session_id ?? event.eventData.session_id ?? null;
            this.browser.sessionStarted(sessionId);
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
        } else if (event.eventType === AgentEventTypes.agentError || event.eventType === AgentEventTypes.error) {
            this.publish("onError", { stage: "runtime", code: "agent_error", retryable: false });
        } else if (event.eventType === "human_request" ||
            event.eventType === "HumanRequestCreated" && this.agentRuntime !== "agentHub") {
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
        if (event.eventType === AgentEventTypes.toolResult && this.persistSession) this.resolveToolFiles(event.eventData);
    }

    /** Fetches the stored URLs of the screenshots and downloads a tool just returned. */
    private resolveToolFiles(eventData: Record<string, any>) {
        const agentEventId = eventData.agentEventId;
        const stored = Array.isArray(eventData.files) && eventData.files.some((file: any) => file?.mediaId != null);
        if (agentEventId == null || !stored) return;
        const generation = this.historyGeneration;
        void (async () => {
            for (const delay of TOOL_FILE_RETRY_MS) {
                if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
                if (generation !== this.historyGeneration) return;
                const media = await fetchToolFileMedia(agentEventId);
                if (generation !== this.historyGeneration) return;
                if (media.length) {
                    this.dispatch(agentToolFilesResolved({ agentEventId, media }));
                    return;
                }
            }
        })();
    }

    private publish<E extends AgentPublicEventName>(event: E, payload: AgentPublicEventPayloads[E]) {
        emitAgentPublicEvent(event, payload, this.agentRuntime);
    }

    private lastTurnCompleteContent: string | null = null;
    private lastTurnCompleteTime = 0;
    private turnCompletionPublished = false;

    private emitSdkEvents(event: AgentChatEvent) {
        if (event.eventType === AgentEventTypes.userMessage || event.eventType === AgentEventTypes.agentStarted) {
            this.lastTurnCompleteContent = null;
            this.lastTurnCompleteTime = 0;
            this.turnCompletionPublished = false;
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
            if (event.eventType === AgentEventTypes.sessionStarted && state &&
                state.items.every((item) => item.id === humanReviewId(state.pendingReview?.requestId ?? 0)) && historyId) {
                void this.loadHistory(historyId, 1);
            } else if (event.eventType === AgentEventTypes.sessionStarted && this.loadingHistoryPages.size === 0) {
                this.dispatch(agentHistoryLoadingChanged(false));
            }
        } else if (event.eventType === AgentEventTypes.turnComplete || event.eventType === AgentEventTypes.turnCompleteLegacy) {
            const content = event.eventData.content ?? event.frame.content;
            const now = Date.now();
            if (now - this.lastTurnCompleteTime < 1500 && isSameAssistantContent(this.lastTurnCompleteContent ?? undefined, typeof content === "string" ? content : undefined)) {
                return;
            }
            this.lastTurnCompleteTime = now;
            this.lastTurnCompleteContent = typeof content === "string" ? content : null;
            // Publish only for a new live completion, never while loading history.
            if (!this.turnCompletionPublished) {
                this.turnCompletionPublished = true;
                const widget = parseWidgetContent(content);
                this.publish("onAgentTurnCompleted", {
                    sessionId: this.socket.currentSessionId,
                    outcome: "completed",
                    ...(widget ? { widget: { name: widget.widget, data: widget.data } } : {}),
                });
            }
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
