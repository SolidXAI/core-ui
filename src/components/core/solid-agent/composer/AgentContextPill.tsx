import React, { useMemo } from "react";
import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../../shad-cn-ui/SolidTooltip";
import styles from "../SolidAgent.module.css";

export interface AgentContextPillProps {
    cost?: number;
    contextTokens?: number;
    totalTokens?: number;
    tokens?: number; // Backward-compatible alias for totalTokens
    contextLimit?: number;
    disabled?: boolean;
}

function formatCompact(num: number): string {
    if (num >= 1_000_000) {
        const val = (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1);
        return `${val}M`;
    }
    if (num >= 1_000) {
        const val = (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1);
        return `${val}k`;
    }
    return num.toString();
}

export function AgentContextPill({
    cost = 0,
    contextTokens = 0,
    totalTokens = 0,
    tokens = 0,
    contextLimit = 200_000,
    disabled = false,
}: AgentContextPillProps) {
    // Determine active context tokens:
    // 1. If explicit contextTokens (> 0) is provided, use it directly (represents current turn prompt tokens).
    // 2. Otherwise fall back to tokens/totalTokens if <= contextLimit (sensible single-turn representation).
    // 3. Otherwise 0.
    const activeTokens = useMemo(() => {
        if (typeof contextTokens === "number" && contextTokens > 0) return contextTokens;
        const fallback = totalTokens > 0 ? totalTokens : tokens;
        if (typeof fallback === "number" && fallback > 0 && fallback <= contextLimit) {
            return fallback;
        }
        return 0;
    }, [contextTokens, totalTokens, tokens, contextLimit]);

    const percentage = useMemo(() => {
        if (!contextLimit || contextLimit <= 0 || activeTokens <= 0) return 0;
        return Math.min(100, Math.max(0, Math.round((activeTokens / contextLimit) * 100)));
    }, [activeTokens, contextLimit]);

    const formattedCost = useMemo(() => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cost);
    }, [cost]);

    const sessionTotal = useMemo(() => {
        const val = totalTokens > 0 ? totalTokens : tokens > 0 ? tokens : activeTokens;
        return (val || 0).toLocaleString("en-US");
    }, [totalTokens, tokens, activeTokens]);

    const activeTokensFormatted = useMemo(() => {
        return (activeTokens || 0).toLocaleString("en-US");
    }, [activeTokens]);

    const compactLimit = useMemo(() => {
        return formatCompact(contextLimit);
    }, [contextLimit]);

    // OpenCode circular SVG math: 16x16, strokeWidth 2, radius 7
    const strokeWidth = 2;
    const radius = 8 - strokeWidth / 2; // 7
    const circumference = 2 * Math.PI * radius; // ~43.982
    const strokeDashoffset = circumference * (1 - percentage / 100);

    return (
        <SolidTooltip delayDuration={150}>
            <SolidTooltipTrigger asChild>
                <button
                    type="button"
                    className={styles.contextPillBtn}
                    aria-label={`Context Usage: ${percentage}%, Cost: ${formattedCost}, Active: ${activeTokensFormatted} of ${compactLimit}`}
                    disabled={disabled}
                >
                    <svg
                        width={16}
                        height={16}
                        viewBox="0 0 16 16"
                        className={styles.contextPillSvg}
                    >
                        <circle
                            cx={8}
                            cy={8}
                            r={radius}
                            className={styles.contextCircleTrack}
                            strokeWidth={strokeWidth}
                        />
                        <circle
                            cx={8}
                            cy={8}
                            r={radius}
                            className={`${styles.contextCircleProgress} ${percentage >= 90 ? styles.progressDanger : percentage >= 70 ? styles.progressWarning : ""}`}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 8 8)"
                        />
                    </svg>
                </button>
            </SolidTooltipTrigger>
            <SolidTooltipContent side="top" align="center" className={styles.contextTooltipContent}>
                <div className={styles.contextTooltipCard}>
                    <div className={styles.contextTooltipRow}>
                        <span className={styles.contextTooltipLabel}>Context</span>
                        <span className={styles.contextTooltipValue}>{percentage}%</span>
                    </div>
                    <div className={styles.contextTooltipRow}>
                        <span className={styles.contextTooltipLabel}>Tokens</span>
                        <span className={styles.contextTooltipValue}>
                            {activeTokensFormatted} / {compactLimit}
                        </span>
                    </div>
                    <div className={styles.contextTooltipRow}>
                        <span className={styles.contextTooltipLabel}>Session Total</span>
                        <span className={styles.contextTooltipValue}>{sessionTotal}</span>
                    </div>
                    <div className={styles.contextTooltipRow}>
                        <span className={styles.contextTooltipLabel}>Cost</span>
                        <span className={styles.contextTooltipValue}>{formattedCost}</span>
                    </div>
                    {percentage >= 90 && (
                        <div className={styles.contextTooltipWarn}>
                            Context limit near — older context may be compacted
                        </div>
                    )}
                </div>
            </SolidTooltipContent>
        </SolidTooltip>
    );
}
