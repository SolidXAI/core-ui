import { useEffect, useMemo, useState } from "react";

/** Public catalog of providers and models maintained at https://models.dev. */
export const MODELS_DEV_API_URL = "https://models.dev/api.json";

export interface ModelsDevModel {
  id: string;
  name: string;
  releaseDate?: string;
}

interface ModelsDevRawModel {
  id: string;
  name?: string;
  tool_call?: boolean;
  release_date?: string;
  modalities?: { input?: string[]; output?: string[] };
}

export interface ModelsDevProvider {
  name?: string;
  npm?: string;
  api?: string;
  models?: Record<string, ModelsDevRawModel>;
}

export type ModelsDevCatalog = Record<string, ModelsDevProvider>;

// Shared across all hook instances so the catalog is fetched once per page load.
let catalogPromise: Promise<ModelsDevCatalog> | null = null;

const loadCatalog = (): Promise<ModelsDevCatalog> => {
  if (!catalogPromise) {
    catalogPromise = fetch(MODELS_DEV_API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`models.dev responded with ${res.status}`);
        return res.json();
      })
      .catch((err) => {
        // Allow a retry on the next mount instead of caching the failure.
        catalogPromise = null;
        throw err;
      });
  }
  return catalogPromise;
};

/** Keep chat models usable by agents: text in/out with tool calling, newest first. */
const toModelList = (raw: Record<string, ModelsDevRawModel> | undefined): ModelsDevModel[] =>
  Object.values(raw ?? {})
    .filter((m) =>
      m.tool_call !== false &&
      (m.modalities?.input ?? ["text"]).includes("text") &&
      (m.modalities?.output ?? ["text"]).includes("text"))
    .map((m) => ({ id: m.id, name: m.name || m.id, releaseDate: m.release_date }))
    .sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "") || a.id.localeCompare(b.id));

/** Common provider names that models.dev lists under a different key. */
const MODELS_DEV_PROVIDER_ALIASES: Record<string, string> = {
  bedrock: "amazon-bedrock",
  "aws-bedrock": "amazon-bedrock",
  vertex: "google-vertex",
  "vertex-anthropic": "google-vertex-anthropic",
  gemini: "google",
};

/** Models for the first of `providerIds` that models.dev knows, or an empty list. */
export const getModelsDevModels = (catalog: ModelsDevCatalog | null, providerIds: Array<string | undefined>): ModelsDevModel[] => {
  const candidates = providerIds.flatMap((id) => {
    const normalized = id?.trim().toLowerCase();
    return normalized ? [normalized, MODELS_DEV_PROVIDER_ALIASES[normalized]] : [];
  });
  const match = catalog && candidates.find((id) => id && catalog[id]);
  return match ? toModelList(catalog![match].models) : [];
};

/** Load the full models.dev catalog (cached for the page lifetime). */
export const useModelsDevCatalog = () => {
  const [catalog, setCatalog] = useState<ModelsDevCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((result) => { if (!cancelled) setCatalog(result); })
      .catch((err: Error) => { if (!cancelled) setError(err.message || "Failed to load models"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, loading, error };
};

/**
 * Fetch available models for a provider from models.dev.
 * `providerIds` are tried in order; the first one known to models.dev wins.
 */
export const useModelsDevModels = (providerIds: Array<string | undefined>) => {
  const { catalog, loading, error } = useModelsDevCatalog();
  const key = providerIds.filter(Boolean).join("|");
  const models = useMemo(() => (key ? getModelsDevModels(catalog, key.split("|")) : []), [catalog, key]);
  return { models, loading: !!key && loading, error };
};
