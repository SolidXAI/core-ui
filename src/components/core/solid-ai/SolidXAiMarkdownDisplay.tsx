import MarkdownViewer from "@/components/common/MarkdownViewer";
import { AiInteraction } from "@/types/solid-core";
import styles from './SolidXAI.module.css';

export interface SolidXAiMarkdownDisplayProps {
    interaction: AiInteraction
}

export const SolidXAiMarkdownDisplay: React.FC<SolidXAiMarkdownDisplayProps> = ({ interaction }) => {
    // const jsonMsg = JSON.parse(interaction.message);
    // const markdown = jsonMsg.data;
    let jsonMsg: any;
    let markdown: string;

    let responseMessage = '';
    let parsed: any = {}
    try {
        parsed = JSON.parse(interaction.message)
        responseMessage = parsed.response ? parsed.response : '';
    } catch (e) {
        responseMessage = 'Invalid JSON'
    }


    try {
        if (typeof responseMessage === "string") {
            try {
                jsonMsg = JSON.parse(responseMessage.trim());
                markdown = jsonMsg?.data ?? "";
            } catch (jsonErr) {
                // Not valid JSON → treat the raw string as markdown
                markdown = responseMessage.trim();
            }
        } else if (typeof responseMessage === "object" && responseMessage !== null) {
            // Already an object
            jsonMsg = responseMessage;
            markdown = jsonMsg?.data ?? "";
        } else {
            // Fallback for other types
            markdown = String(responseMessage ?? "");
        }
    } catch (err: any) {
        // Worst-case fallback: put the error string in markdown
        markdown = `Error handling responseMessage: ${err?.message || String(err)}`;
    }
    // 🔧 Normalize escaped newlines, tabs, and quotes
    if (markdown.includes("\\n")) {
        markdown = markdown
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "")
            .replace(/\\"/g, '"');
    }

    // ✅ markdown is now clean and render-ready

    return (
        <div className={`p-3 ${styles.SolidXAIResponse}`} style={{ width: '100%' }}>
            <MarkdownViewer data={markdown} />
        </div>
    )
}

