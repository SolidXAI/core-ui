import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { loadAgents, loadReport, type Agent, type Group, type Period, type Report, type Result } from "./analytics";
import { Card, CardHeader, Segmented, Skeleton } from "./ui";
import { formatCost, formatCount, formatDurationMs, formatTokens } from "./format";
import { Breakdown } from "./Breakdown";
import "./th-ui.css";

const periods: { value: Period; label: string }[] = [
  { value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "all", label: "All time" },
];
const comparisonColumns = [
  { title: "Sessions", field: "count", format: formatCount },
  { title: "Turns", field: "turnCount_sum", format: formatCount },
  { title: "Steps", field: "totalSteps_sum", format: formatCount },
  { title: "Input tokens", field: "totalInputTokens_sum", format: formatTokens },
  { title: "Output tokens", field: "totalOutputTokens_sum", format: formatTokens },
  { title: "Recorded cost", field: "totalCost_sum", format: formatCost },
];

const value = (row: Group | undefined, field = "count") => Number(row?.[field] ?? 0);
const sum = (source: Result, field = "count") => source.rows.reduce((n, r) => n + value(r, field), 0);
const label = (r: Group) => String(r.groupValue ?? "Unspecified");

function Panel({ title, sub, source, children, empty = !source.rows.length }: { title: string; sub?: string; source: Result; empty?: boolean; children: ReactNode }) {
  return <Card><CardHeader title={title} sub={sub} />{source.issue || empty
    ? <p className="notice">{source.issue ?? "No matching activity."}</p> : children}</Card>;
}

function Trend({ source, period, sessions }: { source: Result; period: Period; sessions: boolean }) {
  const [metric, setMetric] = useState<"cost:sum" | "count">("cost:sum");
  const formatValue = metric === "count" ? formatCount : formatCost;
  const rows = [...source.rows].sort((a, b) => label(a).localeCompare(label(b)));
  const end = new Date().toISOString().slice(0, 10);
  const last = Date.parse(end);
  const first = period === "all" ? Date.parse(String(rows[0]?.groupValue ?? end)) : last - (Number(period) - 1) * 86400000;
  const monthly = last - first > 90 * 86400000;
  const buckets = new Map<string, number>();
  for (const d = new Date(first); d.getTime() <= last; monthly ? d.setUTCMonth(d.getUTCMonth() + 1, 1) : d.setUTCDate(d.getUTCDate() + 1)) {
    buckets.set(d.toISOString().slice(0, monthly ? 7 : 10), 0);
  }
  for (const r of rows) {
    const k = label(r).slice(0, monthly ? 7 : 10);
    buckets.set(k, (buckets.get(k) ?? 0) + value(r, metric === "count" ? "count" : sessions ? "totalCost_sum" : "cost_sum"));
  }
  const series = Array.from(buckets);
  const peak = Array.from(buckets.values()).reduce((max, amount) => Math.max(max, amount), 0);
  return <Panel title="Activity over time" sub={(monthly ? "Monthly" : "Daily") + (sessions ? " totals by session start date" : " event totals")} source={source}>
    <div className="chart-body"><Segmented ariaLabel="Trend metric" options={[{ value: "cost:sum", label: "Cost" }, { value: "count", label: sessions ? "Sessions" : "Events" }]} value={metric} onChange={setMetric} />
    <div className="plot"><span>{formatValue(peak)}</span><div className="bars" role="img" aria-label={metric === "count" ? (sessions ? "Sessions started over time" : "Event volume over time") : "Recorded cost over time"}>
      {series.map(([day, amount]) => <div key={day} style={{ height: (peak ? amount / peak * 100 : 0) + "%" }} title={day + " · " + formatValue(amount)} />)}
    </div></div><div className="axis"><span>{series[0]?.[0]}</span><span>{series[series.length - 1]?.[0]}</span></div>
    <details><summary>View values</summary><div className="series-values">{series.map(([day, amount]) => <div key={day}>{day}<strong>{formatValue(amount)}</strong></div>)}</div></details></div>
  </Panel>;
}

