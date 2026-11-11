import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SolidSpinner } from "../../../shad-cn-ui/SolidSpinner";
import { getAgentTurnChatWidgetName, getExtensionComponent, getToolGroupChatWidgetName } from "../../../../helpers/registry";
import { ExtensionComponentTypes } from "../../../../types/extension-registry";
import styles from "../SolidAgent.module.css";
import widgetStyles from "../widgets/solidChatWidgets.module.css";

import { AgentEventTypes, type AgentChatItem, type AgentContext } from "../types";
import { SolidAgentMessageCopyButton } from "../SolidAgentMarkdown";
import { SolidAgentChatItem } from "./SolidAgentChatItem";
import { parseWidgetContent } from "./inlineWidget";
import { formatChatTime } from "../widgets/chatWidgetUtils";
import { DefaultAgentToolGroupWidget } from "../widgets/DefaultAgentToolGroupWidget";
import { DefaultAgentTurnCompletionWrapperWidget } from "../widgets/DefaultAgentTurnCompletionWrapperWidget";

type Props = {
    items: AgentChatItem[];
    agentName?: string;
    thinking: boolean;
    working?: boolean;
    loadingHistory?: boolean;
    hasMore: boolean;
    loadingOlder?: boolean;
    /** The last older-page load failed; auto-loading pauses until the user retries. */
    loadOlderFailed?: boolean;
    context?: AgentContext;
    emptyState?: React.ReactNode;
    onLoadOlder: () => void;
    onReply: (widgetId: string, widget: string, value: unknown) => void;
    onPrompt: (text: string) => void;
};

