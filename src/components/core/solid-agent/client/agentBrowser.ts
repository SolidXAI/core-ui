import type { AgentAction, AgentBrowserInputEvent } from "../types";

/**
 * The live view of a session's browser (AgentHub browser tools).
 *
 * Kept outside Redux: frames are large base64 JPEGs at several per second. Status, tabs and control
 * state form a small immutable view for React (`subscribe`/`getView`, made for useSyncExternalStore);
 * frames go to `onFrame` listeners that draw them straight onto a canvas.
 *
 * The preview is a per-socket subscription. Viewers call `watch()` while they show the screen; the
 * channel asks for the preview once the browser is live and stops it shortly after the last viewer
 * leaves. A reconnect or a session switch (`sessionStarted`) subscribes again.
 */

export type AgentBrowserState = "none" | "starting" | "live" | "state_saved" | "released";
export type AgentBrowserControlMode = "agent" | "human";
export type AgentBrowserTab = { tab: string; url: string | null; title: string | null };
export type AgentBrowserControl = {
    mode: AgentBrowserControlMode;
    /** The user asked for the browser and waits for the agent's current step to finish. */
    pending: boolean;
    /** Why the agent handed the browser over (browser_handoff). */
    reason: string | null;
    /** ISO time when control returns to the agent automatically. */
    expiresAt: string | null;
};
export type AgentBrowserError = { code: string; message: string; at: number };

export type AgentBrowserView = {
    sessionId: string | null;
    /** False once the agent said it has no browser tools. */
    available: boolean;
    state: AgentBrowserState;
    viewport: { width: number; height: number };
    url: string | null;
    title: string | null;
    tabs: AgentBrowserTab[];
    activeTab: string | null;
    control: AgentBrowserControl;
    /** When the agent last reopened a saved browser session (sign-ins and cookies restored). */
    restoredAt: number | null;
    /** The preview subscription is active on this socket. */
    watching: boolean;
    hasFrame: boolean;
    error: AgentBrowserError | null;
};

export type AgentBrowserFrame = { tab: string | null; url: string | null; title: string | null; format: string; data: string; seq: number };

/** What the channel needs from AgentSocket. */
export type AgentBrowserSocket = {
    readonly currentSessionId: string | null;
    sendNow(action: AgentAction): boolean;
};

const STATES: readonly AgentBrowserState[] = ["none", "starting", "live", "state_saved", "released"];
const DEFAULT_VIEWPORT = { width: 1280, height: 800 };
/** Moving the screen between the side pane and the large view must not drop the preview. */
const STOP_DELAY_MS = 800;
const OFFLINE: Omit<AgentBrowserError, "at"> = { code: "offline", message: "The chat is not connected to the agent. Try again once it reconnects." };

function initialView(sessionId: string | null, available = true): AgentBrowserView {
    return {
        sessionId,
        available,
        state: "none",
        viewport: DEFAULT_VIEWPORT,
        url: null,
        title: null,
        tabs: [],
        activeTab: null,
        control: { mode: "agent", pending: false, reason: null, expiresAt: null },
        restoredAt: null,
        watching: false,
        hasFrame: false,
        error: null,
    };
}

const text = (value: unknown): string | null => (typeof value === "string" && value ? value : null);

/** Whether the panel should show: the browser runs, or the user has (or is offered) it. */
export function isBrowserActive(view: AgentBrowserView): boolean {
    return view.available && (view.state === "live" || view.state === "starting" || view.control.mode === "human");
}

type Timers = { setTimeout: (callback: () => void, ms: number) => unknown; clearTimeout: (handle: any) => void; now: () => number };

export class AgentBrowserChannel {
    private view: AgentBrowserView = initialView(null);
    private listeners = new Set<() => void>();
    private frameListeners = new Set<(frame: AgentBrowserFrame) => void>();
    private frame: AgentBrowserFrame | null = null;
    private watchers = 0;
    /** The session whose preview this socket subscribed to, if any. */
    private previewSession: string | null = null;
    private stopTimer: unknown = null;
    private readonly socket: AgentBrowserSocket;
    private readonly timers: Timers;

