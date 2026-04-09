
import { useMemo, useState } from "react";
import { SolidFormFieldWidgetProps } from "../../../../../types/solid-core";
import MarkdownViewer from "../../../../../components/common/MarkdownViewer";
import { SolidButton } from "../../../../shad-cn-ui/SolidButton";
import { SolidTabGroup } from "../../../../../components/shad-cn-ui/SolidTabs";
import ReactCodeMirror, { EditorView, oneDark } from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

export const SolidAiInteractionMetadataFieldFormWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {

    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;
    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const userKeyFieldName = fieldMetadata.relationModel?.userKeyField?.name;
    const value = formik.values[fieldLayoutInfo.attrs.name];

    const [activeTab, setActiveTab] = useState("chunks");

    const chunkContent = useMemo(() => {
        if (!value?.chunks?.length) return null;
        return (
            <div className="solid-layout-accordion flex flex-col gap-2">
                {value.chunks.map((c: any, index: number) => {
                    let processedText = c.text || '';
                    const meta = c.metadata || {};

                    const isDoc = !!meta.path || meta.source === "docusaurus";
                    const isModule = meta.type === "module";
                    const isModel = meta.type === "model";

                    if (isDoc) {
                        processedText = processedText
                            .replace(/^Document Title:\s*/i, "")
                            .replace(/^Text:\s*/i, "")
                            .trim();
                    }

                    if (isModel) {
                        const match = processedText.match(/Full model metadata json:\s*\n?({[\s\S]+})/);
                        if (match) {
                            try {
                                const pretty = JSON.stringify(JSON.parse(match[1]), null, 2);
                                processedText = processedText.replace(
                                    match[0],
                                    `**Full model metadata json:**\n\n\`\`\`json\n${pretty}\n\`\`\``
                                );
                            } catch {
                                processedText = processedText.replace(
                                    match[0],
                                    `**Full model metadata json (raw):**\n\n\`\`\`\n${match[1]}\n\`\`\``
                                );
                            }
                        }
                    }

                    let headerTitle = "Unknown";
                    if (isModule) {
                        headerTitle = `Module: ${meta.moduleName} (${meta.modelCount} models)`;
                    } else if (isModel) {
                        headerTitle = `Model: ${meta.modelName} (${meta.fieldCount} fields)`;
                    } else if (isDoc) {
                        headerTitle = `Doc: ${meta.title || meta.doc_title || meta.path}`;
                    }

                    const openDoc = (e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isDoc) {
                            const cleanPath = (meta.path || "").replace(/\.md$/, "");
                            const url = `https://docs.solidxai.com/docs/${cleanPath}`;
                            window.open(url, "_blank");
                        }
                    };

                    return (
                        <details key={c.id ?? index} className="solid-accordion-item rounded-md border border-border bg-card" open={index === 0}>
                            <summary className="solid-accordion-header flex justify-between items-center gap-2 p-3 cursor-pointer">
                                <span className="font-medium">{headerTitle}</span>
                                {isDoc && (
                                    <SolidButton variant="ghost" size="sm" onClick={openDoc} aria-label="Open documentation">
                                        <i className="pi pi-external-link" aria-hidden />
                                    </SolidButton>
                                )}
                            </summary>
                            <div className="solid-accordion-content p-3 pt-0">
                                <MarkdownViewer data={processedText} />
                            </div>
                        </details>
                    );
                })}
            </div>
        );
    }, [value?.chunks]);

    const tabs = [
        { value: "chunks", label: "Chunks", content: chunkContent },
        {
            value: "system",
            label: "System Prompt",
            content: value?.system_prompt ? <MarkdownViewer data={value.system_prompt} /> : null,
        },
        {
            value: "user",
            label: "User Prompt",
            content: value?.user_prompt ? <MarkdownViewer data={value.user_prompt} /> : null,
        },
        {
            value: "usage",
            label: "Token Usage",
            content: value?.tokenUsage ? (
                <div className="p-3 w-full">
                    <ReactCodeMirror
                        value={JSON.stringify(value.tokenUsage, null, 2)}
                        style={{ fontSize: '10px' }}
                        theme={oneDark}
                        extensions={[javascript(), EditorView.lineWrapping]}
                    />
                </div>
            ) : null,
        },
    ];

    return (
        <div className="mt-2 flex-column">
            <SolidTabGroup tabs={tabs} value={activeTab} onValueChange={setActiveTab} />
        </div>
    );
}
