import { useEffect, useState, useSyncExternalStore } from "react";
import type { AgentBrowserChannel, AgentBrowserView } from "../client/agentBrowser";

const EMPTY_VIEW: AgentBrowserView = {
    sessionId: null,
    available: false,
    state: "none",
    viewport: { width: 1280, height: 800 },
    url: null,
    title: null,
    tabs: [],
    activeTab: null,
    control: { mode: "agent", pending: false, reason: null, expiresAt: null },
    restoredAt: null,
    watching: false,
    hasFrame: false,
    error: null,
    controllable: true,
};
const noSubscription = () => () => {};
const emptyView = () => EMPTY_VIEW;

/** The browser view of a chat's runtime; an empty, unavailable view before the runtime exists. */
export function useAgentBrowser(channel: AgentBrowserChannel | null | undefined): AgentBrowserView {
    return useSyncExternalStore(channel?.subscribe ?? noSubscription, channel?.getView ?? emptyView, channel?.getView ?? emptyView);
}

/** The current time, refreshed every second while `active` (countdowns and short-lived notices). */
export function useSecondTicker(active: boolean): number {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!active) return;
        setNow(Date.now());
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [active]);
    return now;
}
