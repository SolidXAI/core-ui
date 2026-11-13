import React, { useEffect, useRef, useState } from "react";
import type { AgentWorkspaceAgent } from "./embed/agentWorkspace";
import styles from "./AgentWorkspaceAgentSelector.module.css";

type Props = {
    agents: AgentWorkspaceAgent[];
    selectedAgentName: string;
    onSelect: (agentName: string) => void;
    compact?: boolean;
};

export function AgentWorkspaceAgentSelector({ agents, selectedAgentName, onSelect, compact = false }: Props) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const selectedAgent = agents.find((agent) => agent.name === selectedAgentName);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: globalThis.PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return <div ref={rootRef} className={`${styles.selector} ${compact ? styles.compact : ""}`}>
        <button type="button" className={styles.trigger} title={compact ? `Switch agent · ${selectedAgent?.title ?? "Agent"}` : undefined}
            aria-label={compact ? `Switch agent. Current: ${selectedAgent?.title ?? "Agent"}` : "Switch agent"}
            aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
            <svg className={styles.icon} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19M17 5.5a3 3 0 0 1 0 5.8M17.5 14a5.5 5.5 0 0 1 3 5" />
            </svg>
            {!compact && <span className={styles.triggerText}>{selectedAgent?.title ?? "Choose an agent"}</span>}
            {!compact && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>}
        </button>
        {open && <div className={styles.menu} role="menu" aria-label="Choose agent">
            <div className={styles.menuTitle}>Choose an agent</div>
            {agents.map((agent) => <button key={agent.name} type="button" role="menuitemradio"
                aria-checked={agent.name === selectedAgentName} className={`${styles.option} ${agent.name === selectedAgentName ? styles.selected : ""}`}
                onClick={() => {
                    setOpen(false);
                    if (agent.name !== selectedAgentName) onSelect(agent.name);
                }}>
                <span className={styles.avatar} aria-hidden="true">{agent.title.trim().charAt(0).toUpperCase()}</span>
                <span className={styles.optionTitle}>{agent.title}</span>
                {agent.name === selectedAgentName && <svg className={styles.check} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
            </button>)}
        </div>}
    </div>;
}
