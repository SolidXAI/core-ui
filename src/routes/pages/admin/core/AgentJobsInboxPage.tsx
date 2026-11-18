import React from "react";
import { Filter, Inbox as InboxIcon, List, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { SolidButton, SolidDialog, SolidDialogBody, SolidSelect } from "../../../../components/shad-cn-ui";
import { Column, SolidDataTable } from "../../../../components/core/list/SolidDataTable";
import { historyToItems, isSameAssistantContent } from "../../../../components/core/solid-agent/agentEvents";
import { resolveAttachmentMedia } from "../../../../components/core/solid-agent/client/agentAttachmentMedia";
import { AgentComposer } from "../../../../components/core/solid-agent/composer/AgentComposer";
import { humanReviewAllowsChoice, humanReviewAnswerItem, humanReviewId, humanReviewItem, humanReviewText,
  type HumanReview } from "../../../../components/core/solid-agent/humanReview";
import { AgentThread } from "../../../../components/core/solid-agent/thread/AgentThread";
import { AgentEventTypes, type AgentChatItem, type AgentWireFrame } from "../../../../components/core/solid-agent/types";
import chatStyles from "../../../../components/core/solid-agent/SolidAgent.module.css";
import { solidAxios } from "../../../../http/solidHttp";
import styles from "./AgentJobsInboxPage.module.css";

type Run = {
  id: number;
  sessionId: string;
  hostRefId?: string | null;
  agentId?: number | null;
  agentTitle: string | null;
  status: string;
  trigger?: string;
  runtime?: string | null;
  configVersion?: number;
  startedAt?: string;
  hasJob?: boolean;
  lastActiveAt: string;
  turnCount?: number;
  totalCost?: number;
  endedAt?: string | null;
};
type RequestHistory = HumanReview & {
  status: string;
  createdAt: string;
  answeredAt: string | null;
  answer: { choice?: string | null; text?: string | null } | null;
};
type RunDetail = {
  status: string;
  jobId: number | null;
  jobStatus: string | null;
  hasJob?: boolean;
  agentName?: string | null;
  result: string | null;
  requests?: RequestHistory[];
  error?: { code?: string; message?: string } | null;
  pendingRequest: HumanReview | null;
};
type Inbox = { runs: Run[]; hasMore: boolean; total: number };
type InboxFilters = { review: boolean; agent: string; hostRefId: string; sessionId: string; status: string; trigger: string; runtime: string; startedFrom: string; startedTo: string };
type Message = AgentWireFrame & { id: string; timestamp: string };
type HistoryPage = { messages: Message[]; has_more: boolean };

const historyPageSize = 100;
const ignoreAction = () => undefined;

function requestItems(requests: RequestHistory[], pendingId: number | undefined, submitting: boolean): AgentChatItem[] {
  return requests.flatMap((request) => {
    const active = request.requestId === pendingId;
    const items = [humanReviewItem(request, Date.parse(request.createdAt), !active, active && submitting)];
    if (request.answeredAt && request.answer) {
      items.push(humanReviewAnswerItem(request.requestId, request.kind, request.answer.choice, request.answer.text,
        Date.parse(request.answeredAt)));
    }
    return items;
  });
}

const inboxPath = "/agent-session/inbox";
const initialPageSize = 25;
const pageSizeOptions = [10, 25, 50, 100];
const emptyFilters: InboxFilters = { review: false, agent: "", hostRefId: "", sessionId: "", status: "", trigger: "", runtime: "", startedFrom: "", startedTo: "" };
const statuses = ["queued", "running", "active", "awaiting_input", "awaiting_approval", "completed", "failed", "cancelled", "expired"];
const triggers = ["api", "webhook"];
const runtimes = ["solidx", "agentHub"];
const inboxFilterKeys = ["review", "agent", "hostRefId", "sessionId", "status", "trigger", "runtime", "startedFrom", "startedTo"] as const;
const sortOptions = [
  { label: "Recent activity", value: "last_active_desc" },
  { label: "Old activity", value: "last_active_asc" },
  { label: "Newly started", value: "started_desc" },
  { label: "Oldest started", value: "started_asc" },
  { label: "Agent A–Z", value: "agent_asc" },
];
type InboxSort = (typeof sortOptions)[number]["value"];
const defaultSort: InboxSort = "last_active_desc";

function readInboxFilters(search: string): InboxFilters {
  const params = new URLSearchParams(search);
  const readOption = (key: string, options: string[]) => {
    const value = params.get(key) ?? "";
    return options.includes(value) ? value : "";
  };
  const readDate = (key: string) => {
    const value = params.get(key) ?? "";
    const timestamp = Date.parse(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(timestamp)
      && new Date(timestamp).toISOString().slice(0, 10) === value ? value : "";
  };
  const startedFrom = readDate("startedFrom");
  const startedTo = readDate("startedTo");
  return {
    review: params.get("review") === "true",
    agent: params.get("agent")?.trim() ?? "",
    hostRefId: params.get("hostRefId")?.trim() ?? "",
    sessionId: params.get("sessionId")?.trim() ?? "",
    status: readOption("status", statuses),
    trigger: readOption("trigger", triggers),
    runtime: readOption("runtime", runtimes),
    startedFrom,
    startedTo: startedFrom && startedTo && startedTo < startedFrom ? "" : startedTo,
  };
}
const statusLabel = (status: string) => ({
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
  expired: "Expired",
  awaiting_input: "Needs an answer",
  awaiting_approval: "Needs approval",
}[status] ?? status.replaceAll("_", " "));

function RunStatus({ status, hasJob }: { status: string; hasJob?: boolean }) {
  const tone = hasJob === false || status === "failed" ? "error"
    : ["awaiting_input", "awaiting_approval"].includes(status) ? "warning"
    : status === "running" ? "active"
    : status === "completed" ? "success" : "neutral";
  return <span className={styles.status} data-tone={tone}>{hasJob === false ? "No linked job" : statusLabel(status)}</span>;
}

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response as { data?: { message?: unknown } } | undefined;
    if (typeof response?.data?.message === "string") return response.data.message;
  }
  return fallback;
}

