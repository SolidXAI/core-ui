import React from "react";
import { MessageSquareText } from "lucide-react";
import { solidGet } from "../../../../../http/solidHttp";
import type { SolidFormWidgetProps } from "../../../../../types/solid-core";
import { AgentThread } from "../../../solid-agent/thread/AgentThread";
import { historyToItems } from "../../../solid-agent/agentEvents";
import { resolveAttachmentMedia } from "../../../solid-agent/client/agentAttachmentMedia";
import type { AgentChatItem } from "../../../solid-agent/types";
import chatStyles from "../../../solid-agent/SolidAgent.module.css";
import styles from "./AgentSessionChatFormWidget.module.css";

type SessionHistory = {
  messages: any[];
  page?: number;
  has_more?: boolean;
};

async function fetchSessionHistory(sessionId: string | number, page = 1): Promise<SessionHistory> {
  const response = await solidGet(`/agent-session/${encodeURIComponent(String(sessionId))}/messages?page=${page}&page_size=500`);
  let payload = response?.data;
  for (let depth = 0; depth < 4 && payload; depth += 1) {
    if (Array.isArray(payload.messages)) return payload as SessionHistory;
    payload = payload.data;
  }
  throw new Error("The session messages response was invalid.");
}

const noOp = () => undefined;

export function AgentSessionChatFormWidget({ formData, formViewData }: SolidFormWidgetProps) {
  const sessionId = formViewData?.data?.id ?? formData?.id;
  const [items, setItems] = React.useState<AgentChatItem[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    if (sessionId == null || sessionId === "") {
      setItems([]);
      setHasMore(false);
      setError(false);
      return () => { alive = false; };
    }

    setLoading(true);
    setError(false);
    setItems([]);
    void fetchSessionHistory(sessionId).then(async (history) => {
      const chatItems = await resolveAttachmentMedia(historyToItems(history.messages ?? []));
      if (!alive) return;
      setItems(chatItems);
      setPage(Number(history.page) || 1);
      setHasMore(history.has_more === true);
    }).catch(() => {
      if (alive) setError(true);
    }).finally(() => {
      if (alive) setLoading(false);
    });

    return () => { alive = false; };
  }, [sessionId]);

  const loadOlder = React.useCallback(async () => {
    if (sessionId == null || !hasMore || loadingOlder) return;
    const nextPage = page + 1;
    setLoadingOlder(true);
    try {
      const history = await fetchSessionHistory(sessionId, nextPage);
      const olderItems = await resolveAttachmentMedia(historyToItems(history.messages ?? []));
      setItems((current) => [...olderItems, ...current]);
      setPage(Number(history.page) || nextPage);
      setHasMore(history.has_more === true);
    } catch {
      // Keep the loaded messages visible; the user can retry with the control.
    } finally {
      setLoadingOlder(false);
    }
  }, [hasMore, loadingOlder, page, sessionId]);

  return (
    <section className={styles.root} aria-label="Session chat interface">
      {sessionId == null || sessionId === "" ? (
        <div className={styles.state}>Save the session to view its conversation.</div>
      ) : loading ? (
        <div className={styles.state}>Loading session messages…</div>
      ) : error ? (
        <div className={`${styles.state} ${styles.error}`}>Could not load messages for this session.</div>
      ) : items.length === 0 ? (
        <div className={styles.state}><MessageSquareText size={21} /><p>No messages found for this session.</p></div>
      ) : (
        <div className={`${chatStyles.root} ${styles.messages}`}>
          <AgentThread
            items={items}
            thinking={false}
            working={false}
            hasMore={hasMore}
            loadingOlder={loadingOlder}
            onLoadOlder={() => void loadOlder()}
            onReply={noOp}
            onPrompt={noOp}
          />
        </div>
      )}
    </section>
  );
}
