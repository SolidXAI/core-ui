import { AlertTriangle, CheckCircle2, CircleX, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { getChatWidgetData } from "./chatWidgetUtils";

type Tone = "success" | "warning" | "error" | "info";
type StatusData = {
    tone?: Tone;
    title?: string;
    message?: string;
    action?: { label: string; prompt: string };
    /** In-app route for a View link (starts with "/"), e.g. "/admin/test-hub/application/11?tab=security". */
    route?: string;
};

const TONE_CLASS: Record<Tone, string> = {
    success: styles.statusSuccess,
    warning: styles.statusWarning,
    error: styles.statusError,
    info: styles.statusInfo,
};

const TONE_ICON = { success: CheckCircle2, warning: AlertTriangle, error: CircleX, info: Info };

/**
 * `event_data: { widget: "status", tone, title?, message?, action?: { label, prompt }, route? }`.
 * The optional action posts `prompt` as a new user message; the optional route adds a View link
 * (same as the scenario-added widget).
 */
export const SolidStatusChatWidget = ({ eventData, sendPrompt }: SolidChatWidgetProps) => {
    const navigate = useNavigate();
    const data = getChatWidgetData<StatusData & { status?: string; state?: string }>(eventData);
    const rawTone = String(data.tone ?? data.status ?? data.state ?? "").toLowerCase() as Tone;
    const tone: Tone = rawTone in TONE_CLASS ? rawTone : "info";
    const Icon = TONE_ICON[tone];
    const route = typeof data.route === "string" && data.route.startsWith("/") ? data.route : undefined;
    return (
        <div className={`${styles.status} ${TONE_CLASS[tone]}`} role={tone === "error" ? "alert" : "status"}>
            <Icon size={16} style={{ flex: "0 0 auto", marginTop: 2 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.title && <strong>{data.title}</strong>}
                {data.message && <span>{data.message}</span>}
                {route && (
                    <button type="button" className={styles.saView} style={{ alignSelf: "flex-start" }} onClick={() => navigate(route)}>
                        View
                    </button>
                )}
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
