import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronRight, LoaderCircle } from "lucide-react";
import styles from "../SolidAgent.module.css";
import widgetStyles from "../widgets/solidChatWidgets.module.css";

import { AgentEventTypes, type AgentChatItem, type AgentContext } from "../types";
import { SolidAgentMessageCopyButton } from "../SolidAgentMarkdown";
import { SolidAgentChatItem } from "./SolidAgentChatItem";
import { parseWidgetContent } from "./inlineWidget";
import { formatChatTime } from "../widgets/chatWidgetUtils";

type Props = {
    items: AgentChatItem[];
    thinking: boolean;
    working?: boolean;
    hasMore: boolean;
    loadingOlder?: boolean;
    context?: AgentContext;
    emptyState?: React.ReactNode;
    onLoadOlder: () => void;
    onReply: (widgetId: string, widget: string, value: unknown) => void;
    onPrompt: (text: string) => void;
};

type ItemGroup = { kind: "user"; item: AgentChatItem } | { kind: "agent"; key: string; items: AgentChatItem[] };

const isUserItem = (item: AgentChatItem) => item.eventType === AgentEventTypes.userMessage && !item.widget;
const ASSISTANT_MESSAGE_TYPES = new Set<string>([
    AgentEventTypes.llmToken,
    AgentEventTypes.llmComplete,
    AgentEventTypes.turnComplete,
    AgentEventTypes.turnCompleteLegacy,
]);

const isAssistantMessage = (item: AgentChatItem) => !item.widget && ASSISTANT_MESSAGE_TYPES.has(item.eventType);

const assistantCopyContent = (item: AgentChatItem): string | null => {
    if (item.widget === "markdown" || item.widget === "SolidMarkdownChatWidget") {
        const data = item.eventData?.props ?? item.eventData;
        return typeof (data?.text ?? data?.content) === "string" ? (data.text ?? data.content) : null;
    }
    if (!isAssistantMessage(item)) return null;
    const inline = parseWidgetContent(item.eventData?.content);
    if (inline) {
        if (inline.widget !== "markdown" && inline.widget !== "SolidMarkdownChatWidget") return null;
        return typeof (inline.data.text ?? inline.data.content) === "string" ? (inline.data.text ?? inline.data.content) : null;
    }
    return typeof item.eventData?.content === "string" ? item.eventData.content : null;
};

/** Consecutive agent items form one turn (one avatar); each user message stands alone. */
function groupItems(items: AgentChatItem[]): ItemGroup[] {
    const groups: ItemGroup[] = [];
    let turn: AgentChatItem[] = [];
    let turnKey = "initial-agent-turn";
    const flush = () => {
        if (turn.length) groups.push({ kind: "agent", key: turnKey, items: turn });
        turn = [];
    };
    for (const item of items) {
        if (isUserItem(item)) {
            flush();
            groups.push({ kind: "user", item });
            turnKey = `after-${item.id}`;
        } else {
            turn.push(item);
        }
    }
    flush();
    return groups;
}

