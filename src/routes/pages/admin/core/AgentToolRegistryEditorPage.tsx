import React from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { showToast } from "../../../../redux/features/toastSlice";
import { SolidAgentEmbedded } from "../../../../components/core/solid-agent/SolidAgentEmbedded";
import { SolidButton, SolidCodeEditor, SolidInput, SolidTabGroup } from "../../../../components/shad-cn-ui";
import "./AgentToolRegistryEditorPage.css";

type Agent = { id?: number | string; name?: string; title?: string };
type AgentToolLink = { agentRegistry?: Agent | number | string | null };
type ToolRecord = {
  id: number;
  name?: string;
  description?: string;
  tags?: unknown;
  type?: string;
  source_code?: string;
  agentTools?: AgentToolLink[] | AgentToolLink | null;
};

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

export function AgentToolRegistryEditorPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const entityApi = React.useMemo(() => createSolidEntityApi("agentToolRegistry"), []);
  const { useCreateSolidEntityMutation, useGetSolidEntityByIdQuery, useUpdateSolidEntityMutation } = entityApi;
  const { data: response, isLoading, refetch } = useGetSolidEntityByIdQuery(
    { id, qs: "populate[0]=agentTools&populate[1]=agentTools.agentRegistry" },
    { skip: !id || id === "new" },
  );
  const [createTool, { isLoading: isCreating }] = useCreateSolidEntityMutation();
  const [updateTool, { isLoading: isSaving }] = useUpdateSolidEntityMutation();
  const record = (response?.data ?? response) as ToolRecord | undefined;
  const [activeTab, setActiveTab] = React.useState("general");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState("custom");
  const [sourceCode, setSourceCode] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");

  React.useEffect(() => {
    setName(record?.name ?? "");
    setDescription(record?.description ?? "");
    setType(record?.type ?? "custom");
    setSourceCode(record?.source_code ?? "");
    setTags(parseTags(record?.tags));
  }, [record]);

  const addTag = () => {
    const next = tagDraft.trim();
    if (!next) return;
    if (!tags.some((tag) => tag.toLowerCase() === next.toLowerCase())) setTags((current) => [...current, next]);
    setTagDraft("");
  };

  const save = async () => {
    if (!name.trim() || !description.trim()) {
      setActiveTab("general");
      dispatch(showToast({ severity: "error", summary: "Missing information", detail: "Name and description are required." }));
      return;
    }
    const payload = { name: name.trim(), description: description.trim(), type, source_code: sourceCode, tags: JSON.stringify(tags) };
    try {
      if (record?.id) {
        await updateTool({ id: record.id, data: payload }).unwrap();
        dispatch(showToast({ severity: "success", summary: "Saved", detail: "Tool updated successfully." }));
        refetch();
      } else {
        const result: any = await createTool(payload).unwrap();
        const createdId = result?.data?.id ?? result?.id;
        dispatch(showToast({ severity: "success", summary: "Created", detail: "Tool created successfully." }));
        if (createdId) navigate(`/admin/core/solid-core/agent-tool-registry/editor/${createdId}`, { replace: true });
      }
    } catch (error: any) {
      dispatch(showToast({ severity: "error", summary: "Save failed", detail: error?.data?.message ?? error?.message ?? "Failed to save tool." }));
    }
  };

  const relatedTools = record?.agentTools;
  const links = Array.isArray(relatedTools) ? relatedTools : relatedTools ? [relatedTools] : [];
  const seen = new Set<string>();
  const agents = links.map((link) => link.agentRegistry).filter((agent): agent is Agent => Boolean(agent && typeof agent === "object"))
    .filter((agent) => {
      const key = String(agent.id ?? agent.name ?? agent.title ?? "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const tabs = [
    { value: "general", label: "General Info", content: <div className="agent-tool-editor__general">
      <div className="agent-tool-editor__fields">
        <label className="agent-tool-editor__field"><span>Name <b>*</b></span><SolidInput value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="agent-tool-editor__field"><span>Description <b>*</b></span><SolidInput value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      </div>
      <label className="agent-tool-editor__field"><span>Tool type</span><select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="solidx">SolidX</option><option value="thirdparty">Third Party</option><option value="custom">Custom</option>
      </select></label>
      <div className="agent-tool-editor__field"><span>Tags</span><div className="agent-tool-editor__tag-input">
        {tags.map((tag, index) => <span className="agent-tool-editor__tag" key={`${tag}-${index}`}>{tag}<button type="button" aria-label={`Remove ${tag}`} onClick={() => setTags((current) => current.filter((_, i) => i !== index))}><X size={13} /></button></span>)}
        <input value={tagDraft} aria-label="Add a tag" placeholder="Type a tag and press Enter" onChange={(e) => setTagDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
        <SolidButton type="button" variant="secondary" size="small" onClick={addTag}><Plus size={14} /> Add</SolidButton>
      </div><small>Tags are saved as a JSON array.</small></div>
    </div> },
    { value: "tool", label: "Tool", content: <div className="agent-tool-editor__tool">
      <section className="agent-tool-editor__panel">
        <header><h2>Tool source code</h2><p>Write the tool implementation in Python.</p></header>
        <SolidCodeEditor value={sourceCode} onChange={(value) => setSourceCode(value ?? "")} language="python" height="100%" className="agent-tool-editor__code" />
      </section>
      <section className="agent-tool-editor__panel">
        <header><h2>Agent interface preview</h2><p>Embedded SolidX Agent chat.</p></header>
        <div className="agent-tool-editor__chat"><SolidAgentEmbedded /></div>
      </section>
    </div> },
    { value: "agents", label: "Agents", content: <section className="agent-tool-editor__agents"><div><h2>Associated agents</h2><p>Agents linked to this tool. Associations are read-only here.</p></div>
      {isLoading ? <p>Loading associated agents…</p> : agents.length ? <div className="agent-tool-editor__agent-grid">{agents.map((agent, index) => <article className="agent-tool-editor__agent-card" key={String(agent.id ?? agent.name ?? index)}><span>{(agent.name ?? agent.title ?? "A").slice(0, 1).toUpperCase()}</span><strong>{agent.name ?? agent.title ?? "Unnamed agent"}</strong></article>)}</div> : <div className="agent-tool-editor__empty">No agents are currently associated with this tool.</div>}
    </section> },
  ];

  return <main className="agent-tool-editor">
    <header className="agent-tool-editor__header"><div><p>Agent Hub / Tool Registry</p><h1>{record ? "Edit Tool" : "Create Tool"}</h1></div><div className="agent-tool-editor__actions">
      <SolidButton variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</SolidButton>
      <SolidButton loading={isCreating || isSaving} onClick={save}>Save Tool</SolidButton>
    </div></header>
    {isLoading ? <div className="agent-tool-editor__loading">Loading tool…</div> : <SolidTabGroup tabs={tabs} value={activeTab} onValueChange={setActiveTab} className="agent-tool-editor__tabs" listClassName="agent-tool-editor__tab-list" panelClassName="agent-tool-editor__tab-panel" />}
  </main>;
}
