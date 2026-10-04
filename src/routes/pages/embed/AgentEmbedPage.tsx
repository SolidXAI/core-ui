import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import agentReducer from "../../../redux/features/agentSlice";
import { SolidAgentEmbedded } from "../../../components/core/solid-agent/SolidAgentEmbedded";
import { registerExternalAgentAuth, renewExternalAgentAuth, type AgentAuth } from "../../../components/core/solid-agent/client/agentAuth";
import { EMBED_CHANNEL, validateBootstrap, validateEmbedInputs, type AgentEmbedBootstrap } from "../../../components/core/solid-agent/embed/agentEmbedProtocol";
import styles from "./AgentEmbedPage.module.css";

/** Request IDs correlate iframe messages; they are not credentials and need not be cryptographic. */
function createEmbedRequestId(): string {
    if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return `embed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** Public iframe surface. Authentication is supplied by the parent SDK, with no admin layout or session. */
export function AgentEmbedPage() {
    const agentId = Number(useParams().agentId);
    const [store] = useState(() => configureStore({ reducer: { solidAgent: agentReducer } }));
    const [bootstrap, setBootstrap] = useState<AgentEmbedBootstrap | null>(null);
    const [inputs, setInputs] = useState<Record<string, unknown>>({});
    const [error, setError] = useState("");
    const locked = useRef(false);
    const schema = useRef<AgentEmbedBootstrap | null>(null);
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const parentOrigin = params.get("parentOrigin") ?? "";
    const instanceId = params.get("instanceId") ?? "";
    const agentUrl = `${window.location.origin}/embed/agent/${agentId}?agentId=${agentId}&embedInstance=${encodeURIComponent(instanceId)}`;
    const send = React.useCallback((type: string, data: Record<string, unknown> = {}) => {
        console.info("[agent-embed][iframe] sending parent message", { type, instanceId, requestId: data.requestId });
        if (parentOrigin) window.parent.postMessage({ channel: EMBED_CHANNEL, version: 1, instanceId, type, ...data }, parentOrigin);
    }, [parentOrigin, instanceId]);

    useEffect(() => {
        console.info("[agent-embed][iframe] page initialized", { agentId, pageOrigin: window.location.origin,
            parentOrigin, hasInstanceId: !!instanceId, isFramed: window.parent !== window });
        let parent: URL;
        try { parent = new URL(parentOrigin); } catch {
            console.error("[agent-embed][iframe] invalid parentOrigin", { parentOrigin });
            setError("Open this chat using the SolidX embed SDK."); return;
        }
        if (window.parent === window || !instanceId || !Number.isSafeInteger(agentId) || agentId <= 0
            || parent.origin !== parentOrigin || !["http:", "https:"].includes(parent.protocol)) {
            console.error("[agent-embed][iframe] embed configuration rejected", { isFramed: window.parent !== window,
                hasInstanceId: !!instanceId, validAgentId: Number.isSafeInteger(agentId) && agentId > 0,
                parentOriginIsCanonical: parent.origin === parentOrigin, parentProtocol: parent.protocol });
            setError("Invalid embed configuration."); return;
        }
        console.info("[agent-embed][iframe] embed configuration accepted", { agentId, parentOrigin: parent.origin });
        let disposed = false;
        let pending: { id: string; resolve: (auth: AgentAuth) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null = null;
        const registration = registerExternalAgentAuth(agentUrl, () => new Promise<AgentAuth>((resolve, reject) => {
            setError("");
            const id = createEmbedRequestId();
            const timer = setTimeout(() => {
                pending = null;
                const failure = new Error("The token endpoint did not respond. Try reconnecting.");
                console.error("[agent-embed][iframe] token request timed out", { requestId: id, timeoutMs: 30000 });
                if (!disposed) setError(failure.message);
                reject(failure);
            }, 30000);
            pending = { id, resolve, reject, timer };
            console.info("[agent-embed][iframe] requesting token from parent", { requestId: id });
            send("token_request", { requestId: id });
        }));
        const receive = (event: MessageEvent) => {
            const data = event.data;
            if (event.source !== window.parent || event.origin !== parentOrigin || !data || data.channel !== EMBED_CHANNEL
                || data.version !== 1 || data.instanceId !== instanceId) {
                console.info("[agent-embed][iframe] ignored parent message", { sourceMatchesParent: event.source === window.parent,
                    originMatchesParent: event.origin === parentOrigin, hasData: !!data,
                    channelMatches: !!data && data.channel === EMBED_CHANNEL, versionMatches: !!data && data.version === 1,
                    instanceMatches: !!data && data.instanceId === instanceId });
                return;
            }
            console.info("[agent-embed][iframe] received parent message", { type: data.type, requestId: data.requestId });
            if ((data.type === "token" || data.type === "token_error") && pending && pending.id === data.requestId) {
                const request = pending;
                pending = null;
                clearTimeout(request.timer);
                try {
                    if (data.type === "token_error") throw new Error(String(data.error || "Could not authenticate the chat."));
                    const next = validateBootstrap(data.auth, agentId);
                    console.info("[agent-embed][iframe] token bootstrap validated", { agentId,
                        hasAgentToken: !!next.agentToken, hasWsUrl: !!next.wsUrl, hasHttpUrl: !!next.httpUrl,
                        requiredInputsCount: next.requiredInputs.length, inputsProvided: !!data.inputs });
                    // A renewal may return a changed schema. Existing sessions keep their original inputs.
                    if (!locked.current) { validateEmbedInputs(next.requiredInputs, data.inputs); setInputs(data.inputs); }
                    schema.current = next;
                    setBootstrap(next);
                    setError("");
                    request.resolve({ ...next, solidUserId: null });
                    send("authenticated");
                } catch (failure) {
                    const message = failure instanceof Error ? failure.message : "Invalid bootstrap response.";
                    console.error("[agent-embed][iframe] token bootstrap rejected", { name: failure instanceof Error ? failure.name : "unknown", message });
                    setError(message); request.reject(new Error(message)); send("error", { error: message });
                }
            } else if (data.type === "set_inputs") {
                try {
                    if (locked.current) throw new Error("Start a new chat before changing inputs.");
                    if (schema.current) validateEmbedInputs(schema.current.requiredInputs, data.inputs);
                    setInputs(data.inputs);
                    send("inputs_result", { requestId: data.requestId, ok: true });
                } catch (failure) { send("inputs_result", { requestId: data.requestId, ok: false, error: String(failure) }); }
            }
        };
        window.addEventListener("message", receive);
        const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") send("close"); };
        window.addEventListener("keydown", onKey);
        send("ready");
        void renewExternalAgentAuth(agentUrl).then(() => {
            console.info("[agent-embed][iframe] initial auth renewal completed");
        }).catch((failure) => {
            console.warn("[agent-embed][iframe] initial auth renewal failed", { message: failure instanceof Error ? failure.message : String(failure) });
        });
        return () => {
            disposed = true;
            window.removeEventListener("message", receive);
            window.removeEventListener("keydown", onKey);
            if (pending) { clearTimeout(pending.timer); pending.reject(new Error("Embed closed.")); pending = null; }
            registration.dispose();
        };
    }, [agentId, agentUrl, instanceId, parentOrigin, send]);

    return <Provider store={store}><main className={styles.page}>
        {error && <div role="alert" className={styles.error}>{error}
            <button type="button" className={styles.reconnect} onClick={() => void renewExternalAgentAuth(agentUrl).catch(() => {})}>Reconnect</button>
        </div>}
        {bootstrap ? <SolidAgentEmbedded agentRuntime="agentHub" agentId={agentId} title={bootstrap.title} inputs={inputs} height="100%"
            externalEmbed={{ agentUrl, onInputsLocked: (value) => { locked.current = value; send("inputs_locked", { locked: value }); } }} />
            : !error && <div className={styles.loading} role="status" aria-live="polite">
                <div className={styles.loadingCard}>
                    <span className={styles.spinner} aria-hidden="true" />
                    <span className={styles.loadingTitle}>Please wait</span>
                    <span className={styles.loadingMessage}>Connecting to your assistant</span>
                </div>
            </div>}
    </main></Provider>;
}
