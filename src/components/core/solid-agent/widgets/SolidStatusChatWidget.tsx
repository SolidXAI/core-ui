import { AlertTriangle, CheckCircle2, CircleX, Info } from "lucide-react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { getChatWidgetData } from "./chatWidgetUtils";

type Tone = "success" | "warning" | "error" | "info";
type StatusData = { tone?: Tone; title?: string; message?: string; action?: { label: string; prompt: string } };

const TONE_CLASS: Record<Tone, string> = {
    success: styles.statusSuccess,
    warning: styles.statusWarning,
    error: styles.statusError,
    info: styles.statusInfo,
};

const TONE_ICON = { success: CheckCircle2, warning: AlertTriangle, error: CircleX, info: Info };

/**
 * `event_data: { widget: "status", tone, title?, message?, action?: { label, prompt } }`.
 * The optional action posts `prompt` as a new user message.
 */
export const SolidStatusChatWidget = ({ eventData, sendPrompt }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<StatusData>(eventData);
    const tone: Tone = data.tone && data.tone in TONE_CLASS ? data.tone : "info";
    const Icon = TONE_ICON[tone];
    return (
        <div className={`${styles.status} ${TONE_CLASS[tone]}`} role={tone === "error" ? "alert" : "status"}>
            <Icon size={16} style={{ flex: "0 0 auto", marginTop: 2 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.title && <strong>{data.title}</strong>}
                {data.message && <span>{data.message}</span>}
                {data.action && (
                    <button type="button" className={styles.btn} style={{ alignSelf: "flex-start" }} onClick={() => sendPrompt(data.action!.prompt)}>
                        {data.action.label}
                    </button>
                )}
            </div>
        </div>
    );
};

Object.assign(SolidStatusChatWidget, { getExtensionMetadata: () => ({
    agentWidget: { name: "status", description: "Show the outcome of one operation with a status, title, and detail.", propsSchema: { type: "object", properties: { tone: { type: "string", enum: ["success", "warning", "error", "info"] }, title: { type: "string" }, message: { type: "string" }, action: { type: "object", properties: { label: { type: "string" }, prompt: { type: "string" } }, required: ["label", "prompt"] } } } },
}) });