function runFailureMessage(error: RunDetail["error"]): string | null {
  if (!error) return null;
  if (error.message) return error.message;
  switch (error.code) {
    case "model_unavailable":
      return "The agent’s reasoning model is unavailable. Check its model selection and the provider credentials in AI Settings.";
    case "timeout":
      return "The agent run timed out before it could finish. Review the run and start a new job if needed.";
    case "agent_error":
      return "The agent run failed while continuing after a response. Check the AgentHub worker logs for the underlying error.";
    default:
      return "The agent run failed before it could complete. Check the AgentHub worker logs for details.";
  }
}

function OpenRun({ run, revision, onChange, hideHeader = false }: { run: Run; revision: number; onChange: () => void; hideHeader?: boolean }) {
  const path = `${inboxPath}/${encodeURIComponent(run.sessionId)}`;
  const [detail, setDetail] = React.useState<RunDetail | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [transcript, setTranscript] = React.useState<AgentChatItem[]>([]);
  const [hasOlder, setHasOlder] = React.useState(false);
  const [loadingOlder, setLoadingOlder] = React.useState(false);
  const [answerError, setAnswerError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [resuming, setResuming] = React.useState(false);
  const [accepted, setAccepted] = React.useState<RequestHistory | null>(null);
  const submitLock = React.useRef(false);
  const acceptedId = React.useRef<number | undefined>(undefined);
  const historyPages = React.useRef(1);
  const [error, setError] = React.useState("");
  const [connection, setConnection] = React.useState("Connecting");
  const read = React.useRef<() => Promise<void>>(async () => {});
  const status = accepted && detail?.pendingRequest?.requestId === accepted.requestId
    ? "queued" : detail?.status ?? run.status;
  const hasJob = detail?.hasJob ?? (detail ? detail.jobId !== null : run.hasJob);
  const canConnect = hasJob === true && !["completed", "failed", "cancelled", "expired"].includes(status);
  const runFailure = runFailureMessage(detail?.error);

  React.useEffect(() => {
    const abort = new AbortController();
    let reading: Promise<void> | undefined;
    let refreshAgain = false;
    const loadPage = async (page: number) => {
      const response = await solidAxios.get<{ data: HistoryPage }>(`/agent-session/${run.id}/messages`, {
        params: { page, page_size: historyPageSize }, signal: abort.signal,
      });
      return response.data.data;
    };
    const loadHistory = async () => {
      const first = await loadPage(1);
      const pages = [first];
      const count = historyPages.current;
      for (let page = 2; page <= count && pages[pages.length - 1].has_more; page++) {
        pages.push(await loadPage(page));
      }
      return {
        messages: Array.from(new Map(pages.reverse().flatMap((page) => page.messages).map((row) => [row.id, row])).values()),
        hasMore: pages[0].has_more,
      };
    };
    const refresh = async () => {
      const [record, history] = await Promise.allSettled([
        solidAxios.get<{ data: RunDetail }>(path, { signal: abort.signal }),
        loadHistory(),
      ]);
      if (abort.signal.aborted) return;
      if (record.status === "fulfilled") setDetail(record.value.data.data);
      if (history.status === "fulfilled") {
        const next = history.value.messages;
        setMessages((current) => current.length === next.length && current.every((row, index) => row.id === next[index].id)
          ? current : next);
        setHasOlder(history.value.hasMore);
      }
      setError(record.status === "rejected" ? errorMessage(record.reason, "Could not load the run.")
        : history.status === "rejected" ? "Could not load the conversation." : "");
    };
    read.current = () => {
      if (abort.signal.aborted) return Promise.resolve();
      if (reading) {
        refreshAgain = true;
        return reading;
      }
      reading = (async () => {
        do {
          refreshAgain = false;
          await refresh();
        } while (refreshAgain && !abort.signal.aborted);
      })().finally(() => { reading = undefined; });
      return reading;
    };
    const poll = window.setInterval(() => void read.current(), 8000);
    return () => { abort.abort(); window.clearInterval(poll); };
  }, [path, run.id]);
  React.useEffect(() => { void read.current(); }, [path, run.id, revision]);

  React.useEffect(() => {
    let active = true;
    const items = historyToItems(messages).map((item) => ({ ...item, final: true }));
    setTranscript(items);
    void resolveAttachmentMedia(items).then((resolved) => {
      if (active) setTranscript(resolved);
    }).catch(ignoreAction);
    return () => { active = false; };
  }, [messages]);

  React.useEffect(() => {
    if (!canConnect) return;
    const abort = new AbortController();
    let socket: WebSocket | undefined;
    let retry: number | undefined;
    let refresh: number | undefined;
    let delay = 1000;
    function reconnect() {
      if (abort.signal.aborted || retry !== undefined) return;
      setConnection("Reconnecting");
      void read.current();
      retry = window.setTimeout(() => { retry = undefined; void connect(); }, delay);
      delay = Math.min(delay * 2, 15000);
    }
    async function connect() {
      try {
        const { data: { data: login } } = await solidAxios.post<{ data: { wsUrl: string; agentToken: string } }>(
          `${path}/connect`, undefined, { signal: abort.signal });
        if (abort.signal.aborted) return;
        const ws = new WebSocket(login.wsUrl);
        socket = ws;
        ws.onopen = () => ws.send(JSON.stringify({
          action: "resume_session", session_id: run.sessionId, agentToken: login.agentToken, runtime: "agentHub",
        }));
        ws.onmessage = ({ data }) => {
          let frame: { type?: string; event_type?: string };
          try { frame = JSON.parse(data); } catch { return; }
          const type = frame.type ?? frame.event_type;
          if (type === "session_started") { delay = 1000; setConnection("Live"); }
          if (type === "human_request" || type === "turn_complete" || type === "error") setResuming(false);
          if (type === "error" || type === "session_moved") { ws.close(); return; }
          if (["session_started", "job_status", "human_request", "turn_complete"].includes(type ?? "")) {
            if (refresh === undefined) refresh = window.setTimeout(() => {
              refresh = undefined;
              void read.current();
              onChange();
            }, 350);
          }
        };
        ws.onclose = reconnect;
      } catch (error) {
        if (abort.signal.aborted) return;
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || status === 404) setConnection("Live updates unavailable");
        else reconnect();
      }
    }
    void connect();
    return () => { abort.abort(); socket?.close(); window.clearTimeout(retry); window.clearTimeout(refresh); };
  }, [path, run.sessionId, canConnect, onChange]);

  const awaitingResponse = status === "awaiting_input" || status === "awaiting_approval";
  const request = hasJob && awaitingResponse && detail?.jobStatus === "awaiting_input"
    && detail.pendingRequest?.requestId !== accepted?.requestId ? detail.pendingRequest : null;
  const requestId = request?.requestId;
  React.useEffect(() => { setAnswerError(""); }, [requestId]);
  React.useEffect(() => {
    const waitingAgain = ["awaiting_input", "awaiting_approval"].includes(status)
      && detail?.pendingRequest?.requestId !== accepted?.requestId;
    const terminal = ["completed", "failed", "cancelled", "expired"].includes(status);
    if (waitingAgain || terminal) setResuming(false);
  }, [accepted?.requestId, detail?.pendingRequest?.requestId, status]);

  const submit = async (choice: string, text: string) => {
    if (!request || submitLock.current || acceptedId.current === request.requestId) return;
    submitLock.current = true;
    setAnswerError("");
    setSubmitting(true);
    try {
      await solidAxios.post(`${path}/requests/${request.requestId}/answer`, { choice, text });
      acceptedId.current = request.requestId;
      setResuming(true);
      const historical = detail?.requests?.find((row) => row.requestId === request.requestId);
      const now = new Date().toISOString();
      setAccepted({ ...request, status: "answered", createdAt: historical?.createdAt ?? run.lastActiveAt,
        answeredAt: now, answer: { choice, text } });
    } catch (error) {
      setAnswerError(errorMessage(error, "Could not submit your response."));
      throw error;
    } finally {
      setSubmitting(false);
      submitLock.current = false;
      void read.current();
      onChange();
    }
  };
  const sendText = (text: string) => {
    if (!request) return;
    const answer = humanReviewText(request, text);
    return submit(answer.choice, answer.text);
  };

  const loadOlder = async () => {
    if (loadingOlder || !hasOlder) return;
    historyPages.current += 1;
    setLoadingOlder(true);
    try { await read.current(); }
    finally { setLoadingOlder(false); }
  };
  const items = React.useMemo(() => {
    const requests = new Map((detail?.requests ?? []).map((row) => [row.requestId, row]));
    if (request && !requests.has(request.requestId)) {
      requests.set(request.requestId, { ...request, status: "pending", createdAt: run.lastActiveAt, answeredAt: null, answer: null });
    }
    if (accepted && requests.get(accepted.requestId)?.status !== "answered") requests.set(accepted.requestId, accepted);
    const result = [...transcript, ...requestItems(Array.from(requests.values()), requestId, submitting)]
      .sort((left, right) => left.at - right.at);
    const jobResult = detail?.result;
    if (!hasOlder && jobResult && !messages.some((row) => row.event_type === AgentEventTypes.turnComplete)
      && !transcript.some((item) => item.eventType === AgentEventTypes.llmComplete
        && isSameAssistantContent(item.eventData.content, jobResult))) {
      result.push({ id: "job-result", at: Date.parse(run.lastActiveAt), eventType: AgentEventTypes.llmComplete,
        eventData: { content: jobResult }, final: true });
    }
    return result;
  }, [accepted, detail, hasOlder, messages, request, requestId, run.lastActiveAt, submitting, transcript]);
  return <section className={styles.panel} aria-label="Selected run">
    {!hideHeader && <header className={styles.runHeader}>
      <div><h2>{run.agentTitle ?? "Agent run"}</h2>
        <div className={styles.runMeta}><RunStatus status={status} hasJob={hasJob} />
          {canConnect && <span role="status">{connection}</span>}
          {run.hostRefId && <span title="Host reference ID">Ref {run.hostRefId}</span>}
        </div>
      </div>
    </header>}
    <div className={styles.runBody}>
    {hasJob === false && <p className={styles.notice}>This session has no job for a worker to run.</p>}
    {error && <p className={styles.notice} role="alert">{error}</p>}
    {runFailure && <p className={styles.notice} role="alert">{runFailure}</p>}
    {answerError && <p className={styles.notice} role="alert">{answerError}</p>}
    <div className={`${chatStyles.root} ${styles.chat}`}>
      <AgentThread items={items} agentName={detail?.agentName ?? undefined}
        thinking={resuming || status === "running" || status === "active"}
        working={resuming || status === "running" || status === "active"}
        hasMore={hasOlder} loadingOlder={loadingOlder} onLoadOlder={() => void loadOlder()}
        emptyState={<p className={styles.listMessage}>No messages yet.</p>}
        onReply={(widgetId, widget, value) => {
          if (!request || widgetId !== humanReviewId(request.requestId) || widget !== "SolidQuestionChatWidget" && widget !== "question"
              || typeof value !== "string") return;
          if (humanReviewAllowsChoice(request, value)) void submit(value, request.kind === "approval" ? "" : value).catch(ignoreAction);
        }}
        onPrompt={ignoreAction} />
      {request && <AgentComposer key={request.requestId}
        working={false} disabled={submitting} canAttach={false} commands={[]}
        placeholder={request.kind === "approval" ? "Type Approve or Reject…" : "Type your answer…"}
        onSend={sendText} onStop={ignoreAction} />}
    </div>
    </div>
  </section>;
}

