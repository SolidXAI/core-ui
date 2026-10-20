import React from "react";
import { ArrowLeft, ArrowRight, Check, CircleHelp, Cpu, FileText, GitCompareArrows, Puzzle, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { SolidButton, SolidDialog, SolidDialogBody, SolidDialogClose, SolidDialogDescription, SolidDialogHeader, SolidDialogTitle, SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../../../components/shad-cn-ui";
import { formatConfigDate, loadConfigComparison, loadConfigDiff, type ConfigComparison, type ConfigDiff, type ConfigVersion, type ComparisonRow } from "./agentConfigComparison";
import "./AgentConfigComparisonPage.css";

function VersionHeader({ version, side }: { version: ConfigVersion; side: "Older" | "Newer" }) {
  const name = version.name || `Version ${version.versionNumber}`;
  return <div className={`config-compare__version is-${side.toLowerCase()}`}>
    <span className="config-compare__version-badge">v{version.versionNumber}</span>
    <div className="config-compare__version-copy">
      <div className="config-compare__version-title"><h2>{name}</h2>
        <SolidTooltip><SolidTooltipTrigger asChild><button type="button" className="config-compare__help" aria-label={`About version ${version.versionNumber}`}><CircleHelp size={14} /></button></SolidTooltipTrigger>
          <SolidTooltipContent><div className="config-compare__tooltip"><strong>{name}</strong><p>{version.description || "No description added."}</p></div></SolidTooltipContent>
        </SolidTooltip>
      </div>
      <span className="config-compare__version-meta">{side} · <time dateTime={version.createdAt}>{formatConfigDate(version.createdAt)}</time></span>
    </div>
  </div>;
}

type StatusMarkProps = { matched: boolean; label: string; interactive?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>;
const StatusMark = React.forwardRef<HTMLButtonElement, StatusMarkProps>(({ matched, label, interactive = true, className, ...rest }, ref) => {
  const icon = matched ? <Check size={14} strokeWidth={2.75} /> : <X size={14} strokeWidth={2.75} />;
  const classes = `config-compare__mark ${matched ? "is-matched" : "is-changed"}${className ? ` ${className}` : ""}`;
  if (matched || !interactive) return <span className={classes} role="img" aria-label={`${label}: ${matched ? "no differences" : "different"}`} title={matched ? "No differences" : "Different"}>{icon}</span>;
  return <button ref={ref} type="button" className={classes} aria-label={`${label}: view differences`} title={rest.disabled ? "Different" : "View differences"} {...rest}>{icon}</button>;
});
StatusMark.displayName = "StatusMark";

function SectionHeader({ icon, title, count, changes }: { icon: React.ReactNode; title: string; count?: number; changes: number }) {
  return <header className="config-compare__section-head">
    <span className="config-compare__section-icon">{icon}</span>
    <h2>{title}</h2>
    {count !== undefined && <span className="config-compare__count">{count}</span>}
    <span className={`config-compare__section-status ${changes ? "is-changed" : "is-matched"}`} aria-label={changes ? `${changes} difference${changes === 1 ? "" : "s"}` : "No differences"}>
      {changes ? <><X size={12} strokeWidth={3} />{changes}</> : <Check size={12} strokeWidth={3} />}
    </span>
  </header>;
}

function DiffContent({ comparison, diffKey }: { comparison: ConfigComparison; diffKey: string }) {
  const [detail, setDetail] = React.useState<ConfigDiff | null>(null);
  const [error, setError] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);
  const { left, right } = comparison.versions;
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setDetail(null); setError("");
    void loadConfigDiff({ agentId: comparison.agent.id, leftVersionId: left.id, rightVersionId: right.id, diffKey }, controller.signal)
      .then((result) => { if (active) setDetail(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "The diff could not be loaded."); });
    return () => { active = false; controller.abort(); };
  }, [comparison.agent.id, left.id, right.id, diffKey, attempt]);
  if (error) return <div className="config-compare__empty" role="alert">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>;
  if (!detail) return <div className="config-compare__empty" role="status">Loading diff…</div>;
  const rows = detail.rows ?? [{ id: diffKey, title: detail.title, oldValue: detail.oldValue, newValue: detail.newValue }];
  return <div className="config-compare__diff">{rows.map((row) => <section key={row.id} className="config-compare__diff-block" aria-label={row.title}>
    <header className="config-compare__diff-block-head"><h3>{row.title}</h3><StatusMark matched={row.oldValue === row.newValue} label={row.title} interactive={false} /></header>
    {isFlagChange(row.oldValue, row.newValue) ? <div className={`config-compare__value-change${row.oldValue === row.newValue ? " is-same" : ""}`}>
      <ValueSide version={left} value={row.oldValue} tone="old" /><span className="config-compare__arrow" aria-hidden="true"><ArrowRight size={14} /></span><ValueSide version={right} value={row.newValue} tone="new" />
    </div> : <div className="config-compare__diff-viewer"><ReactDiffViewer oldValue={row.oldValue} newValue={row.newValue} splitView compareMethod={DiffMethod.WORDS} styles={diffViewerStyles}
      leftTitle={`v${left.versionNumber} · ${left.name || "Older version"}`} rightTitle={`v${right.versionNumber} · ${right.name || "Newer version"}`} showDiffOnly={false} /></div>}
  </section>)}</div>;
}

