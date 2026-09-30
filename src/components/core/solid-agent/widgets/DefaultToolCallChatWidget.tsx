import { useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    CloudUpload,
    Cog,
    File,
    FilePen,
    FilePlus,
    Folder,
    Loader2,
    Pencil,
    Search,
    Terminal,
    XCircle,
    type LucideIcon,
} from "lucide-react";
import styles from "./solidChatWidgets.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { formatDuration, toolCategory, toolDisplayName } from "../agentFormat";

type ToolStatus = "running" | "success" | "warning" | "error";
type ToolProgressStep = { label: string; status: "running" | "done"; duration_ms?: number };

/** Icon for a tool, by name / filesystem action / category (same mapping as the agent-ui). */
function getToolIcon(name: string, args?: Record<string, unknown>): LucideIcon {
    if (name === "bash") return Terminal;
    if (name === "filesystem_tool" && typeof args?.action === "string") {
        if (args.action === "read") return File;
        if (args.action === "search") return Search;
        if (args.action === "edit") return Pencil;
        if (args.action === "write") return FilePlus;
    }
    switch (toolCategory(name)) {
        case "Context":
            return Search;
        case "Build":
            return FilePen;
        case "Deploy":
            return CloudUpload;
        case "Files":
            return Folder;
        default:
            return Cog;
    }
}

const CARD_CLASS: Record<ToolStatus, string> = {
    running: styles.ToolCardRunning,
    success: styles.ToolCardDone,
    warning: styles.ToolCardWarning,
    error: styles.ToolCardError,
};

function StatusIcon({ status }: { status: ToolStatus }) {
    if (status === "running") return <Loader2 size={13} className={`${styles.ToolCardStatusIcon} ${styles.Spin}`} />;
    if (status === "warning") return <AlertTriangle size={13} className={styles.ToolCardStatusWarning} />;
    if (status === "error") return <XCircle size={13} className={styles.ToolCardStatusError} />;
    return <CheckCircle2 size={13} className={styles.ToolCardStatusDone} />;
}

/**
 * Default widget for `ToolCalling`: the tool card. `ToolProgress` sub-steps show under the
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
    const ToolIcon = getToolIcon(toolName, args);

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
                <ToolIcon size={12} className={styles.ToolCardToolIcon} />
                <span className={styles.ToolCardName}>{toolDisplayName(toolName, args)}</span>
                {eventData.summary && <span className={styles.ToolCardDesc} title={eventData.summary}>{eventData.summary}</span>}
                <span className={styles.ToolCardBadge}>{toolCategory(toolName)}</span>
                {eventData.duration_ms != null && <span className={styles.ToolCardDuration}>{formatDuration(eventData.duration_ms)}</span>}
                {expandable && <ChevronRight size={11} className={`${styles.ToolCardChevron} ${expanded ? styles.ToolCardChevronOpen : ""}`} />}
            </button>

            {/* Progress sub-steps: always visible */}
            {progress.length > 0 && (
                <div className={styles.ToolCardProgress}>
                    {progress.map((step, index) => (
                        <div key={index} className={`${styles.ToolProgressItem} ${step.status === "running" ? styles.ToolProgressRunning : styles.ToolProgressDone}`}>
                            {step.status === "running" ? <Loader2 size={10} className={styles.Spin} /> : <CheckCircle2 size={10} />}
                            <span className={styles.ToolProgressLabel}>{step.label}</span>
                            {step.duration_ms != null && step.status === "done" && (
                                <span className={styles.ToolProgressDuration}>{formatDuration(step.duration_ms)}</span>
                            )}
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
