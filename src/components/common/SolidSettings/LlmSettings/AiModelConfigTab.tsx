import { Dropdown } from "primereact/dropdown";
import { OpenAiProviderComponent } from "./OpenAiProviderComponent";
import { AnthropicProviderComponent } from "./AnthropicProviderComponent";

export interface ModelConfig {
  provider: string;
  availableProviders: any[];
}

interface Props {
  config: ModelConfig;
  onChange: (config: ModelConfig) => void;
}

const PROVIDER_OPTIONS = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
];

export const AiModelConfigTab = ({ config, onChange }: Props) => {
  const profiles = config.availableProviders ?? [];
  const provider = config.provider;

  const handleProviderSelect = (value: string) => {
    const exists = profiles.some((p: any) => p.provider === value);
    const newProfiles = exists
      ? profiles
      : [...profiles, { id: Date.now().toString(), provider: value }];
    onChange({ ...config, provider: value, availableProviders: newProfiles });
  };

  const handleProfileUpdate = (key: string, value: string) => {
    let updatedProfiles: any[];
    if (profiles.some((p: any) => p.provider === provider)) {
      updatedProfiles = profiles.map((p: any) =>
        p.provider === provider ? { ...p, [key]: value } : p
      );
    } else {
      updatedProfiles = [
        ...profiles,
        { id: Date.now().toString(), provider, [key]: value },
      ];
    }
    onChange({ ...config, availableProviders: updatedProfiles });
  };

  const currentProfile =
    profiles.find((p: any) => p.provider === provider) || null;

  return (
    <div className="ai-model-config-tab">
      <div className="flex flex-column gap-2">
        <label className="form-field-label">Provider</label>
        <Dropdown
          className="w-full"
          value={provider}
          options={PROVIDER_OPTIONS}
          onChange={(e) => handleProviderSelect(e.value)}
          placeholder="Select Provider"
        />
      </div>
      {provider === "openai" && (
        <OpenAiProviderComponent
          profile={currentProfile}
          onUpdate={handleProfileUpdate}
        />
      )}
      {provider === "anthropic" && (
        <AnthropicProviderComponent
          profile={currentProfile}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};
