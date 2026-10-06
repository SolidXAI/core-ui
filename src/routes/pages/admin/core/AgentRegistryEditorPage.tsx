import React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronDown, ExternalLink, FlaskConical, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { useGetSolidSettingsQuery } from "../../../../redux/api/solidSettingsApi";
import { getSettingsMap } from "../../../../helpers/settingsPayload";
import { showToast } from "../../../../redux/features/toastSlice";
import { AgentRegistryAuditPanel } from "./AgentRegistryAuditPanel";
import { AgentResourceCardWidget } from "../../../../components/core/extension/solid-core/agentRegistry/card/AgentResourceCardWidget";
import { AgentSessionsPanel } from "../../../../components/core/extension/solid-core/agentToolRegistry/AgentToolSessionsPanel";
import { AgentProcessesPanel } from "../../../../components/core/extension/solid-core/agentToolRegistry/AgentProcessesPanel";
import type { SolidKanbanCardWidgetProps } from "../../../../types/solid-core";
import { SolidWorkflowStatusPill } from "../../../../components/core/form/SolidDraftPublishWorkflow";
import { ALLOWED_MODELS_BY_PROVIDER, type AllowedModelProvider } from "../../../../constants/allowed-ai-models";
import { SolidButton, SolidCodeEditor, SolidDialog, SolidDialogBody, SolidIconPicker, SolidInput, SolidTabGroup } from "../../../../components/shad-cn-ui";
import { SolidAgentEmbedded } from "../../../../components/core/solid-agent/SolidAgentEmbedded";
import { AgentEmbeddingPanel } from "../../../../components/core/solid-agent/embed/AgentEmbeddingPanel";
import "./AgentRegistryEditorPage.css";

