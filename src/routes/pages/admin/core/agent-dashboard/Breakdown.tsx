import { useState } from "react";
import type { Group, Result } from "./analytics";
import { Card, CardHeader, Segmented } from "./ui";
import { formatCount } from "./format";

type View = "list" | "bars" | "pie";
const count = (row: Group) => Math.max(0, Number(row.count) || 0);
const label = (row: Group) => String(row.groupValue ?? "Unspecified");
const colors = ["var(--th-accent)", "var(--th-info)", "var(--th-ok)", "var(--th-warn)", "var(--th-critical)", "#8b78c8", "#258b8b", "#bb7350"];
const statusColors: Record<string, string> = {
  completed: "var(--th-ok)", succeeded: "var(--th-ok)", answered: "var(--th-ok)",
  failed: "var(--th-err)", active: "var(--th-info)", pending: "var(--th-warn)",
  awaiting_input: "var(--th-warn)", queued: "var(--th-accent)", expired: "var(--th-text-3)",
};

export function Breakdown({ title, source, sub, detail, pie = false, initialView = "bars" }: {
  title: string; source: Result; sub?: string; detail?: (r: Group) => string;
  pie?: boolean; initialView?: View;
}) {
  const [selectedView, setView] = useState<View>(initialView);
  const rows = [...source.rows].sort((a, b) => count(b) - count(a));
  const total = rows.reduce((n, row) => n + count(row), 0);
  const view = total > 0 ? selectedView : "list";
  const peak = count(rows[0] ?? { count: 0, groupValue: null }) || 1;
  const color = (row: Group, i: number) => statusColors[label(row)] ?? (title === "Tool return codes" ? (label(row) === "0" ? "var(--th-ok)" : "var(--th-err)") : colors[i % colors.length]);
  const options: { value: View; label: string }[] = [{ value: "list", label: "List" }, { value: "bars", label: "Bars" }];
  if (pie) options.push({ value: "pie", label: "Pie" });
  let offset = 0;
  return <Card>
    <CardHeader title={title} sub={sub}>
      {!source.issue && rows.length > 0 && total > 0 && <Segmented ariaLabel={title + " visualization"} options={options} value={view} onChange={setView} />}
    </CardHeader>
    {source.issue || !rows.length ? <p className="notice">{source.issue ?? "No matching activity."}</p> :
      <div className={"breakdown-view breakdown-view-" + view}>
        {view === "pie" && total > 0 && <div className="breakdown-donut">
          <svg viewBox="0 0 200 200" role="img" aria-label={title + ": distribution of " + formatCount(total) + " total"}>
            {rows.map((row, i) => {
              const share = count(row) / total * 100;
              const start = offset;
              offset += share;
              return share > 0 && <circle key={label(row)} cx="100" cy="100" r="76" fill="none" stroke={color(row, i)} strokeWidth="26"
                pathLength="100" strokeDasharray={`${share} ${100 - share}`} strokeDashoffset={-start} transform="rotate(-90 100 100)">
                <title>{label(row)}: {formatCount(count(row))} ({(share).toFixed(1)}%)</title>
              </circle>;
            })}
            <text x="100" y="98" textAnchor="middle" className="donut-total">{formatCount(total)}</text>
            <text x="100" y="118" textAnchor="middle" className="donut-caption">Total</text>
          </svg>
        </div>}
        <div className={"breakdown" + (view === "bars" ? " breakdown-bars" : "")}>
          {rows.map((row, i) => <div className="rank" key={label(row)}>
            <span className="rank-label">{view !== "list" && <i className="rank-dot" style={{ background: color(row, i) }} />}{label(row)}</span>
            <strong>{formatCount(count(row))}{view === "pie" && <small className="rank-share">{total ? (count(row) / total * 100).toFixed(1) : "0.0"}%</small>}</strong>
            {view !== "pie" && <div className="track"><i style={{ width: (100 * count(row) / peak) + "%", background: view === "bars" ? color(row, i) : undefined }} /></div>}
            {detail && <small>{detail(row)}</small>}
          </div>)}
        </div>
      </div>}
  </Card>;
}
