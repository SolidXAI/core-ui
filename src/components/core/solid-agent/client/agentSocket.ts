import type { AgentAction, AgentConnection, AgentRuntimeType, AgentSessionOptions, AgentWireFrame } from "../types";
import { agentWsUrl, clearAgentAuth, isAgentProcessAvailable, loadAgentAuth, onAgentAuthChange } from "./agentAuth";

/**
 * WebSocket client for the agent, connecting to the full `wsUrl` named at sign-in (agentAuth.ts).
 *
 * Held outside Redux because sockets are not serializable; the host wires its listeners to
 * dispatch into agentSlice. Every outbound frame carries the `agentToken` from the agent login;
 * there is no socket until the user has signed in with an API key, and signing out closes it. Unexpected closes
 * reconnect with backoff (1s, 2s, 4s, then 15s) and re-send `resume_session`; frames sent
 * while disconnected are queued and flushed once the session is re-established.
 */

const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];

type EventListener = (frame: AgentWireFrame) => void;
type StatusListener = (status: AgentConnection) => void;

export class AgentSocket {
    private ws: WebSocket | null = null;
    private attempt = 0;
    private timer: ReturnType<typeof setTimeout> | null = null;
    private closedByUser = false;
    private queue: AgentAction[] = [];
    private eventListeners = new Set<EventListener>();
    private statusListeners = new Set<StatusListener>();
    private sessionId: string | null = null;
    private provider: string | null = null;
    private model: string | null = null;
    private sessionOptions: AgentSessionOptions = {};
    /** False until the agent confirms the session (session_started) on the current socket. */
    private sessionReady = false;
    private checkingProcessAvailability = false;
    private unacknowledgedMessage: AgentAction | null = null;
    private onSessionExpiredHook: (() => void) | null = null;

    private offAuthChange: () => void;
    private readonly debugEmbed: boolean;

    constructor(
        private agentUrl: string,
        private initialSessionId: string | null = null,
        private checkProcessAvailability = false,
        initialProvider: string | null = null,
        initialModel: string | null = null,
        initialOptions?: AgentSessionOptions,
    ) {
        this.sessionId = initialSessionId;
        this.provider = initialProvider;
        this.model = initialModel;
        if (initialOptions) this.sessionOptions = { ...initialOptions };
        this.debugEmbed = !checkProcessAvailability;
        if (this.debugEmbed) console.info("[agent-embed][runtime] socket created", { endpoint: this.safeEndpoint(), hasInitialSession: !!initialSessionId, provider: initialProvider, model: initialModel, options: initialOptions });
        // Signing in opens the socket on the wsUrl it named; signing out (or the token expiring) closes it.
        this.offAuthChange = onAgentAuthChange(agentUrl, () => {
            if (this.closedByUser) return;
            if (agentWsUrl(agentUrl)) this.connect();
            else this.disconnect();
        });
    }

    get runtime(): AgentRuntimeType {
        return this.checkProcessAvailability ? "agentHub" : "solidx";
    }

    private openSession() {
        const provider = this.provider ?? undefined;
        const model = this.model ?? undefined;
        const runtime = this.runtime;
        void this.sendRaw(
            this.sessionId
                ? { action: "resume_session", session_id: this.sessionId, provider, model, runtime, ...this.sessionOptions }
                : { action: "start_session", provider, model, runtime, ...this.sessionOptions }
        );
    }

    get currentSessionId() {
        return this.sessionId;
    }

    get currentProvider() {
        return this.provider;
    }

    get currentModel() {
        return this.model;
    }

    get currentSessionOptions(): Readonly<AgentSessionOptions> {
        return this.sessionOptions;
    }

    setProvider(provider: string, model?: string) {
        this.provider = provider;
        if (model !== undefined) this.model = model;
    }

    setOnSessionExpired(listener: () => void) {
        this.onSessionExpiredHook = listener;
    }

    onEvent(listener: EventListener) {
        this.eventListeners.add(listener);
        return () => this.eventListeners.delete(listener);
    }

    onStatus(listener: StatusListener) {
        this.statusListeners.add(listener);
        return () => this.statusListeners.delete(listener);
    }

