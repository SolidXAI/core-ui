import React, { useEffect, useLayoutEffect, useRef } from "react";
import { LoaderCircle } from "lucide-react";
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

/** Renders thread items; sticks to the bottom while new content streams unless the user scrolled up. */
export function AgentThread({ items, agentName, thinking, working = thinking, hasMore, loadingOlder = false, context, emptyState, onLoadOlder, onReply, onPrompt }: Props) {
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
        <SolidAgentChatItem key={item.id} item={item} agentName={agentName} agentContext={context} showMessageMeta={showMessageMeta} onReply={onReply} onPrompt={onPrompt} />
    );
    const toolGroupWidgetName = getToolGroupChatWidgetName(agentName) ?? "DefaultAgentToolGroupWidget";
    const ToolGroupWidget = getExtensionComponent(toolGroupWidgetName, ExtensionComponentTypes.agentToolGroupWidget)
        ?? DefaultAgentToolGroupWidget;
    const agentTurnWidgetName = getAgentTurnChatWidgetName(agentName) ?? "DefaultAgentTurnCompletionWrapperWidget";
    const AgentTurnWidget = getExtensionComponent(agentTurnWidgetName, ExtensionComponentTypes.agentTurnCompletionWrapperWidget)
        ?? DefaultAgentTurnCompletionWrapperWidget;

    return (
        <div ref={scrollRef} className={styles.thread} role="log" aria-live="polite" aria-relevant="additions">
            {hasMore && (
                <button type="button" className={`${styles.btn} ${styles.loadMore}`} onClick={onLoadOlder} disabled={loadingOlder}
                    aria-label={loadingOlder ? "Loading earlier messages" : "Load earlier messages"} title={loadingOlder ? "Loading earlier messages" : undefined}>
                    {loadingOlder ? <LoaderCircle size={14} className={styles.spinIcon} aria-hidden="true" /> : "Load earlier messages"}
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
                        <ToolGroupWidget
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
                        <ToolGroupWidget
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
                    <AgentTurnWidget key={group.key}>
                        {turnContent}
                    </AgentTurnWidget>
                );
            })}
        </div>
    );
}
