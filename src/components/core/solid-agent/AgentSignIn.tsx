import React, { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import styles from "./SolidAgent.module.css";
import { signInWithApiKey } from "./client/agentAuth";

type Props = {
    agentUrl: string;
    /** The previous login expired (the agent forgot the token); say so. */
    expired?: boolean;
};

/**
 * Sign-in for the agent: the user pastes a Solid API key, which the agent exchanges for an
 * agentToken kept in this tab only (see client/agentAuth.ts). The key itself is not stored.
 */
export function AgentSignIn({ agentUrl, expired = false }: Props) {
    const [apiKey, setApiKey] = useState("");
    const [reveal, setReveal] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError(null);
        const result = await signInWithApiKey(agentUrl, apiKey);
        setBusy(false);
        if (result.ok) {
            setApiKey("");
            return;
        }
        setError(
            result.status === 401
                ? "That API key was not accepted. Check it and try again."
                : result.status === 403
                  ? "Your account does not have access to this agent."
                  : result.error,
        );
    };

    return (
        <div className={styles.signIn}>
            <form className={styles.signInCard} onSubmit={submit}>
                <div className={styles.signInIcon}>
                    <KeyRound size={18} />
                </div>
                <strong className={styles.signInTitle}>Sign in to the agent</strong>
                <p className={styles.signInText}>
                    {expired ? "Your agent session expired. " : ""}
                    Paste your Solid API key. It is checked by the agent and not stored in the browser; you stay signed in until
                    you close this tab.
                </p>
                <label className={styles.signInLabel} htmlFor="solid-agent-api-key">
                    API key
                </label>
                <div className={styles.signInField}>
                    <input
                        id="solid-agent-api-key"
                        className={styles.signInInput}
                        type={reveal ? "text" : "password"}
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="sldx_…"
                        value={apiKey}
                        onChange={(event) => setApiKey(event.target.value)}
                        disabled={busy}
                        autoFocus
                    />
                    <button
                        type="button"
                        className={styles.iconBtn}
                        aria-label={reveal ? "Hide API key" : "Show API key"}
                        onClick={() => setReveal((value) => !value)}
                    >
                        {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                </div>
                {error && (
                    <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
                        {error}
                    </div>
                )}
                <button type="submit" className={styles.signInBtn} disabled={busy || !apiKey.trim()}>
                    {busy ? <Loader2 size={15} className={styles.spinIcon} /> : null}
                    {busy ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    );
}
