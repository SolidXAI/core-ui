/** Providers whose model IDs are offered by the built-in AI settings and agent editors. */
export type AllowedModelProvider = "anthropic" | "openai" | "openrouter";

/** Curated model IDs grouped by provider. Keep these IDs in the provider's native format. */
export type AllowedModelsByProvider = Record<AllowedModelProvider, readonly string[]>;

export const ALLOWED_MODELS_BY_PROVIDER: AllowedModelsByProvider = {
  anthropic: [
    "claude-opus-4-8",
    "claude-opus-4-7",
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-sonnet-4-5-20250929",
    "claude-haiku-4-5-20251001",
  ],
  openai: [
    "gpt-6-astra",
    "gpt-6.1-sol",
    "gpt-6-luna",
    "gpt-5.6-sol",
    "gpt-5.6-terra",
    "gpt-5.6-luna",
  ],
  openrouter: [
    "openai/gpt-6-astra",
    "openai/gpt-6.1-sol",
    "openai/gpt-6-luna",
    "anthropic/claude-opus-4.8",
    "anthropic/claude-sonnet-4.6",
    "anthropic/claude-haiku-4.5",
  ],
};

/** Return the built-in model IDs supported for a provider, or an empty list for custom providers. */
export function getAllowedModelIdsForProvider(provider: string): readonly string[] {
  return Object.prototype.hasOwnProperty.call(ALLOWED_MODELS_BY_PROVIDER, provider)
    ? ALLOWED_MODELS_BY_PROVIDER[provider as AllowedModelProvider]
    : [];
}
