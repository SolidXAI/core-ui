import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, History, Loader2, LogOut, Maximize2, Minimize2, Minus, PanelRight, Plus, Sparkles, Trash2, WifiOff, X } from "lucide-react";
import styles from "./SolidAgent.module.css";
import { agentModeChanged, agentPrefillConsumed } from "../../../redux/features/agentSlice";
import {
    deleteSession,
    fetchAgentConfigVersionStatus,
    fetchAgentModelAssignments,
    fetchAgentProviders,
    fetchProviderModels,
    fetchSessionList,
    getCachedAgentProviders,
    getCachedProviderModels,
    type AgentSessionSummary,
} from "./client/agentRest";
import {
    getStoredFast,
    getStoredModel,
    getStoredProvider,
    getStoredReasoning,
    getStoredSpeed,
    getStoredThinking,
    setStoredSessionOptions,
} from "./client/agentRuntime";
import { AgentThread } from "./thread/AgentThread";
import { AgentComposer } from "./composer/AgentComposer";
import type { AgentAttachment, AgentMode, AgentProviderInfo, AgentRuntimeType, ProviderModelInfo } from "./types";
import type { AgentInputContext } from "./useAdminInputContext";
import { useAgentChat } from "./useAgentChat";
import { useAgentAuth } from "./useAgentAuth";
import { AgentSignIn } from "./AgentSignIn";
import { signOutOfAgent } from "./client/agentAuth";
import { AgentModelIndicator } from "./AgentModelIndicator";
import type { AgentModelAssignments } from "./types";
import type { AgentInputDefinition } from "./embed/agentEmbedProtocol";
import { SolidButton } from "../../shad-cn-ui/SolidButton";
import { SolidDialog, SolidDialogBody } from "../../shad-cn-ui/SolidDialog";
import { SolidInput } from "../../shad-cn-ui/SolidInput";
import { eventBus } from "../../../helpers/eventBus";
import { SOLID_AGENT_EVENTS } from "./sdk/solidAgent";

type Props = {
    agentUrl: string;
    title?: string;
    /** Which agent backend `agentUrl` belongs to (default "solidx", shared with the launcher). */
    agentRuntime?: AgentRuntimeType;
    inputContext?: AgentInputContext;
    inputs?: Record<string, unknown>;
    requiredInputs?: AgentInputDefinition[];
    externalEmbed?: boolean;
    onInputsLocked?: (locked: boolean) => void;
    /** Rendered inside a page (tab/form widget) instead of the floating window: no window controls. */
    embedded?: boolean;
    /** Only one mounted chat should act on SDK prefill requests; the floating window does by default. */
    handlesPrefill?: boolean;
    suggestions?: string[];
    /** Controlled window actions for an embedded chat rendered in a modal. */
    windowControls?: {
        mode: "docked" | "maximized";
        onDock: () => void;
        onMaximize: () => void;
        onRestore: () => void;
        onClose: () => void;
    };
};

const DEFAULT_SUGGESTIONS = [
    "What can you help me with in this app?",
    "Show me the models in this module",
    "Explain what this screen does",
];

const AGENT_HUB_DEFAULT_SUGGESTIONS = [
    "What can you help me with?",
    "What tools can you use?",
    "Summarize your capabilities",
];

