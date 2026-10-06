import React from "react";
import { ArrowLeft, Plus, RefreshCw, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { showToast } from "../../../../redux/features/toastSlice";
import { AgentRegistryAuditPanel } from "./AgentRegistryAuditPanel";
import {
  SolidButton,
  SolidCodeEditor,
  SolidDialog,
  SolidDialogBody,
  SolidIconPicker,
  SolidInput,
  SolidTabGroup,
} from "../../../../components/shad-cn-ui";
import "./AgentSkillRegistryEditorPage.css";

type AgentReference = {
  id?: number | string;
  name?: string;
  title?: string;
  agentRegistry?: AgentReference | number | string | null;
};

type SkillRecord = {
  id: number;
  name?: string;
  type?: string;
  iconName?: string | null;
  description?: string;
  body?: string;
  tags?: unknown;
  agentSkills?: AgentReference[] | AgentReference | null;
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
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((tag) => String(tag).trim()).filter(Boolean);
    }
  } catch {
    return value === "{}" ? [] : value.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  return [];
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
  if (!error || typeof error !== "object") return "Failed to save skill.";
  const apiError = error as Record<string, any>;
  // Nest validation details are nested at data.data.message; prefer them over
  // the generic outer "Bad Request Exception" message.
  return formatErrorMessage(apiError.data?.data?.message)
    ?? formatErrorMessage(apiError.data?.message)
    ?? formatErrorMessage(apiError.data?.error)
    ?? formatErrorMessage(apiError.message)
    ?? "Failed to save skill.";
}

