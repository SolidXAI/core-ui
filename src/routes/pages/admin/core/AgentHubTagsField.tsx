import React from "react";
import { Plus, Search, X } from "lucide-react";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";
import { SolidButton } from "../../../../components/shad-cn-ui/SolidButton";
import "./AgentHubTagsField.css";

export type AgentHubTag = { id: number; name: string };

export function agentHubTagsFrom(value: unknown): AgentHubTag[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  return value.flatMap((tag) => {
    const id = Number(tag?.id);
    if (!Number.isInteger(id) || id <= 0 || typeof tag?.name !== "string" || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name: tag.name }];
  });
}

export function agentHubTagsPayload(tags: AgentHubTag[]) {
  return { tagsIds: tags.map((tag) => tag.id), tagsCommand: tags.length ? "set" : "clear" };
}

const tagApi = createSolidEntityApi("agentHubTag");

export function AgentHubTagsField({ value, onChange, disabled = false, onBusyChange }: {
  value: AgentHubTag[];
  onChange: (tags: AgentHubTag[]) => void;
  disabled?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { data, isFetching, isError, refetch } = tagApi.useGetSolidEntitiesQuery(
    "offset=0&limit=1000&fields[0]=id&fields[1]=name", { skip: disabled });
  const [createTag, { isLoading: isCreating }] = tagApi.useCreateSolidEntityMutation();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fieldId = React.useId();
  const name = query.trim();
  const catalog = agentHubTagsFrom(data?.records);
  const exact = [...catalog, ...value].find((tag) => tag.name.toLowerCase() === name.toLowerCase());
  const options = catalog.filter((tag) => !value.some((selected) => selected.id === tag.id)
    && tag.name.toLowerCase().includes(name.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  const canCreate = Boolean(name && !exact && !isFetching && !isError);

  const select = (tag: AgentHubTag) => {
    if (!value.some((selected) => selected.id === tag.id)) onChange([...value, tag]);
    setQuery("");
    setActiveIndex(-1);
    setError("");
    inputRef.current?.focus();
  };

  const add = async () => {
    if (disabled || isCreating || !name) return;
    if (exact) { select(exact); return; }
    if (!canCreate) return;
    setError("");
    onBusyChange?.(true);
    try {
      let result = await createTag({ name }).unwrap();
      for (let depth = 0; depth < 3 && result && !result.id; depth += 1) result = result.data;
      const created = agentHubTagsFrom([result])[0];
      if (!created) throw new Error("The tag could not be loaded. Search for it again.");
      select(created);
    } catch (failure: any) {
      const refreshed = await refetch();
      const existing = agentHubTagsFrom(refreshed.data?.records).find((tag) => tag.name.toLowerCase() === name.toLowerCase());
      if (existing) select(existing);
      else {
        const message = failure?.data?.data?.message ?? failure?.data?.message ?? failure?.message;
        setError(typeof message === "string" ? message : "Could not create this tag. Try again.");
      }
    } finally {
      onBusyChange?.(false);
    }
  };

  return <div className="agent-hub-tags" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <label htmlFor={fieldId}>Tags <span className="agent-hub-tags__count">{value.length}</span></label>
    <div className="agent-hub-tags__selection">
      {value.map((tag) => <span className="agent-hub-tags__chip" key={tag.id}>{tag.name}
        {!disabled && <button type="button" disabled={isCreating} aria-label={`Remove ${tag.name}`}
          onClick={() => onChange(value.filter((selected) => selected.id !== tag.id))}><X size={13} /></button>}
      </span>)}
      {!value.length && <span className="agent-hub-tags__empty">No tags selected</span>}
    </div>
    {!disabled && <>
      <div className="agent-hub-tags__search">
        <Search size={16} aria-hidden="true" />
        <input ref={inputRef} id={fieldId} role="combobox" autoComplete="off" aria-expanded={open}
          aria-controls={`${fieldId}-options`} aria-autocomplete="list"
          aria-activedescendant={open && options[activeIndex] ? `${fieldId}-option-${activeIndex}` : undefined}
          disabled={isCreating} value={query} placeholder="Search or create tags…"
          onFocus={() => setOpen(true)}
          onChange={(event) => { setQuery(event.target.value); setActiveIndex(-1); setOpen(true); setError(""); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
            if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, options.length - 1)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
            if (event.key === "Enter") { event.preventDefault(); if (open && options[activeIndex]) select(options[activeIndex]); else void add(); }
          }} />
        {name && <SolidButton variant="secondary" size="small" loading={isCreating}
          disabled={!exact && !canCreate} onClick={() => void add()} leftIcon={<Plus size={14} />}>
          {exact ? "Select" : "Create tag"}
        </SolidButton>}
      </div>
      {isError && <div className="agent-hub-tags__error" role="alert">Tags could not be loaded. <button type="button" onClick={() => void refetch()}>Retry</button></div>}
      {open && <div className="agent-hub-tags__options" id={`${fieldId}-options`} role="listbox" aria-label="Available tags">
        {isFetching ? <div className="agent-hub-tags__empty" role="status">Loading tags…</div>
          : options.length ? options.map((tag, index) => <button key={tag.id} id={`${fieldId}-option-${index}`}
            type="button" role="option" aria-selected={false} disabled={isCreating}
            className={activeIndex === index ? "is-active" : undefined}
            onMouseDown={(event) => event.preventDefault()} onClick={() => select(tag)}>{tag.name}<Plus size={14} /></button>)
            : !isError && <div className="agent-hub-tags__empty">{exact ? "Tag already selected." : canCreate ? `Create “${name}” to add it.` : "No tags available. Type a name to create one."}</div>}
      </div>}
      {error && <small className="agent-hub-tags__error" role="alert">{error}</small>}
      <small className="agent-hub-tags__hint">Tags are shared across agents, skills, and tools.</small>
    </>}
  </div>;
}
