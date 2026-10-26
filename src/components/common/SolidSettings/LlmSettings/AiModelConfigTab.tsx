import React, { useState } from "react";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogTitle,
  SolidAutocomplete,
  SolidInput,
  SolidSwitch,
  SolidTextarea,
} from "../../../shad-cn-ui";
import { useModelsDevCatalog, useModelsDevModels } from "../../../../hooks/useModelsDevModels";


export interface ModelBehavior {
  streaming: boolean;
  custom: string;
}

export interface ProviderEntry {
  type: string;
  apiKey: string;
  baseUrl?: string;
  region?: string;
}

export interface ModelEntry {
  providerId: string;
  model: string;
  behavior: ModelBehavior;
}

export interface SolidAiConfig {
  models: {
    default: ModelEntry;
    fast: ModelEntry;
  };
  providers: Record<string, ProviderEntry>;
}


const PROVIDER_TYPE_OPTIONS = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "OpenAI Compatible", value: "openai-compatible" },
  { label: "Anthropic Compatible", value: "anthropic-compatible" },
  { label: "Amazon Bedrock", value: "bedrock" },
];

const COMPATIBLE_TYPES = ["openai-compatible", "anthropic-compatible"];

// Native Bedrock (Converse API): authenticated with a Bedrock API key and a region, no base URL.
const BEDROCK_TYPE = "bedrock";
const BEDROCK_DEFAULT_NAME = "amazon-bedrock";
const ADDABLE_TYPES = [...COMPATIBLE_TYPES, BEDROCK_TYPE];

const BUILT_IN_TYPES = ["openai", "anthropic"];

// Providers not in the models.dev catalog are keyed as `other(<name>)`; their model ID is always typed in.
const OTHER_PROVIDER_VALUE = "__other_provider__";
const toOtherProviderKey = (name: string) => `other(${name.trim()})`;
export const isOtherProvider = (providerId?: string) => !!providerId && /^other\(.+\)$/.test(providerId);

const DEFAULT_BUILT_IN_PROVIDERS: Record<string, ProviderEntry> = {
  openai: { type: "openai", apiKey: "" },
  anthropic: { type: "anthropic", apiKey: "" },
};

export const ensureBuiltInProviders = (providers: Record<string, ProviderEntry>): Record<string, ProviderEntry> => ({
  ...DEFAULT_BUILT_IN_PROVIDERS,
  ...providers,
});

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--solid-border-color, #e2e8f0)",
  borderRadius: "0.5rem",
  padding: "1.25rem",
  background: "var(--solid-card-bg, var(--solid-surface-bg, transparent))",
};