function skillAgents(record?: SkillRecord): AgentReference[] {
  const related = record?.agentSkills;
  const links = Array.isArray(related)
    ? related
    : related
      ? [related]
      : [];
  const seen = new Set<string>();

  return links
    .map((link) => link.agentRegistry)
    .filter((agent): agent is AgentReference => Boolean(agent && typeof agent === "object"))
    .filter((agent) => {
      const key = String(agent.id ?? agent.name ?? agent.title ?? "");
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function AgentSkillRegistryEditorPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const entityApi = React.useMemo(() => createSolidEntityApi("agentSkillRegistry"), []);
  const {
    useCreateSolidEntityMutation,
    useGetSolidEntityByIdQuery,
    useUpdateSolidEntityMutation,
  } = entityApi;

  const { data: response, isLoading, isFetching, refetch } = useGetSolidEntityByIdQuery(
    {
      id,
      qs: "populate[0]=agentSkills&populate[1]=agentSkills.agentRegistry",
    },
    { skip: !id || id === "new" },
  );
  const [createSkill, { isLoading: isCreating }] = useCreateSolidEntityMutation();
  const [updateSkill, { isLoading: isSaving }] = useUpdateSolidEntityMutation();
  const record = extractEntityRecord(response) as SkillRecord | undefined;

  const [activeTab, setActiveTab] = React.useState("general");
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("custom");
  const [iconName, setIconName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [body, setBody] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [auditRefreshVersion, setAuditRefreshVersion] = React.useState(0);
  const [confirmRefresh, setConfirmRefresh] = React.useState(false);
  const baseline = React.useRef("");
  const currentForm = () => JSON.stringify({ name, type, iconName, description, body, tags, tagDraft });

  React.useEffect(() => {
    const nextTags = parseTags(record?.tags);
    setName(record?.name ?? "");
    setType(record?.type ?? "custom");
    setIconName(record?.iconName ?? "");
    setDescription(record?.description ?? "");
    setBody(record?.body ?? "");
    setTags(nextTags);
    setTagDraft("");
    baseline.current = JSON.stringify({ name: record?.name ?? "", type: record?.type ?? "custom", iconName: record?.iconName ?? "", description: record?.description ?? "", body: record?.body ?? "", tags: nextTags, tagDraft: "" });
  }, [record]);

  const isReadOnly = record?.type === "solidx";
  const isDirty = Boolean(record?.id) && currentForm() !== baseline.current;
  const requestRefresh = () => isDirty ? setConfirmRefresh(true) : void refetch();

  const addTag = () => {
    const nextTag = tagDraft.trim();
    if (!nextTag) return;
    if (!tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      setTags((current) => [...current, nextTag]);
    }
    setTagDraft("");
    setFieldErrors((current) => ({ ...current, tags: "" }));
  };

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!type.trim()) nextErrors.type = "Skill type is required.";
    if (!description.trim()) nextErrors.description = "Description is required.";
    if (!body.trim()) nextErrors.body = "Skill instructions are required.";
    if (tags.length === 0) nextErrors.tags = "At least one tag is required.";

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setActiveTab(nextErrors.body ? "skill" : "general");
      dispatch(showToast({
        severity: "error",
        summary: "Missing information",
        detail: Object.values(nextErrors).join(" "),
      }));
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      iconName: iconName || null,
      description: description.trim(),
      body,
      tags: JSON.stringify(tags),
    };

    try {
      if (record?.id) {
        await updateSkill({ id: record.id, data: payload }).unwrap();
        dispatch(showToast({
          severity: "success",
          summary: "Saved",
          detail: "Skill updated successfully.",
        }));
        setAuditRefreshVersion((version) => version + 1);
        refetch();
      } else {
        const result: any = await createSkill(payload).unwrap();
        const createdId = result?.data?.id ?? result?.id;
        dispatch(showToast({
          severity: "success",
          summary: "Created",
          detail: "Skill created successfully.",
        }));
        if (createdId) {
          navigate(`/admin/core/solid-core/agent-skill-registry/editor/${createdId}`, {
            replace: true,
          });
        }
      }
    } catch (error: any) {
      const errorDetail = getSaveErrorMessage(error);
      const serverFieldErrors: Record<string, string> = {};
      if (/required|not be empty|cannot be empty|should not be empty/i.test(errorDetail)) {
        for (const field of ["name", "type", "description", "body", "tags"]) {
          if (!new RegExp(`\\b${field}\\b`, "i").test(errorDetail)) continue;
          serverFieldErrors[field] = `${field === "body" ? "Skill instructions" : field[0].toUpperCase() + field.slice(1)} is required.`;
        }
      }
      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors);
        setActiveTab(serverFieldErrors.body || serverFieldErrors.tags ? "skill" : "general");
      }
      dispatch(showToast({
        severity: "error",
        summary: "Save failed",
        detail: errorDetail,
      }));
    }
  };

  const agents = skillAgents(record);
  const tabs = [
    {
      value: "general",
      label: "General Info",
      content: (
        <fieldset className="agent-skill-editor__general" disabled={isReadOnly}>
          {isReadOnly && <p className="agent-skill-editor__readonly-note">SolidX skills are seeded by the AgentHub runtime and cannot be edited.</p>}
          <div className="agent-skill-editor__fields">
            <label className="agent-skill-editor__field">
              <span>Name <b>*</b></span>
              <SolidInput
                value={name}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "agent-skill-name-error" : undefined}
                className={fieldErrors.name ? "agent-skill-editor__input--invalid" : undefined}
                onChange={(event) => {
                  setName(event.target.value);
                  setFieldErrors((current) => ({ ...current, name: "" }));
                }}
              />
              {fieldErrors.name && <small id="agent-skill-name-error" className="agent-skill-editor__field-error">{fieldErrors.name}</small>}
            </label>
            <div className="agent-skill-editor__field">
              <span>Icon</span>
              <SolidIconPicker value={iconName} onChange={setIconName} />
            </div>
            <label className="agent-skill-editor__field">
              <span>Description <b>*</b></span>
              <SolidInput
                value={description}
                aria-invalid={Boolean(fieldErrors.description)}
                aria-describedby={fieldErrors.description ? "agent-skill-description-error" : undefined}
                className={fieldErrors.description ? "agent-skill-editor__input--invalid" : undefined}
                onChange={(event) => {
                  setDescription(event.target.value);
                  setFieldErrors((current) => ({ ...current, description: "" }));
                }}
              />
              {fieldErrors.description && <small id="agent-skill-description-error" className="agent-skill-editor__field-error">{fieldErrors.description}</small>}
            </label>
          </div>
          <label className="agent-skill-editor__field">
            <span>Skill type <b>*</b></span>
            <select
              value={type}
              aria-invalid={Boolean(fieldErrors.type)}
              aria-describedby={fieldErrors.type ? "agent-skill-type-error" : undefined}
              className={fieldErrors.type ? "agent-skill-editor__input--invalid" : undefined}
              onChange={(event) => {
                setType(event.target.value);
                setFieldErrors((current) => ({ ...current, type: "" }));
              }}
            >
              {isReadOnly && <option value="solidx">SolidX</option>}
              <option value="thirdparty">Third Party</option>
              <option value="custom">Custom</option>
            </select>
            {fieldErrors.type && <small id="agent-skill-type-error" className="agent-skill-editor__field-error">{fieldErrors.type}</small>}
          </label>
          <div className="agent-skill-editor__field">
            <span>Tags <b>*</b></span>
            <div className={`agent-skill-editor__tag-input${fieldErrors.tags ? " agent-skill-editor__tag-input--invalid" : ""}`}>
              {tags.map((tag, index) => (
                <span className="agent-skill-editor__tag" key={`${tag}-${index}`}>
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => {
                      setTags((current) => {
                        const nextTags = current.filter((_, tagIndex) => tagIndex !== index);
                        if (nextTags.length > 0) setFieldErrors((errors) => ({ ...errors, tags: "" }));
                        return nextTags;
                      });
                    }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
              <input
                value={tagDraft}
                aria-label="Add a tag"
                placeholder="Type a tag and press Enter"
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addTag();
                  }
                }}
              />
              <SolidButton type="button" variant="secondary" size="small" onClick={addTag}>
                <Plus size={14} /> Add
              </SolidButton>
            </div>
            {fieldErrors.tags && <small className="agent-skill-editor__field-error">{fieldErrors.tags}</small>}
            <small>Tags are saved as a JSON array.</small>
          </div>
        </fieldset>
      ),
    },
    {
      value: "skill",
      label: "Skill",
      content: (
        <div className="agent-skill-editor__skill">
          <section className="agent-skill-editor__panel">
            <header>
              <h2>Skill instructions <b>*</b></h2>
              <p>Write the skill's Markdown body here.</p>
            </header>
            <SolidCodeEditor
              value={body}
              onChange={(value) => {
                setBody(value ?? "");
                setFieldErrors((current) => ({ ...current, body: "" }));
              }}
              language="markdown"
              readOnly={isReadOnly}
              fontSize={11}
              height="max(32rem, calc(100dvh - 18rem))"
              className={`agent-skill-editor__code${fieldErrors.body ? " agent-skill-editor__code--invalid" : ""}`}
            />
            {fieldErrors.body && <small className="agent-skill-editor__field-error agent-skill-editor__body-error">{fieldErrors.body}</small>}
          </section>
        </div>
      ),
    },
    {
      value: "agents",
      label: "Agents",
      content: (
        <section className="agent-skill-editor__agents">
          <div>
            <h2>Associated agents</h2>
            <p>Agents linked to this skill. Associations are read-only here.</p>
          </div>
          {isLoading ? (
            <p>Loading associated agents…</p>
          ) : agents.length ? (
            <div className="agent-skill-editor__agent-grid">
              {agents.map((agent, index) => (
                <article className="agent-skill-editor__agent-card" key={String(agent.id ?? agent.name ?? index)}>
                  <span>{(agent.name ?? agent.title ?? "A").slice(0, 1).toUpperCase()}</span>
                  <strong>{agent.name ?? agent.title ?? "Unnamed agent"}</strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="agent-skill-editor__empty">No agents are currently associated with this skill.</div>
          )}
        </section>
      ),
    },
  ];

  return (
    <main className="agent-skill-editor">
      <header className="agent-skill-editor__header">
        <div>
          <div className="agent-skill-editor__heading-with-refresh"><h1>{record ? "Edit Skill" : "Create Skill"}</h1>{record?.id && <button type="button" className={`agent-skill-editor__refresh${isFetching ? " is-loading" : ""}`} aria-label="Refresh skill" title="Refresh skill" disabled={isFetching || isSaving} onClick={requestRefresh}><RefreshCw size={14} /></button>}</div>
        </div>
        <div className="agent-skill-editor__actions">
          <SolidButton variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            Back
          </SolidButton>
          {!isReadOnly && (
            <SolidButton loading={isCreating || isSaving} onClick={handleSave}>
              Save Skill
            </SolidButton>
          )}
        </div>
      </header>

      <SolidDialog open={confirmRefresh} onOpenChange={setConfirmRefresh} header="Discard unsaved changes?" style={{ width: "min(28rem, 94vw)" }}
        footer={<><SolidButton type="button" variant="secondary" onClick={() => setConfirmRefresh(false)}>Cancel</SolidButton><SolidButton type="button" disabled={isFetching} onClick={() => { setConfirmRefresh(false); void refetch(); }}>Refresh and discard</SolidButton></>}>
        <SolidDialogBody><p>You have unsaved changes. Refreshing will discard them and load the latest skill content.</p></SolidDialogBody>
      </SolidDialog>

      {isLoading ? (
        <div className="agent-skill-editor__loading">Loading skill…</div>
      ) : record?.id ? (
        <AgentRegistryAuditPanel
          modelSingularName="agentSkillRegistry"
          recordId={record.id}
          refreshVersion={auditRefreshVersion}
          modelUserKey={record.name}
        >
          <SolidTabGroup
            tabs={tabs}
            value={activeTab}
            onValueChange={setActiveTab}
            className="agent-skill-editor__tabs"
            listClassName="agent-skill-editor__tab-list"
            panelClassName="agent-skill-editor__tab-panel"
          />
        </AgentRegistryAuditPanel>
      ) : (
        <SolidTabGroup
          tabs={tabs}
          value={activeTab}
          onValueChange={setActiveTab}
          className="agent-skill-editor__tabs"
          listClassName="agent-skill-editor__tab-list"
          panelClassName="agent-skill-editor__tab-panel"
        />
      )}
    </main>
  );
}
