import React from "react";
import YAML from "yaml";
import { getExtensionComponent } from "../../helpers/registry";
import type {
  WorkflowNodeChildSlotDefinition,
  WorkflowNodeConfigurationFieldDefinition,
  WorkflowNodeMetadataResponse,
} from "../../types/workflow-node";
import {
  SolidButton,
  SolidCodeEditor,
  SolidDialog,
  SolidDialogBody,
  SolidDialogFooter,
  SolidInput,
  SolidNumberInput,
  SolidPanel,
  SolidSelect,
  SolidSwitch,
  SolidTag,
  SolidTextarea,
} from "../shad-cn-ui";

type WorkflowNodeSchemaEditorProps = {
  nodeType: WorkflowNodeMetadataResponse;
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => void;
  onSubmit?: (value: Record<string, any>) => void;
  readOnly?: boolean;
  className?: string;
};

type WorkflowNodeEditorValue = {
  [key: string]: any;
  id: string;
  name?: string;
  description?: string;
  kind: string;
  type: string;
  disabled?: boolean;
  timeoutMs?: number;
  retryPolicy?: Record<string, any>;
  onError?: "fail" | "continue";
  configuration?: Record<string, any>;
  children?: WorkflowNodeEditorValue[];
  nodes?: WorkflowNodeEditorValue[];
  then?: WorkflowNodeEditorValue[];
  else?: WorkflowNodeEditorValue[];
  branches?: Array<{
    id: string;
    name?: string;
    nodes: WorkflowNodeEditorValue[];
  }>;
};

type WorkflowNodeEditorDialogProps = WorkflowNodeSchemaEditorProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  nodeValue?: WorkflowNodeEditorValue;
  onNodeChange?: (value: WorkflowNodeEditorValue) => void;
  onNodeSubmit?: (value: WorkflowNodeEditorValue) => void;
};

type WorkflowNodePaletteProps = {
  nodeTypes: WorkflowNodeMetadataResponse[];
  value?: string;
  onSelect?: (nodeType: WorkflowNodeMetadataResponse) => void;
  className?: string;
};

type FieldEditorProps = {
  nodeType: WorkflowNodeMetadataResponse;
  field: WorkflowNodeConfigurationFieldDefinition;
  value: any;
  readOnly?: boolean;
  onChange: (value: any) => void;
};

function normalizeFieldValue(
  field: WorkflowNodeConfigurationFieldDefinition,
  currentValue: any,
) {
  if (currentValue !== undefined) {
    return currentValue;
  }

  return field.defaultValue;
}

function parseYamlValue(input: string, fallback: any) {
  if (!input.trim()) {
    return {};
  }

  try {
    return YAML.parse(input);
  } catch {
    return fallback;
  }
}

function getPathValue(value: Record<string, any>, pathOrKey: string) {
  return pathOrKey
    .split(".")
    .reduce<any>((current, part) => current?.[part], value);
}

function setPathValue(value: Record<string, any>, pathOrKey: string, nextValue: any) {
  const parts = pathOrKey.split(".");
  if (parts.length === 1) {
    return {
      ...value,
      [pathOrKey]: nextValue,
    };
  }

  const nextRoot = { ...value };
  let cursor: Record<string, any> = nextRoot;
  parts.forEach((part, index) => {
    if (index === parts.length - 1) {
      cursor[part] = nextValue;
      return;
    }

    const existing = cursor[part];
    cursor[part] =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? { ...existing }
        : {};
    cursor = cursor[part];
  });

  return nextRoot;
}

function getSlotCount(node: WorkflowNodeEditorValue, slot: WorkflowNodeChildSlotDefinition) {
  if (slot.kind === "branch-collection") {
    return Array.isArray(node.branches) ? node.branches.length : 0;
  }

  const value = node[slot.key];
  return Array.isArray(value) ? value.length : 0;
}

function renderFieldHint(field: WorkflowNodeConfigurationFieldDefinition) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
      {field.valueType ? <SolidTag>{field.valueType}</SolidTag> : null}
      {field.required ? <SolidTag tone="warn">required</SolidTag> : null}
      {field.expressionAllowed ? <SolidTag>expressions</SolidTag> : null}
      {field.secretAllowed ? <SolidTag tone="success">secret</SolidTag> : null}
    </div>
  );
}

