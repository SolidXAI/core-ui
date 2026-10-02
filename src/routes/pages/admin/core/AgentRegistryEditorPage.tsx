import React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronDown, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { useGetSolidSettingsQuery } from "../../../../redux/api/solidSettingsApi";
import { getSettingsMap } from "../../../../helpers/settingsPayload";
import { showToast } from "../../../../redux/features/toastSlice";
import { AgentRegistryAuditPanel } from "./AgentRegistryAuditPanel";
import { AgentRegistryCardWidget } from "../../../../components/core/extension/solid-core/agentRegistry/card/AgentRegistryCardWidget";
import type { SolidKanbanCardWidgetProps } from "../../../../types/solid-core";
import { SolidWorkflowStatusPill } from "../../../../components/core/form/SolidDraftPublishWorkflow";
import { ALLOWED_MODELS_BY_PROVIDER, type AllowedModelProvider } from "../../../../constants/allowed-ai-models";
import { SolidButton, SolidCodeEditor, SolidIconPicker, SolidInput, SolidTabGroup } from "../../../../components/shad-cn-ui";
import "./AgentRegistryEditorPage.css";

type Item = { id: number; name?: string; title?: string; displayName?: string; description?: string; iconName?: string; key?: string; module?: { id?: number; displayName?: string }; [key: string]: any };
type Link = { id: number; agentSkillRegistry?: Item; agentToolRegistry?: Item; roleMetadata?: Item; secret?: Item; envVarName?: string; alwaysInclude?: boolean; requiresApproval?: boolean };
type Input = { name: string; description: string; dataType: string };
type Agent = Item & {
  systemPrompt?: string; requiredInputs?: string; reasoningModelKey?: string; fastModelKey?: string; status?: string;
  stepLimit?: number; turnStepLimit?: number; costLimit?: number;
  agentSkills?: Link[]; agentTools?: Link[]; agentRoles?: Link[]; agentSecrets?: Link[];
  agentProcesses?: Item[]; agentSessions?: Item[]; agentJobs?: Item[];
};
type ProviderModelOption = { provider: AllowedModelProvider; model: string; value: string };

const PROVIDER_LABELS: Record<AllowedModelProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  openrouter: "OpenRouter",
};

function ModelPicker({ value, options, placeholder, onChange }: {
  value: string;
  options: ProviderModelOption[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({});
  const selected = options.find((option) => option.value === value);
  const filtered = options.filter((option) =>
    `${PROVIDER_LABELS[option.provider]} ${option.model}`.toLowerCase().includes(query.trim().toLowerCase()));
  const groups = (Object.keys(ALLOWED_MODELS_BY_PROVIDER) as AllowedModelProvider[])
    .map((provider) => ({ provider, options: filtered.filter((option) => option.provider === provider) }))
    .filter((group) => group.options.length > 0);

  React.useEffect(() => {
    if (!open) return;
    const positionMenu = () => {
      const bounds = rootRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const gap = 6;
      const maxMenuHeight = Math.min(288, window.innerHeight - 24);
      const spaceBelow = window.innerHeight - bounds.bottom - gap - 12;
      const spaceAbove = bounds.top - gap - 12;
      const openAbove = spaceBelow < Math.min(220, maxMenuHeight) && spaceAbove > spaceBelow;
      const availableHeight = Math.max(120, Math.min(maxMenuHeight, openAbove ? spaceAbove : spaceBelow));
      setMenuStyle({
        position: "fixed",
        left: bounds.left,
        width: bounds.width,
        maxHeight: availableHeight,
        ...(openAbove
          ? { bottom: window.innerHeight - bounds.top + gap }
          : { top: bounds.bottom + gap }),
      });
    };
    positionMenu();
    window.addEventListener("resize", positionMenu);
    window.addEventListener("scroll", positionMenu, true);
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.removeEventListener("resize", positionMenu);
      window.removeEventListener("scroll", positionMenu, true);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const choose = (option: ProviderModelOption) => {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  };
  let flatIndex = -1;

  return <div className="agent-editor__model-picker" ref={rootRef}>
    <div className="agent-editor__model-control">
      <input
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-label={placeholder}
        placeholder={selected ? `${PROVIDER_LABELS[selected.provider]} / ${selected.model}` : value || placeholder}
        value={open ? query : ""}
        onFocus={() => { setQuery(""); setActiveIndex(0); setOpen(true); }}
        onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); setQuery(""); }
          if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, filtered.length - 1)); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
          if (event.key === "Enter" && open && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex]); }
        }}
      />
      <button type="button" aria-label={open ? "Close model options" : "Show model options"} onMouseDown={(event) => event.preventDefault()} onClick={() => { setOpen((current) => !current); setQuery(""); }}><ChevronDown size={16} /></button>
    </div>
    {open && createPortal(<div ref={menuRef} className="agent-editor__model-menu" style={menuStyle} role="listbox">
      {!groups.length ? <div className="agent-editor__model-empty">{options.length ? "No matching models." : "No enabled providers. Add an API key in AI Settings."}</div>
        : groups.map((group) => <section className="agent-editor__model-group" key={group.provider}>
          <h3>{PROVIDER_LABELS[group.provider]}</h3>
          {group.options.map((option) => {
            flatIndex += 1;
            const index = flatIndex;
            return <button type="button" role="option" aria-selected={option.value === value} className={`agent-editor__model-option${index === activeIndex ? " is-active" : ""}`}
              key={option.value} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(option)}>
              <span>{option.model}</span><small>{option.provider}:{option.model}</small>
            </button>;
          })}
        </section>)}
    </div>, document.body)}
  </div>;
}

