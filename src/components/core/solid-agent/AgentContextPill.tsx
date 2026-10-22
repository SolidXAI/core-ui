import React, { useEffect, useRef, useState } from "react";
import styles from "./SolidAgent.module.css";
import type { AgentUsageStats } from "./types";
import { SolidPopover, SolidPopoverContent, SolidPopoverTrigger } from "../../shad-cn-ui/SolidPopover";

export type AgentContextPillProps = {
    usage?: AgentUsageStats | null;
    activeProvider?: string;
    modelName?: string | null;
    disabled?: boolean;
};

function formatLimit(limit: number): string {
    if (!limit || limit <= 0) return "0";
    if (limit >= 1_000_000) {
        const m = limit / 1_000_000;
        return `${Number.isInteger(m) ? m : m.toFixed(1).replace(/\.0$/, "")}M`;
    }
    if (limit >= 1_000) {
        const k = Math.round(limit / 1_000);
        return `${k}k`;
    }
    return String(limit);
}

function formatCost(cost: number): string {
    if (!cost || cost <= 0) return "$0.00";
    if (cost < 0.01) return `$${cost.toFixed(4)}`;
    return `$${cost.toFixed(2)}`;
}

export function AgentContextPill({
    usage,
    activeProvider = "solidx",
    modelName,
    disabled = false,
}: AgentContextPillProps) {
    const [open, setOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
    const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up close timer on unmount
    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        };
    }, []);

    // Only show pill for supported providers (Solid Native, Pi, Antigravity). Hide completely if unmapped/unknown context limit.
    const ALLOWED_PROVIDERS = new Set(["solidx", "pi", "antigravity", "agy"]);
    if (!ALLOWED_PROVIDERS.has(activeProvider) || !usage?.contextLimit || usage.contextLimit <= 0) {
        return null;
    }

    const contextLimit = usage.contextLimit;
    const contextTokens = usage.contextTokens || 0;
    const totalTokens = usage.totalTokens || 0;
    const totalCost = usage.totalCost || 0;
    const showCost = (activeProvider !== "antigravity" && activeProvider !== "agy") && (totalCost > 0 || activeProvider === "solidx" || activeProvider === "pi" || activeProvider === "claude");

    const pct = Math.min(100, Math.max(0, Math.round((contextTokens / contextLimit) * 100)));

    // SVG circular ring geometry (radius = 7.5, viewBox 0 0 20 20)
    const radius = 7.5;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - pct / 100);

    const handleMouseEnter = () => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        if (!disabled) {
            setOpen(true);
        }
    };

    const handleMouseLeave = () => {
        if (pinned) return;
        closeTimerRef.current = setTimeout(() => {
            setOpen(false);
        }, 150);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (disabled) return;
        if (pinned) {
            setPinned(false);
            setOpen(false);
        } else {
            setPinned(true);
            setOpen(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            setPinned(false);
            setOpen(false);
        }
    };

    return (
        <SolidPopover
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) setPinned(false);
            }}
            autoCloseGroup="solid-agent-context-pill"
        >
            <SolidPopoverTrigger asChild>
                <button
                    type="button"
                    className={styles.contextPillBtn}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onKeyDown={handleKeyDown}
                    aria-label={`Context window usage: ${pct}%. ${contextTokens.toLocaleString()} of ${formatLimit(contextLimit)} tokens`}
                    disabled={disabled}
                >
                    <svg className={styles.contextRingSvg} viewBox="0 0 20 20" aria-hidden="true">
                        <circle
                            cx="10"
                            cy="10"
                            r={radius}
                            className={styles.contextRingTrack}
                            strokeWidth="2.2"
                        />
                        <circle
                            cx="10"
                            cy="10"
                            r={radius}
                            className={styles.contextRingProgress}
                            strokeWidth="2.2"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </SolidPopoverTrigger>

            <SolidPopoverContent
                side="top"
                align="center"
                sideOffset={8}
                portal={true}
                className={styles.contextPopoverContent}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className={styles.contextCardRow}>
                    <span className={styles.contextCardLabel}>Context</span>
                    <span className={styles.contextCardValue}>{pct}%</span>
                </div>
                <div className={styles.contextCardRow}>
                    <span className={styles.contextCardLabel}>Tokens</span>
                    <span className={styles.contextCardValue}>
                        {contextTokens.toLocaleString()} / {formatLimit(contextLimit)}
                    </span>
                </div>
                <div className={styles.contextCardRow}>
                    <span className={styles.contextCardLabel}>Session Total</span>
                    <span className={styles.contextCardValue}>{totalTokens.toLocaleString()}</span>
                </div>
                {showCost && (
                    <div className={styles.contextCardRow}>
                        <span className={styles.contextCardLabel}>Cost</span>
                        <span className={styles.contextCardValue}>{formatCost(totalCost)}</span>
                    </div>
                )}
            </SolidPopoverContent>
        </SolidPopover>
    );
}