// Settings such as "Always include" arrive as "true"/"false" ("" when the skill is absent); text fields always use the diff viewer.
const flagOf = (value: string) => value.trim().toLowerCase();
const isFlagChange = (oldValue: string, newValue: string) => [oldValue, newValue].every((value) => ["true", "false", ""].includes(flagOf(value))) && [oldValue, newValue].some((value) => flagOf(value) !== "");

function ValueSide({ version, value, tone }: { version: ConfigVersion; value: string; tone: "old" | "new" }) {
  const flag = flagOf(value);
  return <div className={`config-compare__value is-${tone}`}>
    <span className="config-compare__value-version">v{version.versionNumber} · {version.name || (tone === "old" ? "Older version" : "Newer version")}</span>
    {flag ? <span className={`config-compare__value-flag is-${flag === "true" ? "on" : "off"}`}>{flag === "true" ? <Check size={13} strokeWidth={3} /> : <X size={13} strokeWidth={3} />}{flag === "true" ? "Yes" : "No"}</span>
      : <span className="config-compare__value-empty">Not included</span>}
  </div>;
}

const diffViewerStyles = {
  contentText: { fontSize: "0.8rem", lineHeight: 1.6 },
  lineNumber: { fontSize: "0.72rem" },
  gutter: { minWidth: "2.25rem", padding: "0 0.5rem" },
  marker: { width: "1.5rem", paddingLeft: "0.4rem" },
  titleBlock: { padding: "0.5rem 0.75rem", fontFamily: "inherit", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.02em" },
};

function DiffDialog({ open, onOpenChange, comparison, diffKey, icon, title, subtitle }: { open: boolean; onOpenChange: (open: boolean) => void; comparison: ConfigComparison; diffKey: string; icon: React.ReactNode; title: string; subtitle: string }) {
  const { left, right } = comparison.versions;
  return <SolidDialog open={open} onOpenChange={onOpenChange} showHeader={false} ariaLabel={`${title} differences`} className="config-compare__dialog">
    <SolidDialogHeader className="config-compare__dialog-header">
      <span className="config-compare__section-icon">{icon}</span>
      <div className="config-compare__dialog-heading"><SolidDialogTitle>{title}</SolidDialogTitle><SolidDialogDescription>{subtitle}</SolidDialogDescription></div>
      <div className="config-compare__dialog-versions" aria-label={`Comparing version ${left.versionNumber} with version ${right.versionNumber}`}>
        <span className="config-compare__version-badge">v{left.versionNumber}</span><ArrowRight size={13} /><span className="config-compare__version-badge is-newer">v{right.versionNumber}</span>
      </div>
      <SolidDialogClose aria-label="Close" />
    </SolidDialogHeader>
    <SolidDialogBody>{open && <DiffContent comparison={comparison} diffKey={diffKey} />}</SolidDialogBody>
  </SolidDialog>;
}

function ComparisonRowView({ row, comparison, kind }: { row: ComparisonRow; comparison: ConfigComparison; kind: "prompt" | "skill" }) {
  const [open, setOpen] = React.useState(false);
  const matched = row.status === "matched";
  const label = row.right?.label || row.left?.label || "Configuration";
  const subtitle = kind === "prompt" ? "System prompt changes" : row.status === "added" ? "Skill added" : row.status === "removed" ? "Skill removed" : "Skill changes";
  return <div className={`config-compare__row is-${row.status}`}>
    {(["left", "right"] as const).map((side) => <React.Fragment key={side}>
      {side === "right" && <div className="config-compare__center"><StatusMark matched={matched} label={label} disabled={!row.diffKey} aria-haspopup="dialog" onClick={() => setOpen(true)} />
        {!matched && row.diffKey && <DiffDialog open={open} onOpenChange={setOpen} comparison={comparison} diffKey={row.diffKey} title={label} subtitle={subtitle} icon={kind === "prompt" ? <FileText size={16} /> : <Puzzle size={16} />} />}</div>}
      <div className={`config-compare__cell${!row[side] ? " is-absent" : ""}`}>
        {row[side] ? <><div className="config-compare__cell-title"><strong>{row[side]!.label}</strong>{((side === "right" && row.status === "added") || (side === "left" && row.status === "removed")) && <span className={`config-compare__change-tag is-${row.status}`}>{row.status === "added" ? "Added" : "Removed"}</span>}</div>
          {row[side]!.summary && <p>{row[side]!.summary}</p>}</> : <span className="config-compare__sr-only">Not included in this version</span>}
      </div>
    </React.Fragment>)}
  </div>;
}

export function AgentConfigComparisonPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const agentId = Number(params.get("agentId"));
  const leftVersionId = Number(params.get("leftVersionId"));
  const rightVersionId = Number(params.get("rightVersionId"));
  const valid = [agentId, leftVersionId, rightVersionId].every((id) => Number.isSafeInteger(id) && id > 0) && leftVersionId !== rightVersionId;
  const [comparison, setComparison] = React.useState<ConfigComparison | null>(null);
  const [error, setError] = React.useState("");
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setComparison(null); setError("");
    if (!valid) return;
    void loadConfigComparison({ agentId, leftVersionId, rightVersionId }, controller.signal)
      .then((result) => { if (active) setComparison(result); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "The comparison could not be loaded."); });
    return () => { active = false; controller.abort(); };
  }, [valid, agentId, leftVersionId, rightVersionId, attempt]);
  const back = () => navigate(valid ? `/admin/core/solid-core/agent-registry/editor/${agentId}?tab=config-versions` : "/admin/core/solid-core/agent-registry/list");
  if (!comparison) {
    const failed = error || (!valid ? "Select two different config versions from an agent editor." : "");
    return <main className="config-compare"><SolidButton variant="secondary" onClick={back}><ArrowLeft size={15} /> Back to agent</SolidButton><div className="config-compare__empty" role={failed ? "alert" : "status"}>{failed || "Loading comparison…"}
      {error && <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button>}</div></main>;
  }
  const { systemPrompt, skills, modelConfiguration } = comparison.sections;
  const skillChanges = skills?.rows.filter((row) => row.status !== "matched").length ?? 0;
  const modelChanges = modelConfiguration.groups.reduce((total, group) => total + group.fields.filter((field) => field.status !== "matched").length, 0);
  const subtitle = comparison.agent.title && comparison.agent.title !== comparison.agent.name ? comparison.agent.title : null;
  return <main className="config-compare">
    <header className="config-compare__page-header"><div><div className="config-compare__eyebrow"><GitCompareArrows size={13} /> Config comparison</div><h1>{comparison.agent.name}</h1>{subtitle && <p>{subtitle}</p>}</div><SolidButton variant="secondary" size="sm" onClick={back}><ArrowLeft size={14} /> Back to agent</SolidButton></header>
    <div className="config-compare__sheet">
      <div className="config-compare__version-headers"><VersionHeader version={comparison.versions.left} side="Older" /><span className="config-compare__center"><span className="config-compare__arrow"><ArrowRight size={14} /></span></span><VersionHeader version={comparison.versions.right} side="Newer" /></div>
      <section className="config-compare__section"><SectionHeader icon={<FileText size={15} />} title={systemPrompt.title} changes={systemPrompt.status === "matched" ? 0 : 1} /><ComparisonRowView comparison={comparison} row={systemPrompt} kind="prompt" /></section>
      <section className="config-compare__section"><SectionHeader icon={<Puzzle size={15} />} title={skills?.title ?? "Skills"} count={skills?.rows.length} changes={skillChanges} />{!skills ? <p className="config-compare__empty">Skill comparison is not available yet.</p> : skills.rows.length ? <div className="config-compare__rows">{skills.rows.map((row) => <ComparisonRowView key={row.id} comparison={comparison} row={row} kind="skill" />)}</div> : <p className="config-compare__empty">Neither version includes skills.</p>}</section>
      <section className="config-compare__section"><SectionHeader icon={<Cpu size={15} />} title={modelConfiguration.title} changes={modelChanges} />{modelConfiguration.groups.map((group) => <div className="config-compare__model-group" key={group.id}><h3>{group.title}</h3><div className="config-compare__rows">{group.fields.map((field) => <div className={`config-compare__row config-compare__model-row is-${field.status}`} key={field.key}>
        <div className="config-compare__cell"><small>{field.label}</small><strong>{field.left ?? "—"}</strong></div><div className="config-compare__center"><StatusMark matched={field.status === "matched"} label={field.label} interactive={false} /></div><div className="config-compare__cell"><small>{field.label}</small><strong>{field.right ?? "—"}</strong></div>
      </div>)}</div></div>)}</section>
    </div>
  </main>;
}
