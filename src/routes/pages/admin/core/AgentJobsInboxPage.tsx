import React from "react";
import { ChevronLeft, ChevronRight, Inbox as InboxIcon, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { SolidButton, SolidCheckbox } from "../../../../components/shad-cn-ui";
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
  agentTitle: string | null;
  status: string;
  hasJob?: boolean;
  lastActiveAt: string;
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
type Inbox = { runs: Run[]; hasMore: boolean };
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
const pageSize = 25;
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

function OpenRun({ run, revision, onChange }: { run: Run; revision: number; onChange: () => void }) {
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
    <header className={styles.runHeader}>
      <div><h2>{run.agentTitle ?? "Agent run"}</h2>
        <div className={styles.runMeta}><RunStatus status={status} hasJob={hasJob} />
          {canConnect && <span role="status">{connection}</span>}
        </div>
      </div>
    </header>
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
  const [review, setReview] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const [inbox, setInbox] = React.useState<Inbox | null>(null);
  const [error, setError] = React.useState("");
  const [revision, setRevision] = React.useState(0);
  const refresh = React.useCallback(() => setRevision((current) => current + 1), []);
  const selectedId = params.get("run");
  const [selected, setSelected] = React.useState<Run>();
  const [selectionError, setSelectionError] = React.useState("");
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
    const abort = new AbortController();
    let reading = false;
    async function list() {
      if (reading) return;
      reading = true;
      try {
        const response = await solidAxios.get<{ data: Inbox }>(inboxPath, {
          params: { review, offset }, signal: abort.signal,
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
  }, [offset, review, revision]);

  return <main className={styles.inbox}>
    <header className={styles.heading}><h1>Jobs inbox</h1>
      <SolidButton variant="secondary" size="sm" leftIcon={<RefreshCw size={15} />} onClick={refresh}>Refresh</SolidButton>
    </header>
    {error && <p className={styles.notice} role="alert">{error}</p>}
    <div className={styles.columns}>
      <section className={styles.panel} aria-label="Background runs">
        <div className={styles.listHeader}><SolidCheckbox label="Needs review" checked={review} onChange={(event) => {
          setReview(event.target.checked); setOffset(0);
        }} /></div>
        <div className={styles.listScroll}>
          {!inbox && !error && <p className={styles.listMessage} role="status">Loading runs…</p>}
          {inbox?.runs.length === 0 && <p className={styles.listMessage}>{review ? "No runs need your review." : "No background runs yet."}</p>}
          {inbox?.runs.map((run) => <button type="button" key={run.sessionId} aria-pressed={selectedId === run.sessionId}
            className={styles.row} onClick={() => setParams({ run: run.sessionId })}>
            <strong>{run.agentTitle ?? "Agent run"}</strong>
            <span className={styles.runMeta}><RunStatus status={run.status} hasJob={run.hasJob} />
              <time dateTime={run.lastActiveAt}>{new Date(run.lastActiveAt).toLocaleString()}</time></span>
          </button>)}
        </div>
        {(offset > 0 || inbox?.hasMore) && <div className={styles.pagination}>
          <SolidButton size="sm" variant="ghost" leftIcon={<ChevronLeft size={15} />} disabled={offset === 0} onClick={() => setOffset(offset - pageSize)}>Previous</SolidButton>
          <SolidButton size="sm" variant="ghost" rightIcon={<ChevronRight size={15} />} disabled={!inbox?.hasMore} onClick={() => setOffset(offset + pageSize)}>Next</SolidButton>
        </div>}
      </section>
      {open ? <OpenRun key={open.sessionId} run={open} revision={revision} onChange={refresh} />
        : <div className={`${styles.panel} ${styles.empty}`}>
          <InboxIcon size={22} aria-hidden="true" />
          <p role={selectionError ? "alert" : "status"}>{selectionError || (selectedId ? "Opening run…" : "Select a run to see its progress.")}</p>
        </div>}
    </div>
  </main>;
}
