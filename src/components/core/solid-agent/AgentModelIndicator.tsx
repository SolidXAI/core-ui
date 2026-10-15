import React, { useEffect, useRef, useState } from "react";
import { Brain, Check, ChevronLeft, ChevronRight, ChevronUp, Zap } from "lucide-react";
import styles from "./SolidAgent.module.css";
import type { AgentModelAssignment, AgentModelAssignments, AgentProviderInfo, ProviderModelInfo } from "./types";

export type AgentModelIndicatorProps = {
    assignments?: AgentModelAssignments | null;
    activeProvider?: string;
    activeModel?: string;
    providers?: AgentProviderInfo[];
    models?: ProviderModelInfo[];
    onModelSelect?: (modelId: string) => void;
    onProviderSelect?: (providerId: string) => void;
    disabled?: boolean;
    isThinking?: boolean;
    isFast?: boolean;
    selectedReasoning?: string;
    selectedSpeed?: string;
    onThinkingToggle?: () => void;
    onFastToggle?: () => void;
    onReasoningSelect?: (effortId: string) => void;
    onSpeedSelect?: (speedId: string) => void;
};

const REASONING_PROVIDERS = new Set(["antigravity", "opencode", "claude", "copilot"]);
const SPEED_PROVIDERS = new Set(["codex", "cursor"]);
const SPEED_EXCLUDED_PROVIDERS = new Set(["antigravity"]);

/**
 * Strips gateway (~), provider (/), and vendor prefixes for multi-provider agents (e.g. Pi, Droid, OpenRouter).
 * Non-brittle:
 *   1. Does NOT split on colons (':') so model tags/versions like ':8b', ':latest', ':extended' are preserved.
 *   2. Safely filters empty segments to handle trailing delimiters (e.g. 'anthropic/').
 *   3. Always falls back to the original trimmed string if candidate reduces to empty.
 *   4. Null, undefined, and non-string safe.
 */
