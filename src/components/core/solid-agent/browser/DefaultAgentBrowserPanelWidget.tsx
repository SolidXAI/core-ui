import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Globe, Hand, Maximize2, PanelRightClose, RotateCw, X } from "lucide-react";
import type { SolidAgentBrowserPanelWidgetProps } from "../../../../types/solid-core";
import { useSecondTicker } from "./useAgentBrowser";
import styles from "./AgentBrowser.module.css";

/** How long the "restored your earlier browser session" note and an error stay visible. */
const RESTORED_NOTICE_MS = 15_000;
const ERROR_NOTICE_MS = 8_000;

function timeLeft(expiresAt: string | null, now: number): string | null {
    if (!expiresAt) return null;
    const end = Date.parse(expiresAt);
    if (Number.isNaN(end)) return null;
    const seconds = Math.max(0, Math.round((end - now) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")} left`;
}

/**
 * Default browser panel of the AgentHub chat: live view, tabs, and control of the agent's browser.
 * Register another `agentBrowserPanelWidget` (metadata `agentBrowserPanel: true`, optional `agents`)
 * to replace it; the chat keeps the layout (side pane, stacked panel, large view) and passes the
 * ready-wired `screen`.
 */
export const DefaultAgentBrowserPanelWidget = ({
    browser, handoff, layout, connected, collapsed, screen,
    takeControl, giveBack, navigate, navigation, dismissError, onToggleCollapsed, onExpand, onClose,
}: SolidAgentBrowserPanelWidgetProps) => {
    const human = browser.control.mode === "human";
    const live = browser.state === "live";
    const [note, setNote] = useState("");
    const [address, setAddress] = useState(browser.url ?? "");
    const [editingAddress, setEditingAddress] = useState(false);
    const now = useSecondTicker(!!browser.control.expiresAt || !!browser.restoredAt || !!browser.error);

    useEffect(() => {
        if (!editingAddress) setAddress(browser.url ?? "");
    }, [browser.url, editingAddress]);
    useEffect(() => {
        if (!human) setNote("");
    }, [human]);

    const remaining = human || handoff ? timeLeft(browser.control.expiresAt, now) : null;
    const restored = browser.restoredAt !== null && now - browser.restoredAt < RESTORED_NOTICE_MS;
    const error = browser.error && now - browser.error.at < ERROR_NOTICE_MS ? browser.error : null;
    const reason = browser.control.reason ?? (handoff && handoff.toolName !== "browser_takeover" ? handoff.question : null);
    const stateLabel = human ? "You have control"
        : browser.control.pending ? "Waiting for the agent"
            : browser.state === "starting" ? "Starting" : live ? "Agent in control" : "Not running";
    const tabs = browser.tabs.length > 1 ? browser.tabs : [];

    return (
        <section className={`${styles.panel} ${styles[`panel_${layout}`] ?? ""}`} aria-label="Agent browser">
            <header className={styles.panelHeader}>
                <Globe size={14} className={styles.panelIcon} aria-hidden="true" />
                <span className={`${styles.stateBadge} ${human ? styles.stateHuman : live ? styles.stateLive : ""}`}>{stateLabel}</span>
                <span className={styles.panelTitle} title={browser.url ?? undefined}>{browser.title || browser.url || "Agent browser"}</span>
                {remaining && <span className={styles.timer} title="Control returns to the agent when this runs out">{remaining}</span>}
                {onExpand && (
                    <button type="button" className={styles.iconBtn} title="Open in a larger view" aria-label="Open the browser in a larger view" onClick={onExpand}>
                        <Maximize2 size={14} />
                    </button>
                )}
                {onToggleCollapsed && layout === "stacked" && (
                    <button type="button" className={styles.iconBtn} title={collapsed ? "Show the browser" : "Collapse the browser"}
                        aria-label={collapsed ? "Show the browser" : "Collapse the browser"} aria-expanded={!collapsed} onClick={onToggleCollapsed}>
                        {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                    </button>
                )}
                {onToggleCollapsed && layout === "side" && (
                    <button type="button" className={styles.iconBtn} title="Hide the browser" aria-label="Hide the browser" onClick={onToggleCollapsed}>
                        <PanelRightClose size={15} />
                    </button>
                )}
                {onClose && (
                    <button type="button" className={styles.iconBtn} title="Close the larger view" aria-label="Close the larger view" onClick={onClose}>
                        <X size={15} />
                    </button>
                )}
            </header>

            {!collapsed && (
                <>
                    {tabs.length > 0 && (
                        <ul className={styles.tabs} aria-label="Browser tabs">
                            {tabs.map((tab) => (
                                <li key={tab.tab} className={tab.tab === browser.activeTab ? styles.tabActive : styles.tab} title={tab.url ?? undefined}
                                    aria-current={tab.tab === browser.activeTab ? "page" : undefined}>
                                    {tab.title || tab.url || tab.tab}
                                </li>
                            ))}
                        </ul>
                    )}

                    {human && (
                        <form className={styles.navBar} onSubmit={(event) => { event.preventDefault(); if (navigate(address)) setEditingAddress(false); }}>
                            <button type="button" className={styles.iconBtn} title="Back" aria-label="Back" onClick={() => navigation("back")}><ArrowLeft size={14} /></button>
                            <button type="button" className={styles.iconBtn} title="Forward" aria-label="Forward" onClick={() => navigation("forward")}><ArrowRight size={14} /></button>
                            <button type="button" className={styles.iconBtn} title="Reload" aria-label="Reload" onClick={() => navigation("refresh")}><RotateCw size={13} /></button>
                            <input className={styles.address} value={address} aria-label="Address" spellCheck={false} autoComplete="off"
                                onFocus={() => setEditingAddress(true)} onBlur={() => setEditingAddress(false)}
                                onChange={(event) => setAddress(event.target.value)} />
                        </form>
                    )}

                    {restored && <div className={styles.notice} role="status">The agent reopened your earlier browser session, so sign-ins from last time are still there.</div>}
                    {reason && !human && handoff && <div className={styles.callout}><strong>The agent asks:</strong> {reason}</div>}
                    {reason && human && browser.control.reason && <div className={styles.callout}><strong>The agent asked:</strong> {reason}</div>}

                    {screen}

                    {error && (
                        <div className={styles.error} role="alert">
                            <span>{error.message}</span>
                            <button type="button" className={styles.linkBtn} onClick={dismissError}>Dismiss</button>
                        </div>
                    )}

                    <footer className={styles.controls}>
                        {human ? (
                            <>
                                <textarea className={styles.note} rows={2} value={note} maxLength={2000}
                                    placeholder="Tell the agent what you did (optional)" aria-label="Note for the agent"
                                    onChange={(event) => setNote(event.target.value)} />
                                <div className={styles.controlRow}>
                                    <span className={styles.hint}>Your mouse and keyboard go to the page.</span>
                                    <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={!connected}
                                        onClick={() => { if (giveBack(note)) setNote(""); }}>
                                        Give back control
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className={styles.controlRow}>
                                <span className={styles.hint}>
                                    {handoff ? "The agent is waiting for you in the browser." : browser.control.pending
                                        ? "You get the browser when the agent finishes its current step." : "Watch the agent work, or take over the browser."}
                                </span>
                                {handoff && (
                                    <button type="button" className={styles.btn} disabled={!connected} onClick={() => giveBack()}>
                                        Continue without taking control
                                    </button>
                                )}
                                <button type="button" className={`${styles.btn} ${handoff ? styles.btnPrimary : ""}`}
                                    disabled={!connected || !live || browser.control.pending} onClick={takeControl}>
                                    <Hand size={13} aria-hidden="true" />
                                    {browser.control.pending ? "Waiting for the agent's step…" : "Take control"}
                                </button>
                            </div>
                        )}
                    </footer>
                </>
            )}
        </section>
    );
};
