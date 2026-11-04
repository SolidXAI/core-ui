import { solidGet } from "../../../../http/solidHttp";

export type ConfigVersion = { id: number; versionNumber: number; name: string | null; description: string | null; createdAt: string };
export type ComparisonStatus = "matched" | "changed" | "added" | "removed";
export type ComparisonSide = { label: string; summary?: string };
export type ComparisonRow = { id?: string; status: ComparisonStatus; diffKey: string | null; left: ComparisonSide | null; right: ComparisonSide | null };
export type ConfigComparison = {
  schemaVersion: number;
  agent: { id: number; name: string; title?: string };
  versions: { left: ConfigVersion; right: ConfigVersion };
  sections: {
    systemPrompt: ComparisonRow & { title: string };
    skills?: { title: string; status: ComparisonStatus; rows: ComparisonRow[] };
    modelConfiguration: { title: string; status: ComparisonStatus; groups: {
      id: string; title: string; status: ComparisonStatus;
      fields: { key: string; label: string; status: ComparisonStatus; left: string | number | null; right: string | number | null }[];
    }[] };
  };
};
export type ConfigDiff = { diffKey: string; title: string; language: string; oldValue: string; newValue: string;
  rows?: { id: string; title: string; oldValue: string; newValue: string }[] };

export const CONFIG_COMPARE_PATH = "/admin/core/solid-core/agent-registry/editor/compare-config";

export function formatConfigDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export async function loadConfigComparison(request: { agentId: number; leftVersionId: number; rightVersionId: number }, signal?: AbortSignal): Promise<ConfigComparison> {
  const response = await solidGet<{ data: ConfigComparison }>("/agent-config-version/compare", { params: request, signal });
  if (!response.data.data?.sections) throw new Error("The server returned an invalid comparison.");
  return response.data.data;
}

export async function loadConfigDiff(request: { agentId: number; leftVersionId: number; rightVersionId: number; diffKey: string }, signal?: AbortSignal): Promise<ConfigDiff> {
  const response = await solidGet<{ data: ConfigDiff }>("/agent-config-version/compare/diff", { params: request, signal });
  if (typeof response.data.data?.oldValue !== "string" || typeof response.data.data?.newValue !== "string") throw new Error("The server returned an invalid diff.");
  return response.data.data;
}