type ItemGroup = { kind: "user"; item: AgentChatItem } | { kind: "agent"; key: string; items: AgentChatItem[]; startedAt?: number };

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
    let startedAt: number | undefined = undefined;
    const flush = () => {
        if (turn.length) groups.push({ kind: "agent", key: turnKey, items: turn, startedAt });
        turn = [];
    };
    for (const item of items) {
        if (isUserItem(item)) {
            flush();
            groups.push({ kind: "user", item });
            turnKey = `after-${item.id}`;
            startedAt = item.at;
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
/** Renders thread items; sticks to the bottom while new content streams unless the user scrolled up. */
export function AgentThread({ items, agentName, thinking, working = thinking, loadingHistory = false, hasMore, loadingOlder = false, loadOlderFailed = false, context, emptyState, onLoadOlder, onReply, onPrompt }: Props) {
    // The scroll container unmounts while history loads or the empty state shows, so it is tracked as state.
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const pinned = useRef(true);
    const prevHeight = useRef(0);
    const prevFirstId = useRef<string | undefined>(undefined);
    const attachScrollEl = useCallback((el: HTMLDivElement | null) => {
        if (el) pinned.current = true;
        setScrollEl(el);
    }, []);

    const onLoadOlderRef = useRef(onLoadOlder);
    onLoadOlderRef.current = onLoadOlder;

    useLayoutEffect(() => {
        const el = scrollEl;
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
    }, [items, scrollEl]);

    useEffect(() => {
        const el = scrollEl;
        if (!el) return;
        const onScroll = () => {
            pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
            prevHeight.current = el.scrollHeight;
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [scrollEl]);

    useEffect(() => {
        const sentinelEl = topSentinelRef.current;
        if (!scrollEl || !sentinelEl || !hasMore || loadingOlder || loadOlderFailed) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) onLoadOlderRef.current();
            },
            { root: scrollEl, rootMargin: "80px 0px 0px 0px", threshold: 0 },
        );
        observer.observe(sentinelEl);
        return () => observer.disconnect();
    }, [scrollEl, hasMore, loadingOlder, loadOlderFailed]);

    if (loadingHistory) {
        return (
            <div className={`${styles.thread} ${styles.threadCenterLoading}`} role="status" aria-live="polite" aria-label="Loading conversation">
                <div className={styles.centerSpinnerWrapper}>
                    <SolidSpinner size={28} />
                </div>
            </div>
        );
    }

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
            startedAt: lastGroup?.kind === "user" ? lastGroup.item.at : undefined,
        });
    }
    const renderItem = (item: AgentChatItem, showMessageMeta?: boolean) => (
        <SolidAgentChatItem key={item.id} item={item} agentName={agentName} agentContext={context} showMessageMeta={showMessageMeta} onReply={onReply} onPrompt={onPrompt} />
    );
    const toolGroupWidgetName = getToolGroupChatWidgetName(agentName) ?? "DefaultAgentToolGroupWidget";
    const ToolGroupWidget = getExtensionComponent(toolGroupWidgetName, ExtensionComponentTypes.agentToolGroupWidget)
        ?? DefaultAgentToolGroupWidget;
    const agentTurnWidgetName = getAgentTurnChatWidgetName(agentName) ?? "DefaultAgentTurnCompletionWrapperWidget";
    const AgentTurnWidget = getExtensionComponent(agentTurnWidgetName, ExtensionComponentTypes.agentTurnCompletionWrapperWidget)
        ?? DefaultAgentTurnCompletionWrapperWidget;

    return (
        <div ref={attachScrollEl} className={styles.thread} role="log" aria-live="polite" aria-relevant="additions">
            {hasMore && <div ref={topSentinelRef} className={styles.loadOlderSentinel} aria-hidden="true" />}
            {loadingOlder ? (
                <div className={`${styles.notice} ${styles.loadOlderStatus}`} role="status">
                    <SolidSpinner size={14} className={styles.inlineSolidSpinner} aria-hidden="true" />
                    <span>Loading earlier messages…</span>
                </div>
            ) : hasMore && loadOlderFailed ? (
                <div className={`${styles.historyErrorRow} ${styles.loadOlderError}`} role="alert">
                    <span>Couldn&rsquo;t load earlier messages.</span>
                    <button type="button" className={styles.historyRetryBtn} onClick={() => onLoadOlderRef.current()}>
                        Retry
                    </button>
                </div>
            ) : null}
            {groups.map((group) => {
                if (group.kind === "user") {
                    return (
                        <div key={group.item.id} className={styles.userTurn}>
                            {renderItem(group.item)}
                        </div>
                    );
                }

                const isCurrentTurn = working && group === groups[groups.length - 1];
                const assistantCopyText = [...group.items].reverse()
                    .map(assistantCopyContent)
                    .find((content) => content !== null && content.length > 0);
                const turnContent: React.ReactNode[] = [];
                let activityItems: AgentChatItem[] = [];
                let hasTrailingActivity = false;

                // Determine planned activity block count to know if this turn has multiple steps
                let plannedActivityCount = 0;
                let pendingActivityCount = 0;
                for (const item of group.items) {
                    if (isAssistantMessage(item)) {
                        if (pendingActivityCount > 0) {
                            plannedActivityCount++;
                            pendingActivityCount = 0;
                        }
                    } else {
                        pendingActivityCount++;
                    }
                }
                if (pendingActivityCount > 0) plannedActivityCount++;
                if (isCurrentTurn && (working || thinking) && pendingActivityCount === 0) {
                    plannedActivityCount++;
                }
                const hasMultipleActivities = plannedActivityCount > 1;

                let activityIndex = 0;
                let currentStepStartTime = group.startedAt || group.items[0]?.at || Date.now();

                const flushActivity = (isLatest: boolean, nextMessageAt?: number) => {
                    if (!activityItems.length) return;
                    const activityKey = `${group.key}-${activityItems[0].id}`;
                    const isLast = activityIndex === plannedActivityCount - 1;
                    const stepEnd = isLatest && isCurrentTurn ? undefined : (nextMessageAt || activityItems[activityItems.length - 1]?.at);

                    turnContent.push(
                        <ToolGroupWidget
                            key={`activity-${activityKey}`}
                            turnKey={activityKey}
                            items={activityItems}
                            working={isCurrentTurn && isLatest}
                            startedAt={currentStepStartTime}
                            endedAt={stepEnd}
                            totalStartedAt={group.startedAt}
                            isLastActivity={isLast}
                            hasMultipleActivities={hasMultipleActivities}
                            renderItem={renderItem}
                        />,
                    );
                    activityIndex++;
                    activityItems = [];
                    if (isLatest) {
                        hasTrailingActivity = true;
                    }
                };

                for (const item of group.items) {
                    if (isAssistantMessage(item)) {
                        flushActivity(false, item.at);
                        turnContent.push(renderItem(item, false));
                        currentStepStartTime = item.at;
                        hasTrailingActivity = false;
                    } else {
                        activityItems.push(item);
                    }
                }
                flushActivity(true);

                if (isCurrentTurn && (working || thinking) && !hasTrailingActivity) {
                    const isLast = activityIndex === plannedActivityCount - 1;
                    turnContent.push(
                        <ToolGroupWidget
                            key={`activity-working-${group.key}`}
                            turnKey={`${group.key}-working`}
                            items={[]}
                            working
                            startedAt={currentStepStartTime}
                            totalStartedAt={group.startedAt}
                            isLastActivity={isLast}
                            hasMultipleActivities={hasMultipleActivities}
                            renderItem={renderItem}
                        />,
                    );
                    activityIndex++;
                }

                if (!isCurrentTurn && assistantCopyText) {
                    const lastItemAt = group.items[group.items.length - 1]?.at;
                    const totalTurnSeconds = (group.startedAt && lastItemAt)
                        ? Math.max(0, Math.floor((lastItemAt - group.startedAt) / 1000))
                        : 0;
                    const totalTurnText = (hasMultipleActivities && totalTurnSeconds > 0)
                        ? `Total ${formatWorkedDuration(totalTurnSeconds)} · `
                        : "";

                    turnContent.push(
                        <div key={`meta-${group.key}`} className={`${widgetStyles.BubbleMeta} ${widgetStyles.BubbleMetaAssistant} ${widgetStyles.TurnMeta}`}>
                            <span className={widgetStyles.Timestamp}>
                                {totalTurnText}{formatChatTime(lastItemAt)}
                            </span>
                            <SolidAgentMessageCopyButton text={assistantCopyText} />
                        </div>,
                    );
                }

                return (
                    <AgentTurnWidget key={group.key}>
                        {turnContent}
                    </AgentTurnWidget>
                );
            })}
        </div>
    );
}
