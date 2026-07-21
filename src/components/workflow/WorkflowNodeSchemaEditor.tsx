import React from "react";
import YAML from "yaml";
import {
  ArrowLeft,
  CircleHelp,
  Filter,
  GitBranch,
  Plus,
  Search,
  Trash2,
  Workflow,
  X,
  Zap,
} from "lucide-react";
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
  SolidSelect,
  SolidSwitch,
  SolidTabGroup,
  SolidTag,
  SolidTextarea,
  SolidTooltip,
  SolidTooltipContent,
  SolidTooltipTrigger,
  SolidIcon,
  normalizeSolidIconName,
} from "../shad-cn-ui";
import "./WorkflowNodeSchemaEditor.css";

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
  tasks?: WorkflowNodeEditorValue[];
  then?: WorkflowNodeEditorValue[];
  else?: WorkflowNodeEditorValue[];
  defaults?: WorkflowNodeEditorValue[];
  cases?: Record<string, WorkflowNodeEditorValue[]>;
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

type WorkflowAddNodeDialogProps = {
  open: boolean;
  nodeTypes: WorkflowNodeMetadataResponse[];
  onOpenChange: (open: boolean) => void;
  createNodeValue: (nodeType: WorkflowNodeMetadataResponse) => WorkflowNodeEditorValue;
  onSubmit: (nodeValue: WorkflowNodeEditorValue) => void;
};

type FieldEditorProps = {
  nodeType: WorkflowNodeMetadataResponse;
  field: WorkflowNodeConfigurationFieldDefinition;
  value: any;
  readOnly?: boolean;
  onChange: (value: any) => void;
};

const EMPTY_YAML_OBJECT = {};
const EMPTY_YAML_ARRAY: any[] = [];

function normalizeFieldValue(
  field: WorkflowNodeConfigurationFieldDefinition,
  currentValue: any,
) {
  if (currentValue !== undefined) {
    return currentValue;
  }

  return field.defaultValue;
}

function stringifyYamlEditorValue(value: any, emptyValue: any) {
  if (typeof value === "string") {
    return value;
  }

  return YAML.stringify(value ?? emptyValue);
}

function getYamlValueSignature(value: any) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
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
  if (slot.kind === "case-collection") {
    return Object.keys(node.cases ?? {}).length;
  }

  const value = node[slot.key];
  return Array.isArray(value) ? value.length : 0;
}

function hasRuntimeFields(nodeType: WorkflowNodeMetadataResponse) {
  const authoring = nodeType.authoring;
  return Boolean(
    authoring?.supportsDisableToggle ||
      authoring?.supportsTimeoutMs ||
      authoring?.supportsOnError ||
      authoring?.supportsRetryPolicy,
  );
}

function getNodeTypeIconName(nodeType: WorkflowNodeMetadataResponse) {
  return nodeType.ui?.icon ?? nodeType.icon;
}

function WorkflowNodeTypeIcon({
  nodeType,
  size = 18,
}: {
  nodeType: WorkflowNodeMetadataResponse;
  size?: number;
}) {
  const iconName = getNodeTypeIconName(nodeType);
  const normalizedIconName = normalizeSolidIconName(iconName);

  if (normalizedIconName) {
    return <SolidIcon name={normalizedIconName} size={size} aria-hidden />;
  }

  if (nodeType.kind === "control") {
    return <GitBranch size={size} strokeWidth={1.9} />;
  }

  if (nodeType.kind === "subflow") {
    return <Workflow size={size} strokeWidth={1.9} />;
  }

  return <Zap size={size} strokeWidth={1.9} />;
}

function getWorkflowNodeIconStyle(
  nodeType: WorkflowNodeMetadataResponse,
): React.CSSProperties | undefined {
  const backgroundColor = nodeType.ui?.iconBackgroundColor;
  const color = nodeType.ui?.iconColor;
  const borderColor = nodeType.ui?.iconBorderColor;

  if (!backgroundColor && !color && !borderColor) {
    return undefined;
  }

  return {
    ...(backgroundColor ? { backgroundColor } : null),
    ...(color ? { color } : null),
    ...(borderColor ? { borderColor } : null),
  };
}