function WorkflowNodeFieldEditor({
  nodeType,
  field,
  value,
  readOnly,
  onChange,
}: FieldEditorProps) {
  const extensionKey =
    field.extensionComponentKey ?? nodeType.ui?.fieldComponentKeys?.[field.key];
  const ExtensionComponent = extensionKey ? getExtensionComponent(extensionKey) : null;

  const normalizedValue = normalizeFieldValue(field, value);

  if (ExtensionComponent) {
    return (
      <ExtensionComponent
        nodeType={nodeType}
        field={field}
        value={normalizedValue}
        onChange={onChange}
        readOnly={readOnly}
      />
    );
  }

  if (field.enumValues?.length) {
    return (
      <SolidSelect
        value={normalizedValue}
        disabled={readOnly}
        options={field.enumValues.map((item) => ({
          label: String(item),
          value: item,
        }))}
        onChange={(event) => onChange(event.value)}
      />
    );
  }

  if (field.valueType === "boolean") {
    return (
      <SolidSwitch
        checked={!!normalizedValue}
        disabled={readOnly}
        onChange={(checked) => onChange(checked)}
      />
    );
  }

  if (field.valueType === "number" || field.valueType === "integer") {
    return (
      <SolidNumberInput
        value={normalizedValue}
        disabled={readOnly}
        onChange={(event) => onChange(event.value)}
      />
    );
  }

  if (
    field.valueType === "object" ||
    field.valueType === "array" ||
    field.valueType === "json" ||
    field.widgetHint === "json-editor" ||
    field.widgetHint === "yaml-editor"
  ) {
    const stringValue =
      typeof normalizedValue === "string"
        ? normalizedValue
        : YAML.stringify(normalizedValue ?? {});

    return (
      <SolidCodeEditor
        language="yaml"
        height="220px"
        readOnly={readOnly}
        value={stringValue}
        onChange={(next) => onChange(parseYamlValue(next ?? "", normalizedValue))}
      />
    );
  }

  if (field.valueType === "any") {
    return (
      <SolidCodeEditor
        language="yaml"
        height="220px"
        readOnly={readOnly}
        value={
          typeof normalizedValue === "string"
            ? normalizedValue
            : YAML.stringify(normalizedValue ?? null)
        }
        onChange={(next) => onChange(parseYamlValue(next ?? "", normalizedValue))}
      />
    );
  }

  if (field.widgetHint === "textarea") {
    return (
      <SolidTextarea
        value={normalizedValue ?? ""}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <SolidInput
      value={normalizedValue ?? ""}
      disabled={readOnly}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function WorkflowNodeSchemaEditor({
  nodeType,
  value,
  onChange,
  onSubmit,
  readOnly,
  className,
}: WorkflowNodeSchemaEditorProps) {
  const [draft, setDraft] = React.useState<Record<string, any>>(
    value ?? nodeType.authoring?.defaultConfiguration ?? {},
  );

  React.useEffect(() => {
    setDraft(value ?? nodeType.authoring?.defaultConfiguration ?? {});
  }, [nodeType, value]);

  const fields = nodeType.authoring?.configurationFields ?? [];
  const groupOrder = nodeType.ui?.layoutHints?.groupOrder ?? [];
  const groupedFields = fields.reduce<Record<string, WorkflowNodeConfigurationFieldDefinition[]>>(
    (acc, field) => {
      const group = field.group ?? "General";
      acc[group] = acc[group] ?? [];
      acc[group].push(field);
      return acc;
    },
    {},
  );

  const orderedGroups = Object.keys(groupedFields).sort((left, right) => {
    const leftIndex = groupOrder.indexOf(left);
    const rightIndex = groupOrder.indexOf(right);
    if (leftIndex >= 0 && rightIndex >= 0) {
      return leftIndex - rightIndex;
    }
    if (leftIndex >= 0) {
      return -1;
    }
    if (rightIndex >= 0) {
      return 1;
    }
    return left.localeCompare(right);
  });

  const updateField = (field: WorkflowNodeConfigurationFieldDefinition, nextValue: any) => {
    const nextDraft = setPathValue(draft, field.path ?? field.key, nextValue);
    setDraft(nextDraft);
    onChange?.(nextDraft);
  };

  return (
    <div className={className} style={{ display: "grid", gap: "1rem" }}>
      {orderedGroups.map((group) => (
        <SolidPanel key={group} header={group}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {groupedFields[group].map((field) => (
              <div key={field.key} style={{ display: "grid", gap: "0.5rem" }}>
                <div style={{ display: "grid", gap: "0.35rem" }}>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    <strong>{field.label ?? field.key}</strong>
                    {renderFieldHint(field)}
                  </div>
                  {field.description ? (
                    <div style={{ opacity: 0.8 }}>{field.description}</div>
                  ) : null}
                </div>
                <WorkflowNodeFieldEditor
                  nodeType={nodeType}
                  field={field}
                  value={getPathValue(draft, field.path ?? field.key)}
                  readOnly={readOnly}
                  onChange={(nextValue) => updateField(field, nextValue)}
                />
              </div>
            ))}
          </div>
        </SolidPanel>
      ))}

      {!readOnly && onSubmit ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <SolidButton onClick={() => onSubmit(draft)}>Save</SolidButton>
        </div>
      ) : null}
    </div>
  );
}

function WorkflowNodeCommonFields({
  nodeType,
  draft,
  readOnly,
  onChange,
}: {
  nodeType: WorkflowNodeMetadataResponse;
  draft: WorkflowNodeEditorValue;
  readOnly?: boolean;
  onChange: (value: WorkflowNodeEditorValue) => void;
}) {
  const authoring = nodeType.authoring;
  const update = (patch: Partial<WorkflowNodeEditorValue>) => {
    onChange({ ...draft, ...patch });
  };

  return (
    <SolidPanel header="Node">
      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          <div style={{ display: "grid", gap: "0.45rem" }}>
            <strong>Id</strong>
            <SolidInput
              value={draft.id ?? ""}
              disabled={readOnly}
              onChange={(event) => update({ id: event.target.value })}
            />
          </div>
          <div style={{ display: "grid", gap: "0.45rem" }}>
            <strong>Type</strong>
            <SolidInput value={draft.type ?? nodeType.type} disabled />
          </div>
        </div>

        {authoring?.supportsName !== false ? (
          <div style={{ display: "grid", gap: "0.45rem" }}>
            <strong>Name</strong>
            <SolidInput
              value={draft.name ?? ""}
              disabled={readOnly}
              onChange={(event) => update({ name: event.target.value })}
            />
          </div>
        ) : null}

        {authoring?.supportsDescription ? (
          <div style={{ display: "grid", gap: "0.45rem" }}>
            <strong>Description</strong>
            <SolidTextarea
              value={draft.description ?? ""}
              disabled={readOnly}
              onChange={(event) => update({ description: event.target.value })}
            />
          </div>
        ) : null}

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <SolidTag>{nodeType.kind}</SolidTag>
          {nodeType.category ? <SolidTag>{nodeType.category}</SolidTag> : null}
          {nodeType.ui?.defaultEditorMode ? (
            <SolidTag>{nodeType.ui.defaultEditorMode}</SolidTag>
          ) : null}
        </div>
      </div>
    </SolidPanel>
  );
}

function WorkflowNodeRuntimeFields({
  nodeType,
  draft,
  readOnly,
  onChange,
}: {
  nodeType: WorkflowNodeMetadataResponse;
  draft: WorkflowNodeEditorValue;
  readOnly?: boolean;
  onChange: (value: WorkflowNodeEditorValue) => void;
}) {
  const authoring = nodeType.authoring;
  const hasRuntimeFields =
    authoring?.supportsDisableToggle ||
    authoring?.supportsTimeoutMs ||
    authoring?.supportsOnError ||
    authoring?.supportsRetryPolicy;

  if (!hasRuntimeFields) {
    return null;
  }

  const update = (patch: Partial<WorkflowNodeEditorValue>) => {
    onChange({ ...draft, ...patch });
  };

  return (
    <SolidPanel header="Runtime">
      <div style={{ display: "grid", gap: "1rem" }}>
        {authoring?.supportsDisableToggle ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <div>
              <strong>Disabled</strong>
              <div style={{ opacity: 0.75 }}>Skip this node during execution.</div>
            </div>
            <SolidSwitch
              checked={!!draft.disabled}
              disabled={readOnly}
              onChange={(checked) => update({ disabled: checked || undefined })}
            />
          </div>
        ) : null}

        <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {authoring?.supportsTimeoutMs ? (
            <div style={{ display: "grid", gap: "0.45rem" }}>
              <strong>Timeout (ms)</strong>
              <SolidNumberInput
                value={draft.timeoutMs}
                disabled={readOnly}
                onChange={(event) => update({ timeoutMs: event.value ?? undefined })}
              />
            </div>
          ) : null}

          {authoring?.supportsOnError ? (
            <div style={{ display: "grid", gap: "0.45rem" }}>
              <strong>On error</strong>
              <SolidSelect
                value={draft.onError ?? "fail"}
                disabled={readOnly}
                options={[
                  { label: "Fail workflow", value: "fail" },
                  { label: "Continue", value: "continue" },
                ]}
                onChange={(event) => update({ onError: event.value })}
              />
            </div>
          ) : null}
        </div>

        {authoring?.supportsRetryPolicy ? (
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div style={{ display: "grid", gap: "0.45rem" }}>
              <strong>Max retries</strong>
              <SolidNumberInput
                value={draft.retryPolicy?.maxRetries}
                disabled={readOnly}
                onChange={(event) =>
                  update({
                    retryPolicy: {
                      ...(draft.retryPolicy ?? {}),
                      maxRetries: event.value ?? undefined,
                    },
                  })
                }
              />
            </div>
            <div style={{ display: "grid", gap: "0.45rem" }}>
              <strong>Retry delay (ms)</strong>
              <SolidNumberInput
                value={draft.retryPolicy?.delayMs}
                disabled={readOnly}
                onChange={(event) =>
                  update({
                    retryPolicy: {
                      ...(draft.retryPolicy ?? {}),
                      delayMs: event.value ?? undefined,
                    },
                  })
                }
              />
            </div>
          </div>
        ) : null}
      </div>
    </SolidPanel>
  );
}

function WorkflowNodeChildSlotsSummary({
  nodeType,
  draft,
}: {
  nodeType: WorkflowNodeMetadataResponse;
  draft: WorkflowNodeEditorValue;
}) {
  const childSlots = nodeType.authoring?.childSlots ?? [];
  if (!childSlots.length) {
    return null;
  }

  return (
    <SolidPanel header="Topology Slots">
      <div style={{ display: "grid", gap: "0.65rem" }}>
        {childSlots.map((slot) => (
          <div
            key={slot.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "0.65rem 0.75rem",
              border: "1px solid var(--surface-border, #dbe3f0)",
              borderRadius: "0.5rem",
              background: "rgba(248, 250, 252, 0.68)",
            }}
          >
            <div style={{ display: "grid", gap: "0.2rem" }}>
              <strong>{slot.label ?? slot.key}</strong>
              <span style={{ opacity: 0.76 }}>
                {slot.description ??
                  "Use the topology canvas to add, reorder, or remove child nodes."}
              </span>
            </div>
            <SolidTag>{getSlotCount(draft, slot)}</SolidTag>
          </div>
        ))}
        <div style={{ opacity: 0.75 }}>
          Child node membership is edited from the topology canvas. This dialog edits the
          control node itself.
        </div>
      </div>
    </SolidPanel>
  );
}

