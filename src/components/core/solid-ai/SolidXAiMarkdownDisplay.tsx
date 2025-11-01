import MarkdownViewer from "@/components/common/MarkdownViewer";
import { AiInteraction } from "@/types/solid-core";
import styles from './SolidXAI.module.css';

export interface SolidXAiMarkdownDisplayProps {
    interaction: AiInteraction
}

export const SolidXAiMarkdownDisplay: React.FC<SolidXAiMarkdownDisplayProps> = ({ interaction }) => {
    // const jsonMsg = JSON.parse(interaction.message);
    // const markdown = jsonMsg.data;
    let markdown = '';
    let generation_status = '';
    let instructions = '';
    let parsed: any = {}
    let errors = []
    try {
        parsed = JSON.parse(interaction.message)
        markdown = parsed.data ? parsed.data : '';
        generation_status = parsed.generation_status;
        instructions = parsed?.instructions;
        instructions = parsed?.instructions;
        errors = parsed?.errors
    } catch (e) {
        markdown = 'Invalid JSON'
    }
    if (markdown.includes("\\n")) {
        markdown = markdown
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "")
            .replace(/\\"/g, '"');
    }
    return (
        <div className={`p-3 ${styles.SolidXAIResponse}`} style={{ width: '100%' }}>

            {generation_status === "success" &&
                <MarkdownViewer data={markdown} />
            }
            {generation_status === "error" &&
                <div>
                    {/* <div className={`p-3 mb-3 ${styles.SolidXAIResponse}`}>
                                            {aiResponseTitle}
                                        </div> */}
                    <div className={`border-round-lg overflow-hidden ${styles.SolidXAiResponseError} border border-red-200 shadow-sm`}>
                        <div className="mb-3 flex align-items-center gap-2 text-red-600">
                            <i className="pi pi-exclamation-triangle text-red-500 text-base"></i>
                            <p className="font-semibold">{instructions}</p>
                        </div>
                        {errors.map((e: any) => <p>{e}</p>)}
                    </div>
                </div>
            }
        </div>
    )
}

