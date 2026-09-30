import { CheckCircle2, CircleX, Loader2 } from "lucide-react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { asArray, getChatWidgetData } from "./chatWidgetUtils";

type ProgressStep = { label: string; status?: "pending" | "running" | "done" | "error" };
type ProgressData = { title?: string; percent?: number; steps?: ProgressStep[] };

export const SolidProgressStepIcon = ({ status }: { status?: ProgressStep["status"] }) => {
    if (status === "done") return <CheckCircle2 size={14} className={styles.okIcon} />;
    if (status === "error") return <CircleX size={14} className={styles.errIcon} />;
    if (status === "running") return <Loader2 size={14} className={styles.spinIcon} />;
    return <span style={{ width: 14, height: 14, borderRadius: 999, border: "2px dashed var(--agent-border)", display: "inline-block" }} />;
};

/**
 * `event_data: { widget: "progress", widgetId, title?, percent?, steps?: [{ label, status }] }`.
 * Send later events with the same widgetId to update it in place.
 */
export const SolidProgressChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<ProgressData>(eventData);
    const steps = asArray<ProgressStep>(data.steps);
    const percent = typeof data.percent === "number" ? Math.max(0, Math.min(100, data.percent)) : null;
    return (
        <div className={styles.card}>
            {data.title && <div className={styles.cardHead}>{data.title}</div>}
            <div className={styles.cardBody}>
                {percent != null && (
                    <div className={styles.progressBar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                        <div className={styles.progressFill} style={{ width: `${percent}%` }} />
                    </div>
                )}
                {steps.map((step, index) => (
                    <div key={index} className={styles.stepRow}>
                        <SolidProgressStepIcon status={step.status} />
                        <span>{step.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
