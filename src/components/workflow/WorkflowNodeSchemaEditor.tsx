import React from "react";
import { createPortal } from "react-dom";
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
import { WorkflowNodeDocsPanel } from "./WorkflowNodeDocsPanel";
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
  expressionSuggestions?: WorkflowExpressionSuggestion[];
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
  expressionSuggestions?: WorkflowExpressionSuggestion[];
  onOpenChange: (open: boolean) => void;
  createNodeValue: (nodeType: WorkflowNodeMetadataResponse) => WorkflowNodeEditorValue;
  onSubmit: (nodeValue: WorkflowNodeEditorValue) => void;
};

type FieldEditorProps = {
  nodeType: WorkflowNodeMetadataResponse;
  field: WorkflowNodeConfigurationFieldDefinition;
  value: any;
  expressionSuggestions?: WorkflowExpressionSuggestion[];
  readOnly?: boolean;
  onChange: (value: any) => void;
};

export type WorkflowExpressionSuggestionGroup = "Inputs" | "Variables" | "Secrets" | "Outputs";

export type WorkflowExpressionSuggestion = {
  group: WorkflowExpressionSuggestionGroup;
  label: string;
  insertText: string;
  detail?: string;
  description?: string;
};

type WorkflowExpressionAutocompletePosition = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
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

function stringifyJsonEditorValue(value: any, emptyValue: any) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value ?? emptyValue, null, 2);
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

