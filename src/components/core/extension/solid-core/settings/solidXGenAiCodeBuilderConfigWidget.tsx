import { useMemo, useState } from "react";
import { SolidButton, SolidTabGroup } from "../../../../shad-cn-ui";
import type { SolidSettingsWidgetProps } from "../../../../../types/solid-core";
import {
  ModelConfigTab,
  ProvidersTab,
  type ModelBehavior,
  type ModelEntry,
  type SolidAiConfig,
  ensureBuiltInProviders,
} from "../../../../common/SolidSettings/LlmSettings/AiModelConfigTab";

const DEFAULT_BEHAVIOR: ModelBehavior = { streaming: false, custom: "" };
const DEFAULT_MODEL_ENTRY: ModelEntry = { providerId: "", model: "", behavior: DEFAULT_BEHAVIOR };

function toSolidAiConfig(value: unknown): SolidAiConfig {
  const defaultConfig: SolidAiConfig = {
    models: {
      default: DEFAULT_MODEL_ENTRY,
      fast: DEFAULT_MODEL_ENTRY,
    },
    providers: {},
  };

  if (!value) return defaultConfig;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object") return defaultConfig;
    const typed = parsed as SolidAiConfig;
    return {
      models: {
        default: typed.models?.default ?? DEFAULT_MODEL_ENTRY,
        fast: typed.models?.fast ?? DEFAULT_MODEL_ENTRY,
      },
      providers: typed.providers ?? {},
    };
  } catch {
    return defaultConfig;
  }
}

export default function solidXGenAiCodeBuilderConfigWidget({ setting, value, updateValue }: SolidSettingsWidgetProps) {
  const [activeTab, setActiveTab] = useState<"providers" | "default" | "fast">("providers");
  const [showAddProvider, setShowAddProvider] = useState(false);

  const aiConfig = useMemo(() => toSolidAiConfig(value), [value]);
  const providers = ensureBuiltInProviders(aiConfig.providers ?? {});

  const onAiConfigChange = (nextConfig: SolidAiConfig) => {
    updateValue(setting.key, nextConfig);
  };

  const tabs = [
    {
      value: "providers" as const,
      label: "Providers",
      content: (
        <ProvidersTab
          providers={providers}
          onProvidersChange={(nextProviders: SolidAiConfig["providers"]) => {
            onAiConfigChange({ ...aiConfig, providers: nextProviders });
          }}
          showAddModal={showAddProvider}
          onAddModalClose={() => setShowAddProvider(false)}
        />
      ),
    },
    {
      value: "default" as const,
      label: "Intelligent Model",
      content: (
        <ModelConfigTab
          modelEntry={aiConfig.models?.default ?? DEFAULT_MODEL_ENTRY}
          providers={providers}
          onModelEntryChange={(entry: ModelEntry) => {
            onAiConfigChange({ ...aiConfig, models: { ...aiConfig.models, default: entry } });
          }}
        />
      ),
    },
    {
      value: "fast" as const,
      label: "Fast Model",
      content: (
        <ModelConfigTab
          modelEntry={aiConfig.models?.fast ?? DEFAULT_MODEL_ENTRY}
          providers={providers}
          onModelEntryChange={(entry: ModelEntry) => {
            onAiConfigChange({ ...aiConfig, models: { ...aiConfig.models, fast: entry } });
          }}
        />
      ),
    },
  ];

  return (
    <div>
      <SolidTabGroup
        tabs={tabs}
        value={activeTab}
        onValueChange={(tab: string) => setActiveTab(tab as "providers" | "default" | "fast")}
        tabPosition="left"
        extra={
          activeTab === "providers" ? (
            <SolidButton size="sm" onClick={() => setShowAddProvider(true)}>
              Add
            </SolidButton>
          ) : undefined
        }
      />
    </div>
  );
}
