import React, { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../../shad-cn-ui/SolidTooltip";
import type { SolidAgentChatHeaderWidgetProps } from "../../../../types/solid-core";
import styles from "../SolidAgent.module.css";

export function DefaultAgentChatHeaderWidget({ title, agentName, agentRuntime, agentConfigVersion,
    statusText, providerDisplayName, signedIn, activeSessionId, displaySessionId, agents, onSelectAgent }: SolidAgentChatHeaderWidgetProps) {
    const [copiedSession, setCopiedSession] = useState(false);
    const [openSelector, setOpenSelector] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    const onCopySessionId = useCallback(() => {
        if (!activeSessionId) return;
        navigator.clipboard?.writeText(activeSessionId).then(() => {
            setCopiedSession(true);
            setTimeout(() => setCopiedSession(false), 2000);
        }).catch(() => {
            // Ignore clipboard failures; copying is an optional convenience.
        });
    }, [activeSessionId]);

    useEffect(() => {
        if (!openSelector) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!selectorRef.current?.contains(event.target as Node)) {
                setOpenSelector(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenSelector(false);
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [openSelector]);

    const hasMultipleAgents = agents && agents.length > 1 && !!onSelectAgent;

    return <>
        <div className={styles.headerTitle}>
            <div className={styles.headerTitleRow}>
                {hasMultipleAgents ? (
                    <div className={styles.headerAgentSelectorWrap} ref={selectorRef}>
                        <button
                            type="button"
                            className={styles.headerAgentSelectorBtn}
                            onClick={() => setOpenSelector((v) => !v)}
                            aria-haspopup="menu"
                            aria-expanded={openSelector}
                            title={`Current agent: ${title}. Click to switch agent.`}
                        >
                            <strong>{title}</strong>
                            <ChevronDown size={14} className={`${styles.headerChevron} ${openSelector ? styles.headerChevronOpen : ""}`} />
                        </button>
                        {openSelector && (
                            <div className={styles.headerAgentMenu} role="menu" aria-label="Switch agent">
                                <div className={styles.headerAgentMenuTitle}>Switch Agent</div>
                                {agents.map((agent) => {
                                    const isSelected = agent.name === agentName;
                                    return (
                                        <button
                                            key={agent.name}
                                            type="button"
                                            role="menuitemradio"
                                            aria-checked={isSelected}
                                            className={`${styles.headerAgentOption} ${isSelected ? styles.headerAgentOptionSelected : ""}`}
                                            onClick={() => {
                                                setOpenSelector(false);
                                                if (!isSelected) {
                                                    onSelectAgent(agent.name, agent.id);
                                                }
                                            }}
                                        >
                                            <span className={styles.headerAgentAvatar}>{agent.title.trim().charAt(0).toUpperCase()}</span>
                                            <span className={styles.headerAgentOptionTitle}>{agent.title}</span>
                                            {isSelected && <Check size={14} className={styles.headerAgentCheck} />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <strong>{title}</strong>
                )}
                {agentRuntime === "agentHub" && agentConfigVersion != null && (
                    <span className={styles.headerVersionTag} title={`Agent Version: v${agentConfigVersion}`}>
                        v{agentConfigVersion}
                    </span>
                )}
            </div>
            <span className={styles.headerSub}>
                {agentRuntime !== "agentHub" && signedIn && providerDisplayName && (
                    <span className={styles.headerProviderTag} title={`Active Provider: ${providerDisplayName}`}>
                        {providerDisplayName}
                    </span>
                )}
                {signedIn && activeSessionId && (
                    <SolidTooltip delayDuration={150}>
                        <SolidTooltipTrigger asChild>
                            <button type="button" className={styles.headerSessionTag} onClick={onCopySessionId}
                                aria-label={`Session ID: ${activeSessionId}. Click to copy`}>
                                <span className={styles.headerSessionCode}>{displaySessionId}</span>
                                {copiedSession
                                    ? <Check size={11} className={`${styles.headerSessionIcon} ${styles.headerSessionIconCopied}`} />
                                    : <Copy size={11} className={styles.headerSessionIcon} />}
                            </button>
                        </SolidTooltipTrigger>
                        <SolidTooltipContent side="bottom" align="start">
                            {copiedSession ? "Copied Session ID!" : `Session: ${activeSessionId} (Click to copy)`}
                        </SolidTooltipContent>
                    </SolidTooltip>
                )}
                {statusText && <span className={styles.headerStatusText}>{statusText}</span>}
            </span>
        </div>
    </>;
}