    constructor(socket: AgentBrowserSocket, timers?: Partial<Timers>) {
        this.socket = socket;
        this.timers = {
            setTimeout: timers?.setTimeout ?? ((callback, ms) => setTimeout(callback, ms)),
            clearTimeout: timers?.clearTimeout ?? ((handle) => clearTimeout(handle)),
            now: timers?.now ?? (() => Date.now()),
        };
    }

    readonly getView = (): AgentBrowserView => this.view;

    readonly subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => { this.listeners.delete(listener); };
    };

    onFrame(listener: (frame: AgentBrowserFrame) => void) {
        this.frameListeners.add(listener);
        return () => { this.frameListeners.delete(listener); };
    }

    get latestFrame(): AgentBrowserFrame | null {
        return this.frame;
    }

    /** Applies one inbound frame. Returns false for frames that are not about the browser. */
    handle(eventType: string, data: Record<string, any>): boolean {
        switch (eventType) {
            case "browser_status": this.applyStatus(data); return true;
            case "browser_frame": this.applyFrame(data); return true;
            case "browser_tabs": this.applyTabs(data); return true;
            case "browser_control_state": this.applyControl(data); return true;
            case "browser_error": this.applyError(data); return true;
            default: return false;
        }
    }

    /** The socket (re)confirmed a session. A new socket has no preview yet; another session starts empty. */
    sessionStarted(sessionId: string | null) {
        this.previewSession = null;
        if (sessionId !== this.view.sessionId) {
            this.frame = null;
            this.setView(initialView(sessionId, this.view.available));
        } else if (this.view.watching) {
            this.setView({ ...this.view, watching: false });
        }
        this.syncPreview();
    }

    /** Forget the current session's browser (new chat, switched conversation, expired session). */
    reset() {
        this.cancelStop();
        if (this.previewSession) this.socket.sendNow({ action: "browser_preview_stop", session_id: this.previewSession });
        this.previewSession = null;
        this.frame = null;
        this.setView(initialView(null, this.view.available));
    }

    /** Keep the preview running while the returned release function has not been called. */
    watch(): () => void {
        this.watchers += 1;
        this.cancelStop();
        this.syncPreview();
        let released = false;
        return () => {
            if (released) return;
            released = true;
            this.watchers -= 1;
            if (this.watchers > 0) return;
            this.cancelStop();
            this.stopTimer = this.timers.setTimeout(() => {
                this.stopTimer = null;
                this.syncPreview();
            }, STOP_DELAY_MS);
        };
    }

    requestControl(): boolean {
        return this.sendForSession((session_id) => ({ action: "browser_control_request", session_id }));
    }

    /** Give the browser back, or continue a handoff without taking it. The note goes to the agent. */
    release(note?: string | null): boolean {
        const trimmed = typeof note === "string" ? note.trim() : "";
        return this.sendForSession((session_id) => ({ action: "browser_control_release", session_id, note: trimmed || null }));
    }

    /** Forwards one input event while the user has the browser. Dropped (false) otherwise. */
    sendInput(event: AgentBrowserInputEvent): boolean {
        if (this.view.control.mode !== "human") return false;
        const sessionId = this.socket.currentSessionId;
        return !!sessionId && this.socket.sendNow({ action: "browser_input", session_id: sessionId, event });
    }

    navigate(url: string): boolean {
        const target = url.trim();
        if (!target) return false;
        return this.sendInput({ kind: "navigation", url: /^[a-z][a-z\d+.-]*:/i.test(target) ? target : `https://${target}` });
    }

    navigation(action: "back" | "forward" | "refresh"): boolean {
        return this.sendInput({ kind: "navigation", action });
    }

    clearError() {
        if (this.view.error) this.setView({ ...this.view, error: null });
    }

    dispose() {
        this.cancelStop();
        this.listeners.clear();
        this.frameListeners.clear();
    }

    private sendForSession(build: (sessionId: string) => AgentAction): boolean {
        const sessionId = this.socket.currentSessionId;
        if (sessionId && this.socket.sendNow(build(sessionId))) return true;
        this.setView({ ...this.view, error: { ...OFFLINE, at: this.timers.now() } });
        return false;
    }

    private wantsPreview() {
        return this.watchers > 0 && isBrowserActive(this.view);
    }

    private syncPreview() {
        const sessionId = this.socket.currentSessionId;
        if (this.wantsPreview()) {
            if (!sessionId || this.previewSession === sessionId) return;
            if (this.socket.sendNow({ action: "browser_preview_start", session_id: sessionId })) {
                this.previewSession = sessionId;
                this.setView({ ...this.view, watching: true });
            }
        } else if (this.watchers === 0 && this.previewSession) {
            this.socket.sendNow({ action: "browser_preview_stop", session_id: this.previewSession });
            this.previewSession = null;
            this.setView({ ...this.view, watching: false });
        }
    }

    private applyStatus(data: Record<string, any>) {
        const state: AgentBrowserState = STATES.includes(data.state) ? data.state : this.view.state;
        const width = Number(data.viewport?.width);
        const height = Number(data.viewport?.height);
        const ended = state === "none" || state === "released" || state === "state_saved";
        if (ended) this.frame = null;
        this.setView({
            ...this.view,
            state,
            viewport: width > 0 && height > 0 ? { width, height } : this.view.viewport,
            url: text(data.url) ?? (ended ? null : this.view.url),
            title: ended ? null : this.view.title,
            activeTab: text(data.active_tab) ?? this.view.activeTab,
            tabs: ended ? [] : this.view.tabs,
            hasFrame: ended ? false : this.view.hasFrame,
            control: data.control_mode === "human" || data.control_mode === "agent"
                ? { ...this.view.control, mode: data.control_mode } : this.view.control,
            restoredAt: data.restored === true ? this.timers.now() : this.view.restoredAt,
        });
        this.syncPreview();
    }

    private applyFrame(data: Record<string, any>) {
        if (typeof data.data !== "string" || !data.data) return;
        const seq = Number(data.seq) || 0;
        // The relay numbers frames per session; an older one can still arrive after a newer one.
        if (this.frame && seq > 0 && seq < this.frame.seq) return;
        const frame: AgentBrowserFrame = {
            tab: text(data.tab), url: text(data.url), title: text(data.title),
            format: text(data.format) ?? "jpeg", data: data.data, seq,
        };
        this.frame = frame;
        const url = frame.url ?? this.view.url;
        const title = frame.title ?? this.view.title;
        if (!this.view.hasFrame || url !== this.view.url || title !== this.view.title) {
            this.setView({ ...this.view, hasFrame: true, url, title });
        }
        this.frameListeners.forEach((listener) => listener(frame));
    }

    private applyTabs(data: Record<string, any>) {
        const tabs: AgentBrowserTab[] = Array.isArray(data.tabs)
            ? data.tabs.flatMap((tab: any) => tab && typeof tab.tab === "string"
                ? [{ tab: tab.tab, url: text(tab.url), title: text(tab.title) }] : [])
            : [];
        this.setView({ ...this.view, tabs, activeTab: text(data.active_tab) ?? null });
    }

    private applyControl(data: Record<string, any>) {
        const control: AgentBrowserControl = {
            mode: data.control_mode === "human" ? "human" : "agent",
            pending: data.pending === true,
            reason: text(data.reason),
            expiresAt: text(data.expires_at),
        };
        this.setView({ ...this.view, control, error: control.mode === "human" ? null : this.view.error });
        this.syncPreview();
    }

    private applyError(data: Record<string, any>) {
        const code = text(data.code) ?? "browser_error";
        const error = { code, message: text(data.message) ?? "The browser could not do that.", at: this.timers.now() };
        if (code === "no_browser") {
            this.previewSession = null;
            this.setView({ ...this.view, available: false, watching: false, error });
            return;
        }
        this.setView({ ...this.view, error });
    }

    private cancelStop() {
        if (this.stopTimer != null) this.timers.clearTimeout(this.stopTimer);
        this.stopTimer = null;
    }

    private setView(view: AgentBrowserView) {
        this.view = view;
        this.listeners.forEach((listener) => listener());
    }
}
