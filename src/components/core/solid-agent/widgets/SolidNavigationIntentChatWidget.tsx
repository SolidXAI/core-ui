import { Compass } from "lucide-react";
import styles from "../SolidAgent.module.css";
import { SolidChatWidgetProps } from "../../../../types/solid-core";
import { getChatWidgetData } from "./chatWidgetUtils";

type NavigationIntentData = {
    schemaVersion?: number;
    kind?: string;
    domain?: string;
    message?: string;
};

/** Distinct assistant treatment for a host-directed navigation intent. */
export const SolidNavigationIntentChatWidget = ({ eventData }: SolidChatWidgetProps) => {
    const data = getChatWidgetData<NavigationIntentData>(eventData);
    if (data.schemaVersion !== 1 || data.kind !== "navigation") return null;
    return (
        <div className={styles.linkCard} role="status" aria-live="polite" style={{ cursor: "default" }}>
            <Compass size={17} aria-hidden="true" />
            <span>{typeof data.message === "string" && data.message.trim() ? data.message : "Opening the requested screen…"}</span>
        </div>
    );
};

Object.assign(SolidNavigationIntentChatWidget, { getExtensionMetadata: () => ({
    agentWidget: {
        name: "navigation-intent",
        description: "Represent a structured navigation request for the host application.",
        propsSchema: {
            type: "object",
            properties: {
                schemaVersion: { type: "number", enum: [1] },
                kind: { type: "string", enum: ["navigation"] },
                domain: { type: "string" },
                message: { type: "string" },
                payload: { type: "object", additionalProperties: true },
            },
            required: ["schemaVersion", "kind", "domain", "payload"],
        },
    },
}) });
