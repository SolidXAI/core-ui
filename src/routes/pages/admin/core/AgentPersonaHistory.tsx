import React from "react";
import { ArrowLeftRight, ChevronDown, History, RefreshCw } from "lucide-react";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useLazyGetchatterMessageQuery } from "../../../../redux/api/solidChatterMessageApi";
import {
  SolidDialog, SolidDialogBody, SolidDropdownMenu, SolidDropdownMenuContent,
  SolidDropdownMenuItem, SolidDropdownMenuTrigger,
} from "../../../../components/shad-cn-ui";
import "./AgentPersonaHistory.css";

type AuditDetail = { fieldName?: string; oldValue?: string | null; newValue?: string | null };
type AuditMessage = {
  id: number;
  messageType?: string;
  messageSubType?: string;
  createdAt?: string;
  user?: { fullName?: string } | null;
  chatterMessageDetails?: AuditDetail[];
};
type PersonaVersion = {
  id: string;
  prompt: string;
  createdAt?: string;
  author: string;
  kind: "current" | "update" | "initial";
};

const PAGE_SIZE = 100;
const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

function relativeTime(value?: string): string {
  if (!value) return "Date unknown";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Date unknown";
  const minutes = Math.round((time - Date.now()) / 60000);
  if (Math.abs(minutes) < 1) return "Just now";
  if (Math.abs(minutes) < 60) return relativeFormatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 30) return relativeFormatter.format(days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return relativeFormatter.format(months, "month");
  return relativeFormatter.format(Math.round(days / 365), "year");
}

function absoluteTime(value?: string): string {
  if (!value) return "Date unknown";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateFormatter.format(date) : "Date unknown";
}

function versionsFrom(messages: AuditMessage[]): PersonaVersion[] {
  const ordered = [...messages].sort((a, b) => {
    const byDate = new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    return byDate || b.id - a.id;
  });
  const versions: PersonaVersion[] = [];
  for (const message of ordered) {
    if (message.messageType !== "audit") continue;
    const detail = message.chatterMessageDetails?.find((item) => item.fieldName === "systemPrompt");
    if (!detail || typeof detail.newValue !== "string") continue;
    if (message.messageSubType !== "audit_update" && message.messageSubType !== "audit_insert") continue;
    versions.push({
      id: `audit-${message.id}`,
      prompt: detail.newValue,
      createdAt: message.createdAt,
      author: message.user?.fullName || "System",
      kind: message.messageSubType === "audit_insert" ? "initial" : "update",
    });
  }
  // Older agents can predate their first recorded insert audit. The first update's
  // before value still gives us the previous prompt without inventing a timestamp.
  if (!versions.some((version) => version.kind === "initial")) {
    const oldestUpdate = [...ordered].reverse().find((message) => message.messageType === "audit" &&
      message.messageSubType === "audit_update" &&
      message.chatterMessageDetails?.some((detail) => detail.fieldName === "systemPrompt" && typeof detail.oldValue === "string"));
    const oldPrompt = oldestUpdate?.chatterMessageDetails?.find((detail) => detail.fieldName === "systemPrompt")?.oldValue;
    if (typeof oldPrompt === "string") versions.push({
      id: `before-${oldestUpdate!.id}`,
      prompt: oldPrompt,
      author: "Earlier version",
      kind: "initial",
    });
  }
  return versions;
}

function versionLabel(version: PersonaVersion): string {
  if (version.kind === "current") return "Current saved prompt";
  if (version.id.startsWith("before-")) return "Before first recorded change";
  return version.kind === "initial" ? "Original prompt" : "Prompt change";
}

function VersionItem({ version, selected }: { version: PersonaVersion; selected?: boolean }) {
  return <span className="persona-history__item">
    <span className="persona-history__item-main"><strong>{versionLabel(version)}</strong></span>
    <span className="persona-history__item-meta">
      {version.createdAt ? <time dateTime={version.createdAt} title={absoluteTime(version.createdAt)}>{relativeTime(version.createdAt)}</time> : "Date unknown"}
      <span aria-hidden="true">·</span><span>{version.author}</span>
      {selected && <span className="persona-history__selected">Selected</span>}
    </span>
  </span>;
}

function VersionPicker({ versions, value, onChange, side }: {
  versions: PersonaVersion[];
  value: string;
  onChange: (id: string) => void;
  side: "left" | "right";
}) {
  const selected = versions.find((version) => version.id === value) ?? versions[0];
  return <SolidDropdownMenu>
    <SolidDropdownMenuTrigger className="persona-history__selector" aria-label={`Choose ${side} prompt version`}>
      <span className="persona-history__selector-copy">
        <span className="persona-history__selector-meta"><small>{side === "left" ? "LEFT VERSION" : "RIGHT VERSION"}</small>
          <time dateTime={selected.createdAt} title={selected.createdAt ? absoluteTime(selected.createdAt) : undefined}>
            {selected.createdAt ? absoluteTime(selected.createdAt) : selected.author}
          </time>
        </span>
        <strong>{versionLabel(selected)}</strong>
      </span><ChevronDown size={17} aria-hidden="true" />
    </SolidDropdownMenuTrigger>
    <SolidDropdownMenuContent className="persona-history__menu" align="start" sideOffset={8}>
      <div className="persona-history__menu-heading">Choose {side} version</div>
      <div className="persona-history__menu-list">
        {versions.map((version) => <SolidDropdownMenuItem key={version.id} className="persona-history__menu-option"
          onSelect={() => onChange(version.id)}><VersionItem version={version} selected={version.id === value} /></SolidDropdownMenuItem>)}
      </div>
    </SolidDropdownMenuContent>
  </SolidDropdownMenu>;
}

