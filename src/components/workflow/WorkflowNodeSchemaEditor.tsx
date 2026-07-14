import React from "react";
import YAML from "yaml";
import { getExtensionComponent } from "../../helpers/registry";
import type {
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

type WorkflowNodeEditorDialogProps = WorkflowNodeSchemaEditorProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
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
    const nextDraft = {
      ...draft,
      [field.path ?? field.key]: nextValue,
    };
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
                  value={draft[field.path ?? field.key]}
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

export function WorkflowNodeEditorDialog({
  open,
  onOpenChange,
  title,
  nodeType,
  value,
  onChange,
  onSubmit,
  readOnly,
}: WorkflowNodeEditorDialogProps) {
  const [draft, setDraft] = React.useState<Record<string, any>>(
    value ?? nodeType.authoring?.defaultConfiguration ?? {},
  );

  React.useEffect(() => {
    setDraft(value ?? nodeType.authoring?.defaultConfiguration ?? {});
  }, [nodeType, value, open]);

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
      </SolidDialogBody>
      {!readOnly && onSubmit ? (
        <SolidDialogFooter>
          <SolidButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </SolidButton>
          <SolidButton onClick={() => onSubmit?.(draft)}>Save</SolidButton>
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
