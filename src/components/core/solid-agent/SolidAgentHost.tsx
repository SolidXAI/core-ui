import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Sparkles } from "lucide-react";
import styles from "./SolidAgent.module.css";
import { agentModeChanged, agentOpenRequested, type AgentState } from "../../../redux/features/agentSlice";
import { SolidAgentChat } from "./SolidAgentChat";
import { useAgentAvailability } from "./useAgentAvailability";

const PREFS_KEY = "solid-agent.window";
const MIN_DOCK = 360;
const MAX_DOCK = 720;

function readPrefs(): { dockWidth: number } {
    try {
        const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
        return { dockWidth: Number(parsed.dockWidth) || 420 };
    } catch {
        return { dockWidth: 420 };
    }
}

function writePrefs(prefs: { dockWidth: number }) {
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
        // ignore
    }
}

/**
 * The single mount point of the SolidX Agent in the admin shell (rendered by AdminLayout).
 * Shows the floating bubble and the chat window; hidden unless the `solidAgentEnabled` setting
 * is on, `solidxAgentBackendUrl` is set and the user has agent:invoke. Ctrl/Cmd+J toggles the window,
 * Esc inside it minimizes back to the bubble.
 */
export default function SolidAgentHost() {
    const dispatch = useDispatch();
    const { ready, enabled, agentUrl, canUse } = useAgentAvailability();
    const agent = useSelector((state: any) => state.solidAgent as AgentState | undefined);
    const [dockWidth, setDockWidth] = useState(() => readPrefs().dockWidth);
    const windowRef = useRef<HTMLDivElement>(null);
    const openerRef = useRef<Element | null>(null);

    const available = ready && enabled && canUse && !!agentUrl && !!agent;
    const mode = agent?.mode ?? "bubble";
    const isOpen = available && mode !== "bubble";

    const toggle = useCallback(() => {
        if (!available) return;
        if (isOpen) dispatch(agentModeChanged("bubble"));
        else {
            openerRef.current = document.activeElement;
            dispatch(agentOpenRequested());
        }
    }, [available, isOpen, dispatch]);

    // Ctrl/Cmd + J toggles the chat from anywhere in the admin app.
    useEffect(() => {
        if (!available) return;
        const onKey = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "j") {
                event.preventDefault();
                toggle();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [available, toggle]);

    // Docked mode pushes the admin shell over instead of covering it.
    useEffect(() => {
        const docked = isOpen && mode === "docked";
        document.body.classList.toggle("solid-agent-docked", docked);
        document.documentElement.style.setProperty("--solid-agent-docked-width", `${dockWidth}px`);
        return () => document.body.classList.remove("solid-agent-docked");
    }, [isOpen, mode, dockWidth]);

    // Focus returns to whatever opened the chat when it is minimized.
    useEffect(() => {
        if (!isOpen && openerRef.current instanceof HTMLElement) {
            openerRef.current.focus();
            openerRef.current = null;
        }
    }, [isOpen]);

    const startResize = (event: React.PointerEvent) => {
        event.preventDefault();
        const onMove = (move: PointerEvent) => {
            setDockWidth(Math.max(MIN_DOCK, Math.min(MAX_DOCK, window.innerWidth - move.clientX)));
        };
        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            setDockWidth((width) => {
                writePrefs({ dockWidth: width });
                return width;
            });
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    if (!available || !agentUrl) return null;

    const frameClass = mode === "docked" ? styles.docked : mode === "maximized" ? styles.maximized : styles.compact;

    return (
        <div className={styles.root}>
            {isOpen ? (
                <div
                    ref={windowRef}
                    className={`${styles.window} ${frameClass}`}
                    style={mode === "docked" ? { width: dockWidth } : undefined}
                    role="complementary"
                    aria-label="SolidX Agent"
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            event.stopPropagation();
                            dispatch(agentModeChanged("bubble"));
                        }
                    }}
                >
                    {mode === "docked" && <div className={styles.resizeHandle} onPointerDown={startResize} aria-hidden="true" />}
                    <SolidAgentChat agentUrl={agentUrl} />
                </div>
            ) : (
                <button type="button" className={styles.bubble} onClick={toggle} aria-label="Open the SolidX Agent (Ctrl+J)" title="SolidX Agent (Ctrl+J)">
                    <Sparkles size={22} />
                    {agent?.working && <span className={styles.bubbleBadge} aria-label="Agent is working" />}
                </button>
            )}
        </div>
    );
}