    connect() {
        if (this.closedByUser) return;
        const state = this.ws?.readyState;
        if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
        this.closedByUser = false;
        const url = agentWsUrl(this.agentUrl);
        if (!url) {
            if (this.debugEmbed) console.warn("[agent-embed][runtime] no WebSocket URL is available from auth yet");
            // Not signed in: the auth listener connects once sign-in names the wsUrl.
            this.setStatus("idle");
            return;
        }
        this.setStatus(this.attempt === 0 ? "connecting" : "reconnecting");
        if (this.debugEmbed) console.info("[agent-embed][runtime] opening WebSocket", { endpoint: this.safeEndpoint(url), attempt: this.attempt + 1 });

        let ws: WebSocket;
        try {
            ws = new WebSocket(url);
        } catch (error) {
            if (this.debugEmbed) console.error("[agent-embed][runtime] WebSocket construction failed", { name: error instanceof Error ? error.name : "unknown", message: error instanceof Error ? error.message : String(error) });
            this.scheduleReconnect();
            return;
        }
        this.ws = ws;

        ws.onopen = () => {
            if (this.ws !== ws) return;
            if (this.debugEmbed) console.info("[agent-embed][runtime] WebSocket open");
            this.attempt = 0;
            this.sessionReady = false;
            this.setStatus("open");
            this.openSession();
        };

        ws.onmessage = (message) => {
            if (this.ws !== ws) return;
            let frame: AgentWireFrame;
            try {
                frame = JSON.parse(message.data);
            } catch {
                return;
            }
            const eventType = frame.event_type ?? frame.type;
            const payload = frame.event_data ?? frame.data;
            if (this.debugEmbed) console.info("[agent-embed][runtime] WebSocket frame", { eventType, hasSessionId: !!(frame.session_id ?? payload?.session_id), isError: eventType === "error" });
            if (eventType === "session_started" || eventType === "session_updated") {
                // After an agent restart the old session is gone and resume returns a new id.
                this.sessionId = frame.session_id ?? payload?.session_id ?? this.sessionId;
                const p = frame.provider ?? payload?.provider;
                if (p) this.provider = p;
                const m = frame.model ?? payload?.model;
                if (m) this.model = m;
                if (eventType === "session_started") {
                    this.sessionReady = true;
                    this.flushQueue();
                }
            } else if (eventType === "error" && /agent token/i.test(String(payload?.error ?? ""))) {
                // The agent forgot the token (idle 30 min or restarted): sign in again.
                this.sessionReady = false;
                if (this.unacknowledgedMessage) this.queue.push(this.unacknowledgedMessage);
                this.unacknowledgedMessage = null;
                clearAgentAuth(this.agentUrl);
            } else if (
                eventType === "error" &&
                (payload?.code === "SESSION_NOT_FOUND" ||
                    payload?.code === "SESSION_EXPIRED" ||
                    frame?.code === "SESSION_NOT_FOUND" ||
                    frame?.code === "SESSION_EXPIRED" ||
                    /session (?:not found|does not exist|expired)|unknown session/i.test(String(payload?.error ?? frame?.error ?? "")))
            ) {
                // The session no longer exists on the agent server (e.g. server restarted or CLI session expired).
                if (this.debugEmbed) console.warn("[agent-embed][runtime] session not found or expired; recovering with fresh session", { error: payload?.error, code: payload?.code });
                this.sessionId = null;
                this.sessionReady = false;
                if (this.unacknowledgedMessage) this.queue.push(this.unacknowledgedMessage);
                this.unacknowledgedMessage = null;
                this.onSessionExpiredHook?.();
                const provider = this.provider ?? undefined;
                const model = this.model ?? undefined;
                void this.sendRaw({
                    action: "start_session",
                    provider,
                    model,
                    runtime: this.runtime,
                    ...this.sessionOptions,
                });
                return;
            } else if (eventType === "error" && !this.sessionReady) {
                // Start/resume failed (e.g. auth); stop holding messages so their errors show.
                this.sessionReady = true;
                this.flushQueue();
            }
            if (eventType === "UserMessage" || eventType === "turn_complete" || eventType === "error") {
                this.unacknowledgedMessage = null;
            }
            // Drop frames for a different session (e.g. a late event after a switch).
            const frameSession = frame.session_id ?? payload?.session_id;
            if (eventType !== "session_started" && frameSession && this.sessionId && frameSession !== this.sessionId) return;
            this.eventListeners.forEach((listener) => listener(frame));
        };

        ws.onclose = (event) => {
            if (this.ws !== ws) return;
            if (this.debugEmbed) console.warn("[agent-embed][runtime] WebSocket closed", { code: event.code, reason: event.reason, clean: event.wasClean });
            this.ws = null;
            this.sessionReady = false;
            if (this.closedByUser) {
                this.setStatus("idle");
                return;
            }
            this.scheduleReconnect();
        };

        ws.onerror = () => {
            if (this.debugEmbed) console.error("[agent-embed][runtime] WebSocket error event");
            // onclose follows and handles the reconnect.
        };
    }

    /** Sends an action, or queues it until the socket and session are ready. */
    send(action: AgentAction) {
        if (this.closedByUser) return;
        const resolvedAction: AgentAction =
            action.action === "message"
                ? { ...this.sessionOptions, ...action }
                : action;
        if (this.ws?.readyState === WebSocket.OPEN && this.sessionId && this.sessionReady) {
            void this.sendRaw(resolvedAction);
        } else {
            this.queue.push(resolvedAction);
            this.connect();
        }
    }

    /** Starts a fresh conversation (drops the current session id). */
    newSession(opts?: { provider?: string; model?: string } & AgentSessionOptions) {
        if (opts?.provider) this.provider = opts.provider;
        if (opts?.model !== undefined) this.model = opts.model;
        if (opts) {
            const { provider: _p, model: _m, ...rest } = opts;
            this.sessionOptions = { ...this.sessionOptions, ...rest };
        }
        this.unacknowledgedMessage = null;
        this.sessionId = null;
        this.sessionReady = false;
        this.queue = [];
        const payload: AgentAction = {
            action: "start_session",
            provider: this.provider ?? undefined,
            model: this.model ?? undefined,
            runtime: this.runtime,
            ...this.sessionOptions,
        };
        if (this.ws?.readyState === WebSocket.OPEN) void this.sendRaw(payload);
        else this.connect();
    }