function SearchableSettingsSelect({ value, options, placeholder, disabled, onChange }: {
  value: string;
  options: { label: string; value: string }[];
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const selectedLabel = options.find((option) => option.value === value)?.label;
  const selected = React.useMemo(() => selectedLabel ? { label: selectedLabel, value } : null, [selectedLabel, value]);
  const suggestions = options.filter((option) =>
    `${option.label} ${option.value}`.toLowerCase().includes(query.trim().toLowerCase()));

  return <SolidAutocomplete
    className="solid-standard-autocomplete w-full"
    value={selected}
    suggestions={suggestions}
    completeMethod={({ query: next }) => setQuery(next)}
    onChange={(event) => onChange(event.value?.value ?? "")}
    field="label"
    placeholder={placeholder}
    disabled={disabled}
    dropdown
    forceSelection
    portal
  />;
}


interface ProviderModalProps {
  visible: boolean;
  onHide: () => void;
  providers: Record<string, ProviderEntry>;
  onProvidersChange: (providers: Record<string, ProviderEntry>) => void;
  editKey?: string | null; // null = add mode, string = edit mode
}

const ProviderModal = ({ visible, onHide, providers, onProvidersChange, editKey }: ProviderModalProps) => {
  const isEdit = !!editKey;
  const existingEntry = isEdit ? providers[editKey] : null;

  const [providerType, setProviderType] = useState(existingEntry?.type ?? "");
  const [providerName, setProviderName] = useState(editKey && !BUILT_IN_TYPES.includes(editKey) ? editKey : "");
  const [providerBaseUrl, setProviderBaseUrl] = useState(existingEntry?.baseUrl ?? "");
  const [providerApiKey, setProviderApiKey] = useState(existingEntry?.apiKey ?? "");
  const [providerRegion, setProviderRegion] = useState(existingEntry?.region ?? "");
  const [otherProviderName, setOtherProviderName] = useState("");
  const { catalog, loading: catalogLoading, error: catalogError } = useModelsDevCatalog();

  const isCompatible = COMPATIBLE_TYPES.includes(providerType);
  const isBedrock = providerType === BEDROCK_TYPE;
  const catalogProviders = Object.entries(catalog ?? {})
    .filter(([id]) => !providers[id])
    .map(([id, provider]) => ({ label: provider.name ? `${provider.name} (${id})` : id, value: id }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Reset state when modal opens with new data
  React.useEffect(() => {
    if (visible) {
      const entry = editKey ? providers[editKey] : null;
      setProviderType(entry?.type ?? "");
      setProviderName(editKey && !BUILT_IN_TYPES.includes(editKey) ? editKey : "");
      setProviderBaseUrl(entry?.baseUrl ?? "");
      setProviderApiKey(entry?.apiKey ?? "");
      setProviderRegion(entry?.region ?? "");
      setOtherProviderName("");
    }
  }, [visible, editKey]);

  // In add mode, only show addable types (built-ins are always pre-added)
  // In edit mode, show all types but lock the value
  const isOtherSelected = !isEdit && providerName === OTHER_PROVIDER_VALUE;
  const providerNameOptions = [...catalogProviders, { label: "Other", value: OTHER_PROVIDER_VALUE }];
  const hasValidCompatibleName = isEdit
    ? !!providerName.trim()
    : isOtherSelected
      ? !!otherProviderName.trim() && !providers[toOtherProviderKey(otherProviderName)]
      : catalogProviders.some((provider) => provider.value === providerName);

  const typeOptions = isEdit
    ? PROVIDER_TYPE_OPTIONS
    : PROVIDER_TYPE_OPTIONS.filter((opt) => ADDABLE_TYPES.includes(opt.value));

  const handleSave = () => {
    if (!providerType) return;

    let key: string;
    const entry: ProviderEntry = { type: providerType, apiKey: providerApiKey };

    if (isCompatible) {
      if (!hasValidCompatibleName || !providerBaseUrl.trim()) return;
      key = isOtherSelected ? toOtherProviderKey(otherProviderName) : providerName.trim();
      entry.baseUrl = providerBaseUrl.trim();
    } else if (isBedrock) {
      if (!providerName.trim() || !providerRegion.trim()) return;
      key = providerName.trim();
      entry.region = providerRegion.trim();
    } else {
      key = providerType;
    }

    // In add mode, don't overwrite existing
    if (!isEdit && providers[key]) return;

    const next = { ...providers };

    // If editing and key changed (shouldn't happen for built-in), remove old
    if (isEdit && editKey !== key) {
      delete next[editKey!];
    }

    next[key] = entry;
    onProvidersChange(next);
    onHide();
  };

  const handleRemove = () => {
    if (!editKey) return;
    const next = { ...providers };
    delete next[editKey];
    onProvidersChange(next);
    onHide();
  };

  const canSave = !!providerType && (isBedrock
    ? !!providerName.trim() && !!providerRegion.trim()
    : !isCompatible || (hasValidCompatibleName && !!providerBaseUrl.trim()));

  return (
    <SolidDialog open={visible} onOpenChange={(open) => !open && onHide()} style={{ width: "500px" }}>
      <SolidDialogHeader>
        <SolidDialogTitle>
          {isEdit
            ? `Edit Provider — ${BUILT_IN_TYPES.includes(editKey!) ? PROVIDER_TYPE_OPTIONS.find((o) => o.value === editKey)?.label : editKey}`
            : "Add Provider"}
        </SolidDialogTitle>
      </SolidDialogHeader>
      <SolidDialogBody>
        <div className="flex flex-col gap-4">
          {!(isEdit && BUILT_IN_TYPES.includes(editKey!)) && (
            <div>
              <label className="form-field-label">Provider Type</label>
              <SearchableSettingsSelect
                value={providerType}
                options={typeOptions}
                onChange={(next) => {
                  setProviderType(next);
                  if (!isEdit) {
                    setProviderName(next === BEDROCK_TYPE && !providers[BEDROCK_DEFAULT_NAME] ? BEDROCK_DEFAULT_NAME : "");
                    setProviderBaseUrl("");
                    setProviderRegion("");
                    setOtherProviderName("");
                  }
                }}
                placeholder="Select Provider Type"
                disabled={isEdit}
              />
            </div>
          )}
          {isCompatible && (
            <>
              {!isEdit && (
                <div>
                  <label className="form-field-label">Provider Name</label>
                  <SearchableSettingsSelect
                    options={providerNameOptions}
                    placeholder={catalogLoading ? "Loading providers..." : "Select Provider"}
                    value={providerName}
                    onChange={(next) => {
                      setProviderName(next);
                      if (next === OTHER_PROVIDER_VALUE) {
                        setProviderBaseUrl("");
                        return;
                      }
                      setOtherProviderName("");
                      const provider = catalog?.[next];
                      const matchingAdapter = providerType === "openai-compatible"
                        ? "@ai-sdk/openai-compatible" : "@ai-sdk/anthropic";
                      setProviderBaseUrl(provider?.npm === matchingAdapter ? provider.api ?? "" : "");
                    }}
                    disabled={!providerType || catalogLoading}
                  />
                  {isOtherSelected && (
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-color-secondary">other (</span>
                      <SolidInput
                        placeholder="e.g. Runpod"
                        value={otherProviderName}
                        // ":" separates provider and model in agent model keys, and ")" closes the name.
                        onChange={(e) => setOtherProviderName(e.target.value.replace(/[:()]/g, ""))}
                        className="w-full"
                        aria-label="Other provider name"
                      />
                      <span className="text-color-secondary">)</span>
                    </div>
                  )}
                  {isOtherSelected && !!otherProviderName.trim() && providers[toOtherProviderKey(otherProviderName)] && (
                    <small className="text-color-secondary">{toOtherProviderKey(otherProviderName)} already exists.</small>
                  )}
                  {catalogError && <small className="text-color-secondary">Could not load providers from models.dev. Choose "Other" to name the provider.</small>}                </div>
              )}
              <div>
                <label className="form-field-label">Base URL</label>
                <SolidInput
                  placeholder="https://api.example.com/v1"
                  value={providerBaseUrl}
                  onChange={(e) => setProviderBaseUrl(e.target.value)}
                  className="w-full"
                />
              </div>
            </>
          )}
          {isBedrock && (
            <>
              {!isEdit && (
                <div>
                  <label className="form-field-label">Provider Name</label>
                  <SolidInput
                    placeholder={BEDROCK_DEFAULT_NAME}
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              <div>
                <label className="form-field-label">Region</label>
                <SolidInput
                  placeholder="us-west-2"
                  value={providerRegion}
                  onChange={(e) => setProviderRegion(e.target.value)}
                  className="w-full"
                />
                <small className="text-color-secondary text-xs">Use a Bedrock API key below. Models are called through the Bedrock Converse API.</small>
              </div>
            </>
          )}
          <div>
            <label className="form-field-label">API Key</label>
            <SolidInput
              type="password"
              value={providerApiKey}
              onChange={(e) => setProviderApiKey(e.target.value)}
              className="w-full"
            />
          </div>
          {isEdit && (
            <div
              role="note"
              style={{
                padding: "0.625rem 0.75rem",
                border: "1px solid var(--solid-info-border-color, rgba(147, 51, 234, 0.3))",
                borderRadius: "0.5rem",
                background: "var(--solid-info-bg, rgba(147, 51, 234, 0.1))",
                color: "var(--solid-info-color, var(--solid-text-color, inherit))",
                fontSize: "0.8125rem",
                lineHeight: 1.4,
              }}
            >
              Restart all agents using this provider for changes to take effect.
            </div>
          )}
        </div>
      </SolidDialogBody>
      <SolidDialogFooter>
        <div className="flex justify-between w-full">
          <div>
            {isEdit && !BUILT_IN_TYPES.includes(editKey!) && (
              <SolidButton variant="ghost" onClick={handleRemove} style={{ color: "var(--solid-danger-color, #ef4444)" }}>
                Remove
              </SolidButton>
            )}
          </div>
          <div className="flex gap-2">
            <SolidButton variant="outline" onClick={onHide}>
              Cancel
            </SolidButton>
            <SolidButton onClick={handleSave} disabled={!canSave}>
              {isEdit ? "Save" : "Add"}
            </SolidButton>
          </div>
        </div>
      </SolidDialogFooter>
    </SolidDialog>
  );
};

// --- Providers Tab (List View) ---

interface ProvidersTabProps {
  providers: Record<string, ProviderEntry>;
  onProvidersChange: (providers: Record<string, ProviderEntry>) => void;
  showAddModal?: boolean;
  onAddModalClose?: () => void;
}

export const ProvidersTab = ({ providers, onProvidersChange, showAddModal, onAddModalClose }: ProvidersTabProps) => {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Ensure built-in providers are always present
  const allProviders = ensureBuiltInProviders(providers);

  // Open modal when parent triggers add
  React.useEffect(() => {
    if (showAddModal) {
      setEditKey(null);
      setModalVisible(true);
    }
  }, [showAddModal]);

  const providerEntries = Object.entries(allProviders);

  const handleRowClick = (key: string) => {
    setEditKey(key);
    setModalVisible(true);
  };

  return (
    <>
      <div className="solid-simple-table">
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem" }}>Name</th>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem" }}>Type</th>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem" }}>API Key</th>
              <th style={{ textAlign: "left", padding: "0.75rem 1rem" }}>Base URL / Region</th>
            </tr>
          </thead>
          <tbody>
            {providerEntries.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "2rem 1rem", opacity: 0.5 }}>
                  No providers configured.
                </td>
              </tr>
            )}
            {providerEntries.map(([key, entry]) => {
              const typeLabel = PROVIDER_TYPE_OPTIONS.find((o) => o.value === entry.type)?.label ?? entry.type;
              const isBuiltIn = BUILT_IN_TYPES.includes(key);
              const displayName = isBuiltIn ? typeLabel : key;
              const maskedKey = entry.apiKey ? "\u2022".repeat(Math.min(entry.apiKey.length, 8)) : "-";

              return (
                <tr
                  key={key}
                  onClick={() => handleRowClick(key)}
                  style={{ cursor: "pointer" }}
                  className="solid-table-row-hover"
                >
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{displayName}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{typeLabel}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{maskedKey}</td>
                  <td style={{ padding: "0.75rem 1rem" }}>{entry.baseUrl || entry.region || "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ProviderModal
        visible={modalVisible}
        onHide={() => {
          setModalVisible(false);
          setEditKey(null);
          onAddModalClose?.();
        }}
        providers={allProviders}
        onProvidersChange={onProvidersChange}
        editKey={editKey}
      />
    </>
  );
};

// --- Model Config Tab (used for Intelligent Model & Fast Model) ---

interface ModelConfigTabProps {
  modelEntry: ModelEntry;
  providers: Record<string, ProviderEntry>;
  onModelEntryChange: (entry: ModelEntry) => void;
}

const OTHER_MODEL_VALUE = "__other__";

export const ModelConfigTab = ({ modelEntry, providers, onModelEntryChange }: ModelConfigTabProps) => {
  const providerType = providers[modelEntry.providerId]?.type;
  // Look up models.dev by provider key first (e.g. "groq", "openrouter"), then by built-in type.
  const { models, loading, error } = useModelsDevModels([
    modelEntry.providerId,
    providerType && BUILT_IN_TYPES.includes(providerType) ? providerType : undefined,
  ]);
  const [otherSelected, setOtherSelected] = useState(false);
  const isOtherProviderSelected = isOtherProvider(modelEntry.providerId);
  const isKnownModel = models.some((m) => m.id === modelEntry.model);
  const showOther = otherSelected || (!loading && !!modelEntry.model && !isKnownModel);
  const modelOptions = [
    ...models.map((m) => ({ label: m.name === m.id ? m.id : `${m.name} (${m.id})`, value: m.id })),
    { label: "Other", value: OTHER_MODEL_VALUE },
  ];
  const selectedModelValue = showOther ? OTHER_MODEL_VALUE : modelEntry.model || "";
  const providerOptions = Object.entries(providers).map(([key, entry]) => {
    const typeLabel = PROVIDER_TYPE_OPTIONS.find((o) => o.value === entry.type)?.label ?? entry.type;
    const label = BUILT_IN_TYPES.includes(key) ? typeLabel : `${key} (${typeLabel})`;
    return { label, value: key };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="solid-ai-model-config-card" style={{ ...cardStyle, width: "50%" }}>
        <p className="solid-settings-subheading">Model Config</p>
        <div className="flex flex-col gap-4 mt-4">
          <div>
            <label className="form-field-label">Provider</label>
            <SearchableSettingsSelect
              value={modelEntry.providerId}
              options={providerOptions}
              onChange={(next) => {
                setOtherSelected(false);
                onModelEntryChange({ ...modelEntry, providerId: next, model: "" });
              }}
              placeholder="Select Provider"
            />
          </div>
          <div>
            <label className="form-field-label">Model</label>
            {isOtherProviderSelected ? (
              <SolidInput
                className="w-full"
                value={modelEntry.model || ""}
                onChange={(e) => onModelEntryChange({ ...modelEntry, model: e.target.value })}
                placeholder="Enter model ID, e.g. my-custom-model"
              />
            ) : <>
            <SearchableSettingsSelect
              value={selectedModelValue}
              options={modelOptions}
              onChange={(next) => {
                if (next === OTHER_MODEL_VALUE) {
                  setOtherSelected(true);
                  if (isKnownModel) onModelEntryChange({ ...modelEntry, model: "" });
                  return;
                }
                setOtherSelected(false);
                onModelEntryChange({ ...modelEntry, model: next });
              }}
              placeholder={loading ? "Loading models..." : "Select Model"}
              disabled={!modelEntry.providerId || loading}
            />
            {error && (
              <small className="text-color-secondary">Could not load models from models.dev. Choose "Other" to enter a model ID.</small>
            )}
            {showOther && (
              <SolidInput
                className="w-full mt-2"
                value={modelEntry.model || ""}
                onChange={(e) => onModelEntryChange({ ...modelEntry, model: e.target.value })}
                placeholder="Enter model ID, e.g. my-custom-model"
              />
            )}
            </>}
          </div>
        </div>
      </div>

      <div className="solid-ai-model-config-card" style={{ ...cardStyle, width: "50%" }}>
        <p className="solid-settings-subheading">Behavior</p>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center gap-2">
            <SolidSwitch
              checked={modelEntry.behavior.streaming}
              onChange={(val) =>
                onModelEntryChange({ ...modelEntry, behavior: { ...modelEntry.behavior, streaming: val } })
              }
            />
            <label className="form-field-label" style={{ marginBottom: 0 }}>Streaming</label>
          </div>
          <div>
            <label className="form-field-label">Custom Params (JSON)</label>
            <SolidTextarea
              value={modelEntry.behavior.custom}
              onChange={(e) =>
                onModelEntryChange({ ...modelEntry, behavior: { ...modelEntry.behavior, custom: e.target.value } })
              }
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
