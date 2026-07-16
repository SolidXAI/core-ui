export type WorkflowNodeKind = "task" | "control" | "subflow";

export type WorkflowNodeConfigurationValueType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "json"
  | "secret"
  | "expression"
  | "relation"
  | "uri"
  | "any";

export type WorkflowStepExecutionStatus =
  | "created"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export type WorkflowNodeMetricType =
  | "counter"
  | "gauge"
  | "histogram"
  | "timer"
  | "summary";

export interface WorkflowNodeChildSlotDefinition {
  key: string;
  label?: string;
  description?: string;
  kind: "sequence" | "case-collection";
  layout?: "sequential" | "parallel";
  required?: boolean;
  minItems?: number;
  maxItems?: number;
}

export interface WorkflowNodeConfigurationFieldDefinition {
  key: string;
  label?: string;
  description?: string;
  valueType?: WorkflowNodeConfigurationValueType;
  required?: boolean;
  path?: string;
  expressionAllowed?: boolean;
  secretAllowed?: boolean;
  defaultValue?: any;
  enumValues?: Array<string | number | boolean>;
  examples?: any[];
  group?: string;
  widgetHint?: string;
  extensionComponentKey?: string;
  schema?: Record<string, any>;
  uiSchema?: Record<string, any>;
}

export interface WorkflowNodeOutputDefinition {
  key: string;
  label?: string;
  description?: string;
  valueType?: WorkflowNodeConfigurationValueType;
  path?: string;
  required?: boolean;
  schema?: Record<string, any>;
}

export interface WorkflowNodeMetricDefinition {
  key: string;
  label?: string;
  description?: string;
  type?: WorkflowNodeMetricType;
  unit?: string;
  path?: string;
  tags?: string[];
}

export interface WorkflowNodeExampleDefinition {
  key: string;
  label?: string;
  description?: string;
  language?: "json" | "yaml" | "javascript" | "typescript" | "text";
  snippet: string;
  configurationOnly?: boolean;
  metadata?: Record<string, any>;
}

export interface WorkflowNodeReferenceDefinition {
  key: string;
  label?: string;
  description?: string;
  content?: string;
  examples?: WorkflowNodeExampleDefinition[];
  schema?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WorkflowNodeAuthoringMetadata {
  defaultConfiguration?: Record<string, any>;
  configurationFields?: WorkflowNodeConfigurationFieldDefinition[];
  childSlots?: WorkflowNodeChildSlotDefinition[];
  outputs?: WorkflowNodeOutputDefinition[];
  supportsExpressions?: boolean;
  supportsRetryPolicy?: boolean;
  supportsTimeoutMs?: boolean;
  supportsOnError?: boolean;
  supportsDisableToggle?: boolean;
  supportsName?: boolean;
  supportsDescription?: boolean;
  searchableText?: string[];
}

export interface WorkflowNodeRuntimeMetadata {
  emitsLogs?: boolean;
  emitsArtifacts?: boolean;
  deterministicOutputs?: boolean;
  executionMode?: "task" | "engine-controlled";
  successStatuses?: WorkflowStepExecutionStatus[];
}

export interface WorkflowNodeDocumentationMetadata {
  summary?: string;
}

export interface WorkflowNodeUiMetadata {
  icon?: string;
  editorComponentKey?: string;
  docsComponentKey?: string;
  paletteComponentKey?: string;
  defaultEditorMode?: "schema" | "custom";
  fieldComponentKeys?: Record<string, string>;
  modalSize?: "sm" | "md" | "lg" | "xl" | "full";
  layoutHints?: {
    preferredPanel?: "code" | "flow" | "docs";
    groupOrder?: string[];
    stickySummary?: boolean;
  };
}

export interface WorkflowNodeMetadataResponse {
  type: string;
  kind: WorkflowNodeKind;
  version?: string;
  category?: string;
  subcategory?: string;
  label?: string;
  description?: string;
  icon?: string;
  tags?: string[];
  configSchema?: Record<string, any>;
  uiSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  examples?: WorkflowNodeExampleDefinition[];
  metrics?: WorkflowNodeMetricDefinition[];
  definitions?: WorkflowNodeReferenceDefinition[];
  authoring?: WorkflowNodeAuthoringMetadata;
  runtime?: WorkflowNodeRuntimeMetadata;
  documentation?: WorkflowNodeDocumentationMetadata;
  ui?: WorkflowNodeUiMetadata;
}
