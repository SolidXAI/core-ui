import React from "react";
import MarkdownViewer from "../common/MarkdownViewer";
import {
  SolidAccordion,
  SolidAccordionContent,
  SolidAccordionItem,
  SolidAccordionTrigger,
  SolidTag,
} from "../shad-cn-ui";
import type {
  WorkflowNodeConfigurationFieldDefinition,
  WorkflowNodeExampleDefinition,
  WorkflowNodeMetricDefinition,
  WorkflowNodeMetadataResponse,
  WorkflowNodeOutputDefinition,
  WorkflowNodeReferenceDefinition,
} from "../../types/workflow-node";
import "./WorkflowNodeDocsPanel.css";

type WorkflowNodeDocsPanelProps = {
  nodeType?: WorkflowNodeMetadataResponse;
  docsModel?: WorkflowDocsModel;
  className?: string;
};

export type WorkflowDocsModel = {
  title: string;
  subtitle?: string;
  summary?: string;
  tags?: string[];
  badges?: string[];
  inputs?: WorkflowNodeConfigurationFieldDefinition[];
  examples?: WorkflowNodeExampleDefinition[];
  outputs?: WorkflowNodeOutputDefinition[];
  metrics?: WorkflowNodeMetricDefinition[];
  definitions?: WorkflowNodeReferenceDefinition[];
};

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatValue(value: any) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function SectionTitle({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <span className="workflow-node-docs-section-title">
      <span>{title}</span>
      <span className="workflow-node-docs-section-count">{count}</span>
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <div className="workflow-node-docs-meta-row">
      <span>{label}</span>
      <code>{value}</code>
    </div>
  );
}

function renderTags(tags: Array<string | undefined>) {
  const filteredTags = tags.filter(Boolean) as string[];
  if (!filteredTags.length) {
    return null;
  }

  return (
    <div className="workflow-node-docs-tags">
      {filteredTags.map((tag) => (
        <SolidTag key={tag}>{tag}</SolidTag>
      ))}
    </div>
  );
}

function renderInput(input: WorkflowNodeConfigurationFieldDefinition) {
  const defaultValue = formatValue(input.defaultValue);
  const enumValues = input.enumValues?.map((item) => String(item)).join(", ");
  const examples = input.examples?.map((example) => formatValue(example)).filter(Boolean);

  return (
    <SolidAccordionItem
      key={input.key}
      value={`input-${input.key}`}
      className="workflow-node-docs-row"
    >
      <SolidAccordionTrigger className="workflow-node-docs-row-trigger">
        <span className="workflow-node-docs-row-heading">
          <strong>{input.label ?? input.key}</strong>
          {input.required ? <SolidTag tone="warn">required</SolidTag> : null}
          {input.valueType ? <SolidTag>{input.valueType}</SolidTag> : null}
        </span>
      </SolidAccordionTrigger>
      <SolidAccordionContent className="workflow-node-docs-row-content">
        <div className="workflow-node-docs-row-body">
          {input.description ? (
            <p className="workflow-node-docs-description">{input.description}</p>
          ) : null}
          <div className="workflow-node-docs-meta-grid">
            <MetaRow label="Path" value={input.path} />
            <MetaRow label="Default" value={defaultValue} />
            <MetaRow label="Values" value={enumValues} />
            <MetaRow label="Widget" value={input.widgetHint} />
            <MetaRow label="Group" value={input.group} />
          </div>
          {renderTags([
            input.expressionAllowed ? "expressions" : undefined,
            input.secretAllowed ? "secret" : undefined,
            input.extensionComponentKey,
          ])}
          {examples?.length ? (
            <div className="workflow-node-docs-examples-inline">
              <strong>Examples</strong>
              {examples.map((example, index) => (
                <code key={`${input.key}-example-${index}`}>{example}</code>
              ))}
            </div>
          ) : null}
        </div>
      </SolidAccordionContent>
    </SolidAccordionItem>
  );
}

