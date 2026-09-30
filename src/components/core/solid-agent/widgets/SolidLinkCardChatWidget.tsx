import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { getChatWidgetData } from "./chatWidgetUtils";

type LinkCardData = { title?: string; subtitle?: string; route?: string; url?: string };

/**
 * `event_data: { widget: "link-card", title, subtitle?, route | url }`.
 * `route` (starting with "/") navigates inside the app; `url` (http/https) opens a new tab.
 */
export const SolidLinkCardChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const navigate = useNavigate();
    const data = getChatWidgetData<LinkCardData>(eventData);
    const external = data.url && /^https?:/i.test(data.url) ? data.url : null;
    const route = data.route && data.route.startsWith("/") ? data.route : null;
    if (!external && !route) return null;

    return (
        <button
            type="button"
            className={styles.linkCard}
            onClick={() => (external ? window.open(external, "_blank", "noopener,noreferrer") : navigate(route!))}
        >
            <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <strong>{data.title ?? route ?? external}</strong>
                {data.subtitle && <span style={{ fontSize: 12, color: "var(--agent-muted)" }}>{data.subtitle}</span>}
            </span>
            <ExternalLink size={14} />
        </button>
    );
};