export function formatSelectedModelLabel(raw: string): string {
    if (!raw || typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";

    let candidate = trimmed;
    // Handle gateway / adapter prefix separated by '~' (e.g. 'openrouter~anthropic/claude-3-5-sonnet')
    if (candidate.includes("~")) {
        const tildeSegments = candidate.split("~").filter(Boolean);
        if (tildeSegments.length > 0) {
            candidate = tildeSegments[tildeSegments.length - 1];
        }
    }

    // Handle provider / vendor prefix separated by '/' (e.g. 'anthropic/claude-3-5-sonnet' or 'openai/gpt-4o')
    if (candidate.includes("/")) {
        const slashSegments = candidate.split("/").filter(Boolean);
        if (slashSegments.length > 0) {
            candidate = slashSegments[slashSegments.length - 1];
        }
    }

    return candidate.trim() || trimmed;
}

export function AgentModelIndicator({
    assignments,
    activeProvider = "solidx",
    activeModel,
    providers = [],
    models = [],
    onModelSelect,
    disabled = false,
    isThinking = false,
    isFast = false,
    selectedReasoning,
    onThinkingToggle,
    onFastToggle,
    onReasoningSelect,
    onSpeedSelect,
}: AgentModelIndicatorProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const [modelOpen, setModelOpen] = useState(false);
    const [effortSubmenuOpen, setEffortSubmenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"models" | "reasoning">("models");
    const [canFitFlyout, setCanFitFlyout] = useState(false);

    const evaluateSpace = () => {
        if (!detailsRef.current) return;
        const rect = detailsRef.current.getBoundingClientRect();
        const windowEl = detailsRef.current.closest<HTMLElement>('[class*="window"]');
        const rightBoundary = windowEl ? windowEl.getBoundingClientRect().right : window.innerWidth;
        // Check if there is at least 200px of free horizontal space to the right for a side flyout
        const available = rightBoundary - (rect.left + 240);
        setCanFitFlyout(available >= 200);
    };

    useEffect(() => {
        if (!modelOpen) return;
        evaluateSpace();
        const handleResize = () => evaluateSpace();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [modelOpen]);

    useEffect(() => {
        if (!modelOpen) return;
        const handleOutside = (e: MouseEvent | TouchEvent) => {
            if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
                setModelOpen(false);
                setEffortSubmenuOpen(false);
                setViewMode("models");
                if (detailsRef.current) detailsRef.current.open = false;
            }
        };
        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("touchstart", handleOutside);
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("touchstart", handleOutside);
        };
    }, [modelOpen]);

    const activeProviderInfo = providers.find((p) => p.id === activeProvider);
    const activeModelInfo = models.find((m) => m.id === activeModel) || (models.length > 0 ? models[0] : undefined);

    let rawModelLabel = "Models";
    if (activeProviderInfo && activeProviderInfo.id !== "solidx") {
        rawModelLabel = activeModelInfo ? activeModelInfo.name || activeModelInfo.id : activeProviderInfo.name;
    } else if (activeModel) {
        rawModelLabel = activeModel;
    } else if (assignments?.reasoning?.model) {
        rawModelLabel = assignments.reasoning.model;
    }

    const displayModelLabel = formatSelectedModelLabel(rawModelLabel);

    const hasCliModels = models && models.length > 0;
    const hasAssignments = assignments && (assignments.fast || assignments.reasoning);

    const isNativeProvider = !activeProvider || activeProvider === "solidx";

    const effectiveModelId = activeModel || activeModelInfo?.id || (models.length === 0 ? "auto" : "");
    const isAutoModel =
        effectiveModelId.toLowerCase() === "auto" ||
        activeModelInfo?.name?.toLowerCase() === "auto" ||
        rawModelLabel.toLowerCase() === "auto";

    const reasoningEfforts = activeModelInfo?.reasoning_efforts || [];
    const hasReasoningSupport =
        !isNativeProvider &&
        !isAutoModel &&
        (reasoningEfforts.length > 0 ||
            Boolean(activeModelInfo?.supports_thinking) ||
            REASONING_PROVIDERS.has(activeProvider) ||
            (activeModel?.includes("thinking") ?? false));

    const speedTiers = activeModelInfo?.speed_tiers || [];
    const hasSpeedSupport =
        !isNativeProvider &&
        !isAutoModel &&
        !SPEED_EXCLUDED_PROVIDERS.has(activeProvider) &&
        (speedTiers.length > 0 ||
            Boolean(activeModelInfo?.supports_fast) ||
            SPEED_PROVIDERS.has(activeProvider));

    if (!hasCliModels && !hasAssignments && providers.length <= 1 && !hasReasoningSupport && !hasSpeedSupport) {
        return null;
    }

    const activeEffortObj = reasoningEfforts.find((r) => r.id === selectedReasoning);
    const effortName = activeEffortObj?.name || (selectedReasoning && selectedReasoning !== "none" ? selectedReasoning : "");

    return (
        <div className={styles.composerControlsGroup}>
            <details
                ref={detailsRef}
                className={`${styles.modelInfo} ${styles.modelInfoInline}`}
                open={modelOpen}
                onToggle={(e) => {
                    const isOpen = (e.target as HTMLDetailsElement).open;
                    setModelOpen(isOpen);
                    if (!isOpen) {
                        setEffortSubmenuOpen(false);
                        setViewMode("models");
                    } else {
                        evaluateSpace();
                    }
                }}
            >
                <summary
                    className={styles.modelInfoSummary}
                    title={rawModelLabel}
                    aria-label={rawModelLabel}
                >
                    <span className={styles.modelInfoModelText}>{displayModelLabel}</span>
                    {hasReasoningSupport && isThinking && (
                        <span className={styles.modelInfoEffortText}>
                            {effortName || "Thinking"}
                        </span>
                    )}
                    {hasSpeedSupport && isFast && (
                        <Zap size={11} className={styles.modelInfoFastBadge} aria-label="Fast mode active" />
                    )}
                    <ChevronUp className={styles.modelInfoChevron} size={12} aria-hidden="true" />
                </summary>
                <div className={styles.modelInfoMenu}>
                    {viewMode === "reasoning" ? (
                        /* ── Drill-Down Sub-View for Constrained Screens (Phones, Tablets, Docked, Floating) ── */
                        <div className={styles.drilldownView}>
                            <div className={styles.drilldownHeader}>
                                <button
                                    type="button"
                                    className={styles.drilldownBackBtn}
                                    onClick={() => setViewMode("models")}
                                    aria-label="Back to models"
                                >
                                    <ChevronLeft size={14} />
                                    <span>Models</span>
                                </button>
                                <span className={styles.drilldownTitle}>Reasoning Effort</span>
                            </div>
                            <div className={styles.effortSelectList}>
                                <button
                                    type="button"
                                    className={`${styles.modelSelectItem} ${!isThinking ? styles.modelSelectItemActive : ""}`}
                                    onClick={() => {
                                        onReasoningSelect?.("none");
                                        setViewMode("models");
                                        setModelOpen(false);
                                        if (detailsRef.current) detailsRef.current.open = false;
                                    }}
                                    disabled={disabled}
                                >
                                    <span>Off</span>
                                    {!isThinking && <Check size={14} className={styles.modelCheckIcon} />}
                                </button>
                                {reasoningEfforts.map((r) => {
                                    const isSelected = isThinking && (selectedReasoning === r.id || (!selectedReasoning && r.id === activeModelInfo?.default_reasoning));
                                    return (
                                        <button
                                            key={r.id}
                                            type="button"
                                            className={`${styles.modelSelectItem} ${isSelected ? styles.modelSelectItemActive : ""}`}
                                            onClick={() => {
                                                onReasoningSelect?.(r.id);
                                                setViewMode("models");
                                                setModelOpen(false);
                                                if (detailsRef.current) detailsRef.current.open = false;
                                            }}
                                            disabled={disabled}
                                        >
                                            <span>{r.name || r.id}</span>
                                            {isSelected && <Check size={14} className={styles.modelCheckIcon} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* ── Main Models View ── */
                        <>
                            <div className={styles.modelInfoHeading}>
                                <strong>{activeProviderInfo ? activeProviderInfo.name : "Configured models"}</strong>
                                <span>{hasCliModels ? "Switch active model" : "Used by this agent"}</span>
                            </div>

                            {hasCliModels ? (
                                <div className={styles.modelSelectList}>
                                    {models.map((m) => {
                                        const isSelected = m.id === activeModel || (!activeModel && m.is_default);
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                className={`${styles.modelSelectItem} ${isSelected ? styles.modelSelectItemActive : ""}`}
                                                onClick={() => {
                                                    onModelSelect?.(m.id);
                                                    setModelOpen(false);
                                                    setEffortSubmenuOpen(false);
                                                    if (detailsRef.current) detailsRef.current.open = false;
                                                }}
                                                disabled={disabled}
                                                title={m.name || m.id}
                                            >
                                                <div className={styles.modelSelectItemName}>
                                                    <span>{m.name || m.id}</span>
                                                    {m.is_default && <span className={styles.modelDefaultTag}>default</span>}
                                                </div>
                                                {isSelected && <Check size={14} className={styles.modelCheckIcon} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : hasAssignments ? (
                                <>
                                    <ModelRow name="Reasoning" assignment={assignments?.reasoning ?? null} />
                                    <ModelRow name="Fast" assignment={assignments?.fast ?? null} />
                                </>
                            ) : null}

                            {/* Thinking / Reasoning submenu row inside the unified model menu */}
                            {hasReasoningSupport && (
                                <>
                                    <div className={styles.modelMenuDivider} />
                                    {reasoningEfforts.length > 0 ? (
                                        <div
                                            className={styles.modelSubmenuContainer}
                                            onMouseEnter={() => {
                                                if (canFitFlyout) setEffortSubmenuOpen(true);
                                            }}
                                            onMouseLeave={() => {
                                                if (canFitFlyout) setEffortSubmenuOpen(false);
                                            }}
                                        >
                                            <button
                                                type="button"
                                                className={`${styles.modelSubmenuRow} ${isThinking ? styles.modelSubmenuRowActive : ""}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (canFitFlyout) {
                                                        setEffortSubmenuOpen((prev) => !prev);
                                                    } else {
                                                        setViewMode("reasoning");
                                                    }
                                                }}
                                                aria-haspopup="menu"
                                                aria-expanded={effortSubmenuOpen}
                                            >
                                                <div className={styles.modelSubmenuRowLeft}>
                                                    <Brain size={13} className={isThinking ? styles.modelSubmenuIconActive : ""} />
                                                    <span>Thinking</span>
                                                </div>
                                                <div className={styles.modelSubmenuRowRight}>
                                                    <span className={styles.modelSubmenuValue}>
                                                        {isThinking ? (effortName || "On") : "Off"}
                                                    </span>
                                                    <ChevronRight size={12} className={styles.modelSubmenuChevron} />
                                                </div>
                                            </button>

                                            {/* Flyout submenu when wide space allows */}
                                            {canFitFlyout && effortSubmenuOpen && (
                                                <div className={styles.modelSubmenu} role="menu">
                                                    <div className={styles.modelSubmenuHeading}>
                                                        <strong>Reasoning Effort</strong>
                                                        <span>Control thinking depth</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={`${styles.modelSelectItem} ${!isThinking ? styles.modelSelectItemActive : ""}`}
                                                        onClick={() => {
                                                            onReasoningSelect?.("none");
                                                            setEffortSubmenuOpen(false);
                                                            setModelOpen(false);
                                                            if (detailsRef.current) detailsRef.current.open = false;
                                                        }}
                                                        disabled={disabled}
                                                    >
                                                        <span>Off</span>
                                                        {!isThinking && <Check size={13} className={styles.modelCheckIcon} />}
                                                    </button>
                                                    {reasoningEfforts.map((r) => {
                                                        const isSelected = isThinking && (selectedReasoning === r.id || (!selectedReasoning && r.id === activeModelInfo?.default_reasoning));
                                                        return (
                                                            <button
                                                                key={r.id}
                                                                type="button"
                                                                className={`${styles.modelSelectItem} ${isSelected ? styles.modelSelectItemActive : ""}`}
                                                                onClick={() => {
                                                                    onReasoningSelect?.(r.id);
                                                                    setEffortSubmenuOpen(false);
                                                                    setModelOpen(false);
                                                                    if (detailsRef.current) detailsRef.current.open = false;
                                                                }}
                                                                disabled={disabled}
                                                                title={r.description || r.name}
                                                            >
                                                                <span>{r.name || r.id}</span>
                                                                {isSelected && <Check size={13} className={styles.modelCheckIcon} />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            className={`${styles.modelSelectItem} ${isThinking ? styles.modelSelectItemActive : ""}`}
                                            onClick={() => {
                                                onThinkingToggle?.();
                                                setModelOpen(false);
                                                if (detailsRef.current) detailsRef.current.open = false;
                                            }}
                                            disabled={disabled}
                                        >
                                            <div className={styles.modelSubmenuRowLeft}>
                                                <Brain size={13} className={isThinking ? styles.modelSubmenuIconActive : ""} />
                                                <span>Thinking</span>
                                            </div>
                                            <span className={isThinking ? styles.modelDefaultTagActive : styles.modelSubmenuValue}>
                                                {isThinking ? "On" : "Off"}
                                            </span>
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Fast Mode toggle inside the unified model menu */}
                            {hasSpeedSupport && (
                                <>
                                    <div className={styles.modelMenuDivider} />
                                    <button
                                        type="button"
                                        className={`${styles.modelSelectItem} ${isFast ? styles.modelSelectItemFastActive : ""}`}
                                        onClick={() => {
                                            if (onFastToggle) onFastToggle();
                                            else if (onSpeedSelect) onSpeedSelect(isFast ? "standard" : "fast");
                                            setModelOpen(false);
                                            if (detailsRef.current) detailsRef.current.open = false;
                                        }}
                                        disabled={disabled}
                                    >
                                        <div className={styles.modelSubmenuRowLeft}>
                                            <Zap size={13} className={isFast ? styles.modelFastIconActive : ""} />
                                            <span>Fast Mode</span>
                                        </div>
                                        <span className={isFast ? styles.modelFastTagActive : styles.modelSubmenuValue}>
                                            {isFast ? "On" : "Off"}
                                        </span>
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </details>
        </div>
    );
}

function ModelRow({ name, assignment }: { name: string; assignment: AgentModelAssignment }) {
    return (
        <div className={styles.modelInfoRow}>
            <span className={styles.modelInfoRole}>{name}</span>
            {assignment ? (
                <>
                    <strong className={styles.modelInfoModel}>{assignment.model}</strong>
                    <span className={styles.modelInfoProvider}>{assignment.provider}</span>
                </>
            ) : (
                <strong className={styles.modelInfoUnavailable}>Not configured</strong>
            )}
        </div>
    );
}
