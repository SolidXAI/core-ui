import React from "react";
import { AlertCircle, Clock3, RefreshCw, Search } from "lucide-react";
import { createSolidEntityApi } from "../../../../../redux/api/solidEntityApi";
import { SolidAutocomplete, SolidInput } from "../../../../shad-cn-ui";
import { AgentEventOutcomeListWidget, getAgentEventFailure } from "../agentEvent/list/AgentEventOutcomeListWidget";
import "../../../../../routes/pages/admin/core/AgentToolRegistryEditorPage.css";

type AgentOption = { id: number | string; name?: string; title?: string };
type SessionRecord = {
  id: number;
  sessionId?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  status?: string | null;
  agent?: AgentOption | number | string | null;
  [key: string]: any;
};

function unwrapRecords(result: any): any[] {
  return Array.isArray(result?.records) ? result.records : [];
}

function ago(value?: string | null): string {
  if (!value) return "Start time unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Start time unknown";
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Started just now";
  if (seconds < 3600) return `Started ${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `Started ${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  return days < 30 ? `Started ${days}d ago` : `Started ${date.toLocaleDateString()}`;
}

function agentName(session: SessionRecord, agents: AgentOption[]): string {
  const relation = session.agent;
  const id = relation && typeof relation === "object" ? relation.id : relation;
  const agent = agents.find((item) => String(item.id) === String(id));
  if (agent) return agent.name ?? agent.title ?? "Unnamed agent";
  if (relation && typeof relation === "object") return relation.name ?? relation.title ?? "Unnamed agent";
  return "Unknown agent";
}

function sessionQuery(agentId: number | string, processId?: number): string {
  const processFilter = processId == null ? "" : `&filters[process][id][$eq]=${encodeURIComponent(String(processId))}`;
  return `offset=0&limit=1000&populate[0]=agent&sort[0]=startedAt%3Adesc&filters[agent][id][$eq]=${encodeURIComponent(String(agentId))}${processFilter}`;
}

function eventsQuery(sessionId: number): string {
  return `offset=0&limit=1000&sort[0]=createdAt%3Aasc&filters[session][id][$eq]=${encodeURIComponent(String(sessionId))}`;
}

type Props = { agents?: AgentOption[]; agentId?: number | string; agentLabel?: string; processId?: number; processLabel?: string };
const EMPTY_AGENTS: AgentOption[] = [];

export function AgentSessionsPanel({ agents, agentId, agentLabel, processId, processLabel }: Props) {
  const linkedAgents = agents ?? EMPTY_AGENTS;
  const scopedAgents = React.useMemo(() => agentId != null
    ? [{ id: agentId, name: agentLabel ?? "Agent" }]
    : linkedAgents, [agentId, agentLabel, linkedAgents]);
  const sessionApi = React.useMemo(() => createSolidEntityApi("agentSession"), []);
  const eventApi = React.useMemo(() => createSolidEntityApi("agentEvent"), []);
  const [fetchSessions] = sessionApi.useLazyGetSolidEntitiesQuery();
  const [fetchEvents] = eventApi.useLazyGetSolidEntitiesQuery();
  const [sessions, setSessions] = React.useState<SessionRecord[]>([]);
  const [selectedAgent, setSelectedAgent] = React.useState<{ id: string; label: string } | null>(null);
  const [selectedSessionId, setSelectedSessionId] = React.useState<number | null>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = React.useState(false);
  const [sessionsError, setSessionsError] = React.useState(false);
  const [eventsError, setEventsError] = React.useState(false);
  const [eventTypeFilter, setEventTypeFilter] = React.useState("all");
  const [outcomeFilter, setOutcomeFilter] = React.useState("all");
  const [eventSearch, setEventSearch] = React.useState("");
  const [sessionSearch, setSessionSearch] = React.useState("");
  const [sessionRefreshVersion, setSessionRefreshVersion] = React.useState(0);
  const [eventRefreshVersion, setEventRefreshVersion] = React.useState(0);
  const agentOptions = React.useMemo(() => linkedAgents.map((agent) => ({
    id: String(agent.id),
    label: agent.name ?? agent.title ?? `Agent ${agent.id}`,
  })), [linkedAgents]);
  const linkedAgentKey = agentOptions.map((agent) => agent.id).join(",");

  React.useEffect(() => {
    let alive = true;
    const requestedAgents = agentId != null ? scopedAgents : selectedAgent ? scopedAgents.filter((agent) => String(agent.id) === selectedAgent.id) : scopedAgents;
    if (!requestedAgents.length) {
      setSessions([]);
      setSelectedSessionId(null);
      return;
    }
    setIsLoadingSessions(true);
    setSessionsError(false);
    void Promise.all(requestedAgents.map(async (agent) => {
      const result = await fetchSessions(sessionQuery(agent.id, processId), false).unwrap();
      return unwrapRecords(result).map((item) => ({
        ...item,
        agent: item.agent && typeof item.agent === "object" ? item.agent : agent,
      } as SessionRecord));
    })).then((groups) => {
      if (!alive) return;
      const unique = new Map<string, SessionRecord>();
      groups.flat().forEach((session) => unique.set(String(session.id), session));
      const ordered = Array.from(unique.values()).sort((a, b) => new Date(b.startedAt ?? 0).getTime() - new Date(a.startedAt ?? 0).getTime());
      setSessions(ordered);
      setSelectedSessionId((current) => ordered.some((session) => session.id === current) ? current : ordered[0]?.id ?? null);
    }).catch(() => {
      if (alive) {
        setSessions([]);
        setSelectedSessionId(null);
        setSessionsError(true);
      }
    }).finally(() => alive && setIsLoadingSessions(false));
    return () => { alive = false; };
  }, [agentId, fetchSessions, linkedAgentKey, processId, scopedAgents, selectedAgent, sessionRefreshVersion]);

  React.useEffect(() => {
    let alive = true;
    if (!selectedSessionId) {
      setEvents([]);
      return;
    }
    setIsLoadingEvents(true);
    setEventsError(false);
    void fetchEvents(eventsQuery(selectedSessionId), false).unwrap().then((result: any) => {
      if (alive) setEvents(unwrapRecords(result));
    }).catch(() => {
      if (alive) {
        setEvents([]);
        setEventsError(true);
      }
    }).finally(() => alive && setIsLoadingEvents(false));
    return () => { alive = false; };
  }, [eventRefreshVersion, fetchEvents, selectedSessionId]);

  const eventTypes = React.useMemo(() => Array.from(new Set(events.map((event) => String(event.eventType ?? "")).filter(Boolean))).sort(), [events]);
  const visibleEvents = React.useMemo(() => {
    const query = eventSearch.trim().toLowerCase();
    return events.filter((event) => {
      if (eventTypeFilter !== "all" && event.eventType !== eventTypeFilter) return false;
      const failed = Boolean(getAgentEventFailure(event));
      if (outcomeFilter === "failure" && !failed) return false;
      if (outcomeFilter === "success" && failed) return false;
      if (!query) return true;
      return [event.eventType, event.toolName, event.content, getAgentEventFailure(event)?.message]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
    });
  }, [events, eventSearch, eventTypeFilter, outcomeFilter]);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const visibleSessions = React.useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter((session) => [session.sessionId, session.id, session.status, agentName(session, scopedAgents)]
      .some((value) => String(value ?? "").toLowerCase().includes(query)));
  }, [scopedAgents, sessionSearch, sessions]);

  return (
    <section className="agent-tool-editor__sessions" aria-label="Sessions and events">
      <aside className="agent-tool-editor__sessions-sidebar">
        <header className="agent-tool-editor__sessions-sidebar-head">
          <div><div className="agent-tool-editor__sessions-heading"><h2>Sessions</h2><button type="button" className={`agent-tool-editor__refresh${isLoadingSessions ? " is-loading" : ""}`} aria-label="Refresh sessions" title="Refresh sessions" disabled={isLoadingSessions} onClick={() => setSessionRefreshVersion((version) => version + 1)}><RefreshCw size={13} /></button><span>{visibleSessions.length}{visibleSessions.length !== sessions.length ? ` / ${sessions.length}` : ""}</span></div></div>
          <p>{processId != null ? `In ${processLabel ?? `process #${processId}`}.` : agentId != null ? "Browse activity for this agent." : "Browse activity across linked agents."}</p>
          {agentId == null && linkedAgents.length > 1 && <label className="agent-tool-editor__sessions-agent-filter"><span>Agent</span>
            <SolidAutocomplete
              value={selectedAgent ? [selectedAgent] : []}
              suggestions={agentOptions}
              field="label"
              multiple
              maxVisibleChips={1}
              dropdown
              forceSelection
              portal
              placeholder="All linked agents"
              onChange={(event: any) => setSelectedAgent(Array.isArray(event.value) ? event.value[0] ?? null : null)}
            />
          </label>}
          <label className="agent-tool-editor__session-search"><span className="sr-only">Find a session</span><Search size={14} /><SolidInput value={sessionSearch} placeholder="Find session or agent…" onChange={(event: any) => setSessionSearch(event.target.value)} /></label>
        </header>
        <div className="agent-tool-editor__session-list" role="listbox" aria-label="Sessions">
          {isLoadingSessions ? <p className="agent-tool-editor__sessions-message">Loading sessions…</p>
            : sessionsError ? <p className="agent-tool-editor__sessions-message agent-tool-editor__sessions-message--error"><AlertCircle size={15} /> Could not load sessions.</p>
              : sessions.length === 0 ? <p className="agent-tool-editor__sessions-message">{processId != null ? "No sessions assigned to this process. Older unassigned sessions remain in the Sessions tab." : "No sessions found for linked agents."}</p>
                : visibleSessions.length === 0 ? <p className="agent-tool-editor__sessions-message">No sessions match this search.</p>
                : visibleSessions.map((session) => {
                  const sessionLabel = session.sessionId ?? String(session.id);
                  const rawStatus = String(session.status ?? "").toLowerCase();
                  const statusLabel = rawStatus === "active" ? "Idle"
                    : rawStatus === "awaiting_input" ? "Awaiting input"
                      : rawStatus === "awaiting_approval" ? "Awaiting approval"
                        : rawStatus ? rawStatus.replace(/[_-]+/g, " ") : session.endedAt ? "Ended" : "Open";
                  return <button
                    type="button"
                    role="option"
                    aria-selected={session.id === selectedSessionId}
                    className={`agent-tool-editor__session-item${session.id === selectedSessionId ? " is-selected" : ""}`}
                    key={session.id}
                    onClick={() => setSelectedSessionId(session.id)}
                    title={sessionLabel}
                  >
                    <span className="agent-tool-editor__session-item-id" title={sessionLabel}>{sessionLabel}</span>
                    <span className="agent-tool-editor__session-item-meta"><span><Clock3 size={12} /> {ago(session.startedAt)}</span><span className={`agent-tool-editor__session-status${rawStatus === "running" ? " is-running" : rawStatus === "active" ? " is-idle" : ""}`}>{statusLabel}</span></span>
                    {agentId == null && <small>{agentName(session, scopedAgents)}</small>}
                  </button>;
                })}
        </div>
      </aside>

      <div className="agent-tool-editor__session-events">
        <header className="agent-tool-editor__events-head">
          <div className="agent-tool-editor__events-title">
            <div><div className="agent-tool-editor__heading-with-refresh"><h2>Events</h2><button type="button" className={`agent-tool-editor__refresh${isLoadingEvents ? " is-loading" : ""}`} aria-label="Refresh events" title="Refresh events" disabled={!selectedSessionId || isLoadingEvents} onClick={() => setEventRefreshVersion((version) => version + 1)}><RefreshCw size={13} /></button></div><p>{selectedSession ? `${selectedSession.sessionId ?? selectedSession.id} · ${agentName(selectedSession, scopedAgents)}` : "Select a session to inspect its events."}</p></div>
            <span>{visibleEvents.length}{visibleEvents.length !== events.length ? ` / ${events.length}` : ""}</span>
          </div>
          <div className="agent-tool-editor__event-filters">
            <label><span>Event type</span><select value={eventTypeFilter} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setEventTypeFilter(event.target.value)}>
              <option value="all">All types</option>{eventTypes.map((eventType) => <option key={eventType} value={eventType}>{eventType}</option>)}
            </select></label>
            <label><span>Outcome</span><select value={outcomeFilter} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setOutcomeFilter(event.target.value)}>
              <option value="all">All outcomes</option><option value="success">Success</option><option value="failure">Failure</option>
            </select></label>
            <label className="agent-tool-editor__event-search"><span>Search events</span><span className="agent-tool-editor__event-search-control"><Search size={15} /><SolidInput value={eventSearch} placeholder="Search events…" onChange={(event: React.ChangeEvent<HTMLInputElement>) => setEventSearch(event.target.value)} /></span></label>
          </div>
        </header>
        <div className="agent-tool-editor__events-table-wrap">
          {isLoadingEvents ? <p className="agent-tool-editor__sessions-message">Loading events…</p>
            : eventsError ? <p className="agent-tool-editor__sessions-message agent-tool-editor__sessions-message--error"><AlertCircle size={15} /> Could not load events for this session.</p>
              : !selectedSession ? <p className="agent-tool-editor__sessions-message">Choose a session from the left to view its events.</p>
                : visibleEvents.length === 0 ? <p className="agent-tool-editor__sessions-message">No events match these filters.</p>
                  : <table className="agent-tool-editor__events-table">
                    <thead><tr><th>Time</th><th>Event type</th><th>Tool</th><th>Cost</th><th>Tokens</th></tr></thead>
                    <tbody>{visibleEvents.map((event) => <tr key={event.id}>
                      <td>{event.createdAt ? new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}</td>
                      <td><AgentEventOutcomeListWidget rowData={event} fieldMetadata={{ name: "eventType" } as any} solidListViewMetaData={{}} column={{ attrs: {} }} /></td>
                      <td>{event.toolName || "—"}</td>
                      <td>{event.cost == null ? "—" : Number(event.cost).toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                      <td>{event.inputTokens || event.outputTokens ? `${event.inputTokens ?? 0} / ${event.outputTokens ?? 0}` : "—"}</td>
                    </tr>)}</tbody>
                  </table>}
        </div>
      </div>
    </section>
  );
}

export const AgentToolSessionsPanel = AgentSessionsPanel;
