import React, { useEffect, useLayoutEffect, useRef } from "react";
import styles from "../SolidAgent.module.css";
import widgetStyles from "../widgets/solidChatWidgets.module.css";
import { SolidXAIIcon } from "../SolidXAIIcon";
import { AgentEventTypes, type AgentChatItem, type AgentContext } from "../types";
import { SolidAgentChatItem } from "./SolidAgentChatItem";

type Props = {
    items: AgentChatItem[];
    thinking: boolean;
    hasMore: boolean;
    context?: AgentContext;
    emptyState?: React.ReactNode;
    onLoadOlder: () => void;
    onReply: (widgetId: string, widget: string, value: unknown) => void;
    onPrompt: (text: string) => void;
};

type ItemGroup = { kind: "user"; item: AgentChatItem } | { kind: "agent"; key: string; items: AgentChatItem[] };

const isUserItem = (item: AgentChatItem) => item.eventType === AgentEventTypes.userMessage && !item.widget;

/** Consecutive agent items form one turn (one avatar); each user message stands alone. */
function groupItems(items: AgentChatItem[]): ItemGroup[] {
    const groups: ItemGroup[] = [];
    let turn: AgentChatItem[] = [];
    const flush = () => {
        if (turn.length) groups.push({ kind: "agent", key: turn[0].id, items: turn });
        turn = [];
    };
    for (const item of items) {
        if (isUserItem(item)) {
            flush();
            groups.push({ kind: "user", item });
        } else {
            turn.push(item);
        }
    }
    flush();
    return groups;
}

/** Stand-in item so the thinking bubble is resolved through the registry like every other widget. */
const THINKING_ITEM: AgentChatItem = { id: "agent-thinking", at: 0, eventType: AgentEventTypes.agentStarted, eventData: {}, live: true };

/** Renders thread items; sticks to the bottom while new content streams unless the user scrolled up. */
export function AgentThread({ items, thinking, hasMore, context, emptyState, onLoadOlder, onReply, onPrompt }: Props) {
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
    }, [items, thinking]);

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
    // The thinking bubble belongs to the current agent turn (or starts one after a user message).
    const last = groups[groups.length - 1];
    if (thinking) {
        if (last && last.kind === "agent") last.items = [...last.items, THINKING_ITEM];
        else groups.push({ kind: "agent", key: "thinking-turn", items: [THINKING_ITEM] });
    }

    const renderItem = (item: AgentChatItem) => (
        <SolidAgentChatItem key={item.id} item={item} agentContext={context} onReply={onReply} onPrompt={onPrompt} />
    );

    return (
        <div ref={scrollRef} className={styles.thread} role="log" aria-live="polite" aria-relevant="additions">
            {hasMore && (
                <button type="button" className={`${styles.btn} ${styles.loadMore}`} onClick={onLoadOlder}>
                    Load earlier messages
                </button>
            )}
            {groups.map((group) =>
                group.kind === "user" ? (
                    renderItem(group.item)
                ) : (
                    <div key={group.key} className={widgetStyles.AiTurnGroup}>
                        <div className={`${widgetStyles.Avatar} ${widgetStyles.AvatarAi}`}>
                            <SolidXAIIcon size={14} />
                        </div>
                        <div className={widgetStyles.AiTurnContent}>{group.items.map(renderItem)}</div>
                    </div>
                ),
            )}
        </div>
    );
}
