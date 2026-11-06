import type { SolidAgentTurnWidgetProps } from "../../../../types/solid-core";
import styles from "./solidChatWidgets.module.css";

/** Keeps the existing assistant-turn layout when no UI module supplies a replacement. */
export function DefaultAgentTurnCompletionWrapperWidget({ children }: SolidAgentTurnWidgetProps) {
    return (
        <div className={styles.AiTurnGroup}>
            <div className={styles.AiTurnContent}>{children}</div>
        </div>
    );
}