export function AgentPersonaHistory({ agentId, savedPrompt, refreshVersion }: {
  agentId: number;
  savedPrompt: string;
  refreshVersion: number;
}) {
  const [getMessages] = useLazyGetchatterMessageQuery();
  const [versions, setVersions] = React.useState<PersonaVersion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [leftId, setLeftId] = React.useState("current");
  const [rightId, setRightId] = React.useState("");
  const requestId = React.useRef(0);

  const current: PersonaVersion = { id: "current", prompt: savedPrompt, author: "Saved agent", kind: "current" };
  const choices = [current, ...versions];
  const left = choices.find((version) => version.id === leftId) ?? current;
  const right = choices.find((version) => version.id === rightId) ?? versions[0] ?? current;

  const loadVersions = React.useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    setError(false);
    try {
      const all: AuditMessage[] = [];
      let offset = 0;
      while (true) {
        const qs = `limit=${PAGE_SIZE}&offset=${offset}&populate[0]=user`;
        const response = await getMessages({ entityId: agentId, entityName: "agentRegistry", qs }, false).unwrap();
        const records = (response?.data?.records ?? []) as AuditMessage[];
        all.push(...records);
        const total = Number(response?.data?.meta?.totalRecords ?? all.length);
        if (!records.length || all.length >= total) break;
        offset += records.length;
      }
      if (request === requestId.current) setVersions(versionsFrom(all));
    } catch {
      if (request === requestId.current) setError(true);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [agentId, getMessages]);

  React.useEffect(() => {
    setVersions([]);
    setLeftId("current");
    setRightId("");
    setDialogOpen(false);
    setMenuOpen(false);
    return () => { requestId.current += 1; };
  }, [agentId]);

  React.useEffect(() => {
    if (menuOpen || dialogOpen) void loadVersions();
  }, [menuOpen, refreshVersion]);

  const compare = (version: PersonaVersion) => {
    setLeftId("current");
    setRightId(version.id);
    setMenuOpen(false);
    setDialogOpen(true);
  };

  return <>
    <SolidDropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <SolidDropdownMenuTrigger className="persona-history__trigger" aria-label="Persona history" title="Persona history">
        <History size={17} aria-hidden="true" />
      </SolidDropdownMenuTrigger>
      <SolidDropdownMenuContent className="persona-history__menu" align="end" sideOffset={8}>
        <div className="persona-history__menu-header"><span><strong>Persona history</strong><small>Saved changes to the system prompt</small></span>
          <button type="button" className="persona-history__refresh" aria-label="Refresh persona history" title="Refresh history"
            onClick={(event) => { event.preventDefault(); event.stopPropagation(); void loadVersions(); }}><RefreshCw size={15} /></button>
        </div>
        <div className="persona-history__menu-list">
          {loading && <div className="persona-history__status">Loading prompt history…</div>}
          {!loading && error && <div className="persona-history__status persona-history__status--error">Could not load history. Try refreshing.</div>}
          {!loading && !error && !versions.length && <div className="persona-history__status">No saved prompt changes yet.</div>}
          {!loading && !error && versions.map((version) => <SolidDropdownMenuItem key={version.id} className="persona-history__menu-option"
            onSelect={() => compare(version)}><VersionItem version={version} /></SolidDropdownMenuItem>)}
        </div>
      </SolidDropdownMenuContent>
    </SolidDropdownMenu>

    <SolidDialog open={dialogOpen} onOpenChange={setDialogOpen} ariaLabel="Compare persona versions"
      className="persona-history__dialog" header={<span className="persona-history__dialog-title"><History size={18} /> Compare persona versions</span>}>
      <SolidDialogBody className="persona-history__dialog-body">
        <div className="persona-history__compare-controls">
          <VersionPicker versions={choices} value={left.id} onChange={setLeftId} side="left" />
          <span className="persona-history__compare-icon" aria-hidden="true"><ArrowLeftRight size={17} /></span>
          <VersionPicker versions={choices} value={right.id} onChange={setRightId} side="right" />
        </div>
        <div className="persona-history__diff" key={`${left.id}:${right.id}`}>
          <ReactDiffViewer oldValue={left.prompt} newValue={right.prompt} splitView compareMethod={DiffMethod.LINES}
            leftTitle={versionLabel(left)} rightTitle={versionLabel(right)} showDiffOnly={false} />
        </div>
      </SolidDialogBody>
    </SolidDialog>
  </>;
}
