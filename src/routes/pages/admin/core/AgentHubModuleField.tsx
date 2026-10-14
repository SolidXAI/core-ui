import React from "react";
import { createSolidEntityApi } from "../../../../redux/api/solidEntityApi";

export type AgentHubModule = { id: number; name: string; displayName?: string };

export function agentHubModuleFrom(value: unknown): AgentHubModule | null {
  const module = value as Record<string, unknown> | null | undefined;
  const id = Number(module?.id);
  if (!Number.isInteger(id) || id <= 0 || typeof module?.name !== "string") return null;
  return { id, name: module.name, displayName: typeof module.displayName === "string" ? module.displayName : undefined };
}

// Mirrors the generic many-to-one form field: the backend resolves `moduleId` into the `module` relation.
// An empty moduleId is ignored by the backend, so an existing module can be changed but not cleared.
export function agentHubModulePayload(module: AgentHubModule | null) {
  return module ? { moduleId: module.id } : {};
}

const moduleApi = createSolidEntityApi("moduleMetadata");

export function AgentHubModuleField({ value, onChange, className, disabled = false, clearable = true }: {
  value: AgentHubModule | null;
  onChange: (module: AgentHubModule | null) => void;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
}) {
  const { data, isFetching, isError, refetch } = moduleApi.useGetSolidEntitiesQuery(
    "offset=0&limit=1000&fields[0]=id&fields[1]=name&fields[2]=displayName", { skip: disabled });
  const records = data?.records;
  const catalog = (Array.isArray(records) ? records : [])
    .map(agentHubModuleFrom)
    .filter((module): module is AgentHubModule => Boolean(module));
  const options = value && !catalog.some((module) => module.id === value.id) ? [value, ...catalog] : catalog;
  const label = (module: AgentHubModule) => module.displayName || module.name;
  const fieldId = React.useId();

  return <label className={className} htmlFor={fieldId}>
    <span>Module</span>
    <select id={fieldId} value={value?.id ?? ""} disabled={disabled || isFetching}
      onChange={(event) => onChange(options.find((module) => module.id === Number(event.target.value)) ?? null)}>
      <option value="" disabled={!clearable}>{isFetching ? "Loading modules…" : "No module"}</option>
      {[...options].sort((a, b) => label(a).localeCompare(label(b))).map((module) =>
        <option key={module.id} value={module.id}>{label(module)}</option>)}
    </select>
    {isError && <small role="alert">Modules could not be loaded. <button type="button" onClick={() => void refetch()}>Retry</button></small>}
  </label>;
}
