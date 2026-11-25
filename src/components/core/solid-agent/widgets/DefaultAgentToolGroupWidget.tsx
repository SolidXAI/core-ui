import { useEffect, useRef, useState } from "react";
import { ChevronRight, LoaderCircle } from "lucide-react";
import type { SolidToolGroupWidgetProps } from "../../../../types/solid-core";
import { AgentEventTypes } from "../types";
import styles from "./solidChatWidgets.module.css";

function formatWorkedDuration(seconds: number): string {
    const s = Math.max(1, seconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

/** Default disclosure for consecutive agent activity items within one turn. */
export function DefaultAgentToolGroupWidget({
    turnKey,
    items,
    working,
    startedAt,
    endedAt,
    totalStartedAt,
    isLastActivity,
    hasMultipleActivities,
    renderItem,
}: SolidToolGroupWidgetProps) {
    const [expanded, setExpanded] = useState(working);
    const prevWorkingRef = useRef(working);

    useEffect(() => {
        if (working && !prevWorkingRef.current) setExpanded(true);
        else if (!working && prevWorkingRef.current) setExpanded(false);
        prevWorkingRef.current = working;
    }, [working]);

    const [now, setNow] = useState(() => Date.now());
    const startTimeRef = useRef(startedAt || items[0]?.at || Date.now());
    const endTimeRef = useRef<number | undefined>(endedAt);

    useEffect(() => {
        if (startedAt) startTimeRef.current = startedAt;
        if (endedAt) endTimeRef.current = endedAt;
    }, [startedAt, endedAt]);

    useEffect(() => {
        if (!working) {
            if (!endTimeRef.current) endTimeRef.current = Date.now();
            return;
        }
        endTimeRef.current = undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [working]);

    const toolCount = items.filter((item) => item.eventType === AgentEventTypes.toolCalling).length;

    let seconds = 0;
    if (working) {
        seconds = Math.max(1, Math.floor((now - startTimeRef.current) / 1000));
    } else {
        const stepMs = (endTimeRef.current && startTimeRef.current) ? (endTimeRef.current - startTimeRef.current) : 0;
        let recordedSeconds = Math.max(0, Math.floor(stepMs / 1000));
        if (recordedSeconds === 0 && items.length > 1) {
            recordedSeconds = Math.max(0, Math.floor((items[items.length - 1].at - items[0].at) / 1000));
        }
        const sumToolMs = items.reduce((acc, item) => acc + (Number(item.eventData?.duration_ms) || 0), 0);
        const toolDurationSeconds = Math.round(sumToolMs / 1000);
        seconds = Math.max(recordedSeconds, toolDurationSeconds, 1);
    }

    let totalSeconds = 0;
    if (totalStartedAt) {
        const effectiveEnd = working ? now : (endTimeRef.current || items[items.length - 1]?.at || now);
        totalSeconds = Math.max(0, Math.floor((effectiveEnd - totalStartedAt) / 1000));
    }

    const durationLabel = formatWorkedDuration(seconds);
    const showTotal = Boolean(hasMultipleActivities && totalSeconds > seconds);
    const totalDurationLabel = showTotal ? formatWorkedDuration(totalSeconds) : "";

    const summary = working
        ? `Working · ${toolCount ? `${toolCount} tool${toolCount === 1 ? "" : "s"} · ` : ""}${durationLabel}${showTotal ? ` (Total ${totalDurationLabel})` : ""}`
        : isLastActivity && showTotal
            ? `Worked for ${durationLabel} · Total ${totalDurationLabel}`
            : `Worked for ${durationLabel}`;

    const panelId = `agent-activity-${turnKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

    if (items.length === 0 && !working) return null;

    return (
        <section className={styles.ActivityGroup} aria-label="Agent activity">
            <button
                type="button"
                className={styles.ActivitySummary}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setExpanded((value) => !value)}
            >
                {working && <LoaderCircle size={13} className={styles.ActivitySpinner} aria-hidden="true" />}
                <span className={styles.ActivitySummaryText}>{summary}</span>
                <ChevronRight size={13} className={`${styles.ActivityChevron} ${expanded ? styles.ActivityChevronOpen : ""}`} aria-hidden="true" />
            </button>
            {expanded && items.length > 0 && (
                <div id={panelId} className={styles.ActivityDetails}>
                    {items.map(renderItem)}
                </div>
            )}
        </section>
    );
}
