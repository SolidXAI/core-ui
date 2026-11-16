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
export function DefaultAgentToolGroupWidget({ turnKey, items, working, renderItem }: SolidToolGroupWidgetProps) {
    const [expanded, setExpanded] = useState(working);
    const prevWorkingRef = useRef(working);

    useEffect(() => {
        if (working && !prevWorkingRef.current) setExpanded(true);
        else if (!working && prevWorkingRef.current) setExpanded(false);
        prevWorkingRef.current = working;
    }, [working]);

    const [now, setNow] = useState(() => Date.now());
    const hasLiveTimer = useRef(working);
    const startTime = useRef(working ? Date.now() : (items[0]?.at || Date.now()));

    useEffect(() => {
        if (!working) {
            if (hasLiveTimer.current) setNow(Date.now());
            return;
        }
        hasLiveTimer.current = true;
        const timer = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, [working]);

    const toolCount = items.filter((item) => item.eventType === AgentEventTypes.toolCalling).length;
    const activeDuration = Math.max(0, Math.floor((now - startTime.current) / 1000));
    let recordedSeconds = 0;
    if (items.length > 1) {
        recordedSeconds = Math.max(0, Math.floor((items[items.length - 1].at - items[0].at) / 1000));
    }
    const sumToolMs = items.reduce((acc, item) => acc + (Number(item.eventData?.duration_ms) || 0), 0);
    const toolDurationSeconds = Math.round(sumToolMs / 1000);
    const seconds = hasLiveTimer.current
        ? activeDuration
        : Math.max(recordedSeconds, toolDurationSeconds, 1);
    const durationLabel = formatWorkedDuration(seconds);
    const summary = working
        ? `Working · ${toolCount ? `${toolCount} tool${toolCount === 1 ? "" : "s"} · ` : ""}${durationLabel}`
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
