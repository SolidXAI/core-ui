import React, { useMemo } from "react";
import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../../shad-cn-ui/SolidTooltip";
import styles from "../SolidAgent.module.css";

export interface AgentContextPillProps {
    cost?: number;
    tokens?: number;
    contextLimit?: number;
    disabled?: boolean;
}

export function AgentContextPill({
    cost = 0,
    tokens = 0,
    contextLimit = 200_000,
    disabled = false,
}: AgentContextPillProps) {
    const percentage = useMemo(() => {
        if (!contextLimit || contextLimit <= 0) return 0;
        return Math.min(100, Math.max(0, Math.round((tokens / contextLimit) * 100)));
    }, [tokens, contextLimit]);

    const formattedCost = useMemo(() => {
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cost);
    }, [cost]);

    const formattedTokens = useMemo(() => {
        return (tokens || 0).toLocaleString("en-US");
    }, [tokens]);

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
                    aria-label={`Context Usage: ${percentage}%, Cost: ${formattedCost}, Tokens: ${formattedTokens}`}
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
                        <span className={styles.contextTooltipLabel}>Cost</span>
                        <span className={styles.contextTooltipValue}>{formattedCost}</span>
                    </div>
                    <div className={styles.contextTooltipRow}>
                        <span className={styles.contextTooltipLabel}>Usage</span>
                        <span className={styles.contextTooltipValue}>{percentage}%</span>
                    </div>
                    <div className={styles.contextTooltipRow}>
                        <span className={styles.contextTooltipLabel}>Tokens</span>
                        <span className={styles.contextTooltipValue}>{formattedTokens}</span>
                    </div>
                </div>
            </SolidTooltipContent>
        </SolidTooltip>
    );
}