type Item = { id: number; name?: string; title?: string; displayName?: string; description?: string; iconName?: string; key?: string; module?: { id?: number; displayName?: string }; [key: string]: any };
type Link = { id: number; agentSkillRegistry?: Item; agentToolRegistry?: Item; roleMetadata?: Item; secret?: Item; envVarName?: string; alwaysInclude?: boolean; requiresApproval?: boolean };
type Input = { name: string; description: string; dataType: string };
type Agent = Item & {
  configVersion?: number;
  systemPrompt?: string; requiredInputs?: string; reasoningModelKey?: string; fastModelKey?: string; status?: string;
  stepLimit?: number; turnStepLimit?: number; costLimit?: number;
  agentSkills?: Link[]; agentTools?: Link[]; agentRoles?: Link[]; agentSecrets?: Link[];
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
const jobApi = createSolidEntityApi("agentJob");

const skillFields = ["id", "name", "iconName", "description", "tags"];
const toolFields = [...skillFields, "type", "status", "lastLoadError"];

function fieldsQuery(fields: string[]): string {
  return fields.map((name) => `fields=${encodeURIComponent(name)}`).join("&");
}

const detailFields = [
  "id", "name", "title", "description", "iconName", "systemPrompt", "requiredInputs",
  "reasoningModelKey", "fastModelKey", "status", "stepLimit", "turnStepLimit", "costLimit", "configVersion",
];

const detailQuery = [
  "agentRoles", "agentRoles.roleMetadata", "agentSecrets", "agentSecrets.secret",
].map((name, index) => `populate[${index}]=${name}`).join("&") + "&" + fieldsQuery(detailFields);

// Group by link ID to project summary columns without populating full registry records.
function resourceLinksQuery(id: string, relation: string, registry: string, setting: string, fields: string[]): string {
  return [
    `filters[id][$eq]=${encodeURIComponent(id)}`,
    `groupBy[0]=${relation}.id`, `groupBy[1]=${relation}.${setting}`,
    ...fields.map((field, index) => `aggregates[${index}]=${relation}.${registry}.${field}:max`),
  ].join("&");
}

function resourceLinksFrom(result: any, relation: string, registry: string, setting: string, fields: string[]): Link[] {
  return items(result?.groupMeta).flatMap((group) => {
    const [linkId, enabled] = String(group.groupValue ?? "").split("_");
    const resource = Object.fromEntries(fields.map((field) => [field, group[`${relation}_${registry}_${field}_max`]]));
    if (!Number(linkId) || !Number(resource.id)) return [];
    return [{ id: Number(linkId), [registry]: { ...resource, id: Number(resource.id) }, [setting]: enabled === "true" || enabled === "1" }];
  });
}

function recordFrom(value: any): any {
  let result = value;
  for (let i = 0; i < 3 && result && typeof result === "object"; i += 1) {
    if ("id" in result || "name" in result) return result;
    result = result.data;
  }
  return undefined;
}

function items(value: any): any[] { return Array.isArray(value) ? value : value ? [value] : []; }

function agentFormFromRecord(record: Agent) {
  const skills = items(record.agentSkills);
  const tools = items(record.agentTools);
  const secrets = items(record.agentSecrets);
  return {
    name: record.name ?? "", title: record.title ?? "", description: record.description ?? "", iconName: record.iconName ?? "",
    inputs: parseInputs(record.requiredInputs), reasoningModelKey: record.reasoningModelKey ?? "", fastModelKey: record.fastModelKey ?? "",
    systemPrompt: record.systemPrompt ?? "", stepLimit: record.stepLimit ?? 100, turnStepLimit: record.turnStepLimit ?? 20,
    costLimit: Number(record.costLimit ?? 3), skillIds: skills.map((link) => link.agentSkillRegistry?.id).filter(Boolean),
    toolIds: tools.map((link) => link.agentToolRegistry?.id).filter(Boolean),
    roleIds: items(record.agentRoles).map((link) => link.roleMetadata?.id).filter(Boolean),
    secretIds: secrets.map((link) => link.secret?.id).filter(Boolean),
    alwaysIncludeValues: Object.fromEntries(skills.map((link) => [link.agentSkillRegistry?.id, link.alwaysInclude !== false]).filter(([key]) => key)),
    requiresApprovalValues: Object.fromEntries(tools.map((link) => [link.agentToolRegistry?.id, link.requiresApproval === true]).filter(([key]) => key)),
    secretEnvVarNames: Object.fromEntries(secrets.map((link) => [link.secret?.id, link.envVarName ?? link.secret?.key ?? link.secret?.name ?? ""]).filter(([key]) => key)),
  };
}

function parseInputs(value: unknown): Input[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(parsed)) return parsed.map((input) => ({
      name: String(input.name ?? input.variableName ?? ""), description: String(input.description ?? ""),
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

function LinkPicker({ label, description, options, selected, onAdd, onRemove, createUrl, render, renderSettings, linkFor }: {
  label: string; description: string; options: Item[]; selected: Item[];
  onAdd: (id: number) => void; onRemove: (id: number) => void; createUrl?: string;
  render: (item: Item, link?: Link) => React.ReactNode;
  renderSettings?: (item: Item, link?: Link) => React.ReactNode;
  linkFor?: (id: number) => Link | undefined;
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
      <div className="agent-editor__card-content">{render(item, linkFor?.(item.id))}</div>
      {renderSettings?.(item, linkFor?.(item.id))}
      <button type="button" aria-label={`Remove ${item.name ?? item.displayName ?? item.key}`} onClick={() => onRemove(item.id)}><Trash2 size={16} /></button>
    </div>)}</div> : <div className="agent-editor__empty">No {label.toLowerCase()} linked yet.</div>}
  </section>;
}

export function AgentRegistryEditorPage() {
  const { id = "new" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const agentResult = entityApi.useGetSolidEntityByIdQuery({ id, qs: detailQuery }, { skip: id === "new" });
  const skillLinks = entityApi.useGetSolidEntitiesQuery(
    resourceLinksQuery(id, "agentSkills", "agentSkillRegistry", "alwaysInclude", skillFields), { skip: id === "new" });
  const toolLinks = entityApi.useGetSolidEntitiesQuery(
    resourceLinksQuery(id, "agentTools", "agentToolRegistry", "requiresApproval", toolFields), { skip: id === "new" });
  const isLoading = agentResult.isLoading || skillLinks.isLoading || toolLinks.isLoading;
  const isFetching = agentResult.isFetching || skillLinks.isFetching || toolLinks.isFetching;
  const isError = agentResult.isError || skillLinks.isError || toolLinks.isError;
  const response = React.useMemo(() => {
    const agent = recordFrom(agentResult.currentData);
    if (!agent || !skillLinks.currentData || !toolLinks.currentData) return undefined;
    return { ...agent,
      agentSkills: resourceLinksFrom(skillLinks.currentData, "agentSkills", "agentSkillRegistry", "alwaysInclude", skillFields),
      agentTools: resourceLinksFrom(toolLinks.currentData, "agentTools", "agentToolRegistry", "requiresApproval", toolFields),
    };
  }, [agentResult.currentData, skillLinks.currentData, toolLinks.currentData]);
  const { data: settings, isError: settingsError } = useGetSolidSettingsQuery(undefined);
  const skills = useCatalog(skillApi, `offset=0&limit=1000&${fieldsQuery(skillFields)}`);
  const tools = useCatalog(toolApi, `offset=0&limit=1000&${fieldsQuery(toolFields)}`);
  const roles = useCatalog(roleApi, "offset=0&limit=1000&populate[0]=module");
  const secrets = useCatalog(secretApi, "offset=0&limit=1000&fields[0]=id&fields[1]=key&fields[2]=displayName&fields[3]=description");
  const [createAgent, { isLoading: creating }] = entityApi.useCreateSolidEntityMutation();
  const [updateAgent, { isLoading: updating }] = entityApi.useUpdateSolidEntityMutation();
  const [createSkillLink] = agentSkillApi.useCreateSolidEntityMutation();
  const [deleteSkillLink] = agentSkillApi.useDeleteSolidEntityMutation();
  const [updateSkillLink] = agentSkillApi.useUpdateSolidEntityMutation();
  const [createToolLink] = agentToolApi.useCreateSolidEntityMutation();
  const [deleteToolLink] = agentToolApi.useDeleteSolidEntityMutation();
  const [updateToolLink] = agentToolApi.useUpdateSolidEntityMutation();
  const [createRoleLink] = agentRoleApi.useCreateSolidEntityMutation();
  const [deleteRoleLink] = agentRoleApi.useDeleteSolidEntityMutation();
  const [createSecretLink] = agentSecretApi.useCreateSolidEntityMutation();
  const [deleteSecretLink] = agentSecretApi.useDeleteSolidEntityMutation();
  const [updateSecretLink] = agentSecretApi.useUpdateSolidEntityMutation();
  const record = recordFrom(response) as Agent | undefined;
  const [tab, setTab] = React.useState("basics");
  const jobs = jobApi.useGetSolidEntitiesQuery(
    `offset=0&limit=1000&filters[agent][id][$eq]=${encodeURIComponent(id)}&${fieldsQuery(["id", "status"])}`,
    { skip: id === "new" || tab !== "jobs" });
  const refetch = () => {
    void agentResult.refetch(); void skillLinks.refetch(); void toolLinks.refetch();
    if (tab === "jobs") void jobs.refetch();
  };
  const [testAgentOpen, setTestAgentOpen] = React.useState(false);
  const [testAgentWindowMode, setTestAgentWindowMode] = React.useState<"docked" | "maximized">("maximized");
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
  const [alwaysIncludeValues, setAlwaysIncludeValues] = React.useState<Record<number, boolean>>({});
  const [requiresApprovalValues, setRequiresApprovalValues] = React.useState<Record<number, boolean>>({});
  const [secretEnvVarNames, setSecretEnvVarNames] = React.useState<Record<number, string>>({});
  const [pendingSecret, setPendingSecret] = React.useState<Item | null>(null);
  const [secretEnvVarDraft, setSecretEnvVarDraft] = React.useState("");
  const [secretEnvVarError, setSecretEnvVarError] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [auditVersion, setAuditVersion] = React.useState(0);
  const [confirmRefresh, setConfirmRefresh] = React.useState(false);
  const baseline = React.useRef("");

  const currentForm = () => JSON.stringify({ name, title, description, iconName, inputs, reasoningModelKey, fastModelKey, systemPrompt,
    stepLimit: Number(stepLimit), turnStepLimit: Number(turnStepLimit), costLimit: Number(costLimit), skillIds, toolIds, roleIds, secretIds,
    alwaysIncludeValues, requiresApprovalValues, secretEnvVarNames });

  React.useEffect(() => {
    if (!record) return;
    baseline.current = JSON.stringify(agentFormFromRecord(record));
    setName(record.name ?? ""); setTitle(record.title ?? ""); setDescription(record.description ?? "");
    setIconName(record.iconName ?? ""); setInputs(parseInputs(record.requiredInputs));
    setReasoningModelKey(record.reasoningModelKey ?? ""); setFastModelKey(record.fastModelKey ?? "");
    setSystemPrompt(record.systemPrompt ?? ""); setStepLimit(record.stepLimit ?? 100);
    setTurnStepLimit(record.turnStepLimit ?? 20); setCostLimit(Number(record.costLimit ?? 3));
    setSkillIds(items(record.agentSkills).map((link) => link.agentSkillRegistry?.id).filter(Boolean));
    setToolIds(items(record.agentTools).map((link) => link.agentToolRegistry?.id).filter(Boolean));
    setRoleIds(items(record.agentRoles).map((link) => link.roleMetadata?.id).filter(Boolean));
    setSecretIds(items(record.agentSecrets).map((link) => link.secret?.id).filter(Boolean));
    setAlwaysIncludeValues(Object.fromEntries(items(record.agentSkills).map((link) => [link.agentSkillRegistry?.id, link.alwaysInclude !== false]).filter(([key]) => key)));
    setRequiresApprovalValues(Object.fromEntries(items(record.agentTools).map((link) => [link.agentToolRegistry?.id, link.requiresApproval === true]).filter(([key]) => key)));
    setSecretEnvVarNames(Object.fromEntries(items(record.agentSecrets).map((link) => [link.secret?.id, link.envVarName ?? link.secret?.key ?? link.secret?.name ?? ""]).filter(([key]) => key)));
  }, [record?.id, response]);

  const isDirty = Boolean(record?.id) && currentForm() !== baseline.current;
  const requestRefresh = () => isDirty ? setConfirmRefresh(true) : void refetch();
  const openAgentTest = () => {
    setTestAgentWindowMode("maximized");
    setTestAgentOpen(true);
  };

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
    create: any, remove: any, update: any, extra: Record<string, unknown> | ((targetId: number) => Record<string, unknown>) = {}) => {
    const links = items(previous) as Link[];
    const oldIds = links.map((link) => (link as any)[field]?.id).filter(Boolean);
    for (const link of links) {
      if (!selected.includes((link as any)[field]?.id)) await remove(link.id).unwrap();
    }
    for (const targetId of selected) {
      const values = typeof extra === "function" ? extra(targetId) : extra;
      if (!oldIds.includes(targetId)) {
        await create({ agentRegistryId: agentId, [`${field}Id`]: targetId, ...values }).unwrap();
        continue;
      }
      const existing = links.find((link) => (link as any)[field]?.id === targetId);
      if (existing && Object.entries(values).some(([key, value]) => (existing as any)[key] !== value)) {
        await update({ id: existing.id, data: values }).unwrap();
      }
    }
  };

  const save = async (nextStatus?: "draft" | "active" | "disabled") => {
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
      status: nextStatus ?? record?.status ?? "draft",
    };
    let newlyCreatedId: number | undefined;
    let scalarSaved = false;
    try {
      const result = record?.id ? await updateAgent({ id: record.id, data: payload }).unwrap() : await createAgent(payload).unwrap();
      scalarSaved = true;
      const savedId = Number(record?.id ?? recordFrom(result)?.id);
      if (!savedId) throw new Error("Agent saved, but its ID was not returned.");
      if (!record?.id) newlyCreatedId = savedId;
      await syncLinks(savedId, record?.agentSkills, skillIds, "agentSkillRegistry", createSkillLink, deleteSkillLink, updateSkillLink,
        (targetId) => ({ alwaysInclude: alwaysIncludeValues[targetId] ?? true }));
      await syncLinks(savedId, record?.agentTools, toolIds, "agentToolRegistry", createToolLink, deleteToolLink, updateToolLink,
        (targetId) => ({ requiresApproval: requiresApprovalValues[targetId] ?? false }));
      await syncLinks(savedId, record?.agentRoles, roleIds, "roleMetadata", createRoleLink, deleteRoleLink, undefined);
      await syncLinks(savedId, record?.agentSecrets, secretIds, "secret", createSecretLink, deleteSecretLink, updateSecretLink,
        (targetId) => ({ envVarName: secretEnvVarNames[targetId] ?? "" }));
      dispatch(showToast({ severity: "success", summary: nextStatus ? "Agent status updated" : "Saved", detail: nextStatus ? `Agent moved to ${nextStatus}.` : "Agent and its associations saved." }));
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
  const linkForTarget = (links: Link[] | undefined, fieldName: string, targetId: number) =>
    items(links).find((link) => (link as any)[fieldName]?.id === targetId);
  const beginSecretEnvVarEdit = (secret: Item) => {
    setPendingSecret(secret);
    setSecretEnvVarDraft(secretEnvVarNames[secret.id] ?? String(secret.key ?? secret.name ?? secret.displayName ?? ""));
    setSecretEnvVarError("");
  };
  const commitSecretEnvVar = () => {
    const value = secretEnvVarDraft.trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
      setSecretEnvVarError("Use a valid environment variable name (letters, numbers, and underscores; it cannot start with a number).");
      return;
    }
    if (["APP_ENCRYPTION_KEY", "DATABASE_URL", "AGENTHUB_MANAGER_INTERNAL_TOKEN", "AGENTHUB_BRIDGE_PROCESS_KEY"].includes(value)) {
      setSecretEnvVarError("This environment variable name is reserved by AgentHub.");
      return;
    }
    if (secretIds.some((id) => id !== pendingSecret?.id && secretEnvVarNames[id] === value)) {
      setSecretEnvVarError("Each linked secret must use a different environment variable name.");
      return;
    }
    if (pendingSecret) {
      setSecretEnvVarNames((current) => ({ ...current, [pendingSecret.id]: value }));
      setSecretIds((current) => current.includes(pendingSecret.id) ? current : [...current, pendingSecret.id]);
    }
    setPendingSecret(null);
    setSecretEnvVarError("");
  };
  const linkSetting = (label: string, checked: boolean, onChange: (checked: boolean) => void, hint: string) =>
    <label className="agent-editor__link-setting"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><strong>{label}</strong><small>{hint}</small></span></label>;
  const agentStatus = record?.status ?? "draft";
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
      <section className="agent-editor__section agent-editor__workflow" aria-labelledby="agent-lifecycle-title">
        <div className="agent-editor__section-head"><div><h2 id="agent-lifecycle-title">Agent lifecycle</h2><p>Track this agent through its available stages. Select a stage to update its status.</p></div><div className="agent-editor__workflow-meta">{record?.configVersion != null && <span className="agent-editor__config-version" aria-label={`Configuration version ${record.configVersion}`}>Config v{record.configVersion}</span>}<SolidWorkflowStatusPill label={agentStatus} /></div></div>
        <div className="agent-editor__workflow-stages" aria-label={`Current agent stage: ${agentStatus}`}>
          {([[
            "draft", "Draft", "Editable configuration; not available to users."],
            ["active", "Active", "Available to authorized users and the AgentHub runtime."],
            ["disabled", "Disabled", "Unavailable for new interactions."],
          ] as const).map(([value, label, description], index) => <React.Fragment key={value}>
            {index > 0 && <div className="agent-editor__workflow-connector" aria-hidden="true" />}
            <button type="button" className={`agent-editor__workflow-stage${agentStatus === value ? " is-current" : ""}`} aria-current={agentStatus === value ? "step" : undefined}
              aria-pressed={agentStatus === value} disabled={creating || updating || agentStatus === value} onClick={() => void save(value)}>
              <span className="agent-editor__workflow-stage-mark">{index + 1}</span>
              <div className="agent-editor__workflow-stage-copy"><strong>{label}</strong><small>{description}</small><small className="agent-editor__workflow-stage-cta">{agentStatus === value ? "Current stage" : "Click to move to this stage"}</small></div>
              {agentStatus === value && <span className="agent-editor__workflow-current">Current</span>}
            </button>
          </React.Fragment>)}
        </div>
        <small className="agent-editor__workflow-save-hint">Changing stage saves the current form and its linked skills, tools, roles, and secrets.</small>
      </section>
    </div> },
    { value: "persona", label: "Persona", content: <section className="agent-editor__section agent-editor__persona"><div className="agent-editor__section-head"><div><h2>System prompt *</h2><p>Describe the agent's role, behavior, and instructions in Markdown.</p></div></div>
      <SolidCodeEditor value={systemPrompt} onChange={(value) => { setSystemPrompt(value ?? ""); setErrors((current) => ({ ...current, systemPrompt: "" })); }} language="markdown" fontSize={11} height="max(34rem, calc(100dvh - 18rem))" />
      {errors.systemPrompt && <small className="agent-editor__error">{errors.systemPrompt}</small>}</section> },
    { value: "skills", label: "Skills", content: <LinkPicker label="Skills" description="Skills available to this agent." options={skills.records} selected={linked(skillIds, skills.records, items(record?.agentSkills).map((link) => link.agentSkillRegistry).filter(Boolean))}
      onAdd={(id) => toggle(setSkillIds, id)} onRemove={(id) => toggle(setSkillIds, id)} createUrl="/admin/core/solid-core/agent-skill-registry/editor/new"
      linkFor={(id) => linkForTarget(record?.agentSkills, "agentSkillRegistry", id)}
      render={(item) => <AgentResourceCardWidget {...({ rowData: item } as SolidKanbanCardWidgetProps)} />}
      renderSettings={(item) => <div className="agent-editor__link-settings">{linkSetting("Always include", alwaysIncludeValues[item.id] ?? true,
          (checked) => setAlwaysIncludeValues((current) => ({ ...current, [item.id]: checked })), "Add the full skill to the agent prompt. Turn off to load it on demand.")}</div>} /> },
    { value: "tools", label: "Tools", content: <LinkPicker label="Tools" description="Tools available to this agent." options={tools.records} selected={linked(toolIds, tools.records, items(record?.agentTools).map((link) => link.agentToolRegistry).filter(Boolean))}
      onAdd={(id) => toggle(setToolIds, id)} onRemove={(id) => toggle(setToolIds, id)} createUrl="/admin/core/solid-core/agent-tool-registry/editor/new"
      linkFor={(id) => linkForTarget(record?.agentTools, "agentToolRegistry", id)}
      render={(item) => <AgentResourceCardWidget {...({ rowData: item } as SolidKanbanCardWidgetProps)} />}
      renderSettings={(item) => <div className="agent-editor__link-settings">{linkSetting("Require approval", requiresApprovalValues[item.id] ?? false,
          (checked) => setRequiresApprovalValues((current) => ({ ...current, [item.id]: checked })), "Pause before running this tool until a user approves it.")}</div>} /> },
    { value: "policies", label: "Policies", content: <div className="agent-editor__stack"><section className="agent-editor__section"><h2>Roles</h2><p>Grant the agent the roles it may use.</p>
      {Object.entries(groups).map(([groupName, groupRoles]) => <fieldset className="agent-editor__role-group" key={groupName}><legend>{groupName}</legend>
        {(groupRoles ?? []).map((role) => <label key={role.id}><input type="checkbox" checked={roleIds.includes(role.id)} onChange={() => toggle(setRoleIds, role.id)} /> {role.name}</label>)}
      </fieldset>)}{!roles.records.length && <div className="agent-editor__empty">No roles available.</div>}</section>
      <section className="agent-editor__section"><h2>Execution limits</h2><div className="agent-editor__grid">
        {[["Step limit", stepLimit, setStepLimit], ["Turn step limit", turnStepLimit, setTurnStepLimit], ["Cost limit", costLimit, setCostLimit]].map(([label, value, setter]) =>
          <label className="agent-editor__field" key={label as string}><span>{label as string}</span><input type="number" min={label === "Cost limit" ? 0 : 1} step={label === "Cost limit" ? 0.01 : 1} value={value as number} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} /></label>)}
      </div>{errors.limits && <small className="agent-editor__error">{errors.limits}</small>}</section></div> },
    { value: "secrets", label: "Secrets", content: <LinkPicker label="Secrets" description="Grant access to existing secrets. Secret values are never shown here." options={secrets.records} selected={linked(secretIds, secrets.records, items(record?.agentSecrets).map((link) => link.secret).filter(Boolean))}
      onAdd={(id) => { const secret = secrets.records.find((item) => item.id === id); if (secret) beginSecretEnvVarEdit(secret); }} onRemove={(id) => toggle(setSecretIds, id)}
      linkFor={(id) => linkForTarget(record?.agentSecrets, "secret", id)}
      render={(item, link) => <div className="agent-editor__secret"><strong>{item.displayName ?? item.name ?? item.key}</strong><span>{item.key}</span><p>{item.description}</p>
        <div className="agent-editor__secret-env"><span>Process environment</span><code>{secretEnvVarNames[item.id] ?? link?.envVarName ?? item.key ?? item.name}</code>
          <button type="button" aria-label={`Edit environment variable name for ${item.displayName ?? item.key}`} onClick={() => beginSecretEnvVarEdit(item)}><Pencil size={14} /></button></div></div>} /> },
    ...(record?.id ? [{ value: "processes", label: "Processes", content: <AgentProcessesPanel agentId={record.id} agentLabel={record.name ?? record.title} /> }] : []),
    ...((record?.id ? [
      ["jobs", "Jobs", jobs.currentData?.records],
    ] : []) as [string, string, Item[]][]).map(([value, label, related]) => ({ value, label, content: <section className="agent-editor__section"><h2>{label}</h2>
      {jobs.isLoading || jobs.isFetching ? <div className="agent-editor__empty">Loading jobs…</div>
        : jobs.isError ? <div className="agent-editor__empty">Jobs could not be loaded.</div>
        : items(related).length ? <div className="agent-editor__related">{items(related).map((item) => <article key={item.id}><strong>{item.name ?? item.title ?? `#${item.id}`}</strong><span>{item.status ?? ""}</span></article>)}</div>
        : <div className="agent-editor__empty">No {label.toLowerCase()} for this agent yet.</div>}</section> })),
    ...(record?.id ? [{ value: "sessions", label: "Sessions", content: <AgentSessionsPanel agentId={record.id} agentLabel={record.name ?? record.title} /> }] : []),
    ...(record?.id ? [{ value: "embedding", label: "Embedding", content: <AgentEmbeddingPanel agentId={record.id}
      fields={parseInputs(record.requiredInputs)} active={record.status === "active"}
      hubUrl={String(getSettingsMap(settings).solidxAgentHubBackendUrl ?? "")} /> }] : []),
  ];
  const content = <SolidTabGroup tabs={tabs} value={tab} onValueChange={setTab} className="agent-editor__tabs" listClassName="agent-editor__tab-list" panelClassName="agent-editor__tab-panel" />;
  return <main className="agent-editor"><header className="agent-editor__header"><div className="agent-editor__heading-with-refresh"><h1>{record?.id ? "Edit Agent" : "Create Agent"}</h1>{record?.id && <button type="button" className={`agent-editor__refresh${isFetching ? " is-loading" : ""}`} aria-label="Refresh agent" title="Refresh agent" disabled={isFetching || updating} onClick={requestRefresh}><RefreshCw size={14} /></button>}</div><div className="agent-editor__actions">
    <SolidButton variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</SolidButton>
    {record?.id && <SolidButton variant="secondary" leftIcon={<FlaskConical size={16} />} onClick={openAgentTest}>Test Agent</SolidButton>}
    <SolidButton loading={creating || updating} disabled={isLoading || isFetching || isError || (id !== "new" && !record?.id)} onClick={() => void save()}>Save Agent</SolidButton>
  </div></header>
    <SolidDialog open={confirmRefresh} onOpenChange={setConfirmRefresh} header="Discard unsaved changes?" style={{ width: "min(28rem, 94vw)" }}
      footer={<><SolidButton type="button" variant="secondary" onClick={() => setConfirmRefresh(false)}>Cancel</SolidButton><SolidButton type="button" disabled={isFetching} onClick={() => { setConfirmRefresh(false); void refetch(); }}>Refresh and discard</SolidButton></>}>
      <SolidDialogBody><p>You have unsaved changes. Refreshing will discard them and load the latest agent content.</p></SolidDialogBody>
    </SolidDialog>
    {isLoading ? <div className="agent-editor__empty">Loading agent…</div> : isError || (id !== "new" && !record?.id) ?
    <div className="agent-editor__empty">This agent could not be loaded.</div> : record?.id ?
    <AgentRegistryAuditPanel modelSingularName="agentRegistry" recordId={record.id} refreshVersion={auditVersion} modelUserKey={record.name}>{content}</AgentRegistryAuditPanel> : content}
    <SolidDialog open={Boolean(pendingSecret)} onOpenChange={(open) => { if (!open) { setPendingSecret(null); setSecretEnvVarError(""); } }}
      header="Set secret environment variable" style={{ width: "min(34rem, 94vw)" }}
      footer={<div className="agent-editor__secret-dialog-actions"><SolidButton type="button" variant="secondary" onClick={() => { setPendingSecret(null); setSecretEnvVarError(""); }}>Cancel</SolidButton>
        <SolidButton type="button" onClick={commitSecretEnvVar}>Use secret</SolidButton></div>}>
      <SolidDialogBody className="agent-editor__secret-dialog-body"><div className="agent-editor__secret-dialog"><p>Choose the environment variable name AgentHub will set for <strong>{pendingSecret?.displayName ?? pendingSecret?.name ?? pendingSecret?.key}</strong>. The default is the secret name.</p>
        <label className="agent-editor__field"><span>Environment variable name</span><SolidInput autoFocus value={secretEnvVarDraft} aria-invalid={Boolean(secretEnvVarError)} onChange={(event) => { setSecretEnvVarDraft(event.target.value); setSecretEnvVarError(""); }} />
          {secretEnvVarError && <small className="agent-editor__error">{secretEnvVarError}</small>}</label></div></SolidDialogBody>
    </SolidDialog>
    {record?.id && <SolidDialog
      open={testAgentOpen}
      onOpenChange={setTestAgentOpen}
      onHide={() => setTestAgentOpen(false)}
      showHeader={false}
      overlayClassName="agent-editor__test-dialog-overlay"
      ariaLabel={`Test ${record.name ?? "SolidX Agent"}`}
      className="agent-editor__test-dialog"
      style={testAgentWindowMode === "maximized"
        ? { position: "fixed", inset: 16, width: "auto", maxWidth: "none", height: "auto", maxHeight: "none", transform: "none", borderRadius: 14, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }
        : { position: "fixed", top: 16, right: 16, bottom: 16, left: "auto", width: "min(28rem, calc(100vw - 32px))", maxWidth: "none", height: "auto", maxHeight: "none", transform: "none", borderRadius: 14, padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}
    >
      <div className="agent-editor__test-dialog-body">
        <SolidAgentEmbedded agentRuntime="agentHub" agentId={record.id} title={record.name ?? "SolidX Agent"} requiredInputs={parseInputs(record.requiredInputs)} height="100%" className="agent-editor__test-chat"
          windowControls={{ mode: testAgentWindowMode, onDock: () => setTestAgentWindowMode("docked"), onMaximize: () => setTestAgentWindowMode("maximized"), onRestore: () => setTestAgentWindowMode("docked"), onClose: () => setTestAgentOpen(false) }} />
      </div>
    </SolidDialog>}
  </main>;
}
