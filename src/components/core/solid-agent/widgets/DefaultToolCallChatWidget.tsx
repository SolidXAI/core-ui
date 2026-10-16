import { useState } from "react";
import {
    ChevronRight,
    Loader2,
    XCircle,
} from "lucide-react";
import styles from "./solidChatWidgets.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { toolDisplayName } from "../agentFormat";

type ToolStatus = "running" | "success" | "warning" | "error";
type ToolProgressStep = { label: string; status: "running" | "done"; duration_ms?: number };

const CARD_CLASS: Record<ToolStatus, string> = {
    running: styles.ToolCardRunning,
    success: styles.ToolCardDone,
    warning: styles.ToolCardWarning,
    error: styles.ToolCardError,
};

function StatusIcon({ status }: { status: ToolStatus }) {
    if (status === "running") return <Loader2 size={12} className={`${styles.ToolCardStatusIcon} ${styles.Spin}`} />;
    if (status === "error") return <XCircle size={12} className={styles.ToolCardStatusError} />;
    return null;
}

/**
 * Default widget for `ToolCalling`: clean borderless row. `ToolProgress` sub-steps show under the
 * header; `ToolResult` sets the status and duration. Expanding shows the Arguments and Result.
 */
export const DefaultToolCallChatWidget = ({ eventData, live }: SolidChatWidgetProps) => {
    const [expanded, setExpanded] = useState(false);
    const toolName: string = eventData.tool_name ?? "tool";
    const args: Record<string, unknown> | undefined = eventData.arguments;
    const progress: ToolProgressStep[] = Array.isArray(eventData.progress) ? eventData.progress : [];
    const status: ToolStatus = live ? "running" : (eventData.status as ToolStatus) ?? "success";
    const output: string | undefined = eventData.output_raw ?? eventData.output;
    const hasArgs = !!args && Object.keys(args).length > 0;
    const expandable = (hasArgs || !!output) && status !== "running";

    return (
        <div className={`${styles.ToolCard} ${CARD_CLASS[status] ?? styles.ToolCardDone}`}>
            <button
                type="button"
                className={styles.ToolCardHeaderBtn}
                onClick={expandable ? () => setExpanded((value) => !value) : undefined}
                data-expandable={expandable ? "true" : undefined}
                aria-expanded={expandable ? expanded : undefined}
            >
                <StatusIcon status={status} />
                <span className={styles.ToolCardName}>{live ? `Invoking ${toolDisplayName(toolName, args)}…` : toolDisplayName(toolName, args)}</span>
                {eventData.summary && <span className={styles.ToolCardDesc} title={eventData.summary}>{eventData.summary}</span>}
                {expandable && <ChevronRight size={11} className={`${styles.ToolCardChevron} ${expanded ? styles.ToolCardChevronOpen : ""}`} />}
            </button>

            {/* Progress sub-steps: always visible */}
            {progress.length > 0 && (
                <div className={styles.ToolCardProgress}>
                    {progress.map((step, index) => (
                        <div key={index} className={`${styles.ToolProgressItem} ${step.status === "running" ? styles.ToolProgressRunning : styles.ToolProgressDone}`}>
                            {step.status === "running" && <Loader2 size={10} className={styles.Spin} />}
                            <span className={styles.ToolProgressLabel}>{step.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {expanded && (
                <div className={styles.ToolCardExpandable}>
                    {hasArgs && (
                        <div className={styles.ToolCardOutput}>
                            <div className={styles.ToolOutputHeader}>
                                <span>Arguments</span>
                            </div>
                            <pre className={styles.ToolOutputText}>{JSON.stringify(args, null, 2)}</pre>
                        </div>
                    )}
                    {output && (
                        <div className={styles.ToolCardOutput}>
                            <div className={styles.ToolOutputHeader}>
                                <span>Result</span>
                            </div>
                            <pre className={`${styles.ToolOutputText} ${status === "warning" ? styles.ToolOutputWarning : status === "error" ? styles.ToolOutputError : ""}`}>
                                {output}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

Object.assign(DefaultToolCallChatWidget, { getExtensionMetadata: () => ({
    chatInteraction: { role: "event-renderer", agentSelectable: false },
}) });
