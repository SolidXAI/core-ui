import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, LoaderCircle } from "lucide-react";
import styles from "../SolidAgent.module.css";
import widgetStyles from "../widgets/solidChatWidgets.module.css";
import { SolidXAIIcon } from "../SolidXAIIcon";
import { AgentEventTypes, type AgentChatItem, type AgentContext } from "../types";
import { toolCategory } from "../agentFormat";
import { SolidAgentMessageCopyButton } from "../SolidAgentMarkdown";
import { SolidAgentChatItem } from "./SolidAgentChatItem";
import { parseWidgetContent } from "./inlineWidget";
import { formatChatTime } from "../widgets/chatWidgetUtils";

type Props = {
    items: AgentChatItem[];
    thinking: boolean;
    working?: boolean;
    hasMore: boolean;
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
const isVisibleCurrentTool = (item: AgentChatItem) =>
    item.eventType === AgentEventTypes.toolCalling
    && toolCategory(item.eventData?.tool_name ?? "") !== "Context";

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

function AgentActivityDisclosure({
    turnKey,
    items,
    detailItems,
    working,
    showSummary,
    renderItem,
}: {
    turnKey: string;
    items: AgentChatItem[];
    detailItems: AgentChatItem[];
    working: boolean;
    showSummary: boolean;
    renderItem: (item: AgentChatItem) => React.ReactNode;
}) {
    const [expanded, setExpanded] = useState(false);
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
    const recordedDuration = items.length > 1
        ? Math.max(0, Math.floor((items[items.length - 1].at - items[0].at) / 1000))
        : 0;
    const seconds = hasLiveTimer.current ? activeDuration : recordedDuration;
    const durationLabel = `${seconds}s`;
    const summary = working
        ? `Working · ${toolCount ? `${toolCount} tool${toolCount === 1 ? "" : "s"} · ` : ""}${durationLabel}`
        : toolCount
          ? `${toolCount} tool${toolCount === 1 ? "" : "s"} called · took ${durationLabel}`
          : `Activity · took ${durationLabel}`;
    const panelId = `agent-activity-${turnKey.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

    return (
        <section className={`${widgetStyles.ActivityGroup} ${showSummary ? "" : widgetStyles.ActivityTimerOnly}`} aria-label={showSummary ? "Agent activity" : undefined}>
            {showSummary && (
                <>
                    {detailItems.length > 0 ? <button
                        type="button"
                        className={widgetStyles.ActivitySummary}
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => setExpanded((value) => !value)}
                    >
                        {working
                            ? <LoaderCircle size={15} className={widgetStyles.ActivitySpinner} aria-hidden="true" />
                            : <CheckCircle2 size={15} className={widgetStyles.ActivityComplete} aria-hidden="true" />}
                        <span className={widgetStyles.ActivitySummaryText}>{summary}</span>
                        <ChevronDown size={15} className={`${widgetStyles.ActivityChevron} ${expanded ? widgetStyles.ActivityChevronOpen : ""}`} aria-hidden="true" />
                    </button> : <div className={widgetStyles.ActivitySummary} role="status">
                        {working
                            ? <LoaderCircle size={15} className={widgetStyles.ActivitySpinner} aria-hidden="true" />
                            : <CheckCircle2 size={15} className={widgetStyles.ActivityComplete} aria-hidden="true" />}
                        <span className={widgetStyles.ActivitySummaryText}>{summary}</span>
                    </div>}
                    {expanded && (
                        <div id={panelId} className={widgetStyles.ActivityDetails}>
                            {detailItems.map(renderItem)}
                        </div>
                    )}
                </>
            )}
        </section>
    );
}

/** Renders thread items; sticks to the bottom while new content streams unless the user scrolled up. */
export function AgentThread({ items, thinking, working = thinking, hasMore, context, emptyState, onLoadOlder, onReply, onPrompt }: Props) {
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
                <button type="button" className={`${styles.btn} ${styles.loadMore}`} onClick={onLoadOlder}>
                    Load earlier messages
                </button>
            )}
            {groups.map((group) => {
                if (group.kind === "user") return renderItem(group.item);

                const isCurrentTurn = working && group === groups[groups.length - 1];
                const assistantCopyText = group.items.map(assistantCopyContent)
                    .filter(Boolean)
                    .join("\n\n");
                const turnContent: React.ReactNode[] = [];
                let activityItems: AgentChatItem[] = [];
                const flushActivity = (isLatest: boolean) => {
                    if (!activityItems.length) return;
                    const currentActivity = isCurrentTurn && isLatest
                        ? [...activityItems].reverse().find((item) => isVisibleCurrentTool(item) && item.live)
                            ?? [...activityItems].reverse().find(isVisibleCurrentTool)
                        : undefined;
                    const detailItems = activityItems.filter((item) => item !== currentActivity);
                    const activityKey = `${group.key}-${activityItems[0].id}`;
                    turnContent.push(
                        <AgentActivityDisclosure
                            key={`activity-${activityKey}`}
                            turnKey={activityKey}
                            items={activityItems}
                            detailItems={detailItems}
                            working={isCurrentTurn && isLatest}
                            showSummary={detailItems.length > 0 || currentActivity !== undefined}
                            renderItem={renderItem}
                        />,
                    );
                    if (currentActivity) turnContent.push(renderItem(currentActivity));
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
                            detailItems={[]}
                            working
                            showSummary
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
                        <div className={`${widgetStyles.Avatar} ${widgetStyles.AvatarAi}`}>
                            <SolidXAIIcon size={14} />
                        </div>
                        <div className={widgetStyles.AiTurnContent}>{turnContent}</div>
                    </div>
                );
            })}
        </div>
    );
}
