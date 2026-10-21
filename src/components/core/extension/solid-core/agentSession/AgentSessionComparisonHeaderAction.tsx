import React from "react";
import qs from "qs";
import { GitCompareArrows, MessageSquareText } from "lucide-react";
import { useDispatch } from "react-redux";
import { createSolidEntityApi } from "../../../../../redux/api/solidEntityApi";
import { closePopup } from "../../../../../redux/features/popupSlice";
import { solidGet } from "../../../../../http/solidHttp";
import { AgentThread } from "../../../solid-agent/thread/AgentThread";
import { historyToItems } from "../../../solid-agent/agentEvents";
import { resolveAttachmentMedia } from "../../../solid-agent/client/agentAttachmentMedia";
import type { AgentChatItem } from "../../../solid-agent/types";
import chatStyles from "../../../solid-agent/SolidAgent.module.css";
import styles from "./AgentSessionComparisonHeaderAction.module.css";
import {
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
  SolidTooltip,
  SolidTooltipContent,
  SolidTooltipTrigger,
} from "../../../../shad-cn-ui";

type AgentSummary = { id?: number | string; name?: string; title?: string; displayName?: string } | number | string | null | undefined;
type SessionRecord = {
  id: number | string;
  sessionId?: string;
  agent?: AgentSummary;
  configVersion?: number | string | null;
  createdAt?: string | null;
  startedAt?: string | null;
};
type SessionComparisonData = {
  session: SessionRecord;
  agentName: string;
  versionName?: string;
  versionDescription?: string;
  items: AgentChatItem[];
  loading: boolean;
  page?: number;
  hasMore?: boolean;
  loadingOlder?: boolean;
  error?: string;
};

const emptyRecords: SessionRecord[] = [];
const noOp = () => undefined;
const entities = (value: any) => Array.isArray(value?.records) ? value.records : [];

async function fetchCoreSessionHistory(sessionId: number | string, page = 1) {
  const response = await solidGet(`/agent-session/${encodeURIComponent(String(sessionId))}/messages?page=${page}&page_size=500`);
  let payload = response?.data;
  for (let depth = 0; depth < 4 && payload; depth += 1) {
    if (Array.isArray(payload.messages)) return payload;
    payload = payload.data;
  }
  throw new Error("The session messages response was invalid.");
}

