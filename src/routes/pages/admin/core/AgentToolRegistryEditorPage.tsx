import React from "react";
import { ArrowLeft, Plus, RefreshCw, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { showToast } from "../../../../redux/features/toastSlice";
import { AgentRegistryAuditPanel } from "./AgentRegistryAuditPanel";
import { AgentToolSessionsPanel } from "../../../../components/core/extension/solid-core/agentToolRegistry/AgentToolSessionsPanel";
import { AgentRegistryCardWidget } from "../../../../components/core/extension/solid-core/agentRegistry/card/AgentRegistryCardWidget";
import { SolidButton, SolidCodeEditor, SolidDialog, SolidDialogBody, SolidIconPicker, SolidInput, SolidTabGroup } from "../../../../components/shad-cn-ui";
import "./AgentToolRegistryEditorPage.css";

const SharedAgentRegistryCard = AgentRegistryCardWidget as React.ComponentType<{ rowData: Record<string, any> }>;

type Agent = { id?: number | string; name?: string; title?: string; [key: string]: any };
type AgentToolLink = { agentRegistry?: Agent | number | string | null };
type ToolRecord = {
  id: number;
  name?: string;
  iconName?: string | null;
  description?: string;
  tags?: unknown;
  type?: string;
  status?: string | null;
  lastLoadError?: string | null;
  sourceCode?: string;
  agentTools?: AgentToolLink[] | AgentToolLink | null;
};

function extractEntityRecord(response: unknown): Record<string, any> | undefined {
  let candidate: unknown = response;
  for (let depth = 0; depth < 3; depth += 1) {
    if (!candidate || typeof candidate !== "object") return undefined;
    const value = candidate as Record<string, unknown>;
    if ("id" in value || "name" in value) return value;
    candidate = value.data;
  }
  return candidate && typeof candidate === "object" ? candidate as Record<string, any> : undefined;
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((tag) => tag.trim()).filter(Boolean);
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).map((tag) => tag.trim()).filter(Boolean) : [];
  } catch {
    return value === "{}" ? [] : value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function formatErrorMessage(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const messages = value.map(formatErrorMessage).filter((message): message is string => Boolean(message));
    return messages.length ? messages.join("; ") : undefined;
  }
  if (value && typeof value === "object") {
    const error = value as Record<string, unknown>;
    return formatErrorMessage(error.message)
      ?? formatErrorMessage(error.constraints)
      ?? formatErrorMessage(error.error);
  }
  return undefined;
}

function getSaveErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Failed to save tool.";
  const apiError = error as Record<string, any>;
  return formatErrorMessage(apiError.data?.data?.message)
    ?? formatErrorMessage(apiError.data?.message)
    ?? formatErrorMessage(apiError.data?.error)
    ?? formatErrorMessage(apiError.message)
    ?? "Failed to save tool.";
}

export function AgentToolRegistryEditorPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const entityApi = React.useMemo(() => createSolidEntityApi("agentToolRegistry"), []);
  const { useCreateSolidEntityMutation, useGetSolidEntityByIdQuery, useUpdateSolidEntityMutation } = entityApi;
  const { data: response, isLoading, isFetching, refetch } = useGetSolidEntityByIdQuery(
    { id, qs: "populate[0]=agentTools&populate[1]=agentTools.agentRegistry" },
    { skip: !id || id === "new" },
  );
  const [createTool, { isLoading: isCreating }] = useCreateSolidEntityMutation();
  const [updateTool, { isLoading: isSaving }] = useUpdateSolidEntityMutation();
  const record = extractEntityRecord(response) as ToolRecord | undefined;
  const [activeTab, setActiveTab] = React.useState("general");
  const [name, setName] = React.useState("");
  const [iconName, setIconName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState("custom");
  const [sourceCode, setSourceCode] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [auditRefreshVersion, setAuditRefreshVersion] = React.useState(0);
  const [confirmRefresh, setConfirmRefresh] = React.useState(false);
  const baseline = React.useRef("");

  const currentForm = () => JSON.stringify({ name, iconName, description, type, sourceCode, tags, tagDraft });

  React.useEffect(() => {
    const nextTags = parseTags(record?.tags);
    setName(record?.name ?? "");
    setIconName(record?.iconName ?? "");
    setDescription(record?.description ?? "");
    setType(record?.type ?? "custom");
    setSourceCode(record?.sourceCode ?? "");
    setTags(nextTags);
    setTagDraft("");
    baseline.current = JSON.stringify({ name: record?.name ?? "", iconName: record?.iconName ?? "", description: record?.description ?? "", type: record?.type ?? "custom", sourceCode: record?.sourceCode ?? "", tags: nextTags, tagDraft: "" });
  }, [record]);

  const isReadOnly = record?.type === "solidx";
  const isDirty = Boolean(record?.id) && currentForm() !== baseline.current;
  const requestRefresh = () => isDirty ? setConfirmRefresh(true) : void refetch();

  const addTag = () => {
    const next = tagDraft.trim();
    if (!next) return;
    if (!tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) setTags((current) => [...current, next]);
    setTagDraft("");
    setFieldErrors((current) => ({ ...current, tags: "" }));
  };

  const save = async (nextStatus?: "active" | "inactive") => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!description.trim()) nextErrors.description = "Description is required.";
    if (tags.length === 0) nextErrors.tags = "At least one tag is required.";
    if (!type.trim()) nextErrors.type = "Tool type is required.";
    if (!sourceCode.trim()) nextErrors.sourceCode = "Tool source code is required.";

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setActiveTab(nextErrors.sourceCode ? "tool" : "general");
      dispatch(showToast({ severity: "error", summary: "Missing information", detail: Object.values(nextErrors).join(" ") }));
      return;
    }
    const payload = {
      name: name.trim(), iconName: iconName || null, description: description.trim(), type,
      sourceCode, tags: JSON.stringify(tags),
      ...(type === "custom" ? { checksum: await sha256Hex(sourceCode) } : {}),
      // Status is required by the agentToolRegistry metadata, including partial
      // updates. Preserve the current lifecycle state for ordinary saves.
      status: nextStatus ?? (record?.status === "load_failed" ? "active" : record?.status ?? "active"),
      ...((nextStatus === "active" || (!nextStatus && record?.status === "load_failed")) ? { lastLoadError: null } : {}),
    };
    try {
      if (record?.id) {
        await updateTool({ id: record.id, data: payload }).unwrap();
        dispatch(showToast({ severity: "success", summary: nextStatus ? "Tool status updated" : "Saved", detail: nextStatus ? `Tool moved to ${nextStatus}. Restart linked agent processes to apply the change.` : "Tool updated successfully." }));
        setAuditRefreshVersion((version) => version + 1);
        refetch();
      } else {
        const result: any = await createTool(payload).unwrap();
        const createdId = result?.data?.id ?? result?.id;
        dispatch(showToast({ severity: "success", summary: "Created", detail: "Tool created successfully." }));
        if (createdId) navigate(`/admin/core/solid-core/agent-tool-registry/editor/${createdId}`, { replace: true });
      }
    } catch (error: any) {
      const errorDetail = getSaveErrorMessage(error);
      const serverFieldErrors: Record<string, string> = {};
      if (/required|not be empty|cannot be empty|should not be empty/i.test(errorDetail)) {
        for (const field of ["name", "description", "tags", "type", "sourceCode"]) {
          if (!new RegExp(`\\b${field}\\b`, "i").test(errorDetail)) continue;
          const label = field === "sourceCode" ? "Tool source code" : field[0].toUpperCase() + field.slice(1);
          serverFieldErrors[field] = `${label} is required.`;
        }
      }
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors);
        setActiveTab(serverFieldErrors.sourceCode ? "tool" : "general");
      }
      dispatch(showToast({ severity: "error", summary: "Save failed", detail: errorDetail }));
    }
  };

  const agents = React.useMemo(() => {
    const relatedTools = record?.agentTools;
    const links = Array.isArray(relatedTools) ? relatedTools : relatedTools ? [relatedTools] : [];
    const seen = new Set<string>();
    return links.map((link) => link.agentRegistry).filter((agent): agent is Agent => Boolean(agent && typeof agent === "object"))
      .filter((agent) => {
        const key = String(agent.id ?? agent.name ?? agent.title ?? "");
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [record?.agentTools]);
  const sessionAgents = React.useMemo(() => agents.filter((agent): agent is Agent & { id: number | string } => agent.id !== undefined && agent.id !== null), [agents]);
  const tabs = [
    { value: "general", label: "General Info", content: <fieldset className="agent-tool-editor__general" disabled={isReadOnly}>
      {isReadOnly && <p className="agent-tool-editor__readonly-note">SolidX tools are seeded by the AgentHub runtime and cannot be edited.</p>}
      {record?.status && <section className={`agent-tool-editor__runtime-status${record.status === "load_failed" ? " agent-tool-editor__runtime-status--failed" : ""}`} role={record.status === "load_failed" ? "alert" : "status"}>
        <div className="agent-tool-editor__runtime-heading"><strong>Runtime status</strong><span>{record.status.replace(/[_-]+/g, " ")}</span></div>
        {record.status === "load_failed" ? <>
          <p>The AgentHub runtime could not load this tool. After correcting its source or checksum, restart linked agent processes so the runtime retries loading it.</p>
          {record.lastLoadError && <pre>{record.lastLoadError}</pre>}
        </> : <p>{record.lastLoadError || "No tool load error has been reported."}</p>}
      </section>}
      <div className="agent-tool-editor__fields">
        <label className="agent-tool-editor__field"><span>Name <b>*</b></span><SolidInput value={name} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "agent-tool-name-error" : undefined} className={fieldErrors.name ? "agent-tool-editor__input--invalid" : undefined} onChange={(e) => { setName(e.target.value); setFieldErrors((current) => ({ ...current, name: "" })); }} />{fieldErrors.name && <small id="agent-tool-name-error" className="agent-tool-editor__field-error">{fieldErrors.name}</small>}</label>
        <div className="agent-tool-editor__field"><span>Icon</span><SolidIconPicker value={iconName} onChange={setIconName} /></div>
        <label className="agent-tool-editor__field"><span>Description <b>*</b></span><SolidInput value={description} aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "agent-tool-description-error" : undefined} className={fieldErrors.description ? "agent-tool-editor__input--invalid" : undefined} onChange={(e) => { setDescription(e.target.value); setFieldErrors((current) => ({ ...current, description: "" })); }} />{fieldErrors.description && <small id="agent-tool-description-error" className="agent-tool-editor__field-error">{fieldErrors.description}</small>}</label>
      </div>
      <label className="agent-tool-editor__field"><span>Tool type <b>*</b></span><select value={type} aria-invalid={Boolean(fieldErrors.type)} aria-describedby={fieldErrors.type ? "agent-tool-type-error" : undefined} className={fieldErrors.type ? "agent-tool-editor__input--invalid" : undefined} onChange={(e) => { setType(e.target.value); setFieldErrors((current) => ({ ...current, type: "" })); }}>
        {isReadOnly && <option value="solidx">SolidX</option>}<option value="thirdparty">Third Party</option><option value="custom">Custom</option>
      </select>{fieldErrors.type && <small id="agent-tool-type-error" className="agent-tool-editor__field-error">{fieldErrors.type}</small>}</label>
      <div className="agent-tool-editor__field"><span>Tags <b>*</b></span><div className={`agent-tool-editor__tag-input${fieldErrors.tags ? " agent-tool-editor__tag-input--invalid" : ""}`}>
        {tags.map((tag, index) => <span className="agent-tool-editor__tag" key={`${tag}-${index}`}>{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => setTags((current) => { const next = current.filter((_, i) => i !== index); if (next.length) setFieldErrors((errors) => ({ ...errors, tags: "" })); return next; })}><X size={13} /></button></span>)}
        <input value={tagDraft} aria-label="Add a tag" placeholder="Type a tag and press Enter" onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
        <SolidButton type="button" variant="secondary" size="small" onClick={addTag}><Plus size={14} /> Add</SolidButton>
      </div>{fieldErrors.tags && <small className="agent-tool-editor__field-error">{fieldErrors.tags}</small>}<small>Tags are saved as a JSON array.</small></div>
      {record?.id && <section className="agent-tool-editor__workflow" aria-labelledby="agent-tool-lifecycle-title">
        <div className="agent-tool-editor__workflow-head"><div><h2 id="agent-tool-lifecycle-title">Tool lifecycle</h2><p>Activate or deactivate this tool for linked agents. Load failures are reported by AgentHub.</p></div></div>
        <div className="agent-tool-editor__workflow-stages" aria-label={`Current tool stage: ${(record.status ?? "active").replace(/[_-]+/g, " ")}`}>
          {([ ["active", "Active", "Enabled for loading into linked agents."], ["inactive", "Inactive", "Not loaded for linked agents."], ["load_failed", "Load failed", "AgentHub could not load this tool."] ] as const).map(([value, label, description], index) => {
            const currentStatus = record.status ?? "active";
            const isCurrent = currentStatus === value;
            const canRetry = value === "load_failed" && isCurrent;
            const disabled = isCreating || isSaving || (!canRetry && (value === "load_failed" || isCurrent));
            return <React.Fragment key={value}>
              {index > 0 && <div className="agent-tool-editor__workflow-connector" aria-hidden="true" />}
              <button type="button" className={`agent-tool-editor__workflow-stage agent-tool-editor__workflow-stage--${value}${isCurrent ? " is-current" : ""}`}
                aria-current={isCurrent ? "step" : undefined} aria-pressed={isCurrent} disabled={disabled}
                onClick={() => void save(value === "load_failed" ? "active" : value)}>
                <span className="agent-tool-editor__workflow-mark">{index + 1}</span>
                <span className="agent-tool-editor__workflow-copy"><strong>{label}</strong><small>{description}</small><small className="agent-tool-editor__workflow-cta">{canRetry ? "Click to retry loading" : isCurrent ? "Current stage" : value === "load_failed" ? "Set automatically by AgentHub" : "Click to move to this stage"}</small></span>
                {isCurrent && <span className="agent-tool-editor__workflow-current">Current</span>}
              </button>
            </React.Fragment>;
          })}
        </div>
        {record.status === "load_failed" && <small className="agent-tool-editor__workflow-hint">Fix the source or checksum first. Retrying saves the current tool configuration and clears the reported error; restart linked agent processes to load the updated tool.</small>}
        <small className="agent-tool-editor__workflow-hint">Changing stage saves the current tool configuration. Restart linked agent processes to apply the change.</small>
      </section>}
    </fieldset> },
    { value: "tool", label: "Tool", content: <div className="agent-tool-editor__tool">
      <section className="agent-tool-editor__panel">
        <header><h2>Tool source code <b>*</b></h2><p>Write the tool's Python code here.</p></header>
        <SolidCodeEditor value={sourceCode} onChange={(value) => { setSourceCode(value ?? ""); setFieldErrors((current) => ({ ...current, sourceCode: "" })); }} language="python" readOnly={isReadOnly} fontSize={11} height="max(32rem, calc(100dvh - 18rem))" className={`agent-tool-editor__code${fieldErrors.sourceCode ? " agent-tool-editor__code--invalid" : ""}`} />
        {fieldErrors.sourceCode && <small className="agent-tool-editor__field-error agent-tool-editor__code-error">{fieldErrors.sourceCode}</small>}
      </section>
    </div> },
    { value: "agents", label: "Agents", content: <section className="agent-tool-editor__agents"><div><h2>Associated agents</h2><p>Agents linked to this tool. Associations are read-only here.</p></div>
      {isLoading ? <p>Loading associated agents…</p> : agents.length ? <div className="agent-tool-editor__agent-grid">{agents.map((agent, index) => <div className="agent-tool-editor__agent-card" key={String(agent.id ?? agent.name ?? index)}><SharedAgentRegistryCard rowData={agent} /></div>)}</div> : <div className="agent-tool-editor__empty">No agents are currently associated with this tool.</div>}
    </section> },
    { value: "sessions", label: "Sessions", content: <AgentToolSessionsPanel agents={sessionAgents} /> },
  ];

  return <main className="agent-tool-editor">
    <header className="agent-tool-editor__header"><div><div className="agent-tool-editor__heading-with-refresh"><h1>{record ? "Edit Tool" : "Create Tool"}</h1>{record?.id && <button type="button" className={`agent-tool-editor__refresh${isFetching ? " is-loading" : ""}`} aria-label="Refresh tool" title="Refresh tool" disabled={isFetching || isSaving} onClick={requestRefresh}><RefreshCw size={14} /></button>}</div></div><div className="agent-tool-editor__actions">
      <SolidButton variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</SolidButton>
      {!isReadOnly && <SolidButton loading={isCreating || isSaving} onClick={() => void save()}>Save Tool</SolidButton>}
    </div></header>
    <SolidDialog open={confirmRefresh} onOpenChange={setConfirmRefresh} header="Discard unsaved changes?" style={{ width: "min(28rem, 94vw)" }}
      footer={<><SolidButton type="button" variant="secondary" onClick={() => setConfirmRefresh(false)}>Cancel</SolidButton><SolidButton type="button" disabled={isFetching} onClick={() => { setConfirmRefresh(false); void refetch(); }}>Refresh and discard</SolidButton></>}>
      <SolidDialogBody><p>You have unsaved changes. Refreshing will discard them and load the latest tool content.</p></SolidDialogBody>
    </SolidDialog>
    {isLoading ? <div className="agent-tool-editor__loading">Loading tool…</div> : record?.id ? (
      <AgentRegistryAuditPanel modelSingularName="agentToolRegistry" recordId={record.id} refreshVersion={auditRefreshVersion} modelUserKey={record.name}>
        <SolidTabGroup tabs={tabs} value={activeTab} onValueChange={setActiveTab} className="agent-tool-editor__tabs" listClassName="agent-tool-editor__tab-list" panelClassName="agent-tool-editor__tab-panel" />
      </AgentRegistryAuditPanel>
    ) : <SolidTabGroup tabs={tabs} value={activeTab} onValueChange={setActiveTab} className="agent-tool-editor__tabs" listClassName="agent-tool-editor__tab-list" panelClassName="agent-tool-editor__tab-panel" />}
  </main>;
}