const entityApi = createSolidEntityApi("agentRegistry");
const skillApi = createSolidEntityApi("agentSkillRegistry");
const toolApi = createSolidEntityApi("agentToolRegistry");
const roleApi = createSolidEntityApi("roleMetadata");
const secretApi = createSolidEntityApi("secret");
const agentSkillApi = createSolidEntityApi("agentSkill");
const agentToolApi = createSolidEntityApi("agentTool");
const agentRoleApi = createSolidEntityApi("agentRole");
const agentSecretApi = createSolidEntityApi("agentSecret");

const populate = [
  "agentSkills", "agentSkills.agentSkillRegistry", "agentTools", "agentTools.agentToolRegistry",
  "agentRoles", "agentRoles.roleMetadata", "agentSecrets", "agentSecrets.secret",
  "agentProcesses", "agentSessions", "agentJobs",
].map((name, index) => `populate[${index}]=${name}`).join("&");

function recordFrom(value: any): any {
  let result = value;
  for (let i = 0; i < 3 && result && typeof result === "object"; i += 1) {
    if ("id" in result || "name" in result) return result;
    result = result.data;
  }
  return undefined;
}

function items(value: any): any[] { return Array.isArray(value) ? value : value ? [value] : []; }

function parseInputs(value: unknown): Input[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed.map((input) => ({
      name: String(input.name ?? ""), description: String(input.description ?? ""),
      dataType: String(input.dataType ?? input.type ?? "string"),
    }));
    // Existing agent definitions may use a name-keyed object.
    if (parsed && typeof parsed === "object") return Object.entries(parsed).map(([name, definition]: [string, any]) => ({
      name, description: String(definition?.description ?? ""),
      dataType: String(definition?.dataType ?? definition?.type ?? "string"),
    }));
  } catch { /* Keep malformed historical values from crashing the editor. */ }
  return [];
}

function apiError(error: any): string {
  const value = error?.data?.data?.message ?? error?.data?.message ?? error?.message;
  return Array.isArray(value) ? value.join("; ") : typeof value === "string" ? value : "The save failed.";
}

function useCatalog(api: typeof skillApi, query = "offset=0&limit=1000") {
  const { data, isLoading, refetch } = api.useGetSolidEntitiesQuery(query);
  return { records: items(data?.records) as Item[], isLoading, refetch };
}

