import styles from './SolidXAI.module.css';
import { AiInteraction } from "@/types/solid-core";

export interface SolidXAiPlainTextDisplayProps {
    interaction: AiInteraction
}

export const SolidXAiPlainTextDisplay: React.FC<SolidXAiPlainTextDisplayProps> = ({ interaction }) => {

    // let response = '';
    // let parsed: any = {}
    // try {
    //     parsed = JSON.parse(interaction.message)
    //     response = parsed.response ? parsed.response : '';
    // } catch (e) {
    //     response = 'Invalid JSON'
    // }

    return (
        <div className={`p-3 ${styles.SolidXAIResponse}`}>
            {interaction?.message}
        </div>
    )
}