function normalizeGroupLabel(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed || fallback;
}

function getNodeTypeSearchText(nodeType: WorkflowNodeMetadataResponse) {
  return [
    nodeType.type,
    nodeType.kind,
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
}

function createSelectOptions(values: string[], allLabel: string) {
  return [
    { label: allLabel, value: "" },
    ...values
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ label: value, value })),
  ];
}

function isConfigurationFieldVisible(
  field: WorkflowNodeConfigurationFieldDefinition,
  draft: Record<string, any>,
) {
  const visibleWhen = field.uiSchema?.visibleWhen as
    | {
        field?: string;
        path?: string;
        equals?: any;
        notEquals?: any;
        includes?: any[];
      }
    | undefined;

  if (!visibleWhen) {
    return true;
  }

  const dependencyPath = visibleWhen.path ?? visibleWhen.field;
  if (!dependencyPath) {
    return true;
  }

  const dependencyValue = getPathValue(draft, dependencyPath);

  if ("equals" in visibleWhen) {
    return dependencyValue === visibleWhen.equals;
  }

  if ("notEquals" in visibleWhen) {
    return dependencyValue !== visibleWhen.notEquals;
  }

  if (Array.isArray(visibleWhen.includes)) {
    return visibleWhen.includes.includes(dependencyValue);
  }

  return true;
}

function getConfigurationFieldWidth(field: WorkflowNodeConfigurationFieldDefinition) {
  const width = field.uiSchema?.layout?.width;
  return width === "full" || width === "field" ? width : "half";
}

function getFieldHintItems(field: WorkflowNodeConfigurationFieldDefinition) {
  return [
    field.valueType ? { key: "valueType", label: field.valueType } : null,
    field.required ? { key: "required", label: "required", tone: "warn" as const } : null,
    field.expressionAllowed ? { key: "expressions", label: "expressions" } : null,
    field.secretAllowed ? { key: "secret", label: "secret", tone: "success" as const } : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    tone?: "warn" | "success";
  }>;
}

function WorkflowFieldHelp({ field }: { field: WorkflowNodeConfigurationFieldDefinition }) {
  const hintItems = getFieldHintItems(field);

  if (!field.description && !hintItems.length) {
    return null;
  }

  return (
    <SolidTooltip delayDuration={120}>
      <SolidTooltipTrigger asChild>
        <button
          type="button"
          className="workflow-node-editor-help-trigger"
          aria-label={`${field.label ?? field.key} help`}
        >
          <CircleHelp size={13} />
        </button>
      </SolidTooltipTrigger>
      <SolidTooltipContent
        side="top"
        align="end"
        className="workflow-node-editor-help-tooltip"
      >
        {field.description ? (
          <div className="workflow-node-editor-help-section">
            <div className="workflow-node-editor-help-title">Help</div>
            <div className="workflow-node-editor-help-copy">{field.description}</div>
          </div>
        ) : null}
        {hintItems.length ? (
          <div className="workflow-node-editor-help-section">
            <div className="workflow-node-editor-help-title">Allowed</div>
            <div className="workflow-node-editor-help-pills">
              {hintItems.map((item) => (
                <SolidTag key={item.key} tone={item.tone}>
                  {item.label}
                </SolidTag>
              ))}
            </div>
          </div>
        ) : null}
      </SolidTooltipContent>
    </SolidTooltip>
  );
}

function normalizeKeyValueRows(value: any) {
  if (Array.isArray(value)) {
    return value.map((item) => ({
      key: String(item?.key ?? item?.name ?? ""),
      value: item?.value ?? "",
    }));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, rowValue]) => ({
      key,
      value:
        rowValue === undefined || rowValue === null
          ? ""
          : typeof rowValue === "string"
            ? rowValue
            : YAML.stringify(rowValue).trim(),
    }));
  }

  return [];
}

function rowsToKeyValueObject(rows: Array<{ key: string; value: any }>) {
  return rows.reduce<Record<string, any>>((acc, row) => {
    const key = row.key.trim();
    if (!key) {
      return acc;
    }
    acc[key] = row.value;
    return acc;
  }, {});
}