    /** Updates provider, model, or parameters for the active session. */
    updateSession(opts: { provider?: string; model?: string } & AgentSessionOptions) {
        if (opts.provider) this.provider = opts.provider;
        if (opts.model !== undefined) this.model = opts.model;
        const { provider: _p, model: _m, ...rest } = opts;
        this.sessionOptions = { ...this.sessionOptions, ...rest };
        if (this.sessionId && this.ws?.readyState === WebSocket.OPEN) {
            void this.sendRaw({
                action: "update_session",
                session_id: this.sessionId,
                provider: this.provider ?? undefined,
                model: this.model ?? undefined,
                runtime: this.runtime,
                ...this.sessionOptions,
            });
        }
    }

    /** Switches to an existing conversation. */
    resume(sessionId: string, opts?: { provider?: string; model?: string } & AgentSessionOptions) {
        if (opts?.provider) this.provider = opts.provider;
        if (opts?.model !== undefined) this.model = opts.model;
        if (opts) {
            const { provider: _p, model: _m, ...rest } = opts;
            this.sessionOptions = { ...this.sessionOptions, ...rest };
        }
        this.sessionId = sessionId;
        this.sessionReady = false;
        if (this.ws?.readyState === WebSocket.OPEN) {
            void this.sendRaw({
                action: "resume_session",
                session_id: sessionId,
                provider: this.provider ?? undefined,
                model: this.model ?? undefined,
                runtime: this.runtime,
                ...this.sessionOptions,
            });
        } else {
            this.connect();
        }
    }

    /** Closes for good (the runtime is being disposed). */
    close() {
        this.offAuthChange();
        this.closedByUser = true;
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.ws?.close();
        this.ws = null;
    }

    /** Drops the socket after sign-out; the next sign-in reconnects. */
    private disconnect() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = null;
        this.attempt = 0;
        this.sessionReady = false;
        if (this.ws) {
            this.ws.onclose = null; // No reconnect.
            this.ws.close();
            this.ws = null;
        }
        this.setStatus("idle");
    }

    private flushQueue() {
        const pending = this.queue;
        this.queue = [];
        pending.forEach((action) => {
            // Queued messages were addressed before a session existed; point them at the current one.
            const addressed = "session_id" in action && this.sessionId ? { ...action, session_id: this.sessionId } : action;
            void this.sendRaw(addressed as AgentAction);
        });
    }

    private async sendRaw(action: AgentAction) {
        const agentToken = (await loadAgentAuth(this.agentUrl))?.agentToken;
        if (!agentToken || this.ws?.readyState !== WebSocket.OPEN) {
            if (this.debugEmbed) console.warn("[agent-embed][runtime] skipped outbound frame", { action: action.action, hasAgentToken: !!agentToken, socketOpen: this.ws?.readyState === WebSocket.OPEN });
            if (action.action !== "start_session" && action.action !== "resume_session") this.queue.push(action);
            return;
        }
        if (this.debugEmbed) console.info("[agent-embed][runtime] sending WebSocket action", { action: action.action });
        this.ws.send(JSON.stringify({ ...action, agentToken }));
        if (action.action === "message") this.unacknowledgedMessage = action;
    }

    private scheduleReconnect() {
        if (this.timer) return;
        const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)];
        this.attempt += 1;
        this.setStatus(this.attempt > BACKOFF_MS.length ? "offline" : "reconnecting");
        if (this.checkProcessAvailability && this.attempt >= 2 && this.attempt % 3 === 2) {
            void this.checkAgentProcess(this.attempt);
        }
        this.timer = setTimeout(() => {
            this.timer = null;
            this.connect();
        }, delay);
    }

    private async checkAgentProcess(failedAttempt: number) {
        if (this.checkingProcessAvailability) return;
        this.checkingProcessAvailability = true;
        try {
            const auth = await loadAgentAuth(this.agentUrl);
            if (!auth || this.closedByUser || this.attempt !== failedAttempt) return;
            if (!(await isAgentProcessAvailable(auth)) && !this.closedByUser && this.attempt === failedAttempt) {
                // Repeated WebSocket failures plus a failed process health check mean the stored
                // endpoint is stale. Returning to sign-in lets the manager issue a fresh wsUrl.
                clearAgentAuth(this.agentUrl);
            }
        } finally {
            this.checkingProcessAvailability = false;
        }
    }

    private setStatus(status: AgentConnection) {
        if (this.debugEmbed) console.info("[agent-embed][runtime] connection status", { status });
        this.statusListeners.forEach((listener) => listener(status));
    }

    private safeEndpoint(url = this.agentUrl) {
        try {
            const parsed = new URL(url);
            return `${parsed.origin}${parsed.pathname}`;
        } catch {
            return "invalid-url";
        }
    }
}
