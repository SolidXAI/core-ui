import styles from './SolidXAI.module.css';
import { AiInteraction } from "@/types/solid-core";

export interface SolidXAiStatusErrorDisplayProps {
    interaction: AiInteraction
}

export const SolidXAiStatusErrorDisplay: React.FC<SolidXAiStatusErrorDisplayProps> = ({ interaction }) => {
    
    return (
        <div className={`p-3 ${styles.SolidXAIResponse}`}>
            {interaction?.status === "mcp_tool_failed" && <p>{interaction.message}</p>}
            {interaction?.status === "mcp_client_failed" && <p>{interaction.message}</p>}
        </div>
    )
}