function keyValueRowsSignature(rows: Array<{ key: string; value: any }>) {
  return JSON.stringify(rowsToKeyValueObject(rows));
}

function WorkflowKeyValueEditor({
  value,
  readOnly,
  onChange,
}: {
  value: any;
  readOnly?: boolean;
  onChange: (value: Record<string, any>) => void;
}) {
  const normalizedRows = normalizeKeyValueRows(value);
  const [rows, setRows] = React.useState<Array<{ key: string; value: any }>>(
    normalizedRows.length ? normalizedRows : [{ key: "", value: "" }],
  );
  const lastEmittedSignatureRef = React.useRef(keyValueRowsSignature(normalizedRows));

  React.useEffect(() => {
    const nextRows = normalizeKeyValueRows(value);
    const nextSignature = keyValueRowsSignature(nextRows);
    if (nextSignature === lastEmittedSignatureRef.current) {
      return;
    }

    setRows(nextRows.length ? nextRows : [{ key: "", value: "" }]);
    lastEmittedSignatureRef.current = nextSignature;
  }, [value]);

  const emitRows = (nextRows: Array<{ key: string; value: any }>) => {
    const nextValue = rowsToKeyValueObject(nextRows);
    lastEmittedSignatureRef.current = JSON.stringify(nextValue);
    onChange(nextValue);
  };

  const updateRow = (
    index: number,
    patch: Partial<{ key: string; value: any }>,
  ) => {
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row,
    );
    setRows(nextRows);
    emitRows(nextRows);
  };

  const removeRow = (index: number) => {
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index);
    const displayRows = nextRows.length ? nextRows : [{ key: "", value: "" }];
    setRows(displayRows);
    emitRows(displayRows);
  };

  const addRow = () => {
    setRows([...rows, { key: "", value: "" }]);
  };

  return (
    <div className="workflow-node-key-value-editor">
      <div className="workflow-node-key-value-header">
        <span>Key</span>
        <span>Value</span>
        <span />
      </div>
      {rows.map((row, index) => (
        <div
          className="workflow-node-key-value-row"
          key={`${row.key || "row"}-${index}`}
        >
          <SolidInput
            value={row.key}
            disabled={readOnly}
            placeholder="key"
            onChange={(event) => updateRow(index, { key: event.target.value })}
          />
          <SolidInput
            value={row.value ?? ""}
            disabled={readOnly}
            placeholder="value"
            onChange={(event) => updateRow(index, { value: event.target.value })}
          />
          <button
            type="button"
            className="workflow-node-key-value-action"
            disabled={readOnly || rows.length === 1}
            aria-label="Remove row"
            onClick={() => removeRow(index)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        className="workflow-node-key-value-add"
        disabled={readOnly}
        onClick={addRow}
      >
        <Plus size={14} />
        Add row
      </button>
    </div>
  );
}

function WorkflowYamlFieldEditor({
  value,
  readOnly,
  onChange,
  emptyValue = {},
}: {
  value: any;
  readOnly?: boolean;
  onChange: (value: any) => void;
  emptyValue?: any;
}) {
  const [textValue, setTextValue] = React.useState(() =>
    stringifyYamlEditorValue(value, emptyValue),
  );
  const [parseError, setParseError] = React.useState<string | null>(null);
  const lastEmittedSignatureRef = React.useRef(getYamlValueSignature(value ?? emptyValue));

  React.useEffect(() => {
    const nextSignature = getYamlValueSignature(value ?? emptyValue);
    if (nextSignature === lastEmittedSignatureRef.current) {
      return;
    }

    setTextValue(stringifyYamlEditorValue(value, emptyValue));
    setParseError(null);
    lastEmittedSignatureRef.current = nextSignature;
  }, [emptyValue, value]);

  const handleEditorChange = (nextText: string | undefined) => {
    const safeText = nextText ?? "";
    setTextValue(safeText);

    try {
      const parsedValue = safeText.trim() ? YAML.parse(safeText) : emptyValue;
      setParseError(null);
      lastEmittedSignatureRef.current = getYamlValueSignature(parsedValue);
      onChange(parsedValue);
    } catch (error: any) {
      setParseError(error?.message ?? "YAML is invalid.");
    }
  };

  return (
    <div className="workflow-node-yaml-field-editor">
      <SolidCodeEditor
        language="yaml"
        height="220px"
        readOnly={readOnly}
        value={textValue}
        onChange={handleEditorChange}
      />
      {parseError ? (
        <div className="workflow-node-yaml-field-error">{parseError}</div>
      ) : null}
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

  if (field.widgetHint === "key-value-editor") {
    return (
      <WorkflowKeyValueEditor
        value={normalizedValue}
        readOnly={readOnly}
        onChange={onChange}
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

  if (field.widgetHint === "raw-editor") {
    const stringValue =
      typeof normalizedValue === "string"
        ? normalizedValue
        : normalizedValue === undefined || normalizedValue === null
          ? ""
          : JSON.stringify(normalizedValue, null, 2);
    const editorLanguage = field.uiSchema?.editor?.language ?? "json";

    return (
      <SolidCodeEditor
        language={editorLanguage}
        height="220px"
        readOnly={readOnly}
        value={stringValue}
        onChange={(next) => onChange(next ?? "")}
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
    return (
      <WorkflowYamlFieldEditor
        value={normalizedValue}
        readOnly={readOnly}
        onChange={onChange}
        emptyValue={field.valueType === "array" ? EMPTY_YAML_ARRAY : EMPTY_YAML_OBJECT}
      />
    );
  }

  if (field.valueType === "any") {
    return (
      <WorkflowYamlFieldEditor
        value={normalizedValue}
        readOnly={readOnly}
        onChange={onChange}
        emptyValue={null}
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
  const visibleFields = fields.filter((field) =>
    isConfigurationFieldVisible(field, draft),
  );
  const groupedFields = visibleFields.reduce<Record<string, WorkflowNodeConfigurationFieldDefinition[]>>(
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

  if (!orderedGroups.length) {
    return (
      <div className={`workflow-node-editor-empty ${className ?? ""}`}>
        This node does not expose configuration fields yet.
      </div>
    );
  }

  return (
    <div className={`workflow-node-editor-config ${className ?? ""}`}>
      {orderedGroups.map((group) => (
        <section key={group} className="workflow-node-editor-section">
          {orderedGroups.length > 1 || group !== "General" ? (
            <div className="workflow-node-editor-section-heading">{group}</div>
          ) : null}
          <div className="workflow-node-editor-form-grid">
            {groupedFields[group].map((field) => {
              const fieldWidth = getConfigurationFieldWidth(field);
              return (
                <div
                  key={field.key}
                  className={`workflow-node-editor-field workflow-node-editor-field--${fieldWidth}`}
                >
                  <div className="workflow-node-editor-field-heading">
                    <div className="workflow-node-editor-label-row">
                      <label className="workflow-node-editor-label">
                        {field.label ?? field.key}
                      </label>
                      <WorkflowFieldHelp field={field} />
                    </div>
                  </div>
                  <WorkflowNodeFieldEditor
                    nodeType={nodeType}
                    field={field}
                    value={getPathValue(draft, field.path ?? field.key)}
                    readOnly={readOnly}
                    onChange={(nextValue) => updateField(field, nextValue)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {!readOnly && onSubmit ? (
        <div className="workflow-node-editor-inline-actions">
          <SolidButton onClick={() => onSubmit(draft)}>Save</SolidButton>
        </div>
      ) : null}
    </div>
  );
}

function WorkflowNodeTags({ nodeType }: { nodeType: WorkflowNodeMetadataResponse }) {
  return (
    <div className="workflow-node-editor-tags">
      <SolidTag>{nodeType.kind}</SolidTag>
      {nodeType.category ? <SolidTag>{nodeType.category}</SolidTag> : null}
      {nodeType.ui?.defaultEditorMode ? <SolidTag>{nodeType.ui.defaultEditorMode}</SolidTag> : null}
    </div>
  );
}

function WorkflowNodeHeaderMeta({ nodeType }: { nodeType: WorkflowNodeMetadataResponse }) {
  return (
    <div className="workflow-node-editor-dialog-meta">
      <span
        className="workflow-node-editor-dialog-icon"
        style={getWorkflowNodeIconStyle(nodeType)}
      >
        <WorkflowNodeTypeIcon nodeType={nodeType} size={15} />
      </span>
      <SolidTag>{nodeType.kind}</SolidTag>
      <SolidTag>{nodeType.type}</SolidTag>
      {nodeType.category ? <SolidTag>{nodeType.category}</SolidTag> : null}
      {nodeType.subcategory ? <SolidTag>{nodeType.subcategory}</SolidTag> : null}
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
    <section className="workflow-node-editor-section">
      <div className="workflow-node-editor-form-grid">
        <div className="workflow-node-editor-field">
          <label className="workflow-node-editor-label">Id</label>
          <SolidInput
            value={draft.id ?? ""}
            disabled={readOnly}
            onChange={(event) => update({ id: event.target.value })}
          />
        </div>
        <div className="workflow-node-editor-field">
          <label className="workflow-node-editor-label">Type</label>
          <SolidInput value={draft.type ?? nodeType.type} disabled />
        </div>

        {authoring?.supportsName !== false ? (
          <div className="workflow-node-editor-field">
            <label className="workflow-node-editor-label">Name</label>
            <SolidInput
              value={draft.name ?? ""}
              disabled={readOnly}
              onChange={(event) => update({ name: event.target.value })}
            />
          </div>
        ) : null}

        <div className="workflow-node-editor-field">
          <label className="workflow-node-editor-label">Kind</label>
          <WorkflowNodeTags nodeType={nodeType} />
        </div>

        {authoring?.supportsDescription ? (
          <div className="workflow-node-editor-field workflow-node-editor-field--wide">
            <label className="workflow-node-editor-label">Description</label>
            <SolidTextarea
              className="workflow-node-editor-description-input"
              value={draft.description ?? ""}
              disabled={readOnly}
              onChange={(event) => update({ description: event.target.value })}
            />
          </div>
        ) : null}
      </div>
    </section>
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

  if (!hasRuntimeFields(nodeType)) {
    return null;
  }

  const update = (patch: Partial<WorkflowNodeEditorValue>) => {
    onChange({ ...draft, ...patch });
  };

  return (
    <section className="workflow-node-editor-section">
      {authoring?.supportsDisableToggle ? (
        <div className="workflow-node-editor-toggle-row">
          <div>
            <div className="workflow-node-editor-toggle-title">Disabled</div>
            <div className="workflow-node-editor-description">
              Skip this node during execution.
            </div>
          </div>
          <SolidSwitch
            checked={!!draft.disabled}
            disabled={readOnly}
            onChange={(checked) => update({ disabled: checked || undefined })}
          />
        </div>
      ) : null}

      <div className="workflow-node-editor-form-grid">
        {authoring?.supportsTimeoutMs ? (
          <div className="workflow-node-editor-field">
            <label className="workflow-node-editor-label">Timeout (ms)</label>
            <SolidNumberInput
              value={draft.timeoutMs}
              disabled={readOnly}
              onChange={(event) => update({ timeoutMs: event.value ?? undefined })}
            />
          </div>
        ) : null}

        {authoring?.supportsOnError ? (
          <div className="workflow-node-editor-field">
            <label className="workflow-node-editor-label">On error</label>
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

        {authoring?.supportsRetryPolicy ? (
          <>
            <div className="workflow-node-editor-field">
              <label className="workflow-node-editor-label">Max retries</label>
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
            <div className="workflow-node-editor-field">
              <label className="workflow-node-editor-label">Retry delay (ms)</label>
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
          </>
        ) : null}
      </div>
    </section>
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
    <section className="workflow-node-editor-section">
      <div className="workflow-node-editor-slot-list">
        {childSlots.map((slot) => (
          <div key={slot.key} className="workflow-node-editor-slot-row">
            <div className="workflow-node-editor-slot-copy">
              <div className="workflow-node-editor-slot-title">{slot.label ?? slot.key}</div>
              <div className="workflow-node-editor-description">
                {slot.description ??
                  "Use the topology canvas to add, reorder, or remove child nodes."}
              </div>
            </div>
            <SolidTag>{getSlotCount(draft, slot)}</SolidTag>
          </div>
        ))}
      </div>
      <div className="workflow-node-editor-note">
        Child node membership is edited from the topology canvas. This dialog edits the
        control node itself.
      </div>
    </section>
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
  const [activeTab, setActiveTab] = React.useState("basic");
  const hasConfiguration = Boolean(nodeType.authoring?.configurationFields?.length);
  const childSlots = nodeType.authoring?.childSlots ?? [];

  const tabs = [
    {
      value: "basic",
      label: "Basic Info",
      content: (
        <WorkflowNodeCommonFields
          nodeType={nodeType}
          draft={value}
          readOnly={readOnly}
          onChange={onChange}
        />
      ),
    },
    hasConfiguration
      ? {
          value: "configuration",
          label: "Configuration",
          content: (
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
          ),
        }
      : null,
    hasRuntimeFields(nodeType)
      ? {
          value: "runtime",
          label: "Runtime",
          content: (
            <WorkflowNodeRuntimeFields
              nodeType={nodeType}
              draft={value}
              readOnly={readOnly}
              onChange={onChange}
            />
          ),
        }
      : null,
    childSlots.length
      ? {
          value: "topology",
          label: "Topology",
          content: <WorkflowNodeChildSlotsSummary nodeType={nodeType} draft={value} />,
        }
      : null,
  ].filter(Boolean) as Array<{ value: string; label: string; content: React.ReactNode }>;

  React.useEffect(() => {
    if (!tabs.some((tab) => tab.value === activeTab)) {
      setActiveTab(tabs[0]?.value ?? "basic");
    }
  }, [activeTab, tabs]);

  return (
    <SolidTabGroup
      tabs={tabs}
      value={activeTab}
      onValueChange={setActiveTab}
      className="workflow-node-editor-tabs"
      panelClassName="workflow-node-editor-tab-panel"
    />
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
  const dialogTitle = title ?? nodeType.label ?? nodeType.type;
  const dialogSubtitle = isFullNodeMode
    ? "Review the node details and configuration for this workflow step."
    : "Review the configuration fields for this workflow node.";

  const handleNodeChange = (nextValue: WorkflowNodeEditorValue) => {
    setNodeDraft(nextValue);
    setDraft(nextValue.configuration ?? {});
    onNodeChange?.(nextValue);
  };

  return (
    <SolidDialog
      open={open}
      onOpenChange={onOpenChange}
      header={
        <div className="workflow-node-editor-dialog-heading">
          <div className="workflow-node-editor-dialog-title">{dialogTitle}</div>
          <div className="workflow-node-editor-dialog-subtitle">{dialogSubtitle}</div>
          <WorkflowNodeHeaderMeta nodeType={nodeType} />
        </div>
      }
      className={`solid-workflow-node-editor-dialog solid-workflow-node-editor-dialog--${nodeType.ui?.modalSize ?? "lg"}`}
      style={{
        width: nodeType.ui?.modalSize === "full" ? "96vw" : "min(780px, 92vw)",
        maxWidth: "96vw",
      }}
    >
      <SolidDialogBody className="workflow-node-editor-dialog-body">
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
            className="workflow-node-editor-standalone-config"
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
        <SolidDialogFooter className="workflow-node-editor-dialog-footer">
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

export function WorkflowAddNodeDialog({
  open,
  nodeTypes,
  onOpenChange,
  createNodeValue,
  onSubmit,
}: WorkflowAddNodeDialogProps) {
  const [step, setStep] = React.useState<"select" | "configure">("select");
  const [query, setQuery] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [subcategoryFilter, setSubcategoryFilter] = React.useState("");
  const [kindFilter, setKindFilter] = React.useState("");
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState("");
  const [nodeDraft, setNodeDraft] = React.useState<WorkflowNodeEditorValue | null>(null);

  React.useEffect(() => {
    if (!open) {
      setStep("select");
      setQuery("");
      setCategoryFilter("");
      setSubcategoryFilter("");
      setKindFilter("");
      setFiltersOpen(false);
      setSelectedType("");
      setNodeDraft(null);
    }
  }, [open]);

  const selectedNodeType = React.useMemo(
    () => nodeTypes.find((nodeType) => nodeType.type === selectedType),
    [nodeTypes, selectedType],
  );

  const categoryOptions = React.useMemo(
    () =>
      createSelectOptions(
        Array.from(
          new Set(nodeTypes.map((nodeType) => nodeType.category ?? "").filter(Boolean)),
        ),
        "All categories",
      ),
    [nodeTypes],
  );

  const subcategoryOptions = React.useMemo(() => {
    const source = categoryFilter
      ? nodeTypes.filter((nodeType) => nodeType.category === categoryFilter)
      : nodeTypes;
    return createSelectOptions(
      Array.from(
        new Set(source.map((nodeType) => nodeType.subcategory ?? "").filter(Boolean)),
      ),
      "All subcategories",
    );
  }, [categoryFilter, nodeTypes]);

  const kindOptions = React.useMemo(
    () =>
      createSelectOptions(
        Array.from(new Set(nodeTypes.map((nodeType) => nodeType.kind).filter(Boolean))),
        "All kinds",
      ),
    [nodeTypes],
  );

  React.useEffect(() => {
    if (
      subcategoryFilter &&
      !subcategoryOptions.some((option) => option.value === subcategoryFilter)
    ) {
      setSubcategoryFilter("");
    }
  }, [subcategoryFilter, subcategoryOptions]);

  const filteredNodeTypes = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return nodeTypes.filter((nodeType) => {
      if (categoryFilter && nodeType.category !== categoryFilter) {
        return false;
      }
      if (subcategoryFilter && nodeType.subcategory !== subcategoryFilter) {
        return false;
      }
      if (kindFilter && nodeType.kind !== kindFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return getNodeTypeSearchText(nodeType).includes(normalizedQuery);
    });
  }, [
    categoryFilter,
    kindFilter,
    nodeTypes,
    query,
    subcategoryFilter,
  ]);

  const groupedNodeTypes = React.useMemo(() => {
    const grouped = new Map<
      string,
      Map<string, WorkflowNodeMetadataResponse[]>
    >();

    filteredNodeTypes.forEach((nodeType) => {
      const category = normalizeGroupLabel(nodeType.category, "Uncategorized");
      const subcategory = normalizeGroupLabel(nodeType.subcategory, "General");
      const categoryGroup = grouped.get(category) ?? new Map();
      const subcategoryGroup = categoryGroup.get(subcategory) ?? [];
      subcategoryGroup.push(nodeType);
      categoryGroup.set(subcategory, subcategoryGroup);
      grouped.set(category, categoryGroup);
    });

    return Array.from(grouped.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, subcategories]) => ({
        category,
        subcategories: Array.from(subcategories.entries())
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([subcategory, nodes]) => ({
            subcategory,
            nodes: nodes.sort((left, right) =>
              (left.label ?? left.type).localeCompare(right.label ?? right.type),
            ),
          })),
      }));
  }, [filteredNodeTypes]);

  const goToConfigureStep = (nodeType = selectedNodeType) => {
    if (!nodeType) {
      return;
    }

    setSelectedType(nodeType.type);
    setNodeDraft(createNodeValue(nodeType));
    setStep("configure");
  };

  const handleSubmit = () => {
    if (!nodeDraft) {
      return;
    }

    onSubmit(nodeDraft);
    onOpenChange(false);
  };

  const header = (
    <div className="workflow-node-editor-dialog-heading">
      <div className="workflow-node-editor-dialog-title">
        {step === "select" ? "Add Node" : `Configure ${selectedNodeType?.label ?? selectedNodeType?.type ?? "Node"}`}
      </div>
      <div className="workflow-node-editor-dialog-subtitle">
        {step === "select"
          ? "Choose the workflow node type to insert at this point in the flow."
          : "Review the node details and configuration before adding it to the workflow."}
      </div>
      {selectedNodeType ? <WorkflowNodeHeaderMeta nodeType={selectedNodeType} /> : null}
    </div>
  );

  return (
    <SolidDialog
      open={open}
      onOpenChange={onOpenChange}
      header={header}
      className="solid-workflow-node-editor-dialog solid-workflow-add-node-dialog"
      style={{ width: "min(1040px, 94vw)", maxWidth: "96vw" }}
    >
      <SolidDialogBody className="workflow-node-editor-dialog-body workflow-add-node-dialog-body">
        {step === "select" ? (
          <div className="workflow-add-node-picker">
            <div className="workflow-add-node-search-row">
              <div className="workflow-add-node-search">
                <Search size={15} />
                <SolidInput
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search node types"
                />
                <button
                  type="button"
                  className={`workflow-add-node-search-action ${filtersOpen ? "is-active" : ""}`}
                  aria-label={filtersOpen ? "Hide filters" : "Show filters"}
                  title={filtersOpen ? "Hide filters" : "Show filters"}
                  onClick={() => setFiltersOpen((current) => !current)}
                >
                  <Filter size={14} />
                </button>
                <button
                  type="button"
                  className="workflow-add-node-search-action"
                  aria-label="Clear search"
                  title="Clear search"
                  disabled={!query}
                  onClick={() => setQuery("")}
                >
                  <X size={14} />
                </button>
              </div>
              {filtersOpen ? (
                <div className="workflow-add-node-filters">
                  <SolidSelect
                    value={categoryFilter}
                    options={categoryOptions}
                    onChange={(event) => setCategoryFilter(event.value ?? "")}
                  />
                  <SolidSelect
                    value={subcategoryFilter}
                    options={subcategoryOptions}
                    onChange={(event) => setSubcategoryFilter(event.value ?? "")}
                  />
                  <SolidSelect
                    value={kindFilter}
                    options={kindOptions}
                    onChange={(event) => setKindFilter(event.value ?? "")}
                  />
                </div>
              ) : null}
            </div>

            <div className="workflow-add-node-results">
              {groupedNodeTypes.length ? (
                groupedNodeTypes.map((categoryGroup) => (
                  <section
                    key={categoryGroup.category}
                    className="workflow-add-node-category"
                  >
                    <div className="workflow-add-node-category-title">
                      {categoryGroup.category}
                    </div>
                    <div className="workflow-add-node-subcategory-list">
                      {categoryGroup.subcategories.map((subcategoryGroup) => (
                        <div
                          key={`${categoryGroup.category}-${subcategoryGroup.subcategory}`}
                          className="workflow-add-node-subcategory"
                        >
                          <div className="workflow-add-node-subcategory-title">
                            {subcategoryGroup.subcategory}
                          </div>
                          <div className="workflow-add-node-grid">
                            {subcategoryGroup.nodes.map((nodeType) => (
                              <button
                                key={nodeType.type}
                                type="button"
                                className={`workflow-add-node-card ${selectedType === nodeType.type ? "is-active" : ""}`}
                                onClick={() => goToConfigureStep(nodeType)}
                              >
                                <span
                                  className={`workflow-add-node-card-icon workflow-add-node-card-icon--${nodeType.kind}`}
                                  style={getWorkflowNodeIconStyle(nodeType)}
                                >
                                  <WorkflowNodeTypeIcon nodeType={nodeType} />
                                </span>
                                <span className="workflow-add-node-card-copy">
                                  <span className="workflow-add-node-card-title">
                                    {nodeType.label ?? nodeType.type}
                                  </span>
                                  <span className="workflow-add-node-card-description">
                                    {nodeType.description ?? nodeType.type}
                                  </span>
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))
              ) : (
                <div className="workflow-node-editor-empty">
                  No node types match the current search and filters.
                </div>
              )}
            </div>
          </div>
        ) : selectedNodeType && nodeDraft ? (
          <WorkflowNodeFullEditor
            nodeType={selectedNodeType}
            value={nodeDraft}
            onChange={setNodeDraft}
          />
        ) : null}
      </SolidDialogBody>
      <SolidDialogFooter className="workflow-node-editor-dialog-footer">
        {step === "select" ? (
          <SolidButton variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </SolidButton>
        ) : (
          <>
            <SolidButton
              variant="secondary"
              leftIcon={<ArrowLeft size={14} />}
              onClick={() => setStep("select")}
            >
              Back
            </SolidButton>
            <SolidButton onClick={handleSubmit}>Add Node</SolidButton>
          </>
        )}
      </SolidDialogFooter>
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