function LinkPicker({ label, description, options, selected, onAdd, onRemove, createUrl, render }: {
  label: string; description: string; options: Item[]; selected: Item[];
  onAdd: (id: number) => void; onRemove: (id: number) => void; createUrl?: string;
  render: (item: Item) => React.ReactNode;
}) {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const available = options.filter((item) => !selected.some((selectedItem) => selectedItem.id === item.id)
    && `${item.name ?? item.displayName ?? item.key ?? ""} ${item.description ?? ""}`.toLowerCase().includes(search.toLowerCase())).slice(0, 20);
  return <section className="agent-editor__section">
    <div className="agent-editor__section-head"><div><h2>{label}</h2><p>{description}</p></div>
      {createUrl && <a href={createUrl} target="_blank" rel="noopener noreferrer" className="agent-editor__new-link">Create {label === "Skills" ? "skill" : "tool"} <ExternalLink size={14} /></a>}
    </div>
    <div className="agent-editor__picker">
      <SolidInput value={search} placeholder={`Search and add ${label.toLowerCase()}…`} aria-label={`Search ${label.toLowerCase()}`}
        onFocus={() => setOpen(true)} onChange={(event) => { setSearch(event.target.value); setOpen(true); }} />
      {open && <div className="agent-editor__picker-results">
        {available.length ? available.map((item) => <button type="button" key={item.id} onClick={() => { onAdd(item.id); setSearch(""); setOpen(false); }}>
          <strong>{item.name ?? item.displayName ?? item.key}</strong><span>{item.description}</span>
        </button>) : <p>No available {label.toLowerCase()} found.</p>}
      </div>}
    </div>
    {selected.length ? <div className="agent-editor__cards">{selected.map((item) => <div className="agent-editor__linked-card" key={item.id}>
      <div className="agent-editor__card-content">{render(item)}</div>
      <button type="button" aria-label={`Remove ${item.name ?? item.displayName ?? item.key}`} onClick={() => onRemove(item.id)}><Trash2 size={16} /></button>
    </div>)}</div> : <div className="agent-editor__empty">No {label.toLowerCase()} linked yet.</div>}
  </section>;
}