function renderExample(example: WorkflowNodeExampleDefinition) {
  const language = example.language ?? "text";
  return (
    <SolidAccordionItem
      key={example.key}
      value={`example-${example.key}`}
      className="workflow-node-docs-row"
    >
      <SolidAccordionTrigger className="workflow-node-docs-row-trigger">
        <span className="workflow-node-docs-row-heading">
          <strong>{example.label ?? example.key}</strong>
          {example.configurationOnly ? <SolidTag>configuration</SolidTag> : null}
          <SolidTag>{language}</SolidTag>
        </span>
      </SolidAccordionTrigger>
      <SolidAccordionContent className="workflow-node-docs-row-content">
        <div className="workflow-node-docs-row-body">
          {example.description ? (
            <p className="workflow-node-docs-description">{example.description}</p>
          ) : null}
          <MarkdownViewer data={`\`\`\`${language}\n${example.snippet}\n\`\`\``} />
        </div>
      </SolidAccordionContent>
    </SolidAccordionItem>
  );
}

function renderOutput(output: WorkflowNodeOutputDefinition) {
  return (
    <SolidAccordionItem
      key={output.key}
      value={`output-${output.key}`}
      className="workflow-node-docs-row"
    >
      <SolidAccordionTrigger className="workflow-node-docs-row-trigger">
        <span className="workflow-node-docs-row-heading">
          <strong>{output.label ?? output.key}</strong>
          {output.required ? <SolidTag tone="warn">required</SolidTag> : null}
          {output.valueType ? <SolidTag>{output.valueType}</SolidTag> : null}
        </span>
      </SolidAccordionTrigger>
      <SolidAccordionContent className="workflow-node-docs-row-content">
        <div className="workflow-node-docs-row-body">
          {output.description ? (
            <p className="workflow-node-docs-description">{output.description}</p>
          ) : null}
          <div className="workflow-node-docs-meta-grid">
            <MetaRow label="Path" value={output.path} />
          </div>
        </div>
      </SolidAccordionContent>
    </SolidAccordionItem>
  );
}

function renderMetric(metric: WorkflowNodeMetricDefinition) {
  return (
    <SolidAccordionItem
      key={metric.key}
      value={`metric-${metric.key}`}
      className="workflow-node-docs-row"
    >
      <SolidAccordionTrigger className="workflow-node-docs-row-trigger">
        <span className="workflow-node-docs-row-heading">
          <strong>{metric.label ?? metric.key}</strong>
          {metric.type ? <SolidTag>{metric.type}</SolidTag> : null}
          {metric.unit ? <SolidTag>{metric.unit}</SolidTag> : null}
        </span>
      </SolidAccordionTrigger>
      <SolidAccordionContent className="workflow-node-docs-row-content">
        <div className="workflow-node-docs-row-body">
          {metric.description ? (
            <p className="workflow-node-docs-description">{metric.description}</p>
          ) : null}
          <div className="workflow-node-docs-meta-grid">
            <MetaRow label="Path" value={metric.path} />
          </div>
          {renderTags(metric.tags ?? [])}
        </div>
      </SolidAccordionContent>
    </SolidAccordionItem>
  );
}

function renderDefinition(definition: WorkflowNodeReferenceDefinition) {
  return (
    <SolidAccordionItem
      key={definition.key}
      value={`definition-${definition.key}`}
      className="workflow-node-docs-row"
    >
      <SolidAccordionTrigger className="workflow-node-docs-row-trigger">
        <span className="workflow-node-docs-row-heading">
          <strong>{definition.label ?? definition.key}</strong>
        </span>
      </SolidAccordionTrigger>
      <SolidAccordionContent className="workflow-node-docs-row-content">
        <div className="workflow-node-docs-row-body">
          {definition.description ? (
            <p className="workflow-node-docs-description">{definition.description}</p>
          ) : null}
          {definition.content ? <MarkdownViewer data={definition.content} /> : null}
          {definition.examples?.length ? (
            <SolidAccordion
              type="multiple"
              defaultValue={definition.examples.map((example) => `example-${example.key}`)}
              className="workflow-node-docs-inner-accordion"
            >
              {definition.examples.map((example) => renderExample(example))}
            </SolidAccordion>
          ) : null}
        </div>
      </SolidAccordionContent>
    </SolidAccordionItem>
  );
}

