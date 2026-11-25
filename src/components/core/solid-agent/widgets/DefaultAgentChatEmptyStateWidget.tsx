import React from "react";
import { Sparkles } from "lucide-react";
import type { SolidAgentChatEmptyStateWidgetProps } from "../../../../types/solid-core";
import styles from "../SolidAgent.module.css";

export function DefaultAgentChatEmptyStateWidget({ title, agentRuntime, providerDisplayName, suggestions, sendPrompt }: SolidAgentChatEmptyStateWidgetProps) {
    return (
        <div className={styles.empty}>
            <div className={styles.emptyMark}><Sparkles size={24} /></div>
            <div>
                <h2 className={styles.emptyTitle}>{agentRuntime === "agentHub" ? `Start a conversation with ${title}` : "How can I help?"}</h2>
                <p className={styles.emptyText}>{agentRuntime === "agentHub"
                    ? "Ask this agent for help with its configured capabilities. It can use the tools and knowledge available to it."
                    : "Ask in plain English. I can read this app's metadata and data, and run the agent's tools for you."}</p>
                {providerDisplayName && (
                    <div className={styles.emptyProviderBadge}>
                        Using <strong>{providerDisplayName}</strong>
                    </div>
                )}
            </div>
            <div className={styles.suggestions}>
                {suggestions.map((text) => (
                    <button key={text} type="button" className={styles.suggestion} onClick={() => sendPrompt(text)}>
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );
}
