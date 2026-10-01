import type { AgentAction, AgentConnection, AgentWireFrame } from "../types";
import { clearAgentAuth, loadAgentAuth, onAgentAuthChange } from "./agentAuth";
import { toWsUrl } from "./agentUrls";

export { toHttpBase, toWsUrl } from "./agentUrls";

/**
 * WebSocket client for the SolidX Agent (`<agentUrl>/ws/agent`).
 *
 * Held outside Redux because sockets are not serializable; the host wires its listeners to
 * dispatch into agentSlice. Every outbound frame carries the `agentToken` from the agent login
 * (agentAuth.ts); nothing is sent until the user has signed in with an API key. Unexpected closes
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
    /** False until the agent confirms the session (session_started) on the current socket. */
    private sessionReady = false;

    private offAuthChange: () => void;

    constructor(private agentUrl: string, private initialSessionId: string | null = null) {
        this.sessionId = initialSessionId;
        // Signing in (or again, after the token expired) starts/resumes the session on the open socket.
        this.offAuthChange = onAgentAuthChange(agentUrl, () => {
            if (this.ws?.readyState === WebSocket.OPEN && !this.sessionReady) this.openSession();
        });
    }

    private openSession() {
        void this.sendRaw(this.sessionId ? { action: "resume_session", session_id: this.sessionId } : { action: "start_session" });
    }

    get currentSessionId() {
        return this.sessionId;
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
        const state = this.ws?.readyState;
        if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;
        this.closedByUser = false;
        this.setStatus(this.attempt === 0 ? "connecting" : "reconnecting");

        let ws: WebSocket;
        try {
            ws = new WebSocket(toWsUrl(this.agentUrl));
        } catch {
            this.scheduleReconnect();
            return;
        }
        this.ws = ws;

        ws.onopen = () => {
            this.attempt = 0;
            this.sessionReady = false;
            this.setStatus("open");
            this.openSession();
        };

        ws.onmessage = (message) => {
            let frame: AgentWireFrame;
            try {
                frame = JSON.parse(message.data);
            } catch {
                return;
            }
            const eventType = frame.event_type ?? frame.type;
            const payload = frame.event_data ?? frame.data;
            if (eventType === "session_started") {
                // After an agent restart the old session is gone and resume returns a new id.
                this.sessionId = frame.session_id ?? payload?.session_id ?? null;
                this.sessionReady = true;
                this.flushQueue();
            } else if (eventType === "error" && /agent token/i.test(String(payload?.error ?? ""))) {
                // The agent forgot the token (idle 30 min or restarted): sign in again.
                this.sessionReady = false;
                clearAgentAuth(this.agentUrl);
            } else if (eventType === "error" && !this.sessionReady) {
                // Start/resume failed (e.g. auth); stop holding messages so their errors show.
                this.sessionReady = true;
                this.flushQueue();
            }
            // Drop frames for a different session (e.g. a late event after a switch).
            const frameSession = frame.session_id ?? payload?.session_id;
            if (eventType !== "session_started" && frameSession && this.sessionId && frameSession !== this.sessionId) return;
            this.eventListeners.forEach((listener) => listener(frame));
        };

        ws.onclose = () => {
            this.ws = null;
            this.sessionReady = false;
            if (this.closedByUser) {
                this.setStatus("idle");
                return;
            }
            this.scheduleReconnect();
        };

        ws.onerror = () => {
            // onclose follows and handles the reconnect.
        };
    }

    /** Sends an action, or queues it until the socket and session are ready. */
    send(action: AgentAction) {
        if (this.ws?.readyState === WebSocket.OPEN && this.sessionId && this.sessionReady) {
            void this.sendRaw(action);
        } else {
            this.queue.push(action);
            this.connect();
        }
    }

    /** Starts a fresh conversation (drops the current session id). */
    newSession() {
        this.sessionId = null;
        this.sessionReady = false;
        this.queue = [];
        if (this.ws?.readyState === WebSocket.OPEN) void this.sendRaw({ action: "start_session" });
        else this.connect();
    }

    /** Switches to an existing conversation. */
    resume(sessionId: string) {
        this.sessionId = sessionId;
        this.sessionReady = false;
        if (this.ws?.readyState === WebSocket.OPEN) void this.sendRaw({ action: "resume_session", session_id: sessionId });
        else this.connect();
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
            if (action.action !== "start_session" && action.action !== "resume_session") this.queue.push(action);
            return;
        }
        this.ws.send(JSON.stringify({ ...action, agentToken }));
    }

    private scheduleReconnect() {
        if (this.timer) return;
        const delay = BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)];
        this.attempt += 1;
        this.setStatus(this.attempt > BACKOFF_MS.length ? "offline" : "reconnecting");
        this.timer = setTimeout(() => {
            this.timer = null;
            this.connect();
        }, delay);
    }

    private setStatus(status: AgentConnection) {
        this.statusListeners.forEach((listener) => listener(status));
    }
}