export function WorkflowNodeDocsPanel({
  nodeType,
  docsModel,
  className,
}: WorkflowNodeDocsPanelProps) {
  const docs = nodeType?.documentation;
  const resolvedDocs: WorkflowDocsModel | undefined = docsModel
    ? docsModel
    : nodeType
      ? {
          title: nodeType.label ?? nodeType.type,
          subtitle: nodeType.type,
          summary: docs?.summary ?? nodeType.description,
          tags: nodeType.tags ?? [],
          badges: [nodeType.category, nodeType.kind].filter(Boolean) as string[],
          inputs: nodeType.authoring?.configurationFields ?? [],
          examples: nodeType.examples ?? [],
          outputs: nodeType.authoring?.outputs ?? [],
          metrics: nodeType.metrics ?? [],
          definitions: nodeType.definitions ?? [],
        }
      : undefined;

  if (!resolvedDocs) {
    return null;
  }

  const inputs = resolvedDocs.inputs ?? [];
  const examples = resolvedDocs.examples ?? [];
  const outputs = resolvedDocs.outputs ?? [];

  return (
    <div className={cx("workflow-node-docs", className)}>
      <header className="workflow-node-docs-hero">
        <div className="workflow-node-docs-title-row">
          <h2>{resolvedDocs.title}</h2>
          {renderTags(resolvedDocs.badges ?? [])}
        </div>
        {resolvedDocs.subtitle ? (
          <code className="workflow-node-docs-type">{resolvedDocs.subtitle}</code>
        ) : null}
        {resolvedDocs.summary ? (
          <p className="workflow-node-docs-summary">{resolvedDocs.summary}</p>
        ) : null}
        {resolvedDocs.tags?.length ? renderTags(resolvedDocs.tags) : null}
      </header>

      <SolidAccordion type="multiple" className="workflow-node-docs-sections">
        {inputs.length ? (
          <SolidAccordionItem value="inputs" className="workflow-node-docs-section">
            <SolidAccordionTrigger className="workflow-node-docs-section-trigger">
              <SectionTitle title="Inputs" count={inputs.length} />
            </SolidAccordionTrigger>
            <SolidAccordionContent className="workflow-node-docs-section-content">
              <SolidAccordion
                type="multiple"
                defaultValue={inputs
                  .filter((input) => input.required)
                  .map((input) => `input-${input.key}`)}
                className="workflow-node-docs-inner-accordion"
              >
                {inputs.map((input) => renderInput(input))}
              </SolidAccordion>
            </SolidAccordionContent>
          </SolidAccordionItem>
        ) : null}

        {outputs.length ? (
          <SolidAccordionItem value="outputs" className="workflow-node-docs-section">
            <SolidAccordionTrigger className="workflow-node-docs-section-trigger">
              <SectionTitle title="Outputs" count={outputs.length} />
            </SolidAccordionTrigger>
            <SolidAccordionContent className="workflow-node-docs-section-content">
              <SolidAccordion type="multiple" className="workflow-node-docs-inner-accordion">
                {outputs.map((output) => renderOutput(output))}
              </SolidAccordion>
            </SolidAccordionContent>
          </SolidAccordionItem>
        ) : null}

        {examples.length ? (
          <SolidAccordionItem value="examples" className="workflow-node-docs-section">
            <SolidAccordionTrigger className="workflow-node-docs-section-trigger">
              <SectionTitle title="Examples" count={examples.length} />
            </SolidAccordionTrigger>
            <SolidAccordionContent className="workflow-node-docs-section-content">
              <SolidAccordion
                type="multiple"
                defaultValue={examples.map((example) => `example-${example.key}`)}
                className="workflow-node-docs-inner-accordion"
              >
                {examples.map((example) => renderExample(example))}
              </SolidAccordion>
            </SolidAccordionContent>
          </SolidAccordionItem>
        ) : null}
      </SolidAccordion>
    </div>
  );
}