function normalizeCssLength(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}px`;
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return undefined;
}

function getConfigurationFieldEditorHeight(
  field: WorkflowNodeConfigurationFieldDefinition,
  fallback = "220px",
) {
  return (
    normalizeCssLength(field.uiSchema?.editor?.height) ??
    normalizeCssLength(field.uiSchema?.layout?.height) ??
    normalizeCssLength(field.uiSchema?.layout?.minHeight) ??
    fallback
  );
}

function getWorkflowNodeEditorDialogStyle(
  nodeType: WorkflowNodeMetadataResponse,
): React.CSSProperties {
  const modalSize = nodeType.ui?.modalSize ?? "lg";

  if (modalSize === "full") {
    return {
      width: "96vw",
      maxWidth: "96vw",
      height: "92vh",
      maxHeight: "92vh",
    };
  }

  if (modalSize === "xl") {
    return {
      width: "min(1240px, 94vw)",
      maxWidth: "94vw",
      height: "min(880px, 90vh)",
      maxHeight: "90vh",
    };
  }

  return {
    width: "min(780px, 92vw)",
    maxWidth: "92vw",
    maxHeight: "90vh",
  };
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
  format = "yaml",
  height = "220px",
  expressionSuggestions,
}: {
  value: any;
  readOnly?: boolean;
  onChange: (value: any) => void;
  emptyValue?: any;
  format?: "json" | "yaml";
  height?: string;
  expressionSuggestions?: WorkflowExpressionSuggestion[];
}) {
  const stringifyValue = React.useCallback(
    (nextValue: any, nextEmptyValue: any) =>
      format === "json"
        ? stringifyJsonEditorValue(nextValue, nextEmptyValue)
        : stringifyYamlEditorValue(nextValue, nextEmptyValue),
    [format],
  );
  const [textValue, setTextValue] = React.useState(() =>
    stringifyValue(value, emptyValue),
  );
  const [parseError, setParseError] = React.useState<string | null>(null);
  const lastEmittedSignatureRef = React.useRef(getYamlValueSignature(value ?? emptyValue));

  React.useEffect(() => {
    const nextSignature = getYamlValueSignature(value ?? emptyValue);
    if (nextSignature === lastEmittedSignatureRef.current) {
      return;
    }

    setTextValue(stringifyValue(value, emptyValue));
    setParseError(null);
    lastEmittedSignatureRef.current = nextSignature;
  }, [emptyValue, stringifyValue, value]);

  const handleEditorChange = (nextText: string | undefined) => {
    const safeText = nextText ?? "";
    setTextValue(safeText);

    try {
      const parsedValue = safeText.trim()
        ? format === "json"
          ? JSON.parse(safeText)
          : YAML.parse(safeText)
        : emptyValue;
      setParseError(null);
      lastEmittedSignatureRef.current = getYamlValueSignature(parsedValue);
      onChange(parsedValue);
    } catch (error: any) {
      setParseError(error?.message ?? `${format.toUpperCase()} is invalid.`);
    }
  };

  return (
    <div className="workflow-node-yaml-field-editor">
      {expressionSuggestions ? (
        <WorkflowExpressionCodeEditor
          language={format}
          height={height}
          fontSize={12}
          readOnly={readOnly}
          value={textValue}
          suggestions={expressionSuggestions}
          onChange={handleEditorChange}
        />
      ) : (
        <SolidCodeEditor
          language={format}
          height={height}
          fontSize={12}
          readOnly={readOnly}
          value={textValue}
          onChange={handleEditorChange}
        />
      )}
      {parseError ? (
        <div className="workflow-node-yaml-field-error">{parseError}</div>
      ) : null}
    </div>
  );
}

function stringifyRecipientListValue(value: any) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function parseRecipientListValue(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }

  if (/^\{\{[\s\S]*\}\}$/.test(trimmedValue)) {
    return trimmedValue;
  }

  const recipients = trimmedValue
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);

  return recipients.length <= 1 ? trimmedValue : recipients;
}

function WorkflowRecipientListFieldEditor({
  value,
  readOnly,
  placeholder,
  expressionSuggestions,
  onChange,
}: {
  value: any;
  readOnly?: boolean;
  placeholder?: string;
  expressionSuggestions?: WorkflowExpressionSuggestion[];
  onChange: (value: any) => void;
}) {
  const [textValue, setTextValue] = React.useState(() =>
    stringifyRecipientListValue(value),
  );
  const lastValueSignatureRef = React.useRef(getYamlValueSignature(value));

  React.useEffect(() => {
    const nextSignature = getYamlValueSignature(value);
    if (nextSignature === lastValueSignatureRef.current) {
      return;
    }

    setTextValue(stringifyRecipientListValue(value));
    lastValueSignatureRef.current = nextSignature;
  }, [value]);

  const emitChange = (nextValue: string) => {
    setTextValue(nextValue);
    const parsedValue = parseRecipientListValue(nextValue);
    lastValueSignatureRef.current = getYamlValueSignature(parsedValue);
    onChange(parsedValue);
  };

  return (
    <WorkflowExpressionAutocompleteField
      value={textValue}
      readOnly={readOnly}
      placeholder={placeholder ?? "{{ item.email }}"}
      suggestions={expressionSuggestions}
      onChange={emitChange}
    />
  );
}

function getExpressionSearchTerm(value: string, caretIndex: number) {
  const prefix = value.slice(0, caretIndex);
  const expressionStart = prefix.lastIndexOf("{{");
  if (expressionStart >= 0 && prefix.lastIndexOf("}}") < expressionStart) {
    return prefix.slice(expressionStart + 2).trim();
  }

  return "";
}

type WorkflowExpressionAutocompleteSession = {
  mode: "expression" | "insert";
  queryStart: number;
};

function getAutocompleteSession(
  value: string,
  caretIndex: number,
): WorkflowExpressionAutocompleteSession {
  const prefix = value.slice(0, caretIndex);
  const expressionStart = prefix.lastIndexOf("{{");

  if (expressionStart >= 0 && prefix.lastIndexOf("}}") < expressionStart) {
    return {
      mode: "expression",
      queryStart: expressionStart + 2,
    };
  }

  return {
    mode: "insert",
    queryStart: caretIndex,
  };
}

function getAutocompleteSessionQuery(
  value: string,
  caretIndex: number,
  session: WorkflowExpressionAutocompleteSession | null,
) {
  if (!session) {
    return getExpressionSearchTerm(value, caretIndex);
  }

  if (session.queryStart > caretIndex) {
    return "";
  }

  return value.slice(session.queryStart, caretIndex).trim();
}

function insertExpressionAtCaret(
  value: string,
  caretIndex: number,
  insertText: string,
  session?: WorkflowExpressionAutocompleteSession | null,
) {
  const prefix = value.slice(0, caretIndex);
  const suffix = value.slice(caretIndex);
  const expressionStart = prefix.lastIndexOf("{{");
  const expressionEndInSuffix = suffix.indexOf("}}");

  if (expressionStart >= 0 && prefix.lastIndexOf("}}") < expressionStart) {
    const endIndex =
      expressionEndInSuffix >= 0
        ? caretIndex + expressionEndInSuffix + 2
        : caretIndex;
    return {
      value: `${value.slice(0, expressionStart)}${insertText}${value.slice(endIndex)}`,
      caretIndex: expressionStart + insertText.length,
    };
  }

  const replaceStart =
    session?.mode === "insert" && session.queryStart <= caretIndex
      ? session.queryStart
      : caretIndex;
  const spacerBefore =
    replaceStart > 0 && !/\s/.test(value.charAt(replaceStart - 1)) ? " " : "";
  const spacerAfter =
    suffix && !/^\s/.test(suffix) ? " " : "";
  const replacement = `${spacerBefore}${insertText}${spacerAfter}`;

  return {
    value: `${value.slice(0, replaceStart)}${replacement}${suffix}`,
    caretIndex: replaceStart + spacerBefore.length + insertText.length,
  };
}

function getWorkflowAutocompletePortalPosition(
  anchor: HTMLElement | null,
): WorkflowExpressionAutocompletePosition | null {
  if (!anchor || typeof window === "undefined") {
    return null;
  }

  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gutter = 12;
  const offset = 6;
  const preferredWidth = Math.max(rect.width, 420);
  const width = Math.min(preferredWidth, viewportWidth - gutter * 2);
  const left = Math.min(
    Math.max(rect.left, gutter),
    Math.max(viewportWidth - width - gutter, gutter),
  );
  const spaceBelow = viewportHeight - rect.bottom - gutter;
  const spaceAbove = rect.top - gutter;
  const renderAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
  const availableHeight = Math.max(
    160,
    Math.min(320, renderAbove ? spaceAbove - offset : spaceBelow - offset),
  );

  return {
    left,
    top: renderAbove
      ? Math.max(gutter, rect.top - offset - availableHeight)
      : Math.min(viewportHeight - gutter - availableHeight, rect.bottom + offset),
    width,
    maxHeight: availableHeight,
  };
}

function getWorkflowCodeAutocompletePortalPosition(
  editor: any,
): WorkflowExpressionAutocompletePosition | null {
  if (!editor || typeof window === "undefined") {
    return null;
  }

  const domNode = editor.getDomNode?.();
  const position = editor.getPosition?.();
  const visiblePosition = position
    ? editor.getScrolledVisiblePosition?.(position)
    : null;

  if (!domNode || !position || !visiblePosition) {
    return getWorkflowAutocompletePortalPosition(domNode ?? null);
  }

  const rect = domNode.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gutter = 12;
  const offset = 6;
  const preferredWidth = Math.max(Math.min(rect.width, 520), 420);
  const width = Math.min(preferredWidth, viewportWidth - gutter * 2);
  const caretLeft = rect.left + visiblePosition.left;
  const caretBottom = rect.top + visiblePosition.top + visiblePosition.height;
  const left = Math.min(
    Math.max(caretLeft, gutter),
    Math.max(viewportWidth - width - gutter, gutter),
  );
  const spaceBelow = viewportHeight - caretBottom - gutter;
  const spaceAbove = rect.top + visiblePosition.top - gutter;
  const renderAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
  const availableHeight = Math.max(
    160,
    Math.min(320, renderAbove ? spaceAbove - offset : spaceBelow - offset),
  );

  return {
    left,
    top: renderAbove
      ? Math.max(gutter, rect.top + visiblePosition.top - offset - availableHeight)
      : Math.min(viewportHeight - gutter - availableHeight, caretBottom + offset),
    width,
    maxHeight: availableHeight,
  };
}

function WorkflowExpressionCodeEditor({
  value,
  readOnly,
  language,
  height,
  fontSize = 12,
  suggestions = [],
  onChange,
}: {
  value: string;
  readOnly?: boolean;
  language: string;
  height?: string;
  fontSize?: string | number;
  suggestions?: WorkflowExpressionSuggestion[];
  onChange: (value: string | undefined) => void;
}) {
  const editorRef = React.useRef<any>(null);
  const disposablesRef = React.useRef<Array<{ dispose: () => void }>>([]);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const scrollBodyRef = React.useRef<HTMLDivElement | null>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const autocompleteSessionRef =
    React.useRef<WorkflowExpressionAutocompleteSession | null>(null);
  const isMenuInteractionRef = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [portalPosition, setPortalPosition] =
    React.useState<WorkflowExpressionAutocompletePosition | null>(null);

  const filteredSuggestions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return suggestions;
    }

    return suggestions.filter((suggestion) =>
      [
        suggestion.group,
        suggestion.label,
        suggestion.insertText,
        suggestion.detail,
        suggestion.description,
      ]
        .filter(Boolean)
        .some((entry) => String(entry).toLowerCase().includes(normalizedQuery)),
    );
  }, [query, suggestions]);

  const filteredSuggestionsRef = React.useRef(filteredSuggestions);
  const activeIndexRef = React.useRef(activeIndex);
  const openRef = React.useRef(open);

  React.useEffect(() => {
    filteredSuggestionsRef.current = filteredSuggestions;
  }, [filteredSuggestions]);

  React.useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const getEditorState = React.useCallback(() => {
    const editor = editorRef.current;
    const model = editor?.getModel?.();
    const position = editor?.getPosition?.();
    if (!editor || !model || !position) {
      return null;
    }

    return {
      editor,
      model,
      position,
      value: model.getValue(),
      caretIndex: model.getOffsetAt(position),
    };
  }, []);

  const closePicker = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setPortalPosition(null);
    autocompleteSessionRef.current = null;
    isMenuInteractionRef.current = false;
  }, []);

  const updatePortalPosition = React.useCallback(() => {
    setPortalPosition(getWorkflowCodeAutocompletePortalPosition(editorRef.current));
  }, []);

  const openPicker = React.useCallback(() => {
    const editorState = getEditorState();
    if (!editorState || readOnly) {
      return;
    }

    const session = getAutocompleteSession(
      editorState.value,
      editorState.caretIndex,
    );
    autocompleteSessionRef.current = session;
    setQuery(
      getAutocompleteSessionQuery(
        editorState.value,
        editorState.caretIndex,
        session,
      ),
    );
    setPortalPosition(getWorkflowCodeAutocompletePortalPosition(editorState.editor));
    setOpen(true);
  }, [getEditorState, readOnly]);

  const scrollAutocompleteBy = React.useCallback((deltaY: number) => {
    const scrollBody = scrollBodyRef.current;
    if (!scrollBody) {
      return false;
    }

    const previousScrollTop = scrollBody.scrollTop;
    scrollBody.scrollTop += deltaY;

    return scrollBody.scrollTop !== previousScrollTop;
  }, []);

  const selectSuggestion = React.useCallback(
    (suggestion: WorkflowExpressionSuggestion) => {
      const editorState = getEditorState();
      if (!editorState) {
        return;
      }

      const next = insertExpressionAtCaret(
        editorState.value,
        editorState.caretIndex,
        suggestion.insertText,
        autocompleteSessionRef.current,
      );
      const range = editorState.model.getFullModelRange();
      editorState.editor.executeEdits("workflow-expression-autocomplete", [
        {
          range,
          text: next.value,
          forceMoveMarkers: true,
        },
      ]);
      const nextPosition = editorState.model.getPositionAt(next.caretIndex);
      editorState.editor.setPosition(nextPosition);
      editorState.editor.focus();
      onChange(next.value);
      closePicker();
    },
    [closePicker, getEditorState, onChange],
  );

  React.useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const scrollBody = scrollBodyRef.current;
    const option = optionRefs.current[activeIndex];
    if (!scrollBody || !option) {
      return;
    }

    const optionTop = option.offsetTop;
    const optionBottom = optionTop + option.offsetHeight;
    const visibleTop = scrollBody.scrollTop;
    const visibleBottom = visibleTop + scrollBody.clientHeight;

    if (optionTop < visibleTop) {
      scrollBody.scrollTop = optionTop;
    } else if (optionBottom > visibleBottom) {
      scrollBody.scrollTop = optionBottom - scrollBody.clientHeight;
    }
  }, [activeIndex, open]);

  React.useLayoutEffect(() => {
    if (!open) {
      setPortalPosition(null);
      return;
    }

    updatePortalPosition();
  }, [filteredSuggestions.length, open, updatePortalPosition, value]);

  React.useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);

    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [open, updatePortalPosition]);

  React.useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const handleNativeWheel = (event: WheelEvent) => {
      const menu = menuRef.current;
      const scrollBody = scrollBodyRef.current;
      if (!menu || !scrollBody) {
        return;
      }

      const target = event.target;
      const targetInsideMenu =
        target instanceof Node ? menu.contains(target) : false;
      const rect = menu.getBoundingClientRect();
      const pointerInsideMenu =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!targetInsideMenu && !pointerInsideMenu) {
        return;
      }

      const normalizedDeltaY =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 32
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * scrollBody.clientHeight
            : event.deltaY || event.deltaX;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      scrollAutocompleteBy(normalizedDeltaY);
    };

    document.addEventListener("wheel", handleNativeWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      document.removeEventListener("wheel", handleNativeWheel, {
        capture: true,
      });
    };
  }, [open, scrollAutocompleteBy]);

  React.useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const getOptionIndexAtPoint = (clientX: number, clientY: number) => {
      const menu = menuRef.current;
      if (!menu) {
        return -1;
      }

      const menuRect = menu.getBoundingClientRect();
      const pointerInsideMenu =
        clientX >= menuRect.left &&
        clientX <= menuRect.right &&
        clientY >= menuRect.top &&
        clientY <= menuRect.bottom;

      if (!pointerInsideMenu) {
        return -1;
      }

      return optionRefs.current.findIndex((option) => {
        if (!option) {
          return false;
        }

        const rect = option.getBoundingClientRect();
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      });
    };

    const handleNativePointerMove = (event: PointerEvent) => {
      const optionIndex = getOptionIndexAtPoint(event.clientX, event.clientY);
      if (optionIndex >= 0) {
        setActiveIndex(optionIndex);
      }
    };

    const handleNativePointerDown = (event: PointerEvent) => {
      const optionIndex = getOptionIndexAtPoint(event.clientX, event.clientY);
      const suggestion = filteredSuggestions[optionIndex];
      if (!suggestion) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      isMenuInteractionRef.current = true;
      setActiveIndex(optionIndex);
      selectSuggestion(suggestion);
    };

    document.addEventListener("pointermove", handleNativePointerMove, {
      capture: true,
    });
    document.addEventListener("pointerdown", handleNativePointerDown, {
      capture: true,
    });

    return () => {
      document.removeEventListener("pointermove", handleNativePointerMove, {
        capture: true,
      });
      document.removeEventListener("pointerdown", handleNativePointerDown, {
        capture: true,
      });
    };
  }, [filteredSuggestions, open, selectSuggestion]);

  React.useEffect(
    () => () => {
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];
    },
    [],
  );

  const handleEditorMount = React.useCallback(
    (editor: any) => {
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];
      editorRef.current = editor;

      const consumeKeyboardEvent = (browserEvent: KeyboardEvent) => {
        const preventEditorHandling = () => {
          browserEvent.preventDefault();
          browserEvent.stopPropagation();
          browserEvent.stopImmediatePropagation();
        };

        if (browserEvent.ctrlKey && browserEvent.code === "Space") {
          preventEditorHandling();
          openPicker();
          return true;
        }

        if (!openRef.current) {
          return false;
        }

        if (browserEvent.key === "Escape") {
          preventEditorHandling();
          closePicker();
          return true;
        }

        if (browserEvent.key === "ArrowDown") {
          preventEditorHandling();
          setActiveIndex((current) =>
            Math.min(
              current + 1,
              Math.max(filteredSuggestionsRef.current.length - 1, 0),
            ),
          );
          return true;
        }

        if (browserEvent.key === "ArrowUp") {
          preventEditorHandling();
          setActiveIndex((current) => Math.max(current - 1, 0));
          return true;
        }

        if (browserEvent.key === "Enter") {
          const suggestion =
            filteredSuggestionsRef.current[activeIndexRef.current];
          if (suggestion) {
            preventEditorHandling();
            selectSuggestion(suggestion);
            return true;
          }
        }

        return false;
      };

      const domNode = editor.getDomNode?.();
      if (domNode) {
        const handleNativeKeyDown = (event: KeyboardEvent) => {
          consumeKeyboardEvent(event);
        };

        domNode.addEventListener("keydown", handleNativeKeyDown, {
          capture: true,
        });
        disposablesRef.current.push({
          dispose: () => {
            domNode.removeEventListener("keydown", handleNativeKeyDown, {
              capture: true,
            });
          },
        });
      }

      disposablesRef.current.push(
        editor.onKeyDown((event: any) => {
          const browserEvent = event.browserEvent;
          if (!browserEvent) {
            return;
          }

          if (consumeKeyboardEvent(browserEvent)) {
            event.preventDefault();
            event.stopPropagation();
          }
        }),
      );

      disposablesRef.current.push(
        editor.onDidChangeModelContent(() => {
          if (!openRef.current) {
            return;
          }

          const editorState = getEditorState();
          if (!editorState) {
            return;
          }

          setQuery(
            getAutocompleteSessionQuery(
              editorState.value,
              editorState.caretIndex,
              autocompleteSessionRef.current,
            ),
          );
          updatePortalPosition();
        }),
      );

      disposablesRef.current.push(
        editor.onDidBlurEditorWidget(() => {
          window.setTimeout(() => {
            if (!isMenuInteractionRef.current) {
              closePicker();
            }
          }, 120);
        }),
      );
    },
    [
      closePicker,
      getEditorState,
      openPicker,
      selectSuggestion,
      updatePortalPosition,
    ],
  );

  const groupedSuggestions = filteredSuggestions.reduce<Record<string, WorkflowExpressionSuggestion[]>>(
    (acc, suggestion) => {
      acc[suggestion.group] = acc[suggestion.group] ?? [];
      acc[suggestion.group].push(suggestion);
      return acc;
    },
    {},
  );

  const handleMenuWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    scrollAutocompleteBy(event.deltaY || event.deltaX);
  };

  const handleMenuPointerDown = () => {
    isMenuInteractionRef.current = true;

    window.setTimeout(() => {
      const handlePointerUp = () => {
        window.setTimeout(() => {
          isMenuInteractionRef.current = false;
        }, 0);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointerup", handlePointerUp);
    }, 0);
  };

  const menu = open && portalPosition && typeof document !== "undefined" ? (
    <div
      ref={menuRef}
      className="workflow-expression-autocomplete-menu"
      data-solid-dialog-outside-safe="true"
      style={{
        left: portalPosition.left,
        top: portalPosition.top,
        width: portalPosition.width,
        maxHeight: portalPosition.maxHeight,
      }}
      onPointerDownCapture={handleMenuPointerDown}
      onWheelCapture={handleMenuWheel}
    >
      <div
        ref={scrollBodyRef}
        className="workflow-expression-autocomplete-scroll-body"
        style={{ maxHeight: Math.max(portalPosition.maxHeight - 16, 120) }}
      >
        <div className="workflow-expression-autocomplete-help">
          Start typing to choose from available variables, inputs, secrets, or outputs.
        </div>
        {filteredSuggestions.length ? (
          Object.entries(groupedSuggestions).map(([group, groupSuggestions]) => (
            <div key={group} className="workflow-expression-autocomplete-group">
              <div className="workflow-expression-autocomplete-group-title">{group}</div>
              {groupSuggestions.map((suggestion) => {
                const absoluteIndex = filteredSuggestions.indexOf(suggestion);
                const isActive = absoluteIndex === activeIndex;

                return (
                  <button
                    ref={(element) => {
                      optionRefs.current[absoluteIndex] = element;
                    }}
                    key={`${suggestion.group}-${suggestion.insertText}`}
                    type="button"
                    className={`workflow-expression-autocomplete-option ${isActive ? "is-active" : ""}`}
                    onPointerEnter={() => {
                      setActiveIndex(absoluteIndex);
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(absoluteIndex);
                    }}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      selectSuggestion(suggestion);
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      selectSuggestion(suggestion);
                    }}
                  >
                    <span className="workflow-expression-autocomplete-option-main">
                      <span className="workflow-expression-autocomplete-option-label">
                        {suggestion.label}
                      </span>
                      {suggestion.detail ? (
                        <span className="workflow-expression-autocomplete-option-detail">
                          {suggestion.detail}
                        </span>
                      ) : null}
                    </span>
                    {suggestion.description ? (
                      <span className="workflow-expression-autocomplete-option-description">
                        {suggestion.description}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="workflow-expression-autocomplete-empty">
            No matching expression references.
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <SolidCodeEditor
        language={language}
        height={height}
        fontSize={fontSize}
        readOnly={readOnly}
        value={value}
        onChange={onChange}
        onMount={handleEditorMount}
      />
      {menu ? createPortal(menu, document.body) : null}
    </>
  );
}

export function WorkflowExpressionAutocompleteField({
  value,
  readOnly,
  multiline,
  placeholder,
  suggestions = [],
  onChange,
}: {
  value: string;
  readOnly?: boolean;
  multiline?: boolean;
  placeholder?: string;
  suggestions?: WorkflowExpressionSuggestion[];
  onChange: (value: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const scrollBodyRef = React.useRef<HTMLDivElement | null>(null);
  const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [portalPosition, setPortalPosition] =
    React.useState<WorkflowExpressionAutocompletePosition | null>(null);
  const autocompleteSessionRef =
    React.useRef<WorkflowExpressionAutocompleteSession | null>(null);
  const isMenuInteractionRef = React.useRef(false);

  const filteredSuggestions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return suggestions;
    }

    return suggestions.filter((suggestion) =>
      [
        suggestion.group,
        suggestion.label,
        suggestion.insertText,
        suggestion.detail,
        suggestion.description,
      ]
        .filter(Boolean)
        .some((entry) => String(entry).toLowerCase().includes(normalizedQuery)),
    );
  }, [query, suggestions]);

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const scrollAutocompleteBy = React.useCallback((deltaY: number) => {
    const scrollBody = scrollBodyRef.current;
    if (!scrollBody) {
      return false;
    }

    const previousScrollTop = scrollBody.scrollTop;
    scrollBody.scrollTop += deltaY;

    return scrollBody.scrollTop !== previousScrollTop;
  }, []);

  React.useLayoutEffect(() => {
    if (!open) {
      return;
    }

    const scrollBody = scrollBodyRef.current;
    const option = optionRefs.current[activeIndex];
    if (!scrollBody || !option) {
      return;
    }

    const optionTop = option.offsetTop;
    const optionBottom = optionTop + option.offsetHeight;
    const visibleTop = scrollBody.scrollTop;
    const visibleBottom = visibleTop + scrollBody.clientHeight;

    if (optionTop < visibleTop) {
      scrollBody.scrollTop = optionTop;
    } else if (optionBottom > visibleBottom) {
      scrollBody.scrollTop = optionBottom - scrollBody.clientHeight;
    }

  }, [activeIndex, open]);

  const updatePortalPosition = React.useCallback(() => {
    setPortalPosition(getWorkflowAutocompletePortalPosition(inputRef.current));
  }, []);

  React.useLayoutEffect(() => {
    if (!open) {
      setPortalPosition(null);
      return;
    }

    updatePortalPosition();
  }, [open, updatePortalPosition, value, filteredSuggestions.length]);

  React.useEffect(() => {
    if (!open || typeof window === "undefined") {
      return;
    }

    window.addEventListener("resize", updatePortalPosition);
    window.addEventListener("scroll", updatePortalPosition, true);

    return () => {
      window.removeEventListener("resize", updatePortalPosition);
      window.removeEventListener("scroll", updatePortalPosition, true);
    };
  }, [open, updatePortalPosition]);

  React.useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const handleNativeWheel = (event: WheelEvent) => {
      const menu = menuRef.current;
      const scrollBody = scrollBodyRef.current;
      if (!menu || !scrollBody) {
        return;
      }

      const target = event.target;
      const targetInsideMenu =
        target instanceof Node ? menu.contains(target) : false;
      const rect = menu.getBoundingClientRect();
      const pointerInsideMenu =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!targetInsideMenu && !pointerInsideMenu) {
        return;
      }

      const normalizedDeltaY =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * 32
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * scrollBody.clientHeight
            : event.deltaY || event.deltaX;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      scrollAutocompleteBy(normalizedDeltaY);
    };

    document.addEventListener("wheel", handleNativeWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      document.removeEventListener("wheel", handleNativeWheel, {
        capture: true,
      });
    };
  }, [open, scrollAutocompleteBy]);

  const openPicker = () => {
    const input = inputRef.current;
    const caretIndex = input?.selectionStart ?? value.length;
    const session = getAutocompleteSession(value, caretIndex);
    autocompleteSessionRef.current = session;
    setQuery(getAutocompleteSessionQuery(value, caretIndex, session));
    setPortalPosition(getWorkflowAutocompletePortalPosition(input));
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    setPortalPosition(null);
    autocompleteSessionRef.current = null;
    isMenuInteractionRef.current = false;
  };

  const selectSuggestion = (suggestion: WorkflowExpressionSuggestion) => {
    const input = inputRef.current;
    const caretIndex = input?.selectionStart ?? value.length;
    const next = insertExpressionAtCaret(
      value,
      caretIndex,
      suggestion.insertText,
      autocompleteSessionRef.current,
    );
    onChange(next.value);
    closePicker();

    window.requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(next.caretIndex, next.caretIndex);
    });
  };

  React.useEffect(() => {
    if (!open || typeof document === "undefined") {
      return;
    }

    const getOptionIndexAtPoint = (clientX: number, clientY: number) => {
      const menu = menuRef.current;
      if (!menu) {
        return -1;
      }

      const menuRect = menu.getBoundingClientRect();
      const pointerInsideMenu =
        clientX >= menuRect.left &&
        clientX <= menuRect.right &&
        clientY >= menuRect.top &&
        clientY <= menuRect.bottom;

      if (!pointerInsideMenu) {
        return -1;
      }

      return optionRefs.current.findIndex((option) => {
        if (!option) {
          return false;
        }

        const rect = option.getBoundingClientRect();
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        );
      });
    };

    const handleNativePointerMove = (event: PointerEvent) => {
      const optionIndex = getOptionIndexAtPoint(event.clientX, event.clientY);
      if (optionIndex >= 0) {
        setActiveIndex(optionIndex);
      }
    };

    const handleNativePointerDown = (event: PointerEvent) => {
      const optionIndex = getOptionIndexAtPoint(event.clientX, event.clientY);
      const suggestion = filteredSuggestions[optionIndex];
      if (!suggestion) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      isMenuInteractionRef.current = true;
      setActiveIndex(optionIndex);
      selectSuggestion(suggestion);
    };

    document.addEventListener("pointermove", handleNativePointerMove, {
      capture: true,
    });
    document.addEventListener("pointerdown", handleNativePointerDown, {
      capture: true,
    });

    return () => {
      document.removeEventListener("pointermove", handleNativePointerMove, {
        capture: true,
      });
      document.removeEventListener("pointerdown", handleNativePointerDown, {
        capture: true,
      });
    };
  }, [filteredSuggestions, open]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (event.ctrlKey && event.code === "Space") {
      event.preventDefault();
      if (!readOnly) {
        openPicker();
      }
      return;
    }

    if (!open) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, Math.max(filteredSuggestions.length - 1, 0)),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && filteredSuggestions[activeIndex]) {
      event.preventDefault();
      selectSuggestion(filteredSuggestions[activeIndex]);
    }
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const nextValue = event.target.value;
    onChange(nextValue);

    if (open) {
      setQuery(
        getAutocompleteSessionQuery(
          nextValue,
          event.target.selectionStart ?? nextValue.length,
          autocompleteSessionRef.current,
        ),
      );
    }
  };

  const groupedSuggestions = filteredSuggestions.reduce<Record<string, WorkflowExpressionSuggestion[]>>(
    (acc, suggestion) => {
      acc[suggestion.group] = acc[suggestion.group] ?? [];
      acc[suggestion.group].push(suggestion);
      return acc;
    },
    {},
  );

  const inputProps = {
    ref: inputRef as any,
    value,
    disabled: readOnly,
    placeholder,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    onBlur: () =>
      window.setTimeout(() => {
        if (!isMenuInteractionRef.current) {
          closePicker();
        }
      }, 120),
  };

  const handleMenuWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    scrollAutocompleteBy(event.deltaY || event.deltaX);
  };

  const handleMenuPointerDown = () => {
    isMenuInteractionRef.current = true;

    window.setTimeout(() => {
      const handlePointerUp = () => {
        window.setTimeout(() => {
          isMenuInteractionRef.current = false;
        }, 0);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointerup", handlePointerUp);
    }, 0);
  };

  const menu = open && portalPosition && typeof document !== "undefined" ? (
    <div
      ref={menuRef}
      className="workflow-expression-autocomplete-menu"
      data-solid-dialog-outside-safe="true"
      style={{
        left: portalPosition.left,
        top: portalPosition.top,
        width: portalPosition.width,
        maxHeight: portalPosition.maxHeight,
      }}
      onPointerDownCapture={handleMenuPointerDown}
      onWheelCapture={handleMenuWheel}
    >
      <div
        ref={scrollBodyRef}
        className="workflow-expression-autocomplete-scroll-body"
        style={{ maxHeight: Math.max(portalPosition.maxHeight - 16, 120) }}
      >
        <div className="workflow-expression-autocomplete-help">
          Start typing to choose from available variables, inputs, secrets, or outputs.
        </div>
        {filteredSuggestions.length ? (
          Object.entries(groupedSuggestions).map(([group, groupSuggestions]) => (
            <div key={group} className="workflow-expression-autocomplete-group">
              <div className="workflow-expression-autocomplete-group-title">{group}</div>
              {groupSuggestions.map((suggestion) => {
                const absoluteIndex = filteredSuggestions.indexOf(suggestion);
                const isActive = absoluteIndex === activeIndex;

                return (
                  <button
                    ref={(element) => {
                      optionRefs.current[absoluteIndex] = element;
                    }}
                    key={`${suggestion.group}-${suggestion.insertText}`}
                    type="button"
                    className={`workflow-expression-autocomplete-option ${isActive ? "is-active" : ""}`}
                    onPointerEnter={() => {
                      setActiveIndex(absoluteIndex);
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(absoluteIndex);
                    }}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      selectSuggestion(suggestion);
                    }}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      selectSuggestion(suggestion);
                    }}
                  >
                    <span className="workflow-expression-autocomplete-option-main">
                      <span className="workflow-expression-autocomplete-option-label">
                        {suggestion.label}
                      </span>
                      {suggestion.detail ? (
                        <span className="workflow-expression-autocomplete-option-detail">
                          {suggestion.detail}
                        </span>
                      ) : null}
                    </span>
                    {suggestion.description ? (
                      <span className="workflow-expression-autocomplete-option-description">
                        {suggestion.description}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))
        ) : (
          <div className="workflow-expression-autocomplete-empty">
            No matching expression references.
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="workflow-expression-autocomplete">
      {multiline ? (
        <SolidTextarea {...inputProps} />
      ) : (
        <SolidInput {...inputProps} />
      )}
      {menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

function WorkflowNodeFieldEditor({
  nodeType,
  field,
  value,
  expressionSuggestions,
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

    if (field.expressionAllowed) {
      return (
        <WorkflowExpressionCodeEditor
          language={editorLanguage}
          height={getConfigurationFieldEditorHeight(field)}
          fontSize={12}
          readOnly={readOnly}
          value={stringValue}
          suggestions={expressionSuggestions}
          onChange={(next) => onChange(next ?? "")}
        />
      );
    }

    return (
      <SolidCodeEditor
        language={editorLanguage}
        height={getConfigurationFieldEditorHeight(field)}
        fontSize={12}
        readOnly={readOnly}
        value={stringValue}
        onChange={(next) => onChange(next ?? "")}
      />
    );
  }

  if (field.widgetHint === "recipient-list") {
    return (
      <WorkflowRecipientListFieldEditor
        value={normalizedValue}
        readOnly={readOnly}
        placeholder={field.uiSchema?.placeholder}
        expressionSuggestions={expressionSuggestions}
        onChange={onChange}
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
        format={field.widgetHint === "yaml-editor" ? "yaml" : "json"}
        height={getConfigurationFieldEditorHeight(field)}
        expressionSuggestions={field.expressionAllowed ? expressionSuggestions : undefined}
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
        format="yaml"
        height={getConfigurationFieldEditorHeight(field)}
        expressionSuggestions={field.expressionAllowed ? expressionSuggestions : undefined}
      />
    );
  }

  if (field.widgetHint === "textarea") {
    if (field.expressionAllowed) {
      return (
        <WorkflowExpressionAutocompleteField
          value={normalizedValue ?? ""}
          readOnly={readOnly}
          multiline
          suggestions={expressionSuggestions}
          onChange={onChange}
        />
      );
    }

    return (
      <SolidTextarea
        value={normalizedValue ?? ""}
        disabled={readOnly}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.expressionAllowed) {
    return (
      <WorkflowExpressionAutocompleteField
        value={normalizedValue ?? ""}
        readOnly={readOnly}
        suggestions={expressionSuggestions}
        onChange={onChange}
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

type WorkflowConfigurationSection = {
  key: string;
  label: string;
  fields: WorkflowNodeConfigurationFieldDefinition[];
};

type WorkflowConfigurationTab = {
  key: string;
  label: string;
  sections: WorkflowConfigurationSection[];
};

function orderGroupLabels(groupLabels: string[], groupOrder: string[]) {
  return [...groupLabels].sort((left, right) => {
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
}

function buildConfigurationSections(
  fields: WorkflowNodeConfigurationFieldDefinition[],
  groupOrder: string[],
) {
  const groupedFields = fields.reduce<Record<string, WorkflowNodeConfigurationFieldDefinition[]>>(
    (acc, field) => {
      const group = field.group ?? "General";
      acc[group] = acc[group] ?? [];
      acc[group].push(field);
      return acc;
    },
    {},
  );

  return orderGroupLabels(Object.keys(groupedFields), groupOrder).map((group) => ({
    key: group,
    label: group,
    fields: groupedFields[group],
  }));
}

function getFieldLayoutKeys(field: WorkflowNodeConfigurationFieldDefinition) {
  return [field.key, field.path].filter(Boolean) as string[];
}

function buildConfigurationTabs(
  fields: WorkflowNodeConfigurationFieldDefinition[],
  groupOrder: string[],
  layout: NonNullable<WorkflowNodeMetadataResponse["authoring"]>["configurationLayout"] | undefined,
): WorkflowConfigurationTab[] {
  if (layout?.type !== "tabs" || !Array.isArray(layout.tabs) || !layout.tabs.length) {
    return [];
  }

  const assignedFieldKeys = new Set<string>();
  const tabs = layout.tabs
    .map((tab) => {
      const tabFieldKeys = new Set(tab.fields ?? []);
      const tabGroupLabels = new Set(tab.groups ?? []);
      const tabFields = fields.filter((field) => {
        const isFieldMatch = getFieldLayoutKeys(field).some((key) => tabFieldKeys.has(key));
        const isGroupMatch = tabGroupLabels.has(field.group ?? "General");

        if (isFieldMatch || isGroupMatch) {
          getFieldLayoutKeys(field).forEach((key) => assignedFieldKeys.add(key));
          return true;
        }

        return false;
      });

      return {
        key: tab.key,
        label: tab.label,
        sections: buildConfigurationSections(tabFields, groupOrder),
      };
    })
    .filter((tab) => tab.sections.some((section) => section.fields.length));

  const unassignedFields = fields.filter(
    (field) => !getFieldLayoutKeys(field).some((key) => assignedFieldKeys.has(key)),
  );

  if (unassignedFields.length) {
    tabs.push({
      key: "other",
      label: "Other",
      sections: buildConfigurationSections(unassignedFields, groupOrder),
    });
  }

  return tabs;
}

function WorkflowConfigurationSections({
  sections,
  nodeType,
  draft,
  expressionSuggestions,
  readOnly,
  updateField,
}: {
  sections: WorkflowConfigurationSection[];
  nodeType: WorkflowNodeMetadataResponse;
  draft: Record<string, any>;
  expressionSuggestions?: WorkflowExpressionSuggestion[];
  readOnly?: boolean;
  updateField: (field: WorkflowNodeConfigurationFieldDefinition, nextValue: any) => void;
}) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.key} className="workflow-node-editor-section">
          {sections.length > 1 || section.label !== "General" ? (
            <div className="workflow-node-editor-section-heading">{section.label}</div>
          ) : null}
          <div className="workflow-node-editor-form-grid">
            {section.fields.map((field) => {
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
                    expressionSuggestions={expressionSuggestions}
                    readOnly={readOnly}
                    onChange={(nextValue) => updateField(field, nextValue)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

export function WorkflowNodeSchemaEditor({
  nodeType,
  value,
  onChange,
  onSubmit,
  expressionSuggestions,
  readOnly,
  className,
}: WorkflowNodeSchemaEditorProps) {
  const [draft, setDraft] = React.useState<Record<string, any>>(
    value ?? nodeType.authoring?.defaultConfiguration ?? {},
  );
  const [activeConfigurationTab, setActiveConfigurationTab] = React.useState("");

  React.useEffect(() => {
    setDraft(value ?? nodeType.authoring?.defaultConfiguration ?? {});
  }, [nodeType, value]);

  const fields = nodeType.authoring?.configurationFields ?? [];
  const groupOrder = nodeType.ui?.layoutHints?.groupOrder ?? [];
  const visibleFields = fields.filter((field) =>
    isConfigurationFieldVisible(field, draft),
  );
  const configurationSections = buildConfigurationSections(visibleFields, groupOrder);
  const configurationTabs = buildConfigurationTabs(
    visibleFields,
    groupOrder,
    nodeType.authoring?.configurationLayout,
  );
  const activeConfigurationTabValue =
    activeConfigurationTab || configurationTabs[0]?.key || "";

  const updateField = (field: WorkflowNodeConfigurationFieldDefinition, nextValue: any) => {
    const nextDraft = setPathValue(draft, field.path ?? field.key, nextValue);
    setDraft(nextDraft);
    onChange?.(nextDraft);
  };

  React.useEffect(() => {
    if (
      configurationTabs.length &&
      !configurationTabs.some((tab) => tab.key === activeConfigurationTab)
    ) {
      setActiveConfigurationTab(configurationTabs[0].key);
    }
  }, [activeConfigurationTab, configurationTabs]);

  if (!configurationSections.length) {
    return (
      <div className={`workflow-node-editor-empty ${className ?? ""}`}>
        This node does not expose configuration fields yet.
      </div>
    );
  }

  return (
    <div className={`workflow-node-editor-config ${className ?? ""}`}>
      {configurationTabs.length > 1 ? (
        <SolidTabGroup
          tabs={configurationTabs.map((tab) => ({
            value: tab.key,
            label: tab.label,
            content: (
              <WorkflowConfigurationSections
                sections={tab.sections}
                nodeType={nodeType}
                draft={draft}
                expressionSuggestions={expressionSuggestions}
                readOnly={readOnly}
                updateField={updateField}
              />
            ),
          }))}
          value={activeConfigurationTabValue}
          onValueChange={setActiveConfigurationTab}
          className="workflow-node-editor-config-tabs"
          panelClassName="workflow-node-editor-config-tab-panel"
        />
      ) : (
        <WorkflowConfigurationSections
          sections={configurationTabs[0]?.sections ?? configurationSections}
          nodeType={nodeType}
          draft={draft}
          expressionSuggestions={expressionSuggestions}
          readOnly={readOnly}
          updateField={updateField}
        />
      )}

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
    <section className="workflow-node-editor-section workflow-node-editor-topology-summary">
      <div className="workflow-node-editor-topology-guide">
        <div className="workflow-node-editor-topology-guide-icon">
          <Workflow size={18} />
        </div>
        <div className="workflow-node-editor-topology-guide-copy">
          <div className="workflow-node-editor-topology-guide-title">
            Add child nodes on the topology canvas
          </div>
          <div className="workflow-node-editor-topology-guide-text">
            Close this dialog, then use the{" "}
            <span className="workflow-node-editor-canvas-plus">
              <Plus size={12} />
              insert points
            </span>{" "}
            inside this control node's child lanes.
          </div>
        </div>
      </div>

      <div className="workflow-node-editor-topology-steps" aria-label="How to add child nodes">
        <div className="workflow-node-editor-topology-step">
          <span className="workflow-node-editor-topology-step-number">1</span>
          <span>Select the compound node on the canvas.</span>
        </div>
        <div className="workflow-node-editor-topology-step">
          <span className="workflow-node-editor-topology-step-number">2</span>
          <span>Close this editor when the node settings look right.</span>
        </div>
        <div className="workflow-node-editor-topology-step">
          <span className="workflow-node-editor-topology-step-number">3</span>
          <span>Use the lane insert points to add or reorder children.</span>
        </div>
      </div>

      <div className="workflow-node-editor-slot-list">
        {childSlots.map((slot) => {
          const count = getSlotCount(draft, slot);
          const slotKindLabel =
            slot.kind === "case-collection"
              ? "Branch cases"
              : slot.layout === "parallel"
                ? "Parallel lane"
                : "Sequential lane";
          const limitLabel = slot.maxItems
            ? `Up to ${slot.maxItems}`
            : slot.minItems
              ? `At least ${slot.minItems}`
              : undefined;

          return (
            <div key={slot.key} className="workflow-node-editor-slot-card">
              <div className="workflow-node-editor-slot-header">
                <div className="workflow-node-editor-slot-main">
                  <span className="workflow-node-editor-slot-icon">
                    <GitBranch size={15} />
                  </span>
                  <div className="workflow-node-editor-slot-copy">
                    <div className="workflow-node-editor-slot-title-row">
                      <div className="workflow-node-editor-slot-title">
                        {slot.label ?? slot.key}
                      </div>
                      <SolidTag>{slotKindLabel}</SolidTag>
                      {slot.required ? <SolidTag>Required</SolidTag> : null}
                      {limitLabel ? <SolidTag>{limitLabel}</SolidTag> : null}
                    </div>
                    <div className="workflow-node-editor-description">
                      {slot.description ??
                        "Use the topology canvas to add, reorder, or remove child nodes."}
                    </div>
                  </div>
                </div>
                <div className="workflow-node-editor-slot-count">
                  <strong>{count}</strong>
                  <span>{count === 1 ? "child" : "children"}</span>
                </div>
              </div>
              <div className="workflow-node-editor-slot-canvas-hint">
                <Plus size={13} />
                Canvas insert points add nodes to this {slot.label ?? slot.key} lane.
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WorkflowNodeFullEditor({
  nodeType,
  value,
  onChange,
  expressionSuggestions,
  readOnly,
}: {
  nodeType: WorkflowNodeMetadataResponse;
  value: WorkflowNodeEditorValue;
  onChange: (value: WorkflowNodeEditorValue) => void;
  expressionSuggestions?: WorkflowExpressionSuggestion[];
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
              expressionSuggestions={expressionSuggestions}
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
    {
      value: "docs",
      label: "Docs",
      content: (
        <WorkflowNodeDocsPanel
          nodeType={nodeType}
          className="workflow-node-editor-docs-panel"
        />
      ),
    },
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
  expressionSuggestions,
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
      style={getWorkflowNodeEditorDialogStyle(nodeType)}
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
            expressionSuggestions={expressionSuggestions}
            readOnly={readOnly}
          />
        ) : (
          <WorkflowNodeSchemaEditor
            className="workflow-node-editor-standalone-config"
            nodeType={nodeType}
            value={draft}
            expressionSuggestions={expressionSuggestions}
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
  expressionSuggestions,
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
            expressionSuggestions={expressionSuggestions}
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