function ReportBody({ report: r, agents, selected, period }: { report: Report; agents: Agent[]; selected: string; period: Period }) {
  const ev = (name: string) => r.events.rows.find(row => row.groupValue === name);
  const cost = sum(r.events, "cost_sum");
  const turns = value(ev("TurnCompleteEvent"));
  const names = new Map(agents.filter(a => !selected || String(a.id) === selected).map(a => [String(a.id), a.title || a.name]));
  const usage = new Map(r.agents.rows.map(row => [String(row.groupValue), row]));
  for (const id of Array.from(usage.keys())) if (!names.has(id)) names.set(id, id === "null" ? "Unassigned" : "Agent " + id);
  function stat(title: string, amount: string, hint: string, source: Result) {
    return <Card className="thx-stat"><div className="thx-stat-l">{title}</div><div className="thx-stat-v">{source.issue ? "-" : amount}</div><small>{source.issue ?? hint}</small></Card>;
  }
  return <>
    <div className="thx-stats">
      {r.events.issue ? stat("Session cost", formatCost(sum(r.agents,"totalCost_sum")), "For sessions started in range", r.agents) : stat("Recorded cost", formatCost(cost), "By event date", r.events)}
      {stat("Runs started", formatCount(value(ev("AgentStarted"))), formatCount(turns) + " completed turns", r.events)}
      {stat("Sessions started", formatCount(sum(r.agents)), formatCount(sum(r.agents, "turnCount_sum")) + " turns in those sessions", r.agents)}
      {stat("Events", formatCount(sum(r.events)), formatCount(value(ev("LlmRawResponse")) + value(ev("FastLlmResponse"))) + " model responses", r.events)}
      {stat("Session tokens", formatTokens(sum(r.agents, "totalInputTokens_sum") + sum(r.agents, "totalOutputTokens_sum")), formatTokens(sum(r.agents, "totalOutputTokens_sum")) + " output tokens", r.agents)}
    </div>
    <div className="panels">
      <Trend source={r.daily.issue ? r.sessionDaily : r.daily} period={period} sessions={Boolean(r.daily.issue)} />
      <Panel title="Cost breakdown" sub="Recorded during the selected period" source={r.events}>
        <dl>{[["Reasoning completions", formatCost(value(ev("LlmComplete"), "cost_sum"))],
          ["Context compaction", formatCost(value(ev("ContextCompacted"), "cost_sum"))],
          ["Cost per completed turn", turns ? formatCost(cost / turns) : "-"],
          ["Fast-model cost", "Unmetered"]].map(([k,v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </Panel>
    </div>
    <Panel title="Agent comparison" sub="Lifetime totals for sessions started in the selected period" source={r.agents} empty={!names.size}>
      <div className="thx-table-wrap"><table className="thx-table"><thead><tr><th>Agent</th>{comparisonColumns.map(column => <th key={column.field}>{column.title}</th>)}</tr></thead>
      <tbody>{Array.from(names).sort(([a],[b]) => value(usage.get(b),"totalCost_sum") - value(usage.get(a),"totalCost_sum")).map(([id,name]) =>
        <tr key={id}><td>{name}</td>{comparisonColumns.map(({ field, format }) =>
          <td key={field}>{format(value(usage.get(id), field))}</td>)}</tr>)}</tbody></table></div>
    </Panel>
    <div className="panels">
      <Breakdown pie title="Reasoning models" sub="Recorded responses by reasoning key" source={r.reasoning} detail={row => formatTokens(value(row,"inputTokens_sum")) + " input · " + formatTokens(value(row,"outputTokens_sum")) + " output tokens"} />
      <Breakdown pie title="Fast models" sub="Recorded responses by fast-model key" source={r.fast} />
      <Breakdown pie initialView="pie" title="Session status" source={r.sessionStatus} /><Breakdown title="Session triggers" source={r.triggers} />
      <Breakdown pie initialView="pie" title="Background jobs" source={r.jobs} detail={row => formatCount(value(row,"attempts_sum")) + " dispatch attempts"} />
      <Breakdown pie initialView="pie" title="Human requests" source={r.requests} />
      <Breakdown title="Tool results" source={r.tools} detail={row => row.durationMs_avg == null ? "Duration unavailable" : formatDurationMs(value(row,"durationMs_avg")) + " ms average"} />
      <Breakdown pie initialView="pie" title="Tool return codes" sub="Zero indicates success" source={r.toolCodes} />
      <Breakdown title="Browser sessions" source={r.browsers} />
      <Breakdown title="Context archives" source={r.archives} detail={row => formatTokens(value(row,"tokenEstimate_sum")) + " estimated tokens"} />
      <Breakdown pie title="Configured reasoning models" sub="Sessions by model key" source={r.configured} />
      <Breakdown title="Event types" source={r.events} />
    </div>
  </>;
}

function Results({ period, selected, agents }: { period: Period; selected: string; agents: Agent[] }) {
  const [report, setReport] = useState<Report>();
  useEffect(() => {
    const abort = new AbortController();
    loadReport(period, selected, abort.signal).then(data => { if (!abort.signal.aborted) setReport(data); });
    return () => abort.abort();
  }, [period, selected]);
  return report ? <ReportBody report={report} agents={agents} selected={selected} period={period} />
    : <div role="status" aria-label="Loading analytics"><Skeleton height={85} /><br/><Skeleton height={210} /></div>;
}

export default function AgentDashboardPage() {
  const [period, setPeriod] = useState<Period>("all");
  const [selected, setSelected] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [registryError, setRegistryError] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    loadAgents(abort.signal).then(data => {
      if (!abort.signal.aborted) { setAgents(data); setRegistryError(false); }
    }).catch(() => { if (!abort.signal.aborted) setRegistryError(true); });
    return () => abort.abort();
  }, [refresh]);
  return <section className="agent-analytics thx" aria-label="Agent analytics" tabIndex={0}><div className="thx-page">
    <header><div><h1>Agent analytics</h1><p>Usage, recorded spend and execution history</p></div>
      <Link to="/admin/core/solid-core/agent-session/inbox">Jobs inbox →</Link></header>
    <div className="toolbar"><Segmented options={periods} value={period} onChange={setPeriod} ariaLabel="Date range" />
      <select className="thx-input" aria-label="Filter by agent" value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">All agents</option>{agents.map(a => <option key={a.id} value={a.id}>{a.title || a.name}</option>)}</select>
      <button className="refresh" type="button" onClick={() => setRefresh(n => n + 1)}>Refresh</button></div>
    {registryError && <p role="status">Agent names could not be loaded. Refresh to retry.</p>}
    <Results key={[period,selected,refresh].join("/")} period={period} selected={selected} agents={agents} />
  </div></section>;
}
