import React from "react";
import { AlertCircle } from "lucide-react";
import styles from "./SolidAgent.module.css";
import type { AgentProviderAuthStatus, AgentProviderInfo } from "./types";
import { SolidSpinner } from "../../shad-cn-ui/SolidSpinner";
import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../shad-cn-ui/SolidTooltip";

export function formatProviderName(raw?: string): string {
    if (!raw) return "";
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();
    if (lower.includes("copilot")) return "Copilot";
    if (lower.includes("droid")) return "Droid";
    if (lower.includes("claude")) return "Claude";
    return trimmed;
}

export function getProviderAuthStatus(provider?: AgentProviderInfo): AgentProviderAuthStatus {
    if (!provider) return "error";
    if (provider.id === "solidx") return "authenticated";
    if (provider.authStatus) return provider.authStatus;
    if (provider.authenticated === true) return "authenticated";
    if (provider.authenticated === false) return "unauthenticated";
    return "checking";
}

type Props = {
    providers: AgentProviderInfo[];
    selectedProvider: string;
    loading: boolean;
    loadError: boolean;
    style?: React.CSSProperties;
    onSelect: (providerId: string) => void;
    onRetryProviders: () => void;
    onRetryAuth: (providerId: string) => void;
};

/** The "Select AI Provider" menu shared by the header and full-screen sidebar new-chat buttons. */
export function AgentProviderDropdown({ providers, selectedProvider, loading, loadError, style, onSelect, onRetryProviders, onRetryAuth }: Props) {
    return (
        <div className={styles.providerDropdown} style={style} role="menu">
            <div className={styles.providerDropdownHeader}>
                <strong>Select AI Provider</strong>
                {loadError && (
                    <button type="button" className={styles.providerRetryButton} onClick={onRetryProviders}>
                        Provider list unavailable. Retry
                    </button>
                )}
            </div>
            {loading && providers.length === 0 ? (
                <div className={styles.providerLoadingItem}>
                    <SolidSpinner size={13} className={styles.inlineSolidSpinner} />
                    <span>Loading providers...</span>
                </div>
            ) : (
                <div className={styles.providerList}>
                    {providers.map((provider) => (
                        <button
                            key={provider.id}
                            type="button"
                            className={`${styles.providerItem} ${provider.id === selectedProvider ? styles.providerItemActive : ""}`}
                            onClick={() => onSelect(provider.id)}
                        >
                            <div className={styles.providerItemMeta}>
                                <span className={styles.providerItemName}>{formatProviderName(provider.name)}</span>
                            </div>
                            {provider.id !== "solidx" && <ProviderAuthBadge provider={provider} onRetry={onRetryAuth} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function ProviderAuthBadge({ provider, onRetry }: { provider: AgentProviderInfo; onRetry: (providerId: string) => void }) {
    const status = getProviderAuthStatus(provider);
    if (status === "authenticated") return null;

    const retry = () => onRetry(provider.id);
    const badge = status === "checking" ? (
        <span
            className={styles.providerBadgeChecking}
            role="status"
            aria-label="Checking authentication status"
            onClick={(e) => e.stopPropagation()}
        >
            <SolidSpinner size={12} className={styles.inlineSolidSpinner} />
        </span>
    ) : status === "error" ? (
        <span
            className={styles.providerBadgeAuthError}
            role="button"
            tabIndex={0}
            aria-label={`Retry ${formatProviderName(provider.name)} authentication check`}
            onClick={(e) => {
                e.stopPropagation();
                retry();
            }}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    retry();
                }
            }}
        >
            <AlertCircle size={12} strokeWidth={1.8} />
        </span>
    ) : (
        <span
            className={styles.providerBadgeUnauth}
            role="img"
            aria-label="Unauthenticated"
            onClick={(e) => e.stopPropagation()}
        >
            <AlertCircle size={12} strokeWidth={1.8} />
        </span>
    );
    const tooltip = status === "checking"
        ? "Checking authentication status…"
        : status === "error"
            ? "Could not verify authentication. Click to retry."
            : provider.id === "opencode"
                ? "Unauthenticated: Free models are available; CLI login required for paid models."
                : "Unauthenticated: Login required.";

    return (
        <div className={styles.providerItemEnd}>
            <SolidTooltip delayDuration={120}>
                <SolidTooltipTrigger asChild>{badge}</SolidTooltipTrigger>
                <SolidTooltipContent side="top" align="center" className={styles.providerUnauthTooltip}>
                    {tooltip}
                </SolidTooltipContent>
            </SolidTooltip>
        </div>
    );
}