export function AgentJobsInboxPage() {
  const [params, setParams] = useSearchParams();
  const querySearch = params.get("q")?.trim() ?? "";
  const currentSort = sortOptions.some((option) => option.value === params.get("sort"))
    ? params.get("sort") as InboxSort : defaultSort;
  const [searchText, setSearchText] = React.useState(querySearch);
  const filterSearch = new URLSearchParams(inboxFilterKeys.flatMap(key => params.has(key) ? [[key, params.get(key)!]] : [])).toString();
  const filters = React.useMemo(() => readInboxFilters(filterSearch), [filterSearch]);
  const [filterDraft, setFilterDraft] = React.useState<InboxFilters>(emptyFilters);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [layout, setLayout] = React.useState<"inbox" | "list">("inbox");
  const [offset, setOffset] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [inbox, setInbox] = React.useState<Inbox | null>(null);
  const [error, setError] = React.useState("");
  const [revision, setRevision] = React.useState(0);
  const refresh = React.useCallback(() => setRevision((current) => current + 1), []);
  const selectedId = params.get("run");
  const [selected, setSelected] = React.useState<Run>();
  const [listSelected, setListSelected] = React.useState<Run | null>(null);
  const [selectionError, setSelectionError] = React.useState("");
  const appliedFilterCount = Object.entries(filters).filter(([key, value]) => key !== "review" && Boolean(value)).length;
  const visibleRun = inbox?.runs.find((run) => run.sessionId === selectedId);
  const open = visibleRun ?? (selected?.sessionId === selectedId ? selected : null);
  React.useEffect(() => {
    setSelectionError("");
    if (visibleRun) { setSelected(visibleRun); return; }
    if (!selectedId) return;
    const abort = new AbortController();
    solidAxios.get<{ data: Run }>(`${inboxPath}/${encodeURIComponent(selectedId)}`, { signal: abort.signal })
      .then(({ data }) => { if (!abort.signal.aborted) setSelected(data.data); })
      .catch((error) => { if (!abort.signal.aborted) setSelectionError(errorMessage(error, "Could not open the run.")); });
    return () => abort.abort();
  }, [selectedId, visibleRun]);

  React.useEffect(() => {
    setSearchText(querySearch);
  }, [querySearch]);

  React.useEffect(() => {
    const nextSearch = searchText.trim();
    if (nextSearch === querySearch) return;
    const timer = window.setTimeout(() => {
      const nextParams = new URLSearchParams(params);
      if (nextSearch) nextParams.set("q", nextSearch);
      else nextParams.delete("q");
      setParams(nextParams, { replace: true });
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [querySearch, searchText, params, setParams]);

  React.useEffect(() => {
    const abort = new AbortController();
    let reading = false;
    async function list() {
      if (reading) return;
      reading = true;
      try {
        const response = await solidAxios.get<{ data: Inbox }>(inboxPath, {
          params: {
            review: filters.review, offset, limit: pageSize,
            ...(querySearch ? { q: querySearch } : {}),
            sort: currentSort,
            ...(filters.agent ? { agent: filters.agent } : {}),
            ...(filters.hostRefId ? { hostRefId: filters.hostRefId } : {}),
            ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.trigger ? { trigger: filters.trigger } : {}),
            ...(filters.runtime ? { runtime: filters.runtime } : {}),
            ...(filters.startedFrom ? { startedFrom: filters.startedFrom } : {}),
            ...(filters.startedTo ? { startedTo: filters.startedTo } : {}),
          }, signal: abort.signal,
        });
        if (!abort.signal.aborted) { setInbox(response.data.data); setError(""); }
      } catch (error) {
        if (!abort.signal.aborted) setError(errorMessage(error, "Could not load the jobs inbox."));
      } finally {
        reading = false;
      }
    }
    void list();
    const poll = window.setInterval(() => void list(), 10000);
    return () => { abort.abort(); window.clearInterval(poll); };
  }, [offset, pageSize, filters, querySearch, currentSort, revision]);

  const updateFilters = (next: InboxFilters) => {
    const nextParams = new URLSearchParams(params);
    for (const key of inboxFilterKeys) {
      if (next[key]) nextParams.set(key, String(next[key]));
      else nextParams.delete(key);
    }
    setParams(nextParams, { replace: true });
    setOffset(0);
    setFilterOpen(false);
  };
  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (filterDraft.startedFrom && filterDraft.startedTo && filterDraft.startedFrom > filterDraft.startedTo) return;
    updateFilters({ ...filterDraft, agent: filterDraft.agent.trim(), hostRefId: filterDraft.hostRefId.trim(),
      sessionId: filterDraft.sessionId.trim() });
  };
  const clearFilters = () => {
    setFilterDraft(emptyFilters);
    updateFilters(emptyFilters);
  };
  const handlePage = (event: { first: number; rows: number }) => { setOffset(event.first); setPageSize(event.rows); };
  const toggleReview = () => updateFilters({ ...filters, review: !filters.review });
  const changeSort = (sort: InboxSort) => {
    const nextParams = new URLSearchParams(params);
    if (sort === defaultSort) nextParams.delete("sort");
    else nextParams.set("sort", sort);
    setParams(nextParams, { replace: true });
    setOffset(0);
  };
  const selectRun = (sessionId: string) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("run", sessionId);
    setParams(nextParams);
  };
  // A session filter narrows the list to one run, so open that run's
  // conversation too. Runs only when the filter value changes, so the user
  // can still pick or close a run afterwards.
  const filteredSessionId = filters.sessionId;
  React.useEffect(() => {
    if (!filteredSessionId) return;
    setParams((current) => {
      if (current.get("run") === filteredSessionId) return current;
      const nextParams = new URLSearchParams(current);
      nextParams.set("run", filteredSessionId);
      return nextParams;
    }, { replace: true });
  }, [filteredSessionId, setParams]);
  const first = inbox?.total ? offset + 1 : 0;
  const last = inbox ? Math.min(offset + pageSize, inbox.total) : 0;
  const reviewCountOnPage = inbox?.runs.filter((run) => ["awaiting_input", "awaiting_approval"].includes(run.status)).length ?? 0;

  return <main className={styles.inbox}>
    <header className={`page-header solid-list-toolbar ${styles.toolbar}`}>
      <label className={styles.search} aria-label="Search runs">
        <input type="search" value={searchText} onChange={(event) => setSearchText(event.currentTarget.value)}
          placeholder="Search agent, session ID, or status" />
      </label>
      <div className="solid-list-toolbar-actions">
        <SolidButton variant="secondary" size="sm" leftIcon={<RefreshCw size={16} />} onClick={refresh} aria-label="Refresh inbox" title="Refresh inbox" />
        <span className={styles.filterAction}>
          <SolidButton variant="secondary" size="sm" leftIcon={<Filter size={16} />} onClick={() => { setFilterDraft(filters); setFilterOpen(true); }}
            aria-label={appliedFilterCount ? `Filters, ${appliedFilterCount} applied` : "Filters"} title="Filter runs" />
          {appliedFilterCount > 0 && <span className={styles.filterCount} aria-hidden="true">{appliedFilterCount}</span>}
        </span>
        <SolidButton variant="secondary" size="sm" leftIcon={layout === "inbox" ? <List size={16} /> : <InboxIcon size={16} />}
          onClick={() => setLayout((current) => current === "inbox" ? "list" : "inbox")}
          aria-label={layout === "inbox" ? "Switch to list view" : "Switch to inbox view"}
          title={layout === "inbox" ? "Switch to list view" : "Switch to inbox view"} />
      </div>
    </header>
    {error && <p className={styles.notice} role="alert">{error}</p>}
    {layout === "inbox" ? <div className={styles.columns}>
      <section className={styles.panel} aria-label="Background runs">
        <div className={styles.listHeader}>
          <div className={styles.listHeaderTitle}><strong>Runs</strong><span>{inbox?.total ?? 0}</span></div>
          <div className={styles.listHeaderControls}>
            <SolidButton size="sm" variant={filters.review ? "primary" : "secondary"} aria-pressed={filters.review}
              className={filters.review ? styles.reviewToggleActive : styles.reviewToggle} onClick={toggleReview}>Needs review</SolidButton>
            <label className={styles.sortLabel}><span>Sort</span><SolidSelect value={currentSort} onChange={(event) => changeSort(event.value as InboxSort)}
              className={styles.sortSelect} options={sortOptions} native={false} menuPlacement="bottom" /></label>
          </div>
        </div>
        <div className={styles.listScroll}>
          {!inbox && !error && <p className={styles.listMessage} role="status">Loading runs…</p>}
          {inbox?.runs.length === 0 && <p className={styles.listMessage}>{filters.review ? "No runs need your review." : "No background runs match these filters."}</p>}
          {inbox?.runs.map((run) => <button type="button" key={run.sessionId} aria-pressed={selectedId === run.sessionId}
            className={styles.row} onClick={() => selectRun(run.sessionId)}>
            <span className={styles.rowHeading}><strong>{run.agentTitle ?? "Agent run"}</strong><span className={styles.runId}>Run #{run.id}</span></span>
            <span className={styles.runMeta}><RunStatus status={run.status} hasJob={run.hasJob} />
              {run.hostRefId && <span title="Host reference ID">Ref {run.hostRefId}</span>}
              <span>Last active <time dateTime={run.lastActiveAt}>{new Date(run.lastActiveAt).toLocaleString()}</time></span></span>
          </button>)}
        </div>
        <div className="solid-table-paginator solid-table-paginator-align-end flex items-center justify-end gap-3 text-sm rounded-md border border-border/60 px-2 sm:px-3 py-1.5 bg-background">
          <div className="solid-paginator-meta flex items-center gap-2 sm:ml-auto"><span className="solid-paginator-label">Rows</span>
            <SolidSelect value={pageSize} onChange={(event) => handlePage({ first: 0, rows: Number(event.value) })}
              className="solid-paginator-select" options={pageSizeOptions.map((rows) => ({ label: String(rows), value: rows }))} native={false} menuPlacement="top" />
            <span className="solid-paginator-report">{first}–{last} of {inbox?.total ?? 0}</span>
          </div>
          <div className="solid-paginator-actions flex items-center gap-2">
            <button type="button" className="solid-paginator-btn" disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - pageSize))}>Previous</button>
            <button type="button" className="solid-paginator-btn" disabled={!inbox?.hasMore}
              onClick={() => setOffset(offset + pageSize)}>Next</button>
          </div>
        </div>
      </section>
      {open ? <OpenRun key={open.sessionId} run={open} revision={revision} onChange={refresh} />
        : <div className={`${styles.panel} ${styles.empty}`}>
          <InboxIcon size={22} aria-hidden="true" />
          <strong>{selectionError ? "Could not open run" : selectedId ? "Opening run…" : "Choose a run"}</strong>
          <p role={selectionError ? "alert" : "status"}>{selectionError || (selectedId ? "Loading its latest messages and status." : "Select a run to see its messages, progress, and pending requests.")}</p>
        {inbox && <span className={styles.reviewSummary}>{reviewCountOnPage} run{reviewCountOnPage === 1 ? "" : "s"} awaiting input or approval on this page</span>}
        </div>}
    </div> : <section className={`${styles.panel} ${styles.tablePanel}`} aria-label="Background runs list" style={{ flexDirection: "column" }}>
      <div className={styles.tableControls}>
        <SolidButton size="sm" variant={filters.review ? "primary" : "secondary"} aria-pressed={filters.review}
          className={filters.review ? styles.reviewToggleActive : styles.reviewToggle} onClick={toggleReview}>Needs review</SolidButton>
        <label className={styles.sortLabel}><span>Sort</span><SolidSelect value={currentSort} onChange={(event) => changeSort(event.value as InboxSort)}
          className={styles.sortSelect} options={sortOptions} native={false} menuPlacement="bottom" /></label>
      </div>
      <div className="solid-datatable-wrapper solid-list-table-area min-h-0 flex-1 overflow-hidden">
        <SolidDataTable value={inbox?.runs ?? []} dataKey="sessionId" rows={pageSize}
          first={offset} totalRecords={inbox?.total ?? 0} rowsPerPageOptions={pageSizeOptions}
          onPage={handlePage} onRowClick={({ data }) => setListSelected(data)}
          rowClassName={() => styles.tableRow}
          emptyMessage={error || (filters.review ? "No runs need your review." : "No background runs match these filters.")}>
          <Column field="agentTitle" header="Agent" />
          <Column field="hostRefId" header="Host Ref ID" body={(run: Run) => run.hostRefId || "—"} />
          <Column field="status" header="Status" body={(run: Run) => <RunStatus status={run.status} hasJob={run.hasJob} />} />
          <Column field="trigger" header="Trigger" />
          <Column field="runtime" header="Runtime" body={(run: Run) => run.runtime ?? "Unknown"} />
          <Column field="startedAt" header="Started" body={(run: Run) => run.startedAt ? new Date(run.startedAt).toLocaleString() : "—"} />
          <Column field="lastActiveAt" header="Last active" body={(run: Run) => new Date(run.lastActiveAt).toLocaleString()} />
          <Column field="turnCount" header="Turns" />
          <Column field="totalCost" header="Cost" body={(run: Run) => typeof run.totalCost === "number" ? run.totalCost.toFixed(4) : "—"} />
        </SolidDataTable>
      </div>
    </section>}
    <SolidDialog className={styles.filterDialog} open={filterOpen} onOpenChange={setFilterOpen} header="Filter runs"
      style={{ width: "min(30rem, 94vw)" }} footer={<>
        <SolidButton variant="ghost" onClick={clearFilters}>Clear filters</SolidButton>
        <SolidButton variant="primary" type="submit" form="agent-inbox-filter-form">Apply filters</SolidButton>
      </>}>
      <SolidDialogBody>
        <form id="agent-inbox-filter-form" className={styles.filterForm} onSubmit={applyFilters}>
          <label>Agent name<input value={filterDraft.agent} onChange={(event) => setFilterDraft((value) => ({ ...value, agent: event.currentTarget.value }))} placeholder="Search agent" /></label>
          <label>Host ref ID<input value={filterDraft.hostRefId} onChange={(event) => setFilterDraft((value) => ({ ...value, hostRefId: event.currentTarget.value }))} placeholder="Exact host reference" /></label>
          <label>Session ID<input value={filterDraft.sessionId} onChange={(event) => setFilterDraft((value) => ({ ...value, sessionId: event.currentTarget.value }))} placeholder="Exact session ID" /></label>
          <label>Status<SelectFilter value={filterDraft.status} onChange={(status) => setFilterDraft((value) => ({ ...value, status }))}
            options={statuses} /></label>
          <label>Trigger<SelectFilter value={filterDraft.trigger} onChange={(trigger) => setFilterDraft((value) => ({ ...value, trigger }))} options={triggers} /></label>
          <label>Runtime<SelectFilter value={filterDraft.runtime} onChange={(runtime) => setFilterDraft((value) => ({ ...value, runtime }))} options={runtimes} /></label>
          <label>Started from<input type="date" value={filterDraft.startedFrom} onChange={(event) => setFilterDraft((value) => ({ ...value, startedFrom: event.currentTarget.value }))} /></label>
          <label>Started to<input type="date" value={filterDraft.startedTo} onChange={(event) => setFilterDraft((value) => ({ ...value, startedTo: event.currentTarget.value }))} /></label>
          {filterDraft.startedFrom && filterDraft.startedTo && filterDraft.startedFrom > filterDraft.startedTo &&
            <span className={styles.filterError} role="alert">Start date must be on or before end date.</span>}
        </form>
      </SolidDialogBody>
    </SolidDialog>
    <SolidDialog open={Boolean(listSelected)} onOpenChange={(open) => { if (!open) setListSelected(null); }}
      ariaLabel="Run conversation" header={listSelected?.agentTitle ?? "Run conversation"}
      className={styles.runDetailDialog}
      style={{ width: "min(78rem, 96vw)", maxHeight: "92dvh", overflowY: "auto" }}>
      <SolidDialogBody className={styles.detailDialogBody}>
        {listSelected && <OpenRun key={listSelected.sessionId} run={listSelected} revision={revision} onChange={refresh} hideHeader />}
      </SolidDialogBody>
    </SolidDialog>
  </main>;
}

function SelectFilter({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <SolidSelect value={value} onChange={(event) => onChange(event.value)}
    options={[{ label: "All", value: "" }, ...options.map((option) => ({ label: option.replaceAll("_", " "), value: option }))]} />;
}
