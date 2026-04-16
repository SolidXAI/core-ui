import React from "react";
import { SolidInput, SolidSelect, SolidSwitch, SolidTextarea } from "../../../shad-cn-ui";

export interface ModelBehavior {
  streaming: boolean;
  custom: string;
}

export interface ProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface ModelEntry {
  providerKey: string;
  behavior: ModelBehavior;
}

export interface SolidAiConfig {
  models: {
    default: ModelEntry;
    fast: ModelEntry;
  };
  providers: Record<string, ProviderConfig>;
}

interface Props {
  providerKey: string;
  providerConfig: ProviderConfig;
  behavior: ModelBehavior;
  allProviders: Record<string, ProviderConfig>;
  onProviderKeyChange: (newProviderKey: string, config: ProviderConfig) => void;
  onProviderConfigChange: (providerKey: string, config: ProviderConfig) => void;
  onBehaviorChange: (behavior: ModelBehavior) => void;
}

const PROVIDER_OPTIONS = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "OpenAI Compatible", value: "openai-compatible" },
  { label: "Anthropic Compatible", value: "anthropic-compatible" },
];

const COMPATIBLE_PROVIDERS = ["openai-compatible", "anthropic-compatible"];

const DEFAULT_PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  openai: { provider: "openai", apiKey: "", model: "" },
  anthropic: { provider: "anthropic", apiKey: "", model: "" },
  "openai-compatible": { provider: "openai-compatible", apiKey: "", model: "", baseUrl: "" },
  "anthropic-compatible": { provider: "anthropic-compatible", apiKey: "", model: "", baseUrl: "" },
};

export const AiModelConfigTab = ({
  providerKey,
  providerConfig,
  behavior,
  allProviders,
  onProviderKeyChange,
  onProviderConfigChange,
  onBehaviorChange,
}: Props) => {
  const isCompatible = COMPATIBLE_PROVIDERS.includes(providerKey);

  const handleProviderSelect = (value: string) => {
    const existingConfig = allProviders[value];
    const newConfig = existingConfig ?? DEFAULT_PROVIDER_CONFIGS[value] ?? { provider: value, apiKey: "", model: "" };
    onProviderKeyChange(value, newConfig);
  };

  const handleConfigUpdate = (key: keyof ProviderConfig, value: string) => {
    onProviderConfigChange(providerKey, { ...providerConfig, [key]: value });
  };

  const cardStyle: React.CSSProperties = {
    border: "1px solid var(--solid-border-color, #e2e8f0)",
    borderRadius: "0.5rem",
    padding: "1.25rem",
    background: "var(--solid-card-bg, var(--solid-surface-bg, transparent))",
  };

  return (
    <div className="flex flex-column gap-4">
      <div style={cardStyle}>
        <p className="solid-settings-subheading">Provider Config</p>
        <div className="flex flex-column gap-3 mt-3">
          <div className="flex flex-column gap-2">
            <label className="form-field-label">Provider</label>
            <SolidSelect
              className="w-full"
              value={providerKey}
              options={PROVIDER_OPTIONS}
              onChange={(e) => handleProviderSelect(e.value)}
              placeholder="Select Provider"
            />
          </div>
          {isCompatible && (
            <div className="flex flex-column gap-2">
              <label className="form-field-label">Base URL</label>
              <SolidInput
                placeholder="http://localhost:8000"
                value={providerConfig?.baseUrl || ""}
                onChange={(e) => handleConfigUpdate("baseUrl", e.target.value)}
                className="w-full"
              />
            </div>
          )}
          <div className="flex flex-column gap-2">
            <label className="form-field-label">API Key</label>
            <SolidInput
              type="password"
              className="w-full"
              value={providerConfig?.apiKey || ""}
              onChange={(e) => handleConfigUpdate("apiKey", e.target.value)}
            />
          </div>
          <div className="flex flex-column gap-2">
            <label className="form-field-label">Model</label>
            <SolidInput
              placeholder="e.g. gpt-4o-mini"
              value={providerConfig?.model || ""}
              onChange={(e) => handleConfigUpdate("model", e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <p className="solid-settings-subheading">Behavior</p>
        <div className="flex flex-column gap-3 mt-3">
          <div className="flex align-items-center gap-2">
            <SolidSwitch
              checked={behavior.streaming}
              onChange={(val) => onBehaviorChange({ ...behavior, streaming: val })}
            />
            <label className="form-field-label" style={{ marginBottom: 0 }}>Streaming</label>
          </div>
          <div className="flex flex-column gap-2">
            <label className="form-field-label">Custom Params (JSON)</label>
            <SolidTextarea
              value={behavior.custom}
              onChange={(e) => onBehaviorChange({ ...behavior, custom: e.target.value })}
              placeholder='{ "temperature": 0.7, "maxTokens": 1000 }'
              rows={4}
              className="w-full"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