function WorkflowNodeFullEditor({
  nodeType,
  value,
  onChange,
  readOnly,
}: {
  nodeType: WorkflowNodeMetadataResponse;
  value: WorkflowNodeEditorValue;
  onChange: (value: WorkflowNodeEditorValue) => void;
  readOnly?: boolean;
}) {
  const configuration = value.configuration ?? {};

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <WorkflowNodeCommonFields
        nodeType={nodeType}
        draft={value}
        readOnly={readOnly}
        onChange={onChange}
      />
      <WorkflowNodeSchemaEditor
        nodeType={nodeType}
        value={configuration}
        readOnly={readOnly}
        onChange={(nextConfiguration) =>
          onChange({
            ...value,
            configuration: nextConfiguration,
          })
        }
      />
      <WorkflowNodeRuntimeFields
        nodeType={nodeType}
        draft={value}
        readOnly={readOnly}
        onChange={onChange}
      />
      <WorkflowNodeChildSlotsSummary nodeType={nodeType} draft={value} />
    </div>
  );
}

export function WorkflowNodeEditorDialog({
  open,
  onOpenChange,
  title,
  nodeType,
  value,
  onChange,
  onSubmit,
  readOnly,
  nodeValue,
  onNodeChange,
  onNodeSubmit,
}: WorkflowNodeEditorDialogProps) {
  const [draft, setDraft] = React.useState<Record<string, any>>(
    value ?? nodeValue?.configuration ?? nodeType.authoring?.defaultConfiguration ?? {},
  );
  const [nodeDraft, setNodeDraft] = React.useState<WorkflowNodeEditorValue>(
    nodeValue ?? {
      id: "",
      type: nodeType.type,
      kind: nodeType.kind,
      configuration: value ?? nodeType.authoring?.defaultConfiguration ?? {},
    },
  );

  React.useEffect(() => {
    setDraft(value ?? nodeValue?.configuration ?? nodeType.authoring?.defaultConfiguration ?? {});
    setNodeDraft(
      nodeValue ?? {
        id: "",
        type: nodeType.type,
        kind: nodeType.kind,
        configuration: value ?? nodeType.authoring?.defaultConfiguration ?? {},
      },
    );
  }, [nodeType, nodeValue, value, open]);

  const editorComponentKey = nodeType.ui?.editorComponentKey;
  const CustomEditor = editorComponentKey ? getExtensionComponent(editorComponentKey) : null;
  const useCustomEditor = !!CustomEditor && nodeType.ui?.defaultEditorMode === "custom";
  const isFullNodeMode = !!nodeValue || !!onNodeSubmit || !!onNodeChange;

  const handleNodeChange = (nextValue: WorkflowNodeEditorValue) => {
    setNodeDraft(nextValue);
    setDraft(nextValue.configuration ?? {});
    onNodeChange?.(nextValue);
  };

  return (
    <SolidDialog
      open={open}
      onOpenChange={onOpenChange}
      header={title ?? nodeType.label ?? nodeType.type}
      className={`solid-workflow-node-editor-dialog solid-workflow-node-editor-dialog--${nodeType.ui?.modalSize ?? "lg"}`}
      style={{
        width: nodeType.ui?.modalSize === "full" ? "96vw" : "min(1100px, 92vw)",
        maxWidth: "96vw",
      }}
    >
      <SolidDialogBody>
        {useCustomEditor ? (
          <CustomEditor
            nodeType={nodeType}
            value={isFullNodeMode ? nodeDraft : draft}
            nodeValue={nodeDraft}
            configuration={draft}
            onChange={isFullNodeMode ? handleNodeChange : setDraft}
            readOnly={readOnly}
          />
        ) : isFullNodeMode ? (
          <WorkflowNodeFullEditor
            nodeType={nodeType}
            value={nodeDraft}
            onChange={handleNodeChange}
            readOnly={readOnly}
          />
        ) : (
          <WorkflowNodeSchemaEditor
            nodeType={nodeType}
            value={draft}
            onChange={(nextValue) => {
              setDraft(nextValue);
              onChange?.(nextValue);
            }}
            onSubmit={(nextValue) => {
              setDraft(nextValue);
              onSubmit?.(nextValue);
            }}
            readOnly={readOnly}
          />
        )}
      </SolidDialogBody>
      {!readOnly && (onSubmit || onNodeSubmit) ? (
        <SolidDialogFooter>
          <SolidButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </SolidButton>
          <SolidButton
            onClick={() => {
              if (isFullNodeMode) {
                onNodeSubmit?.(nodeDraft);
              } else {
                onSubmit?.(draft);
              }
            }}
          >
            Save
          </SolidButton>
        </SolidDialogFooter>
      ) : null}
    </SolidDialog>
  );
}

