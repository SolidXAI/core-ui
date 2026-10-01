import React from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { showToast } from "../../../../redux/features/toastSlice";
import { SolidAgentEmbedded } from "../../../../components/core/solid-agent/SolidAgentEmbedded";
import {
  SolidButton,
  SolidCodeEditor,
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
  description?: string;
  body?: string;
  tags?: unknown;
  agentSkills?: AgentReference[] | AgentReference | null;
};

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

  const { data: response, isLoading, refetch } = useGetSolidEntityByIdQuery(
    {
      id,
      qs: "populate[0]=agentSkills&populate[1]=agentSkills.agentRegistry",
    },
    { skip: !id || id === "new" },
  );
  const [createSkill, { isLoading: isCreating }] = useCreateSolidEntityMutation();
  const [updateSkill, { isLoading: isSaving }] = useUpdateSolidEntityMutation();
  const record = (response?.data ?? response) as SkillRecord | undefined;

  const [activeTab, setActiveTab] = React.useState("general");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [body, setBody] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");

  React.useEffect(() => {
    setName(record?.name ?? "");
    setDescription(record?.description ?? "");
    setBody(record?.body ?? "");
    setTags(parseTags(record?.tags));
  }, [record]);

  const addTag = () => {
    const nextTag = tagDraft.trim();
    if (!nextTag) return;
    if (!tags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase())) {
      setTags((current) => [...current, nextTag]);
    }
    setTagDraft("");
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      setActiveTab("general");
      dispatch(showToast({
        severity: "error",
        summary: "Missing information",
        detail: "Name and description are required.",
      }));
      return;
    }

    const payload = {
      name: name.trim(),
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
      dispatch(showToast({
        severity: "error",
        summary: "Save failed",
        detail: error?.data?.message ?? error?.message ?? "Failed to save skill.",
      }));
    }
  };

  const agents = skillAgents(record);
  const tabs = [
    {
      value: "general",
      label: "General Info",
      content: (
        <div className="agent-skill-editor__general">
          <div className="agent-skill-editor__fields">
            <label className="agent-skill-editor__field">
              <span>Name <b>*</b></span>
              <SolidInput value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="agent-skill-editor__field">
              <span>Description <b>*</b></span>
              <SolidInput value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
          </div>
          <div className="agent-skill-editor__field">
            <span>Tags</span>
            <div className="agent-skill-editor__tag-input">
              {tags.map((tag, index) => (
                <span className="agent-skill-editor__tag" key={`${tag}-${index}`}>
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => setTags((current) => current.filter((_, tagIndex) => tagIndex !== index))}
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
            <small>Tags are saved as a JSON array.</small>
          </div>
        </div>
      ),
    },
    {
      value: "skill",
      label: "Skill",
      content: (
        <div className="agent-skill-editor__skill">
          <section className="agent-skill-editor__panel">
            <header>
              <h2>Skill instructions</h2>
              <p>Write the skill body in Markdown.</p>
            </header>
            <SolidCodeEditor
              value={body}
              onChange={(value) => setBody(value ?? "")}
              language="markdown"
              height="100%"
              className="agent-skill-editor__code"
            />
          </section>
          <section className="agent-skill-editor__panel">
            <header>
              <h2>Agent interface preview</h2>
              <p>Embedded SolidX Agent chat.</p>
            </header>
            <div className="agent-skill-editor__chat">
              <SolidAgentEmbedded />
            </div>
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
          <p>Agent Hub / Skill Registry</p>
          <h1>{record ? "Edit Skill" : "Create Skill"}</h1>
        </div>
        <div className="agent-skill-editor__actions">
          <SolidButton variant="secondary" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)}>
            Back
          </SolidButton>
          <SolidButton loading={isCreating || isSaving} onClick={handleSave}>
            Save Skill
          </SolidButton>
        </div>
      </header>

      {isLoading ? (
        <div className="agent-skill-editor__loading">Loading skill…</div>
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