function formatDate(iso: string | null) {
    if (!iso) return "";
    const date = new Date(iso);
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function parseInputValues(fields: AgentInputDefinition[], rawValues: Record<string, string>): { values?: Record<string, unknown>; error?: string } {
    const values: Record<string, unknown> = {};
    for (const field of fields) {
        const raw = rawValues[field.name] ?? "";
        if (!raw.trim() && (field.optional || field.defaultValue !== null && field.defaultValue !== undefined)) continue;
        if (field.dataType === "boolean") {
            if (raw !== "true" && raw !== "false") return { error: `Choose true or false for “${field.name}”.` };
            values[field.name] = raw === "true";
            continue;
        }
        if (!raw.trim()) return { error: `Enter a value for “${field.name}”.` };
        if (field.dataType === "number" || field.dataType === "integer") {
            const value = Number(raw);
            if (!Number.isFinite(value) || (field.dataType === "integer" && !Number.isSafeInteger(value))) {
                return { error: `Enter a valid ${field.dataType} for “${field.name}”.` };
            }
            values[field.name] = value;
            continue;
        }
        if (field.dataType === "object" || field.dataType === "array") {
            try {
                const value: unknown = JSON.parse(raw);
                if (field.dataType === "object" && (!value || typeof value !== "object" || Array.isArray(value))) throw new Error();
                if (field.dataType === "array" && !Array.isArray(value)) throw new Error();
                values[field.name] = value;
            } catch {
                return { error: `Enter valid JSON ${field.dataType === "array" ? "array" : "object"} for “${field.name}”.` };
            }
            continue;
        }
        if (field.dataType === "date" && (Number.isNaN(Date.parse(raw)) || new Date(raw).toISOString().slice(0, 10) !== raw)) {
            return { error: `Enter a valid date for “${field.name}”.` };
        }
        if (field.dataType === "datetime" && Number.isNaN(Date.parse(raw))) {
            return { error: `Enter a valid date and time for “${field.name}”.` };
        }
        values[field.name] = raw;
    }
    return { values };
}

export function SolidAgentChat({
    agentUrl,
    title = "SolidX Agent",
    agentRuntime = "solidx",
    inputContext = {},
    inputs,
    requiredInputs = [],
    externalEmbed = false,
    onInputsLocked,
    embedded = false,
    // SDK prefill goes through the shared "solidx" conversation only.
    handlesPrefill = !embedded && agentRuntime === "solidx",
    suggestions,
    windowControls,
}: Props) {
    const { agent, dispatch, runtime } = useAgentChat(agentRuntime, agentUrl, externalEmbed);
    // Agent login (API key → agentToken in sessionStorage); the chat is usable once signed in.
    const agentAuth = useAgentAuth(agentUrl, agentRuntime === "agentHub");
    const signedIn = agentAuth.status === "signedIn";
    const signedInAs = agentAuth.auth?.user?.email ?? agentAuth.auth?.user?.username;
    const emptyStateSuggestions = suggestions ?? (agentRuntime === "agentHub" ? AGENT_HUB_DEFAULT_SUGGESTIONS : DEFAULT_SUGGESTIONS);

    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState<AgentSessionSummary[]>([]);
    const [seed, setSeed] = useState<{ text: string; key: number } | null>(null);
    const [staleAgentConfig, setStaleAgentConfig] = useState(false);
    const [modelAssignments, setModelAssignments] = useState<AgentModelAssignments | null>(null);
    const [providers, setProviders] = useState<AgentProviderInfo[]>(() => getCachedAgentProviders(agentUrl));
    const [loadingProviders, setLoadingProviders] = useState<boolean>(() => getCachedAgentProviders(agentUrl).length === 0);
    const [selectedProvider, setSelectedProvider] = useState<string>(() => getStoredProvider());
    const [models, setModels] = useState<ProviderModelInfo[]>(() => {
        const cached = getCachedProviderModels(agentUrl, getStoredProvider());
        return cached?.models || [];
    });
    const [selectedModel, setSelectedModel] = useState<string>(() => getStoredModel(getStoredProvider()) || "");
    const [isThinking, setIsThinking] = useState<boolean>(() => getStoredThinking(getStoredProvider()));
    const [selectedReasoning, setSelectedReasoning] = useState<string>(() => getStoredReasoning(getStoredProvider()) || "");
    const [isFast, setIsFast] = useState<boolean>(() => getStoredFast(getStoredProvider()));
    const [selectedSpeed, setSelectedSpeed] = useState<string>(() => getStoredSpeed(getStoredProvider()) || "standard");
    const [showProviderMenu, setShowProviderMenu] = useState(false);
    const providerMenuRef = useRef<HTMLDivElement>(null);
    const [collectedInputs, setCollectedInputs] = useState<Record<string, unknown> | null>(null);
    const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({});
    const [inputError, setInputError] = useState("");
    useEffect(() => {
        setRawInputValues(Object.fromEntries(requiredInputs.map((field) => [field.name,
            field.defaultValue === null || field.defaultValue === undefined ? "" : typeof field.defaultValue === "string" ? field.defaultValue : JSON.stringify(field.defaultValue)])));
    }, [requiredInputs]);
    const shouldPromptForInputs = !externalEmbed && agentRuntime === "agentHub" && signedIn
        && requiredInputs.length > 0 && inputs === undefined && collectedInputs === null;
    const messageInputs = inputs ?? collectedInputs ?? undefined;

    const activeModelInfo = useMemo(() => {
        return models.find((m) => m.id === selectedModel) || (models.length > 0 ? models[0] : null);
    }, [models, selectedModel]);

    // Synchronize reasoning and speed options when model or provider changes
    useEffect(() => {
        if (!activeModelInfo) return;

        const validEfforts = activeModelInfo.reasoning_efforts || [];
        if (validEfforts.length > 0) {
            const savedReasoning = getStoredReasoning(selectedProvider);
            const matched = validEfforts.find((r) => r.id === savedReasoning);
            const nextReasoning = matched ? matched.id : (activeModelInfo.default_reasoning || validEfforts[0].id);
            setSelectedReasoning(nextReasoning);
            setIsThinking(true);
            setStoredSessionOptions(selectedProvider, { reasoning: nextReasoning, thinking: true });
        } else {
            const savedThinking = getStoredThinking(selectedProvider);
            const thinkActive = selectedProvider === "opencode" || activeModelInfo.id.includes("thinking") || savedThinking;
            setIsThinking(thinkActive);
        }

        const isCodexOrCursor = selectedProvider === "codex" || selectedProvider === "cursor";
        const validSpeedTiers = (activeModelInfo.speed_tiers && activeModelInfo.speed_tiers.length > 0)
            ? activeModelInfo.speed_tiers
            : (isCodexOrCursor ? [{ id: "standard", name: "Standard" }, { id: "fast", name: "Fast" }] : []);

        if (validSpeedTiers.length > 0) {
            const savedSpeed = getStoredSpeed(selectedProvider);
            const matchedSpeed = validSpeedTiers.find((s) => s.id === savedSpeed);
            let nextSpeed = matchedSpeed ? matchedSpeed.id : (activeModelInfo.default_speed || "standard");
            if (selectedProvider === "cursor" && activeModelInfo.id.endsWith("-fast")) {
                nextSpeed = "fast";
            }
            setSelectedSpeed(nextSpeed);
            const fastActive = nextSpeed === "fast";
            setIsFast(fastActive);
            setStoredSessionOptions(selectedProvider, { speed: nextSpeed, fast: fastActive });
        } else {
            setSelectedSpeed("standard");
            setIsFast(false);
        }
    }, [activeModelInfo, selectedProvider]);

    const submitRequiredInputs = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const result = parseInputValues(requiredInputs, rawInputValues);
        if (!result.values) {
            setInputError(result.error ?? "Check the input values and try again.");
            return;
        }
        setCollectedInputs(result.values);
    };

    useEffect(() => {
        let alive = true;
        fetchAgentModelAssignments(agentUrl).then((models) => {
            if (alive) setModelAssignments(models);
        });
        return () => { alive = false; };
    }, [agentUrl, signedIn]);

    useEffect(() => {
        let alive = true;
        if (providers.length === 0) {
            setLoadingProviders(true);
        }
        fetchAgentProviders(agentUrl).then((list) => {
            if (!alive) return;
            const installed = (list || []).filter((p) => p.installed);
            setProviders(installed);
            if (installed.length > 0) {
                const current = getStoredProvider();
                const matched = installed.find((p) => p.id === current);
                if (!matched) {
                    setSelectedProvider(installed[0].id);
                }
            }
        }).catch(() => {
            if (alive && providers.length === 0) setProviders([]);
        }).finally(() => {
            if (alive) setLoadingProviders(false);
        });
        return () => { alive = false; };
    }, [agentUrl, signedIn]);

    useEffect(() => {
        if (!selectedProvider) return;
        let alive = true;
        fetchProviderModels(agentUrl, selectedProvider).then((res) => {
            if (!alive) return;
            const nextModels = res?.models || [];
            if (nextModels.length > 0) {
                setModels(nextModels);
            }
            const savedModel = getStoredModel(selectedProvider);
            const matchedModel = nextModels.find((m) => m.id === savedModel);
            const targetModel = matchedModel ? matchedModel.id : (res?.default_model || nextModels[0]?.id || "");
            if (targetModel) {
                setSelectedModel(targetModel);
            }
        });
        return () => { alive = false; };
    }, [agentUrl, signedIn, selectedProvider]);

    useEffect(() => {
        if (!showProviderMenu) return;
        const handleOutside = (e: MouseEvent) => {
            if (providerMenuRef.current && !providerMenuRef.current.contains(e.target as Node)) {
                setShowProviderMenu(false);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setShowProviderMenu(false);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [showProviderMenu]);

    const handleSelectProvider = (providerId: string) => {
        setSelectedProvider(providerId);
        setShowProviderMenu(false);
        fetchProviderModels(agentUrl, providerId).then((res) => {
            const nextModels = res?.models || [];
            setModels(nextModels);
            const targetModel = res?.default_model || nextModels[0]?.id || "";
            setSelectedModel(targetModel);
            const nextThinking = getStoredThinking(providerId);
            const nextReasoning = getStoredReasoning(providerId) ?? undefined;
            const nextFast = getStoredFast(providerId);
            const nextSpeed = getStoredSpeed(providerId) ?? undefined;
            setIsThinking(nextThinking);
            setSelectedReasoning(nextReasoning ?? "");
            setIsFast(nextFast);
            setSelectedSpeed(nextSpeed ?? "standard");
            runtime?.newChat(providerId, targetModel, {
                thinking: nextThinking,
                reasoning: nextReasoning,
                fast: nextFast,
                speed: nextSpeed,
            });
            setShowHistory(false);
            onInputsLocked?.(false);
            if (!externalEmbed && agentRuntime === "agentHub" && requiredInputs.length && inputs === undefined) {
                setCollectedInputs(null);
                setInputError("");
            }
        });
    };

    const handleStartNewChat = () => {
        runtime?.newChat(selectedProvider, selectedModel, {
            thinking: isThinking,
            reasoning: selectedReasoning,
            fast: isFast,
            speed: selectedSpeed,
        });
        setShowHistory(false);
        setShowProviderMenu(false);
        onInputsLocked?.(false);
        if (!externalEmbed && agentRuntime === "agentHub" && requiredInputs.length && inputs === undefined) {
            setCollectedInputs(null);
            setInputError("");
        }
    };

    const getProviderBadgeLabel = useCallback((providerId?: string) => {
        if (!providerId) return "";
        const matched = providers.find((p) => p.id.toLowerCase() === providerId.toLowerCase());
        if (matched?.name) return matched.name;
        return providerId.charAt(0).toUpperCase() + providerId.slice(1);
    }, [providers]);

    const handleResumeSession = async (session: AgentSessionSummary) => {
        const targetProvider = session.provider || selectedProvider;
        const targetModel = session.model || selectedModel;

        if (targetProvider && targetProvider !== selectedProvider) {
            setSelectedProvider(targetProvider);
        }

        let targetModels = models;
        if (targetProvider && targetProvider !== selectedProvider) {
            const res = await fetchProviderModels(agentUrl, targetProvider);
            targetModels = res?.models || [];
            if (targetModels.length > 0) {
                setModels(targetModels);
            }
        }

        const resolvedModel = targetModel || targetModels[0]?.id || "";
        if (resolvedModel) {
            setSelectedModel(resolvedModel);
        }

        const nextThinking = getStoredThinking(targetProvider);
        const nextReasoning = getStoredReasoning(targetProvider) ?? undefined;
        const nextFast = getStoredFast(targetProvider);
        const nextSpeed = getStoredSpeed(targetProvider) ?? undefined;
        setIsThinking(nextThinking);
        setSelectedReasoning(nextReasoning ?? "");
        setIsFast(nextFast);
        setSelectedSpeed(nextSpeed ?? "standard");

        runtime?.resume(session.session_id, targetProvider, resolvedModel, {
            thinking: nextThinking,
            reasoning: nextReasoning,
            fast: nextFast,
            speed: nextSpeed,
        });
        setShowHistory(false);
    };

    const handleModelChange = (modelId: string) => {
        setSelectedModel(modelId);
        runtime?.updateModel(modelId, selectedProvider, {
            thinking: isThinking,
            reasoning: selectedReasoning,
            fast: isFast,
            speed: selectedSpeed,
        });
    };

    const handleReasoningChange = (newReasoning: string) => {
        const val = (newReasoning || "").toLowerCase().trim();
        const isOff = !newReasoning || val === "none" || val === "off" || val === "disabled" || val === "false" || val === "0";
        const thinkingBool = !isOff;
        setSelectedReasoning(newReasoning);
        setIsThinking(thinkingBool);
        setStoredSessionOptions(selectedProvider, { reasoning: newReasoning, thinking: thinkingBool });
        runtime?.updateSessionOptions({
            reasoning: newReasoning,
            thinking: thinkingBool,
            speed: selectedSpeed,
            fast: isFast,
        });
    };

    const handleThinkingToggle = () => {
        const nextThinking = !isThinking;
        setIsThinking(nextThinking);
        setStoredSessionOptions(selectedProvider, { thinking: nextThinking });
        runtime?.updateSessionOptions({
            thinking: nextThinking,
            reasoning: nextThinking ? (selectedReasoning || undefined) : undefined,
            speed: selectedSpeed,
            fast: isFast,
        });
    };

    const handleSpeedChange = (newSpeed: string) => {
        const fastBool = newSpeed === "fast";
        setSelectedSpeed(newSpeed);
        setIsFast(fastBool);
        setStoredSessionOptions(selectedProvider, { speed: newSpeed, fast: fastBool });

        let targetModel = selectedModel;
        if (selectedProvider === "cursor" && models.length > 0) {
            if (fastBool && !selectedModel.endsWith("-fast")) {
                const cand = `${selectedModel}-fast`;
                if (models.some((m) => m.id === cand)) targetModel = cand;
            } else if (!fastBool && selectedModel.endsWith("-fast")) {
                const cand = selectedModel.slice(0, -5);
                if (models.some((m) => m.id === cand)) targetModel = cand;
            }
        }

        if (targetModel !== selectedModel) {
            handleModelChange(targetModel);
        } else {
            runtime?.updateSessionOptions({
                speed: newSpeed,
                fast: fastBool,
                thinking: isThinking,
                reasoning: selectedReasoning,
            });
        }
    };

    const handleFastToggle = () => {
        const nextSpeed = isFast ? "standard" : "fast";
        handleSpeedChange(nextSpeed);
    };

    useEffect(() => {
        if (agentRuntime !== "agentHub" || !signedIn) {
            setStaleAgentConfig(false);
            return;
        }

        let alive = true;
        const refreshConfigStatus = async () => {
            try {
                const status = await fetchAgentConfigVersionStatus(agentUrl);
                if (alive && status) setStaleAgentConfig(status.stale);
            } catch {
                // Keep the last known status when the agent is temporarily unreachable.
            }
        };
        void refreshConfigStatus();
        const timer = window.setInterval(() => void refreshConfigStatus(), 30_000);
        return () => {
            alive = false;
            window.clearInterval(timer);
        };
    }, [agentRuntime, agentUrl, signedIn]);

    // SDK requests: solidAgent.open({ prompt, autoSend, context }).
    useEffect(() => {
        if (!handlesPrefill || !agent.prefill || !runtime) return;
        const { prompt, autoSend, context, nonce } = agent.prefill;
        dispatch(agentPrefillConsumed());
        setShowHistory(false);
        if (autoSend) runtime.sendMessage(prompt, { ...inputContext, ...(context ?? {}) });
        else setSeed({ text: prompt, key: nonce });
    }, [agent.prefill, handlesPrefill, dispatch, runtime, inputContext]);

    useEffect(() => {
        if (!showHistory || !signedIn) return;
        let alive = true;
        fetchSessionList(agentUrl).then((list) => alive && setSessions(list ?? []));
        return () => {
            alive = false;
        };
    }, [showHistory, agentUrl, signedIn]);

    useEffect(() => {
        return eventBus.on(SOLID_AGENT_EVENTS.sessionChanged, (payload) => {
            if (!payload) return;
            if (payload.provider && payload.provider !== selectedProvider) {
                setSelectedProvider(payload.provider);
                fetchProviderModels(agentUrl, payload.provider).then((res) => {
                    const nextModels = res?.models || [];
                    if (nextModels.length > 0) setModels(nextModels);
                    if (payload.model) {
                        setSelectedModel(payload.model);
                    } else {
                        const fallback = res?.default_model || nextModels[0]?.id || "";
                        if (fallback) setSelectedModel(fallback);
                    }
                });
            } else if (payload.model && payload.model !== selectedModel) {
                setSelectedModel(payload.model);
            }
        });
    }, [agentUrl, selectedProvider, selectedModel]);

    const setMode = (mode: AgentMode) => dispatch(agentModeChanged(mode));
    const windowMode = windowControls?.mode ?? agent.mode;
    const send = useCallback((text: string) => {
        if (!text.trim() || !runtime) return;
        onInputsLocked?.(true);
        return runtime.sendMessage(text, inputContext, [], messageInputs);
    }, [runtime, inputContext, messageInputs, onInputsLocked]);
    const sendWithAttachments = useCallback(
        (text: string, attachments: AgentAttachment[]) => {
            if ((!text.trim() && !attachments.length) || !runtime) return;
            onInputsLocked?.(true);
            return runtime.sendMessage(text, inputContext, attachments, messageInputs);
        },
        [runtime, inputContext, messageInputs, onInputsLocked],
    );
    const offline = agent.connection === "reconnecting" || agent.connection === "offline";
    const statusColor = agent.connection === "open" ? (agent.working ? "#eab308" : "#22c55e") : offline ? "#dc2626" : "#94a3b8";
    const statusText =
        agentAuth.status === "signedOut" ? "Sign in required"
        : agent.connection === "open" ? (agent.working ? "Working…" : "Ready")
        : agent.connection === "connecting" ? "Connecting…"
        : offline ? "Reconnecting…" : "Idle";

    const activeProviderObj = providers.find((p) => p.id === selectedProvider);
    const providerDisplayName = activeProviderObj?.name || (selectedProvider ? selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1) : "");

    const empty = (
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
                {emptyStateSuggestions.map((text) => (
                    <button key={text} type="button" className={styles.suggestion} onClick={() => send(text)}>
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <>
            {shouldPromptForInputs && <SolidDialog
                open
                dismissible={!!windowControls}
                onOpenChange={(open) => { if (!open) windowControls?.onClose(); }}
                className={styles.inputDialog}
                overlayClassName={styles.inputDialogOverlay}
                header="Set up this test run"
                ariaLabel={`Enter inputs for ${title}`}
                style={{ width: "min(34rem, 94vw)" }}
            >
                <SolidDialogBody className={styles.inputDialogBody}>
                    <form className={styles.inputForm} autoComplete="off" onSubmit={submitRequiredInputs}>
                        <p>Sign-in is complete. Enter the values this agent needs before starting the conversation.</p>
                        <div className={styles.inputFields}>
                            {requiredInputs.map((field, index) => {
                                const id = `solid-agent-test-input-${index}`;
                                const value = rawInputValues[field.name] ?? "";
                                const update = (next: string) => {
                                    setRawInputValues((current) => ({ ...current, [field.name]: next }));
                                    setInputError("");
                                };
                                const inputType = field.dataType === "integer" || field.dataType === "number" ? "number"
                                    : field.dataType === "datetime" ? "datetime-local"
                                        : field.dataType === "date" ? "date" : "text";
                                return <label className={styles.inputField} htmlFor={id} key={`${field.name}-${index}`}>
                                    <span>{field.name}<small>{field.description || field.dataType}{field.optional ? " · optional" : ""}</small></span>
                                    {field.dataType === "boolean" ? (
                                        <select id={id} autoComplete="off" value={value} onChange={(event) => update(event.target.value)}>
                                            <option value="">Choose a value</option><option value="true">True</option><option value="false">False</option>
                                        </select>
                                    ) : field.dataType === "object" || field.dataType === "array" ? (
                                        <textarea id={id} autoComplete="off" value={value} onChange={(event) => update(event.target.value)} placeholder={field.dataType === "array" ? "[ ]" : "{ }"} rows={3} />
                                    ) : (
                                        <SolidInput id={id} type={inputType} step={field.dataType === "number" ? "any" : field.dataType === "integer" ? "1" : undefined}
                                            autoComplete="off" value={value} onChange={(event) => update(event.target.value)} />
                                    )}
                                </label>;
                            })}
                        </div>
                        {inputError && <p className={styles.inputError} role="alert">{inputError}</p>}
                        <div className={styles.inputActions}>
                            {windowControls && <SolidButton type="button" variant="secondary" onClick={() => windowControls.onClose()}>Cancel</SolidButton>}
                            <SolidButton type="submit">Start test</SolidButton>
                        </div>
                    </form>
                </SolidDialogBody>
            </SolidDialog>}
            <div className={`${styles.header} ${externalEmbed ? styles.externalEmbedHeader : ""}`}>
                <div className={styles.headerMark}>
                    <Sparkles size={15} />
                    <span className={styles.statusDot} style={{ background: statusColor }} />
                </div>
                <div className={styles.headerTitle}>
                    <strong>{title}</strong>
                    <span className={styles.headerSub}>
                        {signedIn && providerDisplayName && (
                            <span className={styles.headerProviderTag} title={`Active Provider: ${providerDisplayName}`}>
                                {providerDisplayName}
                            </span>
                        )}
                        <span className={styles.headerStatusText}>{statusText}</span>
                    </span>
                </div>
                {signedIn && (
                    <>
                        <div className={styles.newChatSplit} ref={providerMenuRef}>
                            <button
                                type="button"
                                className={styles.splitActionBtn}
                                title={`New chat (${providers.find((p) => p.id === selectedProvider)?.name || "SolidX"})`}
                                aria-label="New chat"
                                disabled={agent.working}
                                onClick={handleStartNewChat}
                            >
                                <Plus size={15} />
                            </button>
                            <span className={styles.splitDivider} />
                            <button
                                type="button"
                                className={`${styles.splitTriggerBtn} ${showProviderMenu ? styles.splitTriggerActive : ""}`}
                                title={loadingProviders ? "Loading AI execution providers..." : "Select AI execution provider"}
                                aria-label="Select AI execution provider"
                                aria-expanded={showProviderMenu}
                                disabled={agent.working}
                                onClick={() => setShowProviderMenu((prev) => !prev)}
                            >
                                {loadingProviders ? (
                                    <Loader2 size={12} className={styles.spinIcon} />
                                ) : (
                                    <ChevronDown size={13} className={`${styles.splitChevron} ${showProviderMenu ? styles.splitChevronOpen : ""}`} />
                                )}
                            </button>
                            {showProviderMenu && (
                                <div className={styles.providerDropdown} role="menu">
                                    <div className={styles.providerDropdownHeader}>
                                        <strong>Select AI Provider</strong>
                                    </div>
                                    {loadingProviders ? (
                                        <div className={styles.providerLoadingItem}>
                                            <Loader2 size={13} className={styles.spinIcon} />
                                            <span>Loading providers...</span>
                                        </div>
                                    ) : (
                                        <div className={styles.providerList}>
                                            {providers.map((p) => {
                                                const isSelected = p.id === selectedProvider;
                                                return (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        className={`${styles.providerItem} ${isSelected ? styles.providerItemActive : ""}`}
                                                        onClick={() => handleSelectProvider(p.id)}
                                                    >
                                                        <div className={styles.providerItemMeta}>
                                                            <span className={styles.providerItemName}>{p.name}</span>
                                                        </div>
                                                        {isSelected && <Check size={14} className={styles.providerCheck} />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className={styles.iconBtn}
                            title="History"
                            aria-label="Chat history"
                            aria-pressed={showHistory}
                            onClick={() => setShowHistory((v) => !v)}
                        >
                            <History size={16} />
                        </button>
                        {!externalEmbed && <button
                            type="button"
                            className={styles.iconBtn}
                            title={signedInAs ? `Sign out of the agent (${String(signedInAs)})` : "Sign out of the agent"}
                            aria-label="Sign out of the agent"
                            onClick={() => { setShowHistory(false); void signOutOfAgent(agentUrl); }}
                        >
                            <LogOut size={15} />
                        </button>}
                    </>
                )}
                {(!embedded || windowControls) && (
                    <>
                        {windowMode !== "docked" && (
                            <button type="button" className={styles.iconBtn} title="Dock to the side" aria-label="Dock to the side" onClick={() => windowControls ? windowControls.onDock() : setMode("docked")}>
                                <PanelRight size={16} />
                            </button>
                        )}
                        {windowMode === "maximized" ? (
                            <button type="button" className={styles.iconBtn} title="Restore" aria-label="Restore size" onClick={() => windowControls ? windowControls.onRestore() : setMode("compact")}>
                                <Minimize2 size={15} />
                            </button>
                        ) : (
                            <button type="button" className={styles.iconBtn} title="Maximize" aria-label="Maximize" onClick={() => windowControls ? windowControls.onMaximize() : setMode("maximized")}>
                                <Maximize2 size={15} />
                            </button>
                        )}
                        <button type="button" className={styles.iconBtn} title={windowControls ? "Close test agent" : "Minimize (Esc)"} aria-label={windowControls ? "Close test agent" : "Minimize"} onClick={() => windowControls ? windowControls.onClose() : setMode("bubble")}>
                            {windowControls || windowMode !== "compact" ? <X size={16} /> : <Minus size={16} />}
                        </button>
                    </>
                )}
            </div>

            {agentAuth.status === "checking" ? (
                externalEmbed
                    ? <div className={styles.embedWait} role="status" aria-live="polite"><div className={styles.embedWaitCard}><span className={styles.embedSpinner} aria-hidden="true" /><strong>Please wait</strong><span>Checking your connection</span></div></div>
                    : <div style={{ flex: "1 1 auto" }} />
            ) : agentAuth.status === "signedOut" ? (
                // The agent forgot the token (expired/restarted) if it already reported an auth error.
                externalEmbed ? <div className={styles.embedWait} role="status" aria-live="polite"><div className={styles.embedWaitCard}><span className={styles.embedSpinner} aria-hidden="true" /><strong>Please wait</strong><span>Connecting to your agent</span></div></div>
                    : <AgentSignIn agentUrl={agentUrl} expired={!!agent.authError} />
            ) : (
                <>
                {externalEmbed && agent.connection !== "open" && (
                    <div className={styles.embedWait} role="status" aria-live="polite">
                        <div className={styles.embedWaitCard}>
                            <span className={styles.embedSpinner} aria-hidden="true" />
                            <strong>Please wait</strong>
                            <span>{offline ? "Reconnecting to your agent" : "Connecting to your agent"}</span>
                        </div>
                    </div>
                )}
                {offline && (
                    <div className={styles.banner} role="status">
                        <WifiOff size={14} /> Reconnecting to the agent… Your messages will be sent once it is back.
                    </div>
                )}
                {agentRuntime === "agentHub" && staleAgentConfig && (
                    <div className={styles.banner} role="status">
                        This session is using an older agent configuration. Ask an administrator to restart the agent, then sign in again to load the latest version.
                    </div>
                )}
                {agent.authError && (
                    <div className={`${styles.banner} ${styles.bannerError}`} role="alert">
                        {agent.authError}
                    </div>
                )}

                {showHistory ? (
                    <div className={styles.historyPanel} aria-label="Past conversations">
                        {sessions.length === 0 && <div className={styles.notice}>No past conversations.</div>}
                        {sessions.map((session) => (
                            <div key={session.session_id} style={{ display: "flex", alignItems: "center" }}>
                                <button
                                    type="button"
                                    className={`${styles.historyItem} ${session.session_id === agent.historySessionId ? styles.historyItemActive : ""}`}
                                    onClick={() => void handleResumeSession(session)}
                                >
                                    <span className={styles.historyPreview}>{session.preview || "New conversation"}</span>
                                    {session.provider && (
                                        <span
                                            className={styles.providerBadge}
                                            title={session.model ? `${getProviderBadgeLabel(session.provider)} (${session.model})` : getProviderBadgeLabel(session.provider)}
                                        >
                                            {getProviderBadgeLabel(session.provider)}
                                        </span>
                                    )}
                                    <span className={styles.historyDate}>{formatDate(session.created_at)}</span>
                                </button>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    aria-label="Delete conversation"
                                    title="Delete"
                                    onClick={async () => {
                                        if (!window.confirm("Delete this conversation?")) return;
                                        await deleteSession(agentUrl, session.session_id);
                                        setSessions((prev) => prev.filter((s) => s.session_id !== session.session_id));
                                        if (session.session_id === agent.historySessionId) runtime?.newChat();
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <AgentThread
                        items={agent.items}
                        thinking={agent.working && agent.thinking}
                        working={agent.working}
                        hasMore={agent.hasMoreHistory}
                        context={agent.context ?? undefined}
                        emptyState={empty}
                        onLoadOlder={() => void runtime?.loadOlder()}
                        onReply={(widgetId, widget, value) => runtime?.replyToWidget(widgetId, widget, value)}
                        onPrompt={send}
                    />
                )}

                <AgentComposer
                    working={agent.working}
                    disabled={!!agent.authError}
                    commands={agent.commands}
                    seed={seed?.text}
                    seedKey={seed?.key}
                    onSend={sendWithAttachments}
                    onStop={() => runtime?.cancel()}
                    modelIndicator={
                        <AgentModelIndicator
                            assignments={modelAssignments}
                            activeProvider={selectedProvider}
                            activeModel={selectedModel}
                            providers={providers}
                            models={models}
                            onModelSelect={handleModelChange}
                            disabled={agent.working}
                            isThinking={isThinking}
                            isFast={isFast}
                            selectedReasoning={selectedReasoning}
                            selectedSpeed={selectedSpeed}
                            onThinkingToggle={handleThinkingToggle}
                            onFastToggle={handleFastToggle}
                            onReasoningSelect={handleReasoningChange}
                            onSpeedSelect={handleSpeedChange}
                        />
                    }
                />
                </>
            )}
        </>
    );
}