function formatSessionDate(session: SessionRecord) {
  const value = session.createdAt ?? session.startedAt;
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function agentDetails(agent: AgentSummary) {
  if (agent && typeof agent === "object") {
    return { id: agent.id, name: agent.displayName ?? agent.name ?? agent.title ?? "Agent" };
  }
  return { id: agent, name: "Agent" };
}

function configVersionQuery(agentId: number | string, versionNumber: number): string {
  return qs.stringify({
    offset: 0,
    limit: 1,
    fields: ["id", "name", "description", "versionNumber"],
    filters: {
      $and: [
        { agentRegistry: { id: { $eq: agentId } } },
        { versionNumber: { $eq: versionNumber } },
      ],
    },
  });
}

function SessionMessages({ data, onLoadOlder }: { data: SessionComparisonData; onLoadOlder: () => void }) {
  if (data.loading) return <div className={styles.messageState}>Loading session messages…</div>;
  if (data.error) return <div className={`${styles.messageState} ${styles.messageStateError}`}>{data.error}</div>;
  if (!data.items.length) return <div className={styles.messageState}><MessageSquareText size={21} /><p>No messages found for this session.</p></div>;

  return (
    <div className={`${chatStyles.root} ${styles.messages}`}>
      <AgentThread
        items={data.items}
        thinking={false}
        working={false}
        hasMore={data.hasMore ?? false}
        loadingOlder={data.loadingOlder}
        onLoadOlder={onLoadOlder}
        onReply={noOp}
        onPrompt={noOp}
      />
    </div>
  );
}

type Props = {
  selectedRecords?: SessionRecord[];
  solidListViewMetaData?: { selectedRows?: SessionRecord[] };
};

export default function AgentSessionComparisonHeaderAction({ selectedRecords, solidListViewMetaData }: Props) {
  const dispatch = useDispatch();
  const configVersionApi = React.useMemo(() => createSolidEntityApi("agentConfigVersion"), []);
  const [fetchConfigVersions] = configVersionApi.useLazyGetSolidEntitiesQuery();
  const [comparisonData, setComparisonData] = React.useState<SessionComparisonData[]>([]);
  const sessions = Array.isArray(selectedRecords)
    ? selectedRecords
    : Array.isArray(solidListViewMetaData?.selectedRows) ? solidListViewMetaData?.selectedRows ?? emptyRecords : emptyRecords;
  const sessionKey = sessions.map((session) => {
    const agentId = agentDetails(session.agent).id;
    return `${session.id}:${session.sessionId ?? ""}:${agentId ?? ""}:${session.configVersion ?? ""}`;
  }).join(",");

  React.useEffect(() => {
    let alive = true;
    if (!sessions.length || sessions.length > 2) {
      setComparisonData([]);
      return () => { alive = false; };
    }

    setComparisonData(sessions.map((session) => ({
      session,
      agentName: agentDetails(session.agent).name,
      items: [],
      loading: true,
    })));

    void Promise.all(sessions.map(async (session): Promise<SessionComparisonData> => {
      const { id: agentId, name: nameFromSession } = agentDetails(session.agent);
      const base: SessionComparisonData = {
        session,
        agentName: nameFromSession,
        items: [],
        loading: false,
        page: 1,
      };

      const [historyResult, versionResult] = await Promise.allSettled([
        fetchCoreSessionHistory(session.id),
        agentId != null && Number(session.configVersion) > 0
          ? fetchConfigVersions(configVersionQuery(agentId, Number(session.configVersion)), false).unwrap()
          : Promise.resolve(null),
      ]);

      if (historyResult.status === "fulfilled") {
        base.items = await resolveAttachmentMedia(historyToItems(historyResult.value.messages ?? []));
        base.page = Number(historyResult.value.page) || 1;
        base.hasMore = historyResult.value.has_more === true;
      } else {
        base.error = "Could not load messages for this session.";
      }

      if (versionResult.status === "fulfilled") {
        const version = entities(versionResult.value)[0];
        if (version) {
          base.versionName = version.name ?? undefined;
          base.versionDescription = version.description ?? undefined;
        }
      }
      return base;
    })).then((data) => {
      if (alive) setComparisonData(data);
    });

    return () => { alive = false; };
    // Trigger a fresh read when the selected session IDs or version metadata change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  const loadOlderMessages = React.useCallback(async (sessionId: number | string) => {
    const current = comparisonData.find((item) => String(item.session.id) === String(sessionId));
    if (!current || !current.hasMore || current.loadingOlder) return;
    const nextPage = (current.page ?? 1) + 1;

    setComparisonData((items) => items.map((item) =>
      String(item.session.id) === String(sessionId) ? { ...item, loadingOlder: true } : item,
    ));

    try {
      const history = await fetchCoreSessionHistory(sessionId, nextPage);
      const olderItems = await resolveAttachmentMedia(historyToItems(history.messages ?? []));
      setComparisonData((items) => items.map((item) =>
        String(item.session.id) === String(sessionId)
          ? {
              ...item,
              items: [...olderItems, ...item.items],
              page: Number(history.page) || nextPage,
              hasMore: history.has_more === true,
              loadingOlder: false,
            }
          : item,
      ));
    } catch {
      setComparisonData((items) => items.map((item) =>
        String(item.session.id) === String(sessionId) ? { ...item, loadingOlder: false } : item,
      ));
    }
  }, [comparisonData]);

  const invalidSelection = sessions.length > 2;
  const displayedData = sessions.map((session) => comparisonData.find((item) => String(item.session.id) === String(session.id)) ?? ({
    session,
    agentName: agentDetails(session.agent).name,
    items: [],
    loading: true,
  } as SessionComparisonData));
  const agentNames = Array.from(new Set(displayedData.map((data) => data.agentName)));
  const showComparison = sessions.length > 0 && !invalidSelection;

  return (
    <div className={styles.root}>
      <SolidDialogHeader>
        <SolidDialogTitle>{showComparison ? `Compare ${agentNames.join(" vs ")}` : "Compare agent sessions"}</SolidDialogTitle>
        <SolidDialogClose aria-label="Close" onClick={() => dispatch(closePopup())} />
      </SolidDialogHeader>
      <SolidDialogSeparator />
      <SolidDialogBody className={styles.body}>
        {!showComparison ? (
          <div className={styles.selectionEmpty}>
            <span className={styles.selectionIcon}><GitCompareArrows size={21} /></span>
            <div className="space-y-1">
              <h3 className={styles.selectionTitle}>{invalidSelection ? "Select up to two sessions" : "Choose sessions to compare"}</h3>
              <p className={styles.selectionDescription}>Select a maximum of two sessions in the list to view their agent conversations here.</p>
            </div>
          </div>
        ) : (
          <div className={styles.columns} style={{ gridTemplateColumns: `repeat(${sessions.length}, minmax(0, 1fr))` }}>
            {displayedData.map((data) => {
              const sessionDate = formatSessionDate(data.session);
              return (
                <section key={String(data.session.id)} className={styles.pane}>
                  <header className={styles.paneHeader}>
                    <SolidTooltip>
                      <SolidTooltipTrigger asChild>
                        <span className={styles.versionBadge} tabIndex={0}>Config v{data.session.configVersion ?? "—"}</span>
                      </SolidTooltipTrigger>
                      <SolidTooltipContent side="bottom" align="start" className={styles.versionTooltip}>
                        {data.versionName && <p className={styles.versionName}>{data.versionName}</p>}
                        {data.versionDescription
                          ? <p className={styles.versionDescription}>{data.versionDescription}</p>
                          : <p className={styles.versionFallback}>No version description available.</p>}
                      </SolidTooltipContent>
                    </SolidTooltip>
                    <span className={styles.sessionId}>Session {data.session.sessionId ?? data.session.id}</span>
                    {sessionDate && <span className={styles.sessionDate}>{sessionDate}</span>}
                  </header>
                  <SessionMessages data={data} onLoadOlder={() => void loadOlderMessages(data.session.id)} />
                </section>
              );
            })}
          </div>
        )}
      </SolidDialogBody>
    </div>
  );
}
