import React, { useCallback, useState } from "react";
import { Check, Copy, Sparkles } from "lucide-react";
import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../../shad-cn-ui/SolidTooltip";
import type { SolidAgentChatHeaderWidgetProps } from "../../../../types/solid-core";
import styles from "../SolidAgent.module.css";

export function DefaultAgentChatHeaderWidget({ title, agentRuntime, agentConfigVersion, statusColor,
    statusText, providerDisplayName, signedIn, activeSessionId, displaySessionId }: SolidAgentChatHeaderWidgetProps) {
    const [copiedSession, setCopiedSession] = useState(false);
    const onCopySessionId = useCallback(() => {
        if (!activeSessionId) return;
        navigator.clipboard?.writeText(activeSessionId).then(() => {
            setCopiedSession(true);
            setTimeout(() => setCopiedSession(false), 2000);
        }).catch(() => {
            // Ignore clipboard failures; copying is an optional convenience.
        });
    }, [activeSessionId]);

    return <>
        <div className={styles.headerMark}>
            <Sparkles size={15} />
            <span className={styles.statusDot} style={{ background: statusColor }} />
        </div>
        <div className={styles.headerTitle}>
            <div className={styles.headerTitleRow}>
                <strong>{title}</strong>
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
