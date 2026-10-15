import React, { useEffect, useRef, useState } from "react";
import { Brain, Check, ChevronUp, Cpu, Zap } from "lucide-react";
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
    selectedSpeed = "standard",
    onThinkingToggle,
    onFastToggle,
    onReasoningSelect,
    onSpeedSelect,
}: AgentModelIndicatorProps) {
    const detailsRef = useRef<HTMLDetailsElement>(null);
    const reasoningDetailsRef = useRef<HTMLDetailsElement>(null);
    const [modelOpen, setModelOpen] = useState(false);
    const [reasoningOpen, setReasoningOpen] = useState(false);

    useEffect(() => {
        if (!modelOpen) return;
        const handleOutside = (e: MouseEvent) => {
            if (detailsRef.current && !detailsRef.current.contains(e.target as Node)) {
                setModelOpen(false);
                if (detailsRef.current) detailsRef.current.open = false;
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [modelOpen]);

    useEffect(() => {
        if (!reasoningOpen) return;
        const handleOutside = (e: MouseEvent) => {
            if (reasoningDetailsRef.current && !reasoningDetailsRef.current.contains(e.target as Node)) {
                setReasoningOpen(false);
                if (reasoningDetailsRef.current) reasoningDetailsRef.current.open = false;
            }
        };
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, [reasoningOpen]);

    const activeProviderInfo = providers.find((p) => p.id === activeProvider);
    const activeModelInfo = models.find((m) => m.id === activeModel) || (models.length > 0 ? models[0] : undefined);

    let summaryLabel = "Models";
    if (activeProviderInfo && activeProviderInfo.id !== "solidx") {
        summaryLabel = activeModelInfo ? activeModelInfo.name || activeModelInfo.id : activeProviderInfo.name;
    } else if (activeModel) {
        summaryLabel = activeModel;
    } else if (assignments?.reasoning?.model) {
        summaryLabel = assignments.reasoning.model;
    }

    const hasCliModels = models && models.length > 0;
    const hasAssignments = assignments && (assignments.fast || assignments.reasoning);

    const isNativeProvider = !activeProvider || activeProvider === "solidx";

    const reasoningEfforts = activeModelInfo?.reasoning_efforts || [];
    const hasReasoningSupport =
        !isNativeProvider &&
        (reasoningEfforts.length > 0 ||
            Boolean(activeModelInfo?.supports_thinking) ||
            REASONING_PROVIDERS.has(activeProvider) ||
            (activeModel?.includes("thinking") ?? false));

    const speedTiers = activeModelInfo?.speed_tiers || [];
    const hasSpeedSupport =
        !isNativeProvider &&
        !SPEED_EXCLUDED_PROVIDERS.has(activeProvider) &&
        (speedTiers.length > 0 ||
            Boolean(activeModelInfo?.supports_fast) ||
            SPEED_PROVIDERS.has(activeProvider));

    if (!hasCliModels && !hasAssignments && providers.length <= 1 && !hasReasoningSupport && !hasSpeedSupport) {
        return null;
    }

    const activeEffortObj = reasoningEfforts.find((r) => r.id === selectedReasoning);
    const reasoningLabel = !isThinking
        ? "Thinking: Off"
        : activeEffortObj
        ? `Thinking (${activeEffortObj.name})`
        : selectedReasoning
        ? `Thinking (${selectedReasoning})`
        : "Thinking";

    return (
        <div className={styles.composerControlsGroup}>
            {(hasCliModels || hasAssignments || providers.length > 1) && (
                <details
                    ref={detailsRef}
                    className={`${styles.modelInfo} ${styles.modelInfoInline}`}
                    open={modelOpen}
                    onToggle={(e) => setModelOpen((e.target as HTMLDetailsElement).open)}
                >
                    <summary
                        className={styles.modelInfoSummary}
                        title="Select model or view configuration"
                        aria-label="Select model or view configuration"
                    >
                        <Cpu size={14} aria-hidden="true" />
                        <span className={styles.modelInfoLabelText}>{summaryLabel}</span>
                        <ChevronUp className={styles.modelInfoChevron} size={12} aria-hidden="true" />
                    </summary>
                    <div className={styles.modelInfoMenu}>
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
                                                if (detailsRef.current) detailsRef.current.open = false;
                                            }}
                                            disabled={disabled}
                                        >
                                            <div className={styles.modelSelectItemInfo}>
                                                <div className={styles.modelSelectItemName}>
                                                    {m.name || m.id}
                                                    {m.is_default && <span className={styles.modelDefaultTag}>default</span>}
                                                </div>
                                                {m.description && <div className={styles.modelSelectItemDesc}>{m.description}</div>}
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
                    </div>
                </details>
            )}

            {/* Thinking / Reasoning control */}
            {hasReasoningSupport && (
                reasoningEfforts.length > 0 ? (
                    <details
                        ref={reasoningDetailsRef}
                        className={styles.featureDropdown}
                        open={reasoningOpen}
                        onToggle={(e) => setReasoningOpen((e.target as HTMLDetailsElement).open)}
                    >
                        <summary
                            className={`${styles.featureSummary} ${isThinking ? styles.featureSummaryActive : ""}`}
                            title="Reasoning effort"
                            aria-label="Reasoning effort"
                        >
                            <Brain size={13} aria-hidden="true" />
                            <span>{reasoningLabel}</span>
                            <ChevronUp className={styles.featureChevron} size={11} aria-hidden="true" />
                        </summary>
                        <div className={styles.featureMenu}>
                            <div className={styles.featureMenuHeading}>
                                <strong>Reasoning Effort</strong>
                                <span>Control thinking depth</span>
                            </div>
                            <button
                                type="button"
                                className={`${styles.featureMenuItem} ${!isThinking ? styles.featureMenuItemActive : ""}`}
                                onClick={() => {
                                    onReasoningSelect?.("none");
                                    setReasoningOpen(false);
                                    if (reasoningDetailsRef.current) reasoningDetailsRef.current.open = false;
                                }}
                                disabled={disabled}
                            >
                                <span>Off</span>
                                {!isThinking && <Check size={13} />}
                            </button>
                            {reasoningEfforts.map((r) => {
                                const isSelected = isThinking && (selectedReasoning === r.id || (!selectedReasoning && r.id === activeModelInfo?.default_reasoning));
                                return (
                                    <button
                                        key={r.id}
                                        type="button"
                                        className={`${styles.featureMenuItem} ${isSelected ? styles.featureMenuItemActive : ""}`}
                                        onClick={() => {
                                            onReasoningSelect?.(r.id);
                                            setReasoningOpen(false);
                                            if (reasoningDetailsRef.current) reasoningDetailsRef.current.open = false;
                                        }}
                                        disabled={disabled}
                                        title={r.description}
                                    >
                                        <span>{r.name}</span>
                                        {isSelected && <Check size={13} />}
                                    </button>
                                );
                            })}
                        </div>
                    </details>
                ) : (
                    <button
                        type="button"
                        className={`${styles.featureToggleBtn} ${isThinking ? styles.featureToggleThinkingActive : ""}`}
                        onClick={onThinkingToggle}
                        disabled={disabled}
                        title={isThinking ? "Thinking is enabled" : "Enable thinking"}
                        aria-label="Toggle thinking"
                    >
                        <Brain size={13} aria-hidden="true" />
                        <span>Thinking</span>
                    </button>
                )
            )}

            {/* Fast mode control */}
            {hasSpeedSupport && (
                <button
                    type="button"
                    className={`${styles.featureToggleBtn} ${isFast ? styles.featureToggleFastActive : ""}`}
                    onClick={onFastToggle}
                    disabled={disabled}
                    title={isFast ? "Fast speed active" : "Enable fast mode"}
                    aria-label="Toggle fast mode"
                >
                    <Zap size={13} aria-hidden="true" />
                    <span>Fast</span>
                </button>
            )}
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
