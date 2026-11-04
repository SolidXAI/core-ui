import React from "react";
import { AlertCircle, Clock3, RefreshCw, Search } from "lucide-react";
import { createSolidEntityApi } from "../../../../../redux/api/solidEntityApi";
import { SolidInput } from "../../../../shad-cn-ui";
import { AgentSessionsPanel } from "./AgentToolSessionsPanel";

type ProcessRecord = {
  id: number;
  processId?: string | null;
  status?: string | null;
  startedAt?: string | null;
};

function processQuery(agentId: number | string): string {
  return `offset=0&limit=1000&sort[0]=startedAt%3Adesc&filters[agent][id][$eq]=${encodeURIComponent(String(agentId))}`;
}

export function AgentProcessesPanel({ agentId, agentLabel }: { agentId: number | string; agentLabel?: string }) {
  const processApi = React.useMemo(() => createSolidEntityApi("agentProcess"), []);
  const [fetchProcesses] = processApi.useLazyGetSolidEntitiesQuery();
  const [processes, setProcesses] = React.useState<ProcessRecord[]>([]);
  const [selectedProcessId, setSelectedProcessId] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [refreshVersion, setRefreshVersion] = React.useState(0);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    void fetchProcesses(processQuery(agentId), false).unwrap().then((result: any) => {
      if (!alive) return;
      const records = Array.isArray(result?.records) ? result.records as ProcessRecord[] : [];
      setProcesses(records);
      setSelectedProcessId((current) => records.some((process) => process.id === current) ? current : records[0]?.id ?? null);
    }).catch(() => {
      if (!alive) return;
      setProcesses([]);
      setSelectedProcessId(null);
      setError(true);
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [agentId, fetchProcesses, refreshVersion]);

  const selectedProcess = processes.find((process) => process.id === selectedProcessId);
  const query = search.trim().toLowerCase();
  const visibleProcesses = processes.filter((process) =>
    [process.id, process.processId, process.status].some((value) => String(value ?? "").toLowerCase().includes(query)));

  return <section className="agent-process-view" aria-label="Processes, sessions and events">
    <aside className="agent-process-view__processes">
      <header className="agent-tool-editor__sessions-sidebar-head">
        <div className="agent-tool-editor__sessions-heading"><h2>Processes</h2><button type="button" className={`agent-tool-editor__refresh${loading ? " is-loading" : ""}`} aria-label="Refresh processes" title="Refresh processes" disabled={loading} onClick={() => setRefreshVersion((version) => version + 1)}><RefreshCw size={13} /></button><span>{visibleProcesses.length}{visibleProcesses.length !== processes.length ? ` / ${processes.length}` : ""}</span></div>
        <p>Browse processes for this agent.</p>
        <label className="agent-tool-editor__session-search"><span className="sr-only">Find a process</span><Search size={14} /><SolidInput value={search} placeholder="Find a process…" onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} /></label>
      </header>
      <div className="agent-tool-editor__session-list" role="listbox" aria-label="Processes">
        {loading ? <p className="agent-tool-editor__sessions-message">Loading processes…</p>
          : error ? <p className="agent-tool-editor__sessions-message agent-tool-editor__sessions-message--error"><AlertCircle size={15} /> Could not load processes.</p>
            : processes.length === 0 ? <p className="agent-tool-editor__sessions-message">No processes found for this agent.</p>
              : visibleProcesses.length === 0 ? <p className="agent-tool-editor__sessions-message">No processes match this search.</p>
                : visibleProcesses.map((process) => {
                  const label = `#${process.id}`;
                  const status = process.status ?? "Unknown";
                  const started = process.startedAt ? new Date(process.startedAt) : null;
                  const startedLabel = started && !Number.isNaN(started.getTime()) ? started.toLocaleString() : "Start time unknown";
                  return <button key={process.id} type="button" role="option" aria-selected={process.id === selectedProcessId}
                    className={`agent-tool-editor__session-item${process.id === selectedProcessId ? " is-selected" : ""}`}
                    title={process.processId ?? label} onClick={() => setSelectedProcessId(process.id)}>
                    <span className="agent-tool-editor__session-item-id">{label}</span>
                    <span className="agent-tool-editor__session-item-meta"><span><Clock3 size={12} /> {startedLabel}</span></span>
                    <span className={`agent-tool-editor__session-status${status === "ready" ? " is-running" : ""}`}>{status}</span>
                  </button>;
                })}
      </div>
    </aside>
    {selectedProcess ? <AgentSessionsPanel key={selectedProcess.id} agentId={agentId} agentLabel={agentLabel}
      processId={selectedProcess.id} processLabel={`#${selectedProcess.id}`} />
      : <div className="agent-process-view__empty">{loading ? "Loading processes…" : error ? "Processes could not be loaded." : "Select a process to inspect its sessions and events."}</div>}
  </section>;
}