function formatWorkedDuration(seconds: number): string {
    const s = Math.max(1, seconds);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

function AgentActivityDisclosure({
    turnKey,
    items,
    working,
    renderItem,
}: {
    turnKey: string;
    items: AgentChatItem[];
    working: boolean;
    renderItem: (item: AgentChatItem) => React.ReactNode;
}) {
    const [expanded, setExpanded] = useState(working);
    const prevWorkingRef = useRef(working);
    const userToggledRef = useRef(false);

    useEffect(() => {
        if (working && !prevWorkingRef.current) {
            userToggledRef.current = false;
            setExpanded(true);
        } else if (!working && prevWorkingRef.current) {
            setExpanded(false);
        }
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
        <section className={widgetStyles.ActivityGroup} aria-label="Agent activity">
            <button
                type="button"
                className={widgetStyles.ActivitySummary}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => {
                    userToggledRef.current = true;
                    setExpanded((value) => !value);
                }}
            >
                {working && <LoaderCircle size={13} className={widgetStyles.ActivitySpinner} aria-hidden="true" />}
                <span className={widgetStyles.ActivitySummaryText}>{summary}</span>
                <ChevronRight size={13} className={`${widgetStyles.ActivityChevron} ${expanded ? widgetStyles.ActivityChevronOpen : ""}`} aria-hidden="true" />
            </button>
            {expanded && items.length > 0 && (
                <div id={panelId} className={widgetStyles.ActivityDetails}>
                    {items.map(renderItem)}
                </div>
            )}
        </section>
    );
}

/** Renders thread items; sticks to the bottom while new content streams unless the user scrolled up. */
export function AgentThread({ items, thinking, working = thinking, hasMore, loadingOlder = false, context, emptyState, onLoadOlder, onReply, onPrompt }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const pinned = useRef(true);
    const prevHeight = useRef(0);
    const prevFirstId = useRef<string | undefined>(undefined);

    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const firstId = items[0]?.id;
        if (prevFirstId.current && firstId !== prevFirstId.current && prevHeight.current) {
            // Older history was prepended: keep the viewport where it was.
            el.scrollTop = el.scrollHeight - prevHeight.current;
        } else if (pinned.current) {
            el.scrollTop = el.scrollHeight;
        }
        prevFirstId.current = firstId;
        prevHeight.current = el.scrollHeight;
    }, [items]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onScroll = () => {
            pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
            prevHeight.current = el.scrollHeight;
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, []);

    if (!items.length && !thinking && emptyState) {
        return <div className={styles.thread}>{emptyState}</div>;
    }

    const groups = groupItems(items);
    const lastGroup = groups[groups.length - 1];
    if (working && (!lastGroup || lastGroup.kind === "user")) {
        groups.push({
            kind: "agent",
            key: lastGroup?.kind === "user" ? `after-${lastGroup.item.id}` : "working-turn",
            items: [],
        });
    }
    const renderItem = (item: AgentChatItem, showMessageMeta?: boolean) => (
        <SolidAgentChatItem key={item.id} item={item} agentContext={context} showMessageMeta={showMessageMeta} onReply={onReply} onPrompt={onPrompt} />
    );

    return (
        <div ref={scrollRef} className={styles.thread} role="log" aria-live="polite" aria-relevant="additions">
            {hasMore && (
                <button type="button" className={`${styles.btn} ${styles.loadMore}`} onClick={onLoadOlder} disabled={loadingOlder}>
                    {loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
                </button>
            )}
            {groups.map((group) => {
                if (group.kind === "user") return renderItem(group.item);

                const isCurrentTurn = working && group === groups[groups.length - 1];
                const assistantCopyText = [...group.items].reverse()
                    .map(assistantCopyContent)
                    .find((content) => content !== null && content.length > 0);
                const turnContent: React.ReactNode[] = [];
                let activityItems: AgentChatItem[] = [];
                const flushActivity = (isLatest: boolean) => {
                    if (!activityItems.length) return;
                    const activityKey = `${group.key}-${activityItems[0].id}`;
                    turnContent.push(
                        <AgentActivityDisclosure
                            key={`activity-${activityKey}`}
                            turnKey={activityKey}
                            items={activityItems}
                            working={isCurrentTurn && isLatest}
                            renderItem={renderItem}
                        />,
                    );
                    activityItems = [];
                };
                for (const item of group.items) {
                    if (isAssistantMessage(item)) {
                        flushActivity(false);
                        turnContent.push(renderItem(item, false));
                    } else {
                        activityItems.push(item);
                    }
                }
                flushActivity(true);
                if (isCurrentTurn && thinking && group.items.length === 0) {
                    turnContent.push(
                        <AgentActivityDisclosure
                            key={`activity-${group.key}`}
                            turnKey={group.key}
                            items={[]}
                            working
                            renderItem={renderItem}
                        />,
                    );
                }
                if (!isCurrentTurn && assistantCopyText) {
                    turnContent.push(
                        <div key={`meta-${group.key}`} className={`${widgetStyles.BubbleMeta} ${widgetStyles.BubbleMetaAssistant} ${widgetStyles.TurnMeta}`}>
                            <span className={widgetStyles.Timestamp}>{formatChatTime(group.items[group.items.length - 1].at)}</span>
                            <SolidAgentMessageCopyButton text={assistantCopyText} />
                        </div>,
                    );
                }

                return (
                    <div key={group.key} className={widgetStyles.AiTurnGroup}>
                        <div className={widgetStyles.AiTurnContent}>{turnContent}</div>
                    </div>
                );
            })}
        </div>
    );
}