export function AgentRegistryEditorPage() {
  const { id = "new" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: response, isLoading, isError, refetch } = entityApi.useGetSolidEntityByIdQuery({ id, qs: populate }, { skip: id === "new" });
  const { data: settings, isError: settingsError } = useGetSolidSettingsQuery(undefined);
  const skills = useCatalog(skillApi);
  const tools = useCatalog(toolApi);
  const roles = useCatalog(roleApi, "offset=0&limit=1000&populate[0]=module");
  const secrets = useCatalog(secretApi, "offset=0&limit=1000&fields[0]=id&fields[1]=key&fields[2]=displayName&fields[3]=description");
  const [createAgent, { isLoading: creating }] = entityApi.useCreateSolidEntityMutation();
  const [updateAgent, { isLoading: updating }] = entityApi.useUpdateSolidEntityMutation();
  const [createSkillLink] = agentSkillApi.useCreateSolidEntityMutation();
  const [deleteSkillLink] = agentSkillApi.useDeleteSolidEntityMutation();
  const [createToolLink] = agentToolApi.useCreateSolidEntityMutation();
  const [deleteToolLink] = agentToolApi.useDeleteSolidEntityMutation();
  const [createRoleLink] = agentRoleApi.useCreateSolidEntityMutation();
  const [deleteRoleLink] = agentRoleApi.useDeleteSolidEntityMutation();
  const [createSecretLink] = agentSecretApi.useCreateSolidEntityMutation();
  const [deleteSecretLink] = agentSecretApi.useDeleteSolidEntityMutation();
  const record = recordFrom(response) as Agent | undefined;
  const [tab, setTab] = React.useState("basics");
  const [name, setName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [iconName, setIconName] = React.useState("");
  const [inputs, setInputs] = React.useState<Input[]>([]);
  const [reasoningModelKey, setReasoningModelKey] = React.useState("");
  const [fastModelKey, setFastModelKey] = React.useState("");
  const [systemPrompt, setSystemPrompt] = React.useState("");
  const [stepLimit, setStepLimit] = React.useState(100);
  const [turnStepLimit, setTurnStepLimit] = React.useState(20);
  const [costLimit, setCostLimit] = React.useState(3);
  const [skillIds, setSkillIds] = React.useState<number[]>([]);
  const [toolIds, setToolIds] = React.useState<number[]>([]);
  const [roleIds, setRoleIds] = React.useState<number[]>([]);
  const [secretIds, setSecretIds] = React.useState<number[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [auditVersion, setAuditVersion] = React.useState(0);

  React.useEffect(() => {
    if (!record) return;
    setName(record.name ?? ""); setTitle(record.title ?? ""); setDescription(record.description ?? "");
    setIconName(record.iconName ?? ""); setInputs(parseInputs(record.requiredInputs));
    setReasoningModelKey(record.reasoningModelKey ?? ""); setFastModelKey(record.fastModelKey ?? "");
    setSystemPrompt(record.systemPrompt ?? ""); setStepLimit(record.stepLimit ?? 100);
    setTurnStepLimit(record.turnStepLimit ?? 20); setCostLimit(Number(record.costLimit ?? 3));
    setSkillIds(items(record.agentSkills).map((link) => link.agentSkillRegistry?.id).filter(Boolean));
    setToolIds(items(record.agentTools).map((link) => link.agentToolRegistry?.id).filter(Boolean));
    setRoleIds(items(record.agentRoles).map((link) => link.roleMetadata?.id).filter(Boolean));
    setSecretIds(items(record.agentSecrets).map((link) => link.secret?.id).filter(Boolean));
  }, [record?.id, response]);

  React.useEffect(() => {
    const refresh = () => { skills.refetch(); tools.refetch(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [skills.refetch, tools.refetch]);

  const configValue = getSettingsMap(settings).solidXGenAiCodeBuilderConfig;
  let enabledProviders: Record<string, { apiKey?: unknown }> = {};
  try {
    const config = typeof configValue === "string" ? JSON.parse(configValue) : configValue;
    enabledProviders = config?.providers ?? {};
  } catch { /* Invalid configuration has no enabled providers. */ }
  const modelOptions = (Object.keys(ALLOWED_MODELS_BY_PROVIDER) as AllowedModelProvider[])
    .filter((provider) => typeof enabledProviders[provider]?.apiKey === "string" && (enabledProviders[provider].apiKey as string).trim().length > 0)
    .flatMap((provider) => ALLOWED_MODELS_BY_PROVIDER[provider].map((model) => ({
      provider,
      model,
      value: `${provider}:${model}`,
    })));
  const toggle = (setter: React.Dispatch<React.SetStateAction<number[]>>, value: number) =>
    setter((current) => current.includes(value) ? current.filter((id) => id !== value) : [...current, value]);

  const syncLinks = async (agentId: number, previous: Link[] | undefined, selected: number[], field: string,
    create: any, remove: any, extra: Record<string, unknown> = {}) => {
    const links = items(previous) as Link[];
    const oldIds = links.map((link) => (link as any)[field]?.id).filter(Boolean);
    for (const link of links) {
      if (!selected.includes((link as any)[field]?.id)) await remove(link.id).unwrap();
    }
    for (const targetId of selected) {
      if (!oldIds.includes(targetId)) await create({ agentRegistryId: agentId, [`${field}Id`]: targetId, ...extra }).unwrap();
    }
  };

  const save = async () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Name is required.";
    if (!title.trim()) next.title = "Title is required.";
    if (!systemPrompt.trim()) next.systemPrompt = "Persona instructions are required.";
    if (!modelOptions.some((option) => option.value === reasoningModelKey)) next.reasoningModelKey = "Choose an enabled reasoning provider and model.";
    if (!modelOptions.some((option) => option.value === fastModelKey)) next.fastModelKey = "Choose an enabled fast provider and model.";
    if (inputs.some((input) => !input.name.trim() || !input.dataType)) next.inputs = "Each input needs a name and data type.";
    if (new Set(inputs.map((input) => input.name.trim().toLowerCase())).size !== inputs.length) next.inputs = "Input names must be unique.";
    if (stepLimit < 1 || turnStepLimit < 1 || costLimit < 0) next.limits = "Step limits must be positive and cost limit cannot be negative.";
    setErrors(next);
    if (Object.keys(next).length) {
      setTab(next.systemPrompt ? "persona" : next.limits ? "policies" : "basics");
      dispatch(showToast({ severity: "error", summary: "Missing information", detail: Object.values(next).join(" ") }));
      return;
    }
    const payload = {
      name: name.trim(), title: title.trim(), description: description.trim(), iconName,
      requiredInputs: JSON.stringify(inputs.map((input) => ({ ...input, name: input.name.trim(), description: input.description.trim() }))),
      reasoningModelKey, fastModelKey, systemPrompt, stepLimit: Number(stepLimit),
      turnStepLimit: Number(turnStepLimit), costLimit: Number(costLimit),
      ...(!record?.id ? { status: "draft", configVersion: 1 } : {}),
    };
    let newlyCreatedId: number | undefined;
    let scalarSaved = false;
    try {
      const result = record?.id ? await updateAgent({ id: record.id, data: payload }).unwrap() : await createAgent(payload).unwrap();
      scalarSaved = true;
      const savedId = Number(record?.id ?? recordFrom(result)?.id);
      if (!savedId) throw new Error("Agent saved, but its ID was not returned.");
      if (!record?.id) newlyCreatedId = savedId;
      await syncLinks(savedId, record?.agentSkills, skillIds, "agentSkillRegistry", createSkillLink, deleteSkillLink, { alwaysInclude: true });
      await syncLinks(savedId, record?.agentTools, toolIds, "agentToolRegistry", createToolLink, deleteToolLink, { requiresApproval: false });
      await syncLinks(savedId, record?.agentRoles, roleIds, "roleMetadata", createRoleLink, deleteRoleLink);
      await syncLinks(savedId, record?.agentSecrets, secretIds, "secret", createSecretLink, deleteSecretLink);
      dispatch(showToast({ severity: "success", summary: "Saved", detail: "Agent and its associations saved." }));
      setAuditVersion((version) => version + 1);
      if (record?.id) refetch();
      else navigate(`/admin/core/solid-core/agent-registry/editor/${savedId}`, { replace: true });
    } catch (error) {
      dispatch(showToast({ severity: "error", summary: scalarSaved ? "Agent saved; links incomplete" : "Save failed", detail: apiError(error) }));
      if (record?.id) refetch();
      else if (newlyCreatedId) navigate(`/admin/core/solid-core/agent-registry/editor/${newlyCreatedId}`, { replace: true });
    }
  };

  const field = (label: string, value: string, setValue: (value: string) => void, key: string, required = false) =>
    <label className="agent-editor__field"><span>{label}{required && " *"}</span>
      <SolidInput value={value} aria-invalid={Boolean(errors[key])} onChange={(event) => { setValue(event.target.value); setErrors((current) => ({ ...current, [key]: "" })); }} />
      {errors[key] && <small className="agent-editor__error">{errors[key]}</small>}
    </label>;
  const linked = (ids: number[], catalog: Item[], fallback: Item[] = []) =>
    ids.map((id) => catalog.find((item) => item.id === id) ?? fallback.find((item) => item.id === id)).filter((item): item is Item => Boolean(item));
  const groups = roles.records.reduce((acc, role) => {
    const key = role.module?.displayName ?? "Default"; (acc[key] ??= []).push(role); return acc;
  }, {} as Record<string, Item[]>);
  const tabs = [
    { value: "basics", label: "Basics", content: <div className="agent-editor__stack">
      <div className="agent-editor__grid">{field("Name", name, setName, "name", true)}{field("Title", title, setTitle, "title", true)}
        {field("Description", description, setDescription, "description")}<div className="agent-editor__field"><span>Icon</span><SolidIconPicker value={iconName} onChange={setIconName} /></div>
      </div>
      <section className="agent-editor__section"><div className="agent-editor__section-head"><div><h2>Required inputs</h2><p>Define the variables people must provide when starting this agent.</p></div>
        {inputs.length > 0 && <SolidButton type="button" variant="secondary" size="small" onClick={() => setInputs((current) => [...current, { name: "", description: "", dataType: "string" }])}><Plus size={15} /> Add input</SolidButton>}
      </div>
      {!inputs.length ? <div className="agent-editor__empty">This agent has no required inputs. <button type="button" onClick={() => setInputs([{ name: "", description: "", dataType: "string" }])}><Plus size={15} /> Add an input variable</button></div>
        : <div className="agent-editor__inputs">{inputs.map((input, index) => <div className="agent-editor__input-row" key={index}>
          <SolidInput aria-label={`Input ${index + 1} name`} placeholder="Variable name" value={input.name} onChange={(event) => setInputs((current) => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} />
          <SolidInput aria-label={`Input ${index + 1} description`} placeholder="Description" value={input.description} onChange={(event) => setInputs((current) => current.map((item, i) => i === index ? { ...item, description: event.target.value } : item))} />
          <select aria-label={`Input ${index + 1} data type`} value={input.dataType} onChange={(event) => setInputs((current) => current.map((item, i) => i === index ? { ...item, dataType: event.target.value } : item))}>
            {["string", "number", "integer", "boolean", "date", "datetime", "object", "array"].map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <button type="button" aria-label={`Remove input ${index + 1}`} onClick={() => setInputs((current) => current.filter((_, i) => i !== index))}><Trash2 size={17} /></button>
        </div>)}</div>}
      {errors.inputs && <small className="agent-editor__error">{errors.inputs}</small>}</section>
      <section className="agent-editor__section"><h2>Models</h2><p>Choose any configured provider and model pair for each role. Both lists use the models enabled in AI settings.</p><div className="agent-editor__grid">
        {([["Reasoning model", reasoningModelKey, setReasoningModelKey, "reasoningModelKey"], ["Fast model", fastModelKey, setFastModelKey, "fastModelKey"]] as const).map(([label, value, setter, key]) =>
          <label className="agent-editor__field" key={key}><span>{label} *</span><ModelPicker value={value} options={modelOptions} placeholder="Search providers and models…" onChange={(next) => setter(next)} />
            {errors[key] && <small className="agent-editor__error">{errors[key]}</small>}</label>)}
      </div>{settingsError ? <p className="agent-editor__hint">Settings could not be loaded. Try refreshing this page.</p>
        : !modelOptions.length && <p className="agent-editor__hint">No configured models are available. Check the AI settings and your permission to view encrypted settings.</p>}</section>
      <div className="agent-editor__field"><span>Status</span><SolidWorkflowStatusPill label={record?.status ?? "draft"} /><small>Read only. Status is managed by the agent workflow.</small></div>
    </div> },
    { value: "persona", label: "Persona", content: <section className="agent-editor__section agent-editor__persona"><div className="agent-editor__section-head"><div><h2>System prompt *</h2><p>Describe the agent's role, behavior, and instructions in Markdown.</p></div></div>
      <SolidCodeEditor value={systemPrompt} onChange={(value) => { setSystemPrompt(value ?? ""); setErrors((current) => ({ ...current, systemPrompt: "" })); }} language="markdown" height="max(34rem, calc(100dvh - 18rem))" />
      {errors.systemPrompt && <small className="agent-editor__error">{errors.systemPrompt}</small>}</section> },
    { value: "skills", label: "Skills", content: <LinkPicker label="Skills" description="Skills available to this agent." options={skills.records} selected={linked(skillIds, skills.records, items(record?.agentSkills).map((link) => link.agentSkillRegistry).filter(Boolean))}
      onAdd={(id) => toggle(setSkillIds, id)} onRemove={(id) => toggle(setSkillIds, id)} createUrl="/admin/core/solid-core/agent-skill-registry/editor/new"
      render={(item) => <AgentRegistryCardWidget {...({ rowData: item } as SolidKanbanCardWidgetProps)} />} /> },
    { value: "tools", label: "Tools", content: <LinkPicker label="Tools" description="Tools available to this agent." options={tools.records} selected={linked(toolIds, tools.records, items(record?.agentTools).map((link) => link.agentToolRegistry).filter(Boolean))}
      onAdd={(id) => toggle(setToolIds, id)} onRemove={(id) => toggle(setToolIds, id)} createUrl="/admin/core/solid-core/agent-tool-registry/editor/new"
      render={(item) => <AgentRegistryCardWidget {...({ rowData: item } as SolidKanbanCardWidgetProps)} />} /> },
    { value: "policies", label: "Policies", content: <div className="agent-editor__stack"><section className="agent-editor__section"><h2>Roles</h2><p>Grant the agent the roles it may use.</p>
      {Object.entries(groups).map(([groupName, groupRoles]) => <fieldset className="agent-editor__role-group" key={groupName}><legend>{groupName}</legend>
        {(groupRoles ?? []).map((role) => <label key={role.id}><input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => toggle(setRoleIds, role.id)} /> {role.name}</label>)}
      </fieldset>)}{!roles.records.length && <div className="agent-editor__empty">No roles available.</div>}</section>
      <section className="agent-editor__section"><h2>Execution limits</h2><div className="agent-editor__grid">
        {[["Step limit", stepLimit, setStepLimit], ["Turn step limit", turnStepLimit, setTurnStepLimit], ["Cost limit", costLimit, setCostLimit]].map(([label, value, setter]) =>
          <label className="agent-editor__field" key={label as string}><span>{label as string}</span><input type="number" min={label === "Cost limit" ? 0 : 1} step={label === "Cost limit" ? 0.01 : 1} value={value as number} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} /></label>)}
      </div>{errors.limits && <small className="agent-editor__error">{errors.limits}</small>}</section></div> },
    { value: "secrets", label: "Secrets", content: <LinkPicker label="Secrets" description="Grant access to existing secrets. Secret values are never shown here." options={secrets.records} selected={linked(secretIds, secrets.records, items(record?.agentSecrets).map((link) => link.secret).filter(Boolean))}
      onAdd={(id) => toggle(setSecretIds, id)} onRemove={(id) => toggle(setSecretIds, id)}
      render={(item) => <div className="agent-editor__secret"><strong>{item.displayName ?? item.key}</strong><span>{item.key}</span><p>{item.description}</p></div>} /> },
    ...((record?.id ? [
      ["processes", "Processes", record.agentProcesses], ["sessions", "Sessions", record.agentSessions], ["jobs", "Jobs", record.agentJobs],
    ] : []) as [string, string, Item[]][]).map(([value, label, related]) => ({ value, label, content: <section className="agent-editor__section"><h2>{label}</h2>
      {items(related).length ? <div className="agent-editor__related">{items(related).map((item) => <article key={item.id}><strong>{item.name ?? item.title ?? `#${item.id}`}</strong><span>{item.status ?? ""}</span></article>)}</div>
        : <div className="agent-editor__empty">No {label.toLowerCase()} for this agent yet.</div>}</section> })),
  ];
  const content = <SolidTabGroup tabs={tabs} value={tab} onValueChange={setTab} className="agent-editor__tabs" listClassName="agent-editor__tab-list" panelClassName="agent-editor__tab-panel" />;
  return <main className="agent-editor"><header className="agent-editor__header"><div><p>Agent Hub / Agent Registry</p><h1>{record?.id ? "Edit Agent" : "Create Agent"}</h1></div><div className="agent-editor__actions">
    <SolidButton variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</SolidButton>
    <SolidButton loading={creating || updating} disabled={isLoading || isError || (id !== "new" && !record?.id)} onClick={save}>Save Agent</SolidButton>
  </div></header>{isLoading ? <div className="agent-editor__empty">Loading agent…</div> : isError || (id !== "new" && !record?.id) ?
    <div className="agent-editor__empty">This agent could not be loaded.</div> : record?.id ?
    <AgentRegistryAuditPanel modelSingularName="agentRegistry" recordId={record.id} refreshVersion={auditVersion} modelUserKey={record.name}>{content}</AgentRegistryAuditPanel> : content}</main>;
}
