import React, { useState } from "react";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogTitle,
  SolidInput,
  SolidSelect,
  SolidSwitch,
  SolidTextarea,
} from "../../../shad-cn-ui";


export interface ModelBehavior {
  streaming: boolean;
  custom: string;
}

export interface ProviderEntry {
  type: string;
  apiKey: string;
  baseUrl?: string;
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
];

const COMPATIBLE_TYPES = ["openai-compatible", "anthropic-compatible"];

const BUILT_IN_TYPES = ["openai", "anthropic"];

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

  const isCompatible = COMPATIBLE_TYPES.includes(providerType);

  // Reset state when modal opens with new data
  React.useEffect(() => {
    if (visible) {
      const entry = editKey ? providers[editKey] : null;
      setProviderType(entry?.type ?? "");
      setProviderName(editKey && !BUILT_IN_TYPES.includes(editKey) ? editKey : "");
      setProviderBaseUrl(entry?.baseUrl ?? "");
      setProviderApiKey(entry?.apiKey ?? "");
    }
  }, [visible, editKey]);

  // In add mode, only show compatible types (built-ins are always pre-added)
  // In edit mode, show all types but lock the value
  const typeOptions = isEdit
    ? PROVIDER_TYPE_OPTIONS
    : PROVIDER_TYPE_OPTIONS.filter((opt) => COMPATIBLE_TYPES.includes(opt.value));

  const handleSave = () => {
    if (!providerType) return;

    let key: string;
    const entry: ProviderEntry = { type: providerType, apiKey: providerApiKey };

    if (isCompatible) {
      if (!providerName.trim()) return;
      key = providerName.trim();
      entry.baseUrl = providerBaseUrl;
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

  const canSave = providerType && (isCompatible ? providerName.trim() : true);

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
        <div className="flex flex-column gap-3">
          {!(isEdit && BUILT_IN_TYPES.includes(editKey!)) && (
            <div>
              <label className="form-field-label">Provider Type</label>
              <SolidSelect
                className="w-full"
                value={providerType}
                options={typeOptions}
                onChange={(e) => {
                  setProviderType(e.value);
                  if (!isEdit) {
                    setProviderName("");
                    setProviderBaseUrl("");
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
                  <label className="form-field-label">Name (unique identifier)</label>
                  <SolidInput
                    placeholder="e.g. openrouter, together-ai"
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              <div>
                <label className="form-field-label">Base URL</label>
                <SolidInput
                  placeholder="https://openrouter.ai/api/v1"
                  value={providerBaseUrl}
                  onChange={(e) => setProviderBaseUrl(e.target.value)}
                  className="w-full"
                />
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
        </div>
      </SolidDialogBody>
      <SolidDialogFooter>
        <div className="flex justify-content-between w-full">
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
              <th style={{ textAlign: "left", padding: "0.75rem 1rem" }}>Base URL</th>
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
                  <td style={{ padding: "0.75rem 1rem" }}>{entry.baseUrl || "-"}</td>
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

export const ModelConfigTab = ({ modelEntry, providers, onModelEntryChange }: ModelConfigTabProps) => {
  const providerOptions = Object.entries(providers).map(([key, entry]) => {
    const typeLabel = PROVIDER_TYPE_OPTIONS.find((o) => o.value === entry.type)?.label ?? entry.type;
    const label = BUILT_IN_TYPES.includes(key) ? typeLabel : `${key} (${typeLabel})`;
    return { label, value: key };
  });

  return (
    <div className="flex flex-column gap-4">
      <div style={{ ...cardStyle, width: "50%" }}>
        <p className="solid-settings-subheading">Model Config</p>
        <div className="flex flex-column gap-3 mt-3">
          <div>
            <label className="form-field-label">Provider</label>
            <SolidSelect
              className="w-full"
              value={modelEntry.providerId}
              options={providerOptions}
              onChange={(e) => onModelEntryChange({ ...modelEntry, providerId: e.value })}
              placeholder="Select Provider"
            />
          </div>
          <div>
            <label className="form-field-label">Model</label>
            <SolidInput
              placeholder="e.g. gpt-4o-mini"
              value={modelEntry.model || ""}
              onChange={(e) => onModelEntryChange({ ...modelEntry, model: e.target.value })}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, width: "50%" }}>
        <p className="solid-settings-subheading">Behavior</p>
        <div className="flex flex-column gap-3 mt-3">
          <div className="flex align-items-center gap-2">
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
