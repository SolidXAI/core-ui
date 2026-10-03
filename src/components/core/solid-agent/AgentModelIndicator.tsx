import { ChevronUp, Settings2 } from "lucide-react";
import styles from "./SolidAgent.module.css";
import type { AgentModelAssignment, AgentModelAssignments } from "./types";

export function AgentModelIndicator({ assignments }: { assignments?: AgentModelAssignments | null }) {
    if (!assignments || (!assignments.fast && !assignments.reasoning)) return null;
    return (
        <details className={`${styles.modelInfo} ${styles.modelInfoInline}`}>
            <summary className={styles.modelInfoSummary} title="View configured models" aria-label="View configured models">
                <Settings2 size={14} aria-hidden="true" />
                <span>Models</span>
                <ChevronUp className={styles.modelInfoChevron} size={12} aria-hidden="true" />
            </summary>
            <div className={styles.modelInfoMenu}>
                <div className={styles.modelInfoHeading}>
                    <strong>Configured models</strong>
                    <span>Used by this agent</span>
                </div>
                <ModelRow name="Reasoning" assignment={assignments.reasoning} />
                <ModelRow name="Fast" assignment={assignments.fast} />
            </div>
        </details>
    );
}

function ModelRow({ name, assignment }: { name: string; assignment: AgentModelAssignment }) {
    return (
        <div className={styles.modelInfoRow}>
            <span className={styles.modelInfoRole}>{name}</span>
            {assignment ? (
                <>
                    <strong className={styles.modelInfoModel}>{assignment.model}</strong>
                    <span className={styles.modelInfoProvider}>{assignment.provider}</span>
                </>
            ) : (
                <strong className={styles.modelInfoUnavailable}>Not configured</strong>
            )}
        </div>
    );
}