export function WorkflowNodePalette({
  nodeTypes,
  value,
  onSelect,
  className,
}: WorkflowNodePaletteProps) {
  const [query, setQuery] = React.useState("");

  const filteredNodeTypes = nodeTypes.filter((nodeType) => {
    const haystack = [
      nodeType.type,
      nodeType.label,
      nodeType.description,
      nodeType.category,
      nodeType.subcategory,
      ...(nodeType.tags ?? []),
      ...(nodeType.authoring?.searchableText ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className={className} style={{ display: "grid", gap: "1rem" }}>
      <SolidInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search node types"
      />
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {filteredNodeTypes.map((nodeType) => (
          <button
            key={nodeType.type}
            type="button"
            onClick={() => onSelect?.(nodeType)}
            style={{
              textAlign: "left",
              border: value === nodeType.type
                ? "1px solid var(--primary-color, #2563eb)"
                : "1px solid var(--surface-border, #e5e7eb)",
              borderRadius: "0.75rem",
              padding: "0.9rem 1rem",
              background: "var(--surface-card, #fff)",
              display: "grid",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <strong>{nodeType.label ?? nodeType.type}</strong>
              {nodeType.category ? <SolidTag>{nodeType.category}</SolidTag> : null}
              <SolidTag>{nodeType.kind}</SolidTag>
            </div>
            {nodeType.description ? (
              <div style={{ opacity: 0.8 }}>{nodeType.description}</div>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
