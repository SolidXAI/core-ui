import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Check, ChevronDown, Clock, Copy, History, LogOut, Maximize2, Minimize2, Minus, MoreHorizontal, PanelRight, Pencil, Plus, Search, Sparkles, Trash2, WifiOff, X } from "lucide-react";
import styles from "./SolidAgent.module.css";
import { agentModeChanged, agentPrefillConsumed } from "../../../redux/features/agentSlice";
import {
    deleteSession,
    fetchAgentConfigVersionStatus,
    fetchAgentModelAssignments,
    fetchAgentProviders,
    fetchProviderAuth,
    fetchProviderModels,
    fetchSessionList,
    getCachedAgentProviders,
    getCachedProviderModels,
    getStoredSessionTitles,
    renameSession,
    type AgentSessionPage,
    type AgentSessionSummary,
} from "./client/agentRest";
import {
    getStoredFast,
    getStoredModel,
    getStoredProvider,
    getStoredReasoning,
    getStoredSpeed,
    getStoredThinking,
    setStoredProviderAndModel,
    setStoredSessionOptions,
} from "./client/agentRuntime";
import { AgentThread } from "./thread/AgentThread";
import { AgentComposer } from "./composer/AgentComposer";
import type { AgentAttachment, AgentMode, AgentProviderAuthStatus, AgentProviderInfo, AgentRuntimeType, ProviderModelInfo } from "./types";
import type { AgentInputContext } from "./useAdminInputContext";
import { useAgentChat } from "./useAgentChat";
import { useAgentAuth } from "./useAgentAuth";
import { AgentSignIn } from "./AgentSignIn";
import { signOutOfAgent } from "./client/agentAuth";
import { AgentModelIndicator, isVisionModel } from "./AgentModelIndicator";
import { AgentContextPill } from "./AgentContextPill";
import type { AgentModelAssignments } from "./types";
import type { AgentInputDefinition } from "./embed/agentEmbedProtocol";
import type { BeforeUserMessageSendRequest, EmbedMessageContext } from "./embed/agentEmbedProtocol";
import { SolidButton } from "../../shad-cn-ui/SolidButton";
import { SolidDialog, SolidDialogBody } from "../../shad-cn-ui/SolidDialog";
import { SolidInput } from "../../shad-cn-ui/SolidInput";
import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../shad-cn-ui/SolidTooltip";
import { SolidSpinner } from "../../shad-cn-ui/SolidSpinner";
import { eventBus } from "../../../helpers/eventBus";
import { SOLID_AGENT_EVENTS } from "./sdk/solidAgent";

export function formatProviderName(raw?: string): string {
    if (!raw) return "";
    const trimmed = raw.trim();
    const lower = trimmed.toLowerCase();
    if (lower.includes("copilot")) return "Copilot";
    if (lower.includes("droid")) return "Droid";
    if (lower.includes("claude")) return "Claude";
    return trimmed;
}

function getProviderAuthStatus(provider?: AgentProviderInfo): AgentProviderAuthStatus {
    if (!provider) return "error";
    if (provider.id === "solidx") return "authenticated";
    if (provider.authStatus) return provider.authStatus;
    if (provider.authenticated === true) return "authenticated";
    if (provider.authenticated === false) return "unauthenticated";
    return "checking";
}

type Props = {
    agentUrl: string;
    title?: string;
    /** AgentHub configuration version to display in the header. */
    agentVersion?: number;
    /** Which agent backend `agentUrl` belongs to (default "solidx", shared with the launcher). */
    agentRuntime?: AgentRuntimeType;
    inputContext?: AgentInputContext;
    inputs?: Record<string, unknown>;
    requiredInputs?: AgentInputDefinition[];
    externalEmbed?: boolean;
    sessionOwnerKey?: string;
    onInputsLocked?: (locked: boolean) => void;
    beforeSend?: (request: BeforeUserMessageSendRequest, signal: AbortSignal) => Promise<EmbedMessageContext | AgentInputContext | undefined>;
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

const SIDEBAR_WIDTH_STORAGE_KEY = "solid-agent.sidebar-width";
const DEFAULT_SIDEBAR_WIDTH = 270;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 420;

function formatDate(iso: string | null) {
    if (!iso) return "";
    const date = new Date(iso);
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (days === 1) return "Yesterday";
    if (days < 7) return date.toLocaleDateString([], { weekday: "short" });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatSessionTime(iso: string | null): string {
    if (!iso) return "";
    const date = new Date(iso);
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
    if (days === 0) return `Today, ${timeStr}`;
    if (days === 1) return `Yesterday, ${timeStr}`;
    return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
}

function parseInputValues(fields: AgentInputDefinition[], rawValues: Record<string, string>): { values?: Record<string, unknown>; error?: string } {
    const values: Record<string, unknown> = {};
    for (const field of fields) {
        const raw = rawValues[field.name] ?? "";
        if (!raw.trim() && field.optional) continue;
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
    agentVersion,
    agentRuntime = "solidx",
    inputContext = {},
    inputs,
    requiredInputs = [],
    externalEmbed = false,
    sessionOwnerKey,
    onInputsLocked,
    beforeSend,
    embedded = false,
    // SDK prefill goes through the shared "solidx" conversation only.
    handlesPrefill = !embedded && agentRuntime === "solidx",
    suggestions,
    windowControls,
}: Props) {
    const { agent, dispatch, runtime } = useAgentChat(agentRuntime, agentUrl, externalEmbed, sessionOwnerKey);
    // Agent login (API key → agentToken in sessionStorage); the chat is usable once signed in.
    const agentAuth = useAgentAuth(agentUrl, agentRuntime === "agentHub");
    const signedIn = agentAuth.status === "signedIn";
    const signedInAs = agentAuth.auth?.user?.email ?? agentAuth.auth?.user?.username;
    const emptyStateSuggestions = suggestions ?? (agentRuntime === "agentHub" ? AGENT_HUB_DEFAULT_SUGGESTIONS : DEFAULT_SUGGESTIONS);

    const windowMode = windowControls?.mode ?? agent.mode;
    const isFullScreen = windowMode === "maximized";
    const [showHistory, setShowHistory] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
        if (typeof window === "undefined") return DEFAULT_SIDEBAR_WIDTH;
        try {
            const stored = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
            if (stored) {
                const num = parseInt(stored, 10);
                if (!isNaN(num) && num >= MIN_SIDEBAR_WIDTH && num <= MAX_SIDEBAR_WIDTH) {
                    return num;
                }
            }
        } catch {}
        return DEFAULT_SIDEBAR_WIDTH;
    });
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
    const isResizingSidebarRef = useRef(false);
    const sidebarWidthRef = useRef(sidebarWidth);
    sidebarWidthRef.current = sidebarWidth;
    const fullScreenLayoutRef = useRef<HTMLDivElement>(null);
    const [sessions, setSessions] = useState<AgentSessionSummary[]>([]);
    const [historyNextCursor, setHistoryNextCursor] = useState<string | null>(null);
    const [historyHasMore, setHistoryHasMore] = useState(false);
    const [historyInitialLoading, setHistoryInitialLoading] = useState(false);
    const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
    const [historyLoadError, setHistoryLoadError] = useState<string | null>(null);
    const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");

    const historyGenerationRef = useRef(0);
    const historyAbortRef = useRef<AbortController | null>(null);
    const historyInFlightRef = useRef(false);
    const historySentinelRef = useRef<HTMLDivElement>(null);
    const historyScrollRef = useRef<HTMLDivElement | null>(null);
    const [sessionToDelete, setSessionToDelete] = useState<AgentSessionSummary | null>(null);
    const startingNewChatRef = useRef(false);
    const [historySearchQuery, setHistorySearchQuery] = useState("");
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [seed, setSeed] = useState<{ text: string; key: number } | null>(null);
    const [staleAgentConfig, setStaleAgentConfig] = useState(false);
    const [agentConfigVersion, setAgentConfigVersion] = useState<number | null>(() => agentVersion ?? null);
    const [modelAssignments, setModelAssignments] = useState<AgentModelAssignments | null>(null);
    const [providers, setProviders] = useState<AgentProviderInfo[]>(() => {
        if (agentRuntime === "agentHub") {
            return [{ id: "solidx", name: "Native", installed: true, authenticated: true, authStatus: "authenticated", version: "" }];
        }
        const cached = getCachedAgentProviders(agentUrl);
        if (cached && cached.length > 0) {
            return cached.map((provider) => provider.id === "solidx"
                ? { ...provider, authenticated: true, authStatus: "authenticated" }
                : { ...provider, authenticated: null, authStatus: "checking" });
        }
        return [
            { id: "solidx", name: "Native", installed: true, authenticated: true, authStatus: "authenticated", version: "" },
            { id: "copilot", name: "GitHub Copilot", installed: true, authenticated: null, authStatus: "checking" },
            { id: "cursor", name: "Cursor", installed: true, authenticated: null, authStatus: "checking" },
            { id: "claude", name: "Claude Code", installed: true, authenticated: null, authStatus: "checking" },
            { id: "codex", name: "Codex", installed: true, authenticated: null, authStatus: "checking" },
            { id: "opencode", name: "OpenCode", installed: true, authenticated: null, authStatus: "checking" },
        ];
    });
    const [loadingProviders, setLoadingProviders] = useState<boolean>(() => {
        if (agentRuntime === "agentHub") return false;
        return getCachedAgentProviders(agentUrl).length === 0;
    });
    const [providersLoadError, setProvidersLoadError] = useState(false);
    const [providersReloadKey, setProvidersReloadKey] = useState(0);
    const [selectedProvider, setSelectedProvider] = useState<string>(() => (agentRuntime === "agentHub" ? "solidx" : getStoredProvider()));
    const [models, setModels] = useState<ProviderModelInfo[]>(() => {
        if (agentRuntime === "agentHub") return [];
        const cached = getCachedProviderModels(agentUrl, getStoredProvider());
        return cached?.models || [];
    });
    const [selectedModel, setSelectedModel] = useState<string>(() => (agentRuntime === "agentHub" ? "" : getStoredModel(getStoredProvider()) || ""));
    const [isThinking, setIsThinking] = useState<boolean>(() => getStoredThinking(getStoredProvider()));
    const [selectedReasoning, setSelectedReasoning] = useState<string>(() => getStoredReasoning(getStoredProvider()) || "");
    const [isFast, setIsFast] = useState<boolean>(() => getStoredFast(getStoredProvider()));
    const [selectedSpeed, setSelectedSpeed] = useState<string>(() => getStoredSpeed(getStoredProvider()) || "standard");
    const [isSwitchingProvider, setIsSwitchingProvider] = useState(false);
    const [resumingSessionId, setResumingSessionId] = useState<string | null>(null);
    const [isStartingNewChat, setIsStartingNewChat] = useState(false);
    const skipProviderEffectRef = useRef<string | null>(null);
    const [showProviderMenu, setShowProviderMenu] = useState(false);
    const providerMenuRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
    const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
    const [menuPlacement, setMenuPlacement] = useState<"up" | "down">("down");
    const historyMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (agentVersion != null) setAgentConfigVersion(agentVersion);
    }, [agentVersion]);
    const [collectedInputs, setCollectedInputs] = useState<Record<string, unknown> | null>(null);
    const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({});
    const [inputError, setInputError] = useState("");
    const requiredInputsSignature = JSON.stringify(requiredInputs);
    const inputAgentUrl = useRef(agentUrl);
    useEffect(() => {
        const definitions: AgentInputDefinition[] = JSON.parse(requiredInputsSignature);
        setRawInputValues((current) => {
            const agentChanged = inputAgentUrl.current !== agentUrl;
            inputAgentUrl.current = agentUrl;
            const next: Record<string, string> = {};
            for (const field of definitions) {
                const defaultValue = field.defaultValue === null || field.defaultValue === undefined
                    ? ""
                    : typeof field.defaultValue === "string" ? field.defaultValue : JSON.stringify(field.defaultValue);
                next[field.name] = agentChanged ? defaultValue : current[field.name] ?? defaultValue;
            }
            return next;
        });
    }, [agentUrl, requiredInputsSignature]);
    const shouldPromptForInputs = !externalEmbed && agentRuntime === "agentHub" && signedIn
        && requiredInputs.length > 0 && inputs === undefined && collectedInputs === null;
    const messageInputs = inputs ?? collectedInputs ?? undefined;

    const activeModelInfo = useMemo(() => {
        return models.find((m) => m.id === selectedModel) || (models.length > 0 ? models[0] : null);
    }, [models, selectedModel]);

    const canAttach = useMemo(() => {
        if (activeModelInfo) return isVisionModel(activeModelInfo);
        if (selectedModel) return isVisionModel(selectedModel);
        return true;
    }, [activeModelInfo, selectedModel]);

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
        if (agentRuntime === "agentHub") {
            setProviders([{ id: "solidx", name: "Native", installed: true, authenticated: true, authStatus: "authenticated", version: "" }]);
            setSelectedProvider("solidx");
            setLoadingProviders(false);
            setProvidersLoadError(false);
            return;
        }
        if (!signedIn) {
            setLoadingProviders(false);
            return;
        }
        let alive = true;
        setLoadingProviders(true);
        setProvidersLoadError(false);
        fetchAgentProviders(agentUrl, false).then((list) => {
            if (!alive) return;
            const installed = (list || []).filter((p) => p.installed).map((provider) => provider.id === "solidx"
                ? { ...provider, authenticated: true, authStatus: "authenticated" as const }
                : { ...provider, authenticated: null, authStatus: "checking" as const });
            setProviders(installed);
            if (installed.length > 0) {
                const current = getStoredProvider();
                const matched = installed.find((p) => p.id === current);
                if (!matched) {
                    setSelectedProvider(installed[0].id);
                }
            }
            // Authentication is intentionally loaded separately from fast provider discovery.
            installed.forEach((p) => {
                if (p.id === "solidx") return;
                fetchProviderAuth(agentUrl, p.id)
                    .then((result) => {
                        if (!alive) return;
                        setProviders((prev) =>
                            prev.map((item) => (item.id === p.id ? {
                                ...item,
                                authenticated: result.authenticated,
                                authStatus: result.status === "unknown" ? "error" : result.status,
                            } : item))
                        );
                    })
                    .catch(() => {
                        if (!alive) return;
                        setProviders((prev) =>
                            prev.map((item) => (item.id === p.id ? { ...item, authenticated: null, authStatus: "error" } : item))
                        );
                    });
            });
        }).catch(() => {
            if (!alive) return;
            setProvidersLoadError(true);
            setProviders((prev) => prev.map((provider) => provider.id === "solidx"
                ? { ...provider, authenticated: true, authStatus: "authenticated" }
                : { ...provider, authenticated: null, authStatus: "error" }));
        }).finally(() => {
            if (alive) {
                setLoadingProviders(false);
            }
        });
        return () => { alive = false; };
    }, [agentRuntime, agentUrl, signedIn, providersReloadKey]);

    const retryProviders = useCallback(() => {
        setProvidersReloadKey((value) => value + 1);
    }, []);

    const retryProviderAuth = useCallback((providerId: string) => {
        setProviders((prev) => prev.map((provider) => provider.id === providerId
            ? { ...provider, authenticated: null, authStatus: "checking" }
            : provider));
        void fetchProviderAuth(agentUrl, providerId, true).then((result) => {
            setProviders((prev) => prev.map((provider) => provider.id === providerId ? {
                ...provider,
                authenticated: result.authenticated,
                authStatus: result.status === "unknown" ? "error" : result.status,
            } : provider));
        }).catch(() => {
            setProviders((prev) => prev.map((provider) => provider.id === providerId
                ? { ...provider, authenticated: null, authStatus: "error" }
                : provider));
        });
    }, [agentUrl]);

    useEffect(() => {
        if (!selectedProvider || agentRuntime === "agentHub") return;
        if (skipProviderEffectRef.current === selectedProvider) {
            skipProviderEffectRef.current = null;
            return;
        }
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
    }, [agentRuntime, agentUrl, signedIn, selectedProvider]);

    const updateDropdownPosition = useCallback(() => {
        if (!providerMenuRef.current) return;
        const btnRect = providerMenuRef.current.getBoundingClientRect();
        const isInSidebar = isFullScreen && sidebarOpen;
        const container = isInSidebar
            ? (providerMenuRef.current.closest(`.${styles.fullScreenSidebar}`) || document.body)
            : (headerRef.current || providerMenuRef.current.closest(`.${styles.header}`) || document.body);
        const containerRect = container.getBoundingClientRect();

        const menuWidth = 220;
        const padding = 8;

        const boundaryLeft = Math.max(containerRect.left, 0);
        const boundaryRight = Math.min(containerRect.right, window.innerWidth);
        const maxAllowedWidth = Math.max(160, boundaryRight - boundaryLeft - padding * 2);
        const effectiveWidth = Math.min(menuWidth, maxAllowedWidth);

        // Start with natural alignment to the left of the button (offset = 0)
        let leftOffset = 0;
        const naturalLeft = btnRect.left;
        const naturalRight = naturalLeft + effectiveWidth;

        if (naturalRight > boundaryRight - padding) {
            // Overflows right side of boundary, shift left so right edge fits comfortably
            const overflow = naturalRight - (boundaryRight - padding);
            leftOffset -= overflow;
        }

        // Check if after shifting left (or initially), it overflows left boundary
        if (btnRect.left + leftOffset < boundaryLeft + padding) {
            leftOffset = (boundaryLeft + padding) - btnRect.left;
        }

        setDropdownStyle({
            left: `${Math.round(leftOffset)}px`,
            right: "auto",
            width: `${effectiveWidth}px`,
            maxWidth: `${effectiveWidth}px`,
        });
    }, [isFullScreen, sidebarOpen, sidebarWidth]);

    const handleSidebarResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        e.preventDefault();
        isResizingSidebarRef.current = true;
        setIsDraggingSidebar(true);

        const layoutEl = fullScreenLayoutRef.current;
        const layoutRect = layoutEl ? layoutEl.getBoundingClientRect() : { left: 0 };

        const handlePointerMove = (moveEvent: PointerEvent) => {
            if (!isResizingSidebarRef.current) return;
            const rawWidth = Math.round(moveEvent.clientX - layoutRect.left);
            const clampedWidth = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, rawWidth));
            sidebarWidthRef.current = clampedWidth;
            setSidebarWidth(clampedWidth);
        };

        const handlePointerUp = () => {
            if (!isResizingSidebarRef.current) return;
            isResizingSidebarRef.current = false;
            setIsDraggingSidebar(false);
            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerUp);
            document.removeEventListener("pointercancel", handlePointerUp);
            document.body.style.removeProperty("cursor");
            document.body.style.removeProperty("user-select");

            try {
                localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(sidebarWidthRef.current));
            } catch {}
        };

        document.body.style.setProperty("cursor", "col-resize");
        document.body.style.setProperty("user-select", "none");
        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);
        document.addEventListener("pointercancel", handlePointerUp);
    }, []);

    useEffect(() => {
        return () => {
            document.body.style.removeProperty("cursor");
            document.body.style.removeProperty("user-select");
        };
    }, []);

    const handleSidebarResizeKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        let delta = 0;
        if (e.key === "ArrowLeft") delta = -10;
        else if (e.key === "ArrowRight") delta = 10;
        else if (e.key === "Home") {
            e.preventDefault();
            setSidebarWidth(MIN_SIDEBAR_WIDTH);
            try { localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(MIN_SIDEBAR_WIDTH)); } catch {}
            return;
        } else if (e.key === "End") {
            e.preventDefault();
            setSidebarWidth(MAX_SIDEBAR_WIDTH);
            try { localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(MAX_SIDEBAR_WIDTH)); } catch {}
            return;
        }
        if (delta !== 0) {
            e.preventDefault();
            setSidebarWidth((prev) => {
                const next = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, prev + delta));
                try { localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(next)); } catch {}
                return next;
            });
        }
    }, []);

    useLayoutEffect(() => {
        if (showProviderMenu) {
            updateDropdownPosition();
        }
    }, [showProviderMenu, updateDropdownPosition]);

    useEffect(() => {
        if (!showProviderMenu) return;
        updateDropdownPosition();
        window.addEventListener("resize", updateDropdownPosition);
        window.addEventListener("scroll", updateDropdownPosition, true);
        return () => {
            window.removeEventListener("resize", updateDropdownPosition);
            window.removeEventListener("scroll", updateDropdownPosition, true);
        };
    }, [showProviderMenu, updateDropdownPosition]);

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

    useEffect(() => {
        if (!menuSessionId) return;
        const handleOutside = (e: MouseEvent) => {
            if (historyMenuRef.current && !historyMenuRef.current.contains(e.target as Node)) {
                setMenuSessionId(null);
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setMenuSessionId(null);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [menuSessionId]);

    useEffect(() => {
        if (!resumingSessionId) return;

        // Clear resuming state once the target session has been loaded into Redux
        if (agent.historySessionId === resumingSessionId && !agent.loadingHistory) {
            setResumingSessionId(null);
            return;
        }

        // Safety timeout to prevent UI lock if network hangs or fails silently
        const timer = setTimeout(() => {
            setResumingSessionId((curr) => (curr === resumingSessionId ? null : curr));
        }, 15000);

        return () => clearTimeout(timer);
    }, [agent.loadingHistory, agent.historySessionId, resumingSessionId]);

    const handleSelectProvider = async (providerId: string) => {
        if (providerId === selectedProvider && !isSwitchingProvider) {
            setShowProviderMenu(false);
            setMenuSessionId(null);
            return;
        }
        setIsSwitchingProvider(true);
        setShowProviderMenu(false);
        setMenuSessionId(null);
        skipProviderEffectRef.current = providerId;
        try {
            const res = await fetchProviderModels(agentUrl, providerId);
            const nextModels = res?.models || [];
            setModels(nextModels);
            setSelectedProvider(providerId);
            const savedModel = getStoredModel(providerId);
            const matchedModel = nextModels.find((m) => m.id === savedModel);
            const targetModel = matchedModel ? matchedModel.id : (res?.default_model || nextModels[0]?.id || "");
            setSelectedModel(targetModel);
            setStoredProviderAndModel(providerId, targetModel);
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
        } catch (err) {
            console.error("Failed to switch provider:", err);
        } finally {
            setIsSwitchingProvider(false);
        }
    };

    const handleStartNewChat = async () => {
        if (!runtime || startingNewChatRef.current || isStartingNewChat || !!resumingSessionId) return;
        setIsStartingNewChat(true);
        startingNewChatRef.current = true;
        try {
            let latestSession: AgentSessionSummary | undefined;
            if (agentRuntime === "agentHub") {
                const latestPage = await fetchSessionList(agentUrl, { limit: 1 });
                if (latestPage?.sessions?.length) {
                    latestSession = latestPage.sessions[0];
                }
            }

            if (latestSession?.has_user_message === false) {
                setResumingSessionId(latestSession.session_id);
                runtime.resume(latestSession.session_id);
            } else {
                runtime.newChat(selectedProvider, selectedModel, {
                    thinking: isThinking,
                    reasoning: selectedReasoning,
                    fast: isFast,
                    speed: selectedSpeed,
                });
            }
        } finally {
            startingNewChatRef.current = false;
            setIsStartingNewChat(false);
        }
        setShowHistory(false);
        setShowProviderMenu(false);
        setMenuSessionId(null);
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
        if (!session.session_id || resumingSessionId) return;
        const currentActiveId = agent.historySessionId || agent.sessionId;
        if (session.session_id === currentActiveId) {
            setShowHistory(false);
            setHistorySearchQuery("");
            setEditingSessionId(null);
            setMenuSessionId(null);
            return;
        }

        setResumingSessionId(session.session_id);
        setShowHistory(false);
        setHistorySearchQuery("");
        setEditingSessionId(null);
        setMenuSessionId(null);
        try {
            const targetProvider = session.provider || selectedProvider;
            const targetModel = session.model || selectedModel;

            let targetModels = models;
            if (targetProvider && targetProvider !== selectedProvider) {
                skipProviderEffectRef.current = targetProvider;
                setSelectedProvider(targetProvider);
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
        } catch (err) {
            console.error("Failed to resume session:", err);
            setResumingSessionId(null);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        setMenuSessionId(null);
        if (!window.confirm("Delete this conversation?")) return;
        await deleteSession(agentUrl, sessionId);
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        if (sessionId === agent.historySessionId) runtime?.newChat();
    };

    const handleSaveRename = async (sessionId: string, newTitle: string) => {
        const trimmed = newTitle.trim();
        if (!trimmed) {
            setEditingSessionId(null);
            return;
        }
        setSessions((prev) =>
            prev.map((s) => (s.session_id === sessionId ? { ...s, title: trimmed } : s))
        );
        setEditingSessionId(null);
        await renameSession(agentUrl, sessionId, trimmed);
    };

    const filteredSessions = useMemo(() => {
        const rawQ = historySearchQuery.trim().toLowerCase();
        if (!rawQ) return sessions;
        const cleanQ = rawQ.replace(/^(session[-_:]?|id[:=]?|#)/i, "").trim() || rawQ;
        return sessions.filter((s) => {
            const title = (s.title || s.preview || "").toLowerCase();
            const sessionId = (s.session_id || "").toLowerCase();
            const provider = (s.provider || "").toLowerCase();
            const model = (s.model || "").toLowerCase();
            const dateStr = s.created_at ? formatDate(s.created_at).toLowerCase() : "";
            return (
                title.includes(rawQ) ||
                sessionId.includes(rawQ) ||
                sessionId.includes(cleanQ) ||
                provider.includes(rawQ) ||
                model.includes(rawQ) ||
                dateStr.includes(rawQ)
            );
        });
    }, [sessions, historySearchQuery]);

    const handleModelChange = (modelId: string) => {
        setSelectedModel(modelId);
        setStoredProviderAndModel(selectedProvider, modelId);
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
                if (alive && status) {
                    setStaleAgentConfig(status.stale);
                    if (typeof status.processConfigVersion === "number") {
                        setAgentConfigVersion(status.processConfigVersion);
                    } else if (typeof status.latestConfigVersion === "number") {
                        setAgentConfigVersion(status.latestConfigVersion);
                    }
                }
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
        if (autoSend) runtime.sendMessage(prompt, { ...inputContext, ...(context ?? {}) }, [], messageInputs, beforeSend, "prefill");
        else setSeed({ text: prompt, key: nonce });
    }, [agent.prefill, handlesPrefill, dispatch, runtime, inputContext, messageInputs, beforeSend]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedHistorySearch(historySearchQuery.trim());
        }, 250);
        return () => clearTimeout(timer);
    }, [historySearchQuery]);

    const loadSessionPage = useCallback(async (
        cursor: string | null = null,
        search: string = "",
        replace: boolean = false,
    ): Promise<AgentSessionPage | null> => {
        if (!replace && historyInFlightRef.current) return null;
        historyInFlightRef.current = true;

        if (replace) {
            historyAbortRef.current?.abort();
            setHistoryLoadingMore(false);
            setSessions([]);
            setHistoryNextCursor(null);
            setHistoryHasMore(false);
            setHistoryLoadError(null);
            setHistoryInitialLoading(true);
        } else {
            setHistoryLoadingMore(true);
        }

        const generation = ++historyGenerationRef.current;
        const controller = new AbortController();
        historyAbortRef.current = controller;

        try {
            const page = await fetchSessionList(agentUrl, {
                cursor,
                search: search || undefined,
                limit: 20,
                signal: controller.signal,
            });

            if (generation !== historyGenerationRef.current || controller.signal.aborted) return null;
            if (!page) {
                setHistoryLoadError("Failed to load conversations.");
                return null;
            }

            setHistoryLoadError(null);
            const storedTitles = getStoredSessionTitles(agentUrl);
            const enriched = page.sessions.map((s) => ({
                ...s,
                title: storedTitles[s.session_id] || s.title || s.preview || "New conversation",
            }));

            if (replace) {
                setSessions(enriched);
            } else {
                setSessions((prev) => {
                    const seen = new Set(prev.map((item) => item.session_id));
                    return [...prev, ...enriched.filter((item) => !seen.has(item.session_id))];
                });
            }
            setHistoryNextCursor(page.next_cursor);
            setHistoryHasMore(page.has_more);
            return page;
        } catch (err: any) {
            if (err?.name === "AbortError" || controller.signal.aborted) return null;
            if (generation === historyGenerationRef.current) {
                setHistoryLoadError("Failed to load conversations.");
            }
            return null;
        } finally {
            if (generation === historyGenerationRef.current) {
                historyInFlightRef.current = false;
                if (replace) setHistoryInitialLoading(false);
                else setHistoryLoadingMore(false);
            }
        }
    }, [agentUrl]);

    const shouldLoadHistory = (showHistory || isFullScreen) && signedIn;
    useEffect(() => {
        if (!shouldLoadHistory) {
            historyAbortRef.current?.abort();
            historyGenerationRef.current += 1;
            historyInFlightRef.current = false;
            setHistoryInitialLoading(false);
            setHistoryLoadingMore(false);
            return;
        }
        void loadSessionPage(null, debouncedHistorySearch, true);
        return () => {
            historyAbortRef.current?.abort();
            historyGenerationRef.current += 1;
            historyInFlightRef.current = false;
        };
    }, [shouldLoadHistory, debouncedHistorySearch, loadSessionPage]);

    useEffect(() => {
        const root = historyScrollRef.current;
        const sentinel = historySentinelRef.current;
        if (!shouldLoadHistory || !root || !sentinel || !historyHasMore || !historyNextCursor
            || historyInitialLoading || historyLoadingMore || historyLoadError) {
            return;
        }
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                void loadSessionPage(historyNextCursor, debouncedHistorySearch, false);
            }
        }, { root, rootMargin: "0px 0px 200px 0px" });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [
        shouldLoadHistory,
        historyHasMore,
        historyNextCursor,
        historyInitialLoading,
        historyLoadingMore,
        historyLoadError,
        debouncedHistorySearch,
        loadSessionPage,
    ]);

    const handleRetryHistory = useCallback(() => {
        setHistoryLoadError(null);
        void loadSessionPage(historyNextCursor, debouncedHistorySearch, sessions.length === 0);
    }, [historyNextCursor, debouncedHistorySearch, sessions.length, loadSessionPage]);

    useEffect(() => {
        return eventBus.on(SOLID_AGENT_EVENTS.turnComplete, (payload) => {
            if (payload?.agentType && payload.agentType !== agentRuntime) return;
            if (!payload?.sessionId) return;
            setSessions((prev) => {
                const exists = prev.some((s) => s.session_id === payload.sessionId);
                if (!exists) {
                    void loadSessionPage(null, debouncedHistorySearch, true);
                }
                return prev;
            });
        });
    }, [agentRuntime, loadSessionPage, debouncedHistorySearch]);

    useEffect(() => {
        return eventBus.on(SOLID_AGENT_EVENTS.sessionChanged, (payload) => {
            if (payload.agentType && payload.agentType !== agentRuntime) return;
            if (!payload) return;
            if (payload.provider && payload.provider !== selectedProvider) {
                setSelectedProvider(payload.provider);
                fetchProviderModels(agentUrl, payload.provider).then((res) => {
                    const nextModels = res?.models || [];
                    if (nextModels.length > 0) setModels(nextModels);
                    if (payload.model) {
                        setSelectedModel(payload.model);
                        setStoredProviderAndModel(payload.provider, payload.model);
                    } else {
                        const saved = getStoredModel(payload.provider);
                        const matched = nextModels.find((m) => m.id === saved);
                        const fallback = matched ? matched.id : (res?.default_model || nextModels[0]?.id || "");
                        if (fallback) setSelectedModel(fallback);
                    }
                });
            } else if (payload.model && payload.model !== selectedModel) {
                setSelectedModel(payload.model);
            }
        });
    }, [agentUrl, selectedProvider, selectedModel]);

    const activeProviderObj = providers.find((p) => p.id === selectedProvider);
    const providerDisplayName = formatProviderName(activeProviderObj?.name) || (selectedProvider ? formatProviderName(selectedProvider) : "");
    const isSelectedProviderCheckingAuth =
        selectedProvider !== "solidx" &&
        !!activeProviderObj &&
        getProviderAuthStatus(activeProviderObj) === "checking";

    const setMode = (mode: AgentMode) => dispatch(agentModeChanged(mode));
    const send = useCallback(async (text: string) => {
        if (isSelectedProviderCheckingAuth || !text.trim() || !runtime) return;
        onInputsLocked?.(true);
        try { return await runtime.sendMessage(text, inputContext, [], messageInputs, beforeSend, "widget"); }
        catch (error) { onInputsLocked?.(false); throw error; }
    }, [runtime, inputContext, messageInputs, beforeSend, onInputsLocked, isSelectedProviderCheckingAuth]);
    const sendWithAttachments = useCallback(
        async (text: string, attachments: AgentAttachment[]) => {
            if (isSelectedProviderCheckingAuth) return;
            if ((!text.trim() && !attachments.length) || !runtime) return;
            onInputsLocked?.(true);
            try {
                const result = await runtime.sendMessage(text, inputContext, attachments, messageInputs, beforeSend, "composer");
                setShowHistory(false);
                return result;
            }
            catch (error) { onInputsLocked?.(false); throw error; }
        },
        [runtime, inputContext, messageInputs, beforeSend, onInputsLocked, isSelectedProviderCheckingAuth],
    );
    useEffect(() => {
        const onEmbedCommand = (event: Event) => {
            event.preventDefault();
            const detail = (event as CustomEvent<{ command: string; payload: Record<string, unknown>; respond: (result?: unknown, error?: unknown) => void }>).detail;
            if (!detail || typeof detail.respond !== "function") return;
            const run = async () => {
                switch (detail.command) {
                    case "sendMessage": {
                        if (typeof detail.payload.text !== "string" || !runtime) throw new Error("Chat is not ready to send a message.");
                        onInputsLocked?.(true);
                        try {
                            await runtime.sendMessage(detail.payload.text, inputContext, [], messageInputs, beforeSend,
                                detail.payload.source === "prefill" ? "prefill" : "sdk");
                        } catch (error) { onInputsLocked?.(false); throw error; }
                        return { queued: true };
                    }
                    case "prefill": {
                        if (typeof detail.payload.text !== "string") throw new Error("prefill requires text.");
                        const autoSend = detail.payload.autoSend === true;
                        if (autoSend) {
                            if (!runtime) throw new Error("Chat is not ready to send a message.");
                            try { await runtime.sendMessage(detail.payload.text, inputContext, [], messageInputs, beforeSend, "prefill"); }
                            catch (error) { onInputsLocked?.(false); throw error; }
                        } else setSeed({ text: detail.payload.text, key: Date.now() });
                        return { queued: autoSend };
                    }
                    case "newChat":
                        if (!runtime) throw new Error("Chat is not ready.");
                        runtime.newChat(); setShowHistory(false); onInputsLocked?.(false); return { started: true };
                    case "cancelTurn":
                        runtime?.cancel(); return { requested: true };
                    case "reconnect":
                        runtime?.socket.connect(); return { requested: true };
                    case "setContext":
                        return { stored: true };
                    default: throw new Error("Unsupported embed command.");
                }
            };
            void run().then((result) => detail.respond(result)).catch((failure) => detail.respond(undefined, failure));
        };
        window.addEventListener("solid-agent-embed:command", onEmbedCommand);
        return () => window.removeEventListener("solid-agent-embed:command", onEmbedCommand);
    }, [runtime, inputContext, messageInputs, beforeSend, onInputsLocked]);
    const offline = agent.connection === "reconnecting" || agent.connection === "offline";
    const statusColor = agent.connection === "open" ? (agent.working ? "#eab308" : "#22c55e") : offline ? "#dc2626" : "#94a3b8";
    const statusText =
        agentAuth.status === "signedOut" ? "Sign in required"
        : agent.connection === "connecting" ? "Connecting…"
        : offline ? "Reconnecting…" : "";



    const activeSessionId = agent.historySessionId || agent.sessionId;
    const displaySessionId = activeSessionId
        ? (isFullScreen ? activeSessionId : (activeSessionId.length > 12 ? activeSessionId.slice(0, 8) : activeSessionId))
        : "";
    const [copiedSession, setCopiedSession] = useState(false);
    const handleCopySessionId = useCallback(() => {
        if (!activeSessionId) return;
        navigator.clipboard?.writeText(activeSessionId).then(() => {
            setCopiedSession(true);
            setTimeout(() => setCopiedSession(false), 2000);
        }).catch(() => {
            // ignore clipboard failure
        });
    }, [activeSessionId]);


    // const providerDisplayName = formatProviderName(activeProviderObj?.name) || (selectedProvider ? formatProviderName(selectedProvider) : "");

    const empty = (
        <div className={styles.empty}>
            <div className={styles.emptyMark}><Sparkles size={24} /></div>
            <div>
                <h2 className={styles.emptyTitle}>{agentRuntime === "agentHub" ? `Start a conversation with ${title}` : "How can I help?"}</h2>
                <p className={styles.emptyText}>{agentRuntime === "agentHub"
                    ? "Ask this agent for help with its configured capabilities. It can use the tools and knowledge available to it."
                    : "Ask in plain English. I can read this app's metadata and data, and run the agent's tools for you."}</p>
                {agentRuntime !== "agentHub" && providerDisplayName && (
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
                        <p>Sign-in is complete. Enter the values this agent needs before starting the conversation. All inputs are required unless explicitly marked optional.</p>
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
            <SolidDialog
                open={!!sessionToDelete}
                onOpenChange={(open) => { if (!open) setSessionToDelete(null); }}
                className={styles.inputDialog}
                overlayClassName={styles.inputDialogOverlay}
                header="Delete conversation?"
                ariaLabel="Confirm conversation deletion"
                style={{ width: "min(28rem, 94vw)" }}
            >
                <SolidDialogBody>
                    <p>This conversation will be permanently deleted.</p>
                    <div className={styles.inputActions}>
                        <SolidButton variant="secondary" onClick={() => setSessionToDelete(null)}>Cancel</SolidButton>
                        <SolidButton
                            variant="destructive"
                            onClick={async () => {
                                const session = sessionToDelete;
                                if (!session) return;
                                await deleteSession(agentUrl, session.session_id);
                                setSessions((prev) => prev.filter((item) => item.session_id !== session.session_id));
                                if (session.session_id === agent.historySessionId) runtime?.newChat();
                                setSessionToDelete(null);
                            }}
                        >Delete</SolidButton>
                    </div>
                </SolidDialogBody>
            </SolidDialog>
            <div className={`${styles.header} ${externalEmbed ? styles.externalEmbedHeader : ""}`} ref={headerRef}>
                <div className={styles.headerMark}>
                    <Sparkles size={15} />
                    <span className={styles.statusDot} style={{ background: statusColor }} />
                </div>
                <div className={styles.headerTitle}>
                    <div className={styles.headerTitleRow}>
                        <strong>{title}</strong>
                        {agentRuntime === "agentHub" && agentConfigVersion != null && (
                            <span className={styles.headerVersionTag} title={`Agent Version: v${agentConfigVersion}`}>
                                v{agentConfigVersion}
                            </span>
                        )}
                    </div>
                    <span className={styles.headerSub}>
                        {agentRuntime !== "agentHub" && signedIn && providerDisplayName && (
                            <span className={styles.headerProviderTag} title={`Active Provider: ${providerDisplayName}`}>
                                {providerDisplayName}
                            </span>
                        )}
                        {signedIn && activeSessionId && (
                            <SolidTooltip delayDuration={150}>
                                <SolidTooltipTrigger asChild>
                                    <button
                                        type="button"
                                        className={styles.headerSessionTag}
                                        onClick={handleCopySessionId}
                                        aria-label={`Session ID: ${activeSessionId}. Click to copy`}
                                    >
                                        <span className={styles.headerSessionCode}>{displaySessionId}</span>
                                        {copiedSession ? (
                                            <Check size={11} className={`${styles.headerSessionIcon} ${styles.headerSessionIconCopied}`} />
                                        ) : (
                                            <Copy size={11} className={styles.headerSessionIcon} />
                                        )}
                                    </button>
                                </SolidTooltipTrigger>
                                <SolidTooltipContent side="bottom" align="start">
                                    {copiedSession ? "Copied Session ID!" : `Session: ${activeSessionId} (Click to copy)`}
                                </SolidTooltipContent>
                            </SolidTooltip>
                        )}
                        {statusText && <span className={styles.headerStatusText}>{statusText}</span>}
                    </span>
                </div>
                {signedIn && (
                    <>
                        {(!isFullScreen || !sidebarOpen) && (
                            agentRuntime === "agentHub" || providers.length <= 1 ? (
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    title="New chat"
                                    aria-label="New chat"
                                    disabled={isStartingNewChat || !!resumingSessionId}
                                    onClick={handleStartNewChat}
                                >
                                    {isStartingNewChat ? <SolidSpinner size={15} className={styles.inlineSolidSpinner} /> : <Plus size={16} />}
                                </button>
                            ) : (
                                <div className={styles.newChatSplit} ref={providerMenuRef}>
                                    <button
                                        type="button"
                                        className={styles.splitActionBtn}
                                        title={`New chat (${formatProviderName(providers.find((p) => p.id === selectedProvider)?.name) || "Native"})`}
                                        aria-label="New chat"
                                        disabled={isStartingNewChat || !!resumingSessionId}
                                        onClick={handleStartNewChat}
                                    >
                                        {isStartingNewChat ? <SolidSpinner size={14} className={styles.inlineSolidSpinner} /> : <Plus size={15} />}
                                    </button>
                                    <span className={styles.splitDivider} />
                                    <button
                                        type="button"
                                        className={`${styles.splitTriggerBtn} ${showProviderMenu ? styles.splitTriggerActive : ""}`}
                                        title={loadingProviders ? "Loading AI execution providers..." : "Select AI execution provider"}
                                        aria-label="Select AI execution provider"
                                        aria-expanded={showProviderMenu}
                                        onClick={() => {
                                            setShowProviderMenu((prev) => {
                                                const next = !prev;
                                                if (next) updateDropdownPosition();
                                                return next;
                                            });
                                        }}
                                    >
                                        {loadingProviders ? (
                                            <SolidSpinner size={12} className={styles.inlineSolidSpinner} />
                                        ) : (
                                            <ChevronDown size={13} className={`${styles.splitChevron} ${showProviderMenu ? styles.splitChevronOpen : ""}`} />
                                        )}
                                    </button>
                                    {showProviderMenu && (
                                        <div className={styles.providerDropdown} style={dropdownStyle} role="menu">
                                            <div className={styles.providerDropdownHeader}>
                                                <strong>Select AI Provider</strong>
                                                {providersLoadError && (
                                                    <button type="button" className={styles.providerRetryButton} onClick={retryProviders}>
                                                        Provider list unavailable — retry
                                                    </button>
                                                )}
                                            </div>
                                            {loadingProviders && providers.length === 0 ? (
                                                <div className={styles.providerLoadingItem}>
                                                    <SolidSpinner size={13} className={styles.inlineSolidSpinner} />
                                                    <span>Loading providers...</span>
                                                </div>
                                            ) : (
                                                <div className={styles.providerList}>
                                                    {providers.map((p) => {
                                                        const isSelected = p.id === selectedProvider;
                                                        const isCli = p.id !== "solidx";
                                                        const authStatus = getProviderAuthStatus(p);
                                                        const isAuthChecking = isCli && authStatus === "checking";
                                                        const isAuthError = isCli && authStatus === "error";
                                                        const isUnauthenticated = isCli && authStatus === "unauthenticated";
                                                        return (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                className={`${styles.providerItem} ${isSelected ? styles.providerItemActive : ""}`}
                                                                onClick={() => handleSelectProvider(p.id)}
                                                            >
                                                                <div className={styles.providerItemMeta}>
                                                                    <span className={styles.providerItemName}>{formatProviderName(p.name)}</span>
                                                                </div>
                                                                {isAuthChecking ? (
                                                                    <div className={styles.providerItemEnd}>
                                                                        <SolidTooltip delayDuration={120}>
                                                                            <SolidTooltipTrigger asChild>
                                                                                <span
                                                                                    className={styles.providerBadgeChecking}
                                                                                    role="status"
                                                                                    aria-label="Checking authentication status"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <SolidSpinner size={12} className={styles.inlineSolidSpinner} />
                                                                                </span>
                                                                            </SolidTooltipTrigger>
                                                                            <SolidTooltipContent side="top" align="center" className={styles.providerUnauthTooltip}>
                                                                                Checking authentication status…
                                                                            </SolidTooltipContent>
                                                                        </SolidTooltip>
                                                                    </div>
                                                                ) : isAuthError ? (
                                                                    <div className={styles.providerItemEnd}>
                                                                        <SolidTooltip delayDuration={120}>
                                                                            <SolidTooltipTrigger asChild>
                                                                                <span
                                                                                    className={styles.providerBadgeAuthError}
                                                                                    role="button"
                                                                                    tabIndex={0}
                                                                                    aria-label={`Retry ${formatProviderName(p.name)} authentication check`}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        retryProviderAuth(p.id);
                                                                                    }}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            retryProviderAuth(p.id);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <AlertCircle size={12} strokeWidth={1.8} />
                                                                                </span>
                                                                            </SolidTooltipTrigger>
                                                                            <SolidTooltipContent side="top" align="center" className={styles.providerUnauthTooltip}>
                                                                                Could not verify authentication. Click to retry.
                                                                            </SolidTooltipContent>
                                                                        </SolidTooltip>
                                                                    </div>
                                                                ) : isUnauthenticated ? (
                                                                    <div className={styles.providerItemEnd}>
                                                                        <SolidTooltip delayDuration={120}>
                                                                            <SolidTooltipTrigger asChild>
                                                                                <span
                                                                                    className={styles.providerBadgeUnauth}
                                                                                    role="img"
                                                                                    aria-label="Unauthenticated"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <AlertCircle size={12} strokeWidth={1.8} />
                                                                                </span>
                                                                            </SolidTooltipTrigger>
                                                                            <SolidTooltipContent side="top" align="center" className={styles.providerUnauthTooltip}>
                                                                                {p.id === "opencode"
                                                                                    ? "Unauthenticated: Free models are available; CLI login required for paid models."
                                                                                    : "Unauthenticated: Login required."}
                                                                            </SolidTooltipContent>
                                                                        </SolidTooltip>
                                                                    </div>
                                                                ) : null}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        )}
                        {!isFullScreen && (
                            <button
                                type="button"
                                className={styles.iconBtn}
                                title="History"
                                aria-label="Chat history"
                                aria-pressed={showHistory}
                                onClick={() => {
                                    setShowHistory((v) => {
                                        if (!v) {
                                            setHistorySearchQuery("");
                                            setEditingSessionId(null);
                                        }
                                        setMenuSessionId(null);
                                        return !v;
                                    });
                                }}
                            >
                                <History size={16} />
                            </button>
                        )}
                        {!externalEmbed && <button
                            type="button"
                            className={styles.iconBtn}
                            title={signedInAs ? `Sign out of the agent (${String(signedInAs)})` : "Sign out of the agent"}
                            aria-label="Sign out of the agent"
                            onClick={() => {
                                setShowHistory(false);
                                setHistorySearchQuery("");
                                setEditingSessionId(null);
                                setMenuSessionId(null);
                                void signOutOfAgent(agentUrl);
                            }}
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

                {(() => {
                    const renderSearchBox = () => (
                        <div className={styles.historySearchBox}>
                            <Search size={13} className={styles.historySearchIcon} />
                            <input
                                type="text"
                                className={styles.historySearchInput}
                                placeholder="Search by title, message, or session ID…"
                                value={historySearchQuery}
                                onChange={(e) => setHistorySearchQuery(e.target.value)}
                                aria-label="Search past conversations"
                            />
                            {historySearchQuery && (
                                <button
                                    type="button"
                                    className={styles.historySearchClear}
                                    onClick={() => setHistorySearchQuery("")}
                                    title="Clear search"
                                    aria-label="Clear search"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    );

                    const renderSessionList = (items: AgentSessionSummary[] = filteredSessions) => (
                        <>
                            {historyInitialLoading ? (
                                <>
                                    <div className={styles.historySkeletonRow} />
                                    <div className={styles.historySkeletonRow} />
                                    <div className={styles.historySkeletonRow} />
                                    <div className={styles.historySkeletonRow} />
                                    <div className={styles.historySkeletonRow} />
                                </>
                            ) : (
                                <>
                                    {sessions.length === 0 && <div className={styles.notice}>No past conversations.</div>}
                                    {sessions.length > 0 && items.length === 0 && (
                                        <div className={styles.notice}>No conversations match &ldquo;{historySearchQuery}&rdquo;</div>
                                    )}
                            {items.map((session, index) => {
                                const isResumingThis = resumingSessionId === session.session_id;
                                const isCurrentSession = session.session_id === (resumingSessionId || agent.historySessionId || agent.sessionId);
                                const isMenuOpen = menuSessionId === session.session_id;

                                return (
                                    <div
                                        key={session.session_id}
                                        className={`${styles.historyRow} ${isCurrentSession ? styles.historyRowActive : ""} ${isMenuOpen ? styles.historyRowMenuOpen : ""}`}
                                    >
                                        {editingSessionId === session.session_id ? (
                                            <form
                                                className={styles.historyRenameForm}
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    void handleSaveRename(session.session_id, editingTitle);
                                                }}
                                            >
                                                <input
                                                    type="text"
                                                    className={styles.historyRenameInput}
                                                    value={editingTitle}
                                                    onChange={(e) => setEditingTitle(e.target.value)}
                                                    autoFocus
                                                    onFocus={(e) => e.target.select()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Escape") {
                                                            e.stopPropagation();
                                                            setEditingSessionId(null);
                                                        }
                                                    }}
                                                    aria-label="Rename conversation"
                                                />
                                                <button
                                                    type="submit"
                                                    className={styles.iconBtn}
                                                    aria-label="Save title"
                                                    title="Save"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.iconBtn}
                                                    aria-label="Cancel rename"
                                                    title="Cancel"
                                                    onClick={() => setEditingSessionId(null)}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </form>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className={`${styles.historyItem} ${isCurrentSession ? styles.historyItemActive : ""}`}
                                                    onClick={() => void handleResumeSession(session)}
                                                    disabled={isResumingThis || !!resumingSessionId}
                                                    title={session.session_id ? `${session.title || session.preview || "Conversation"} (ID: ${session.session_id})` : undefined}
                                                >
                                                    {isResumingThis && <SolidSpinner size={13} className={styles.inlineSolidSpinner} aria-hidden="true" />}
                                                    <span className={styles.historyPreview}>
                                                        {session.title || session.preview || "New conversation"}
                                                    </span>
                                                    {session.provider && (
                                                        <span
                                                            className={styles.historyProviderName}
                                                            title={session.model ? `${getProviderBadgeLabel(session.provider)} (${session.model})` : getProviderBadgeLabel(session.provider)}
                                                        >
                                                            {getProviderBadgeLabel(session.provider)}
                                                        </span>
                                                    )}
                                                </button>
                                                <div
                                                    className={styles.historyMenuWrap}
                                                    ref={isMenuOpen ? historyMenuRef : undefined}
                                                >
                                                    <button
                                                        type="button"
                                                        className={`${styles.historyMenuTrigger} ${isMenuOpen ? styles.historyMenuTriggerActive : ""}`}
                                                        aria-label="Conversation options"
                                                        title="Options"
                                                        aria-expanded={isMenuOpen}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (isMenuOpen) {
                                                                setMenuSessionId(null);
                                                                e.currentTarget.blur();
                                                            } else {
                                                                const btn = e.currentTarget;
                                                                const scrollContainer = btn.closest(`.${styles.historyList}`) || btn.closest(`.${styles.sidebarSessions}`);
                                                                let openUp = false;
                                                                if (scrollContainer) {
                                                                    const btnRect = btn.getBoundingClientRect();
                                                                    const containerRect = scrollContainer.getBoundingClientRect();
                                                                    const spaceBelow = containerRect.bottom - btnRect.bottom;
                                                                    openUp = spaceBelow < 115;
                                                                } else {
                                                                    openUp = index >= items.length - 3 && items.length > 3;
                                                                }
                                                                setMenuPlacement(openUp ? "up" : "down");
                                                                setMenuSessionId(session.session_id);
                                                            }
                                                        }}
                                                    >
                                                        <MoreHorizontal size={14} />
                                                    </button>
                                                    {isMenuOpen && (
                                                        <div
                                                            className={`${styles.historyMenuDropdown} ${menuPlacement === "up" ? styles.historyMenuDropdownUp : ""}`}
                                                            role="menu"
                                                            onClick={(e) => e.stopPropagation()}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                        >
                                                            {session.created_at && (
                                                                <div className={styles.historyMenuTime}>
                                                                    <Clock size={12} className={styles.historyMenuTimeIcon} />
                                                                    <span>{formatSessionTime(session.created_at)}</span>
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                className={styles.historyMenuItem}
                                                                role="menuitem"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setMenuSessionId(null);
                                                                    setEditingSessionId(session.session_id);
                                                                    setEditingTitle(session.title || session.preview || "New conversation");
                                                                }}
                                                            >
                                                                <Pencil size={13} />
                                                                <span>Rename</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className={`${styles.historyMenuItem} ${styles.historyMenuItemDanger}`}
                                                                role="menuitem"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setMenuSessionId(null);
                                                                    setSessionToDelete(session);
                                                                }}
                                                            >
                                                                <Trash2 size={13} />
                                                                <span>Delete</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                            {historyLoadingMore && (
                                <>
                                    <div className={styles.historySkeletonRow} />
                                    <div className={styles.historySkeletonRow} />
                                </>
                            )}
                            {historyLoadError && (
                                <div className={styles.historyErrorRow}>
                                    <span>{historyLoadError}</span>
                                    <button type="button" className={styles.historyRetryBtn} onClick={handleRetryHistory}>
                                        Retry
                                    </button>
                                </div>
                            )}
                            {historyHasMore && <div ref={historySentinelRef} className={styles.historySentinel} />}
                        </>
                    )}
                </>
            );



                    const isViewingHistory = !isFullScreen && showHistory;
                    const isBusyTransitioning = isSwitchingProvider || isStartingNewChat || agent.loadingHistory || !!resumingSessionId || isViewingHistory;

                    const threadComponent = (
                        <AgentThread
                            items={agent.items}
                            thinking={agent.working && agent.thinking}
                            working={agent.working}
                            loadingHistory={agent.loadingHistory || !!resumingSessionId}
                            hasMore={agent.hasMoreHistory}
                            loadingOlder={agent.loadingOlder}
                            context={agent.context ?? undefined}
                            emptyState={empty}
                            onLoadOlder={() => void runtime?.loadOlder()}
                            onReply={(widgetId, widget, value) => runtime?.replyToWidget(widgetId, widget, value, beforeSend)}
                            onPrompt={send}
                        />
                    );

                    const composerComponent = (
                        <AgentComposer
                            working={agent.working}
                            disabled={!!agent.authError || isBusyTransitioning || isSelectedProviderCheckingAuth}
                            placeholder={
                                isViewingHistory
                                    ? "Select a conversation to continue…"
                                    : isSelectedProviderCheckingAuth
                                    ? `Checking ${providerDisplayName || "provider"} authentication…`
                                    : isSwitchingProvider
                                    ? "Connecting..."
                                    : isStartingNewChat
                                    ? "Starting new chat..."
                                    : (agent.loadingHistory || !!resumingSessionId)
                                    ? "Loading conversation..."
                                    : undefined
                            }
                            commands={agent.commands}
                            seed={seed?.text}
                            seedKey={seed?.key}
                            onSend={sendWithAttachments}
                            onStop={() => runtime?.cancel()}
                            canAttach={canAttach}
                            modelIndicator={
                                <AgentModelIndicator
                                    assignments={modelAssignments}
                                    activeProvider={selectedProvider}
                                    activeModel={selectedModel}
                                    providers={providers}
                                    models={models}
                                    onModelSelect={handleModelChange}
                                    disabled={agent.working || isBusyTransitioning}
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
                            contextPill={
                                <AgentContextPill
                                    usage={agent.usage}
                                    activeProvider={selectedProvider}
                                    modelName={selectedModel}
                                    disabled={agent.working || isBusyTransitioning}
                                />
                            }
                        />
                    );

                    if (isFullScreen) {
                        return (
                            <div className={styles.fullScreenLayout} ref={fullScreenLayoutRef}>
                                {sidebarOpen && (
                                    <>
                                        <aside
                                            className={styles.fullScreenSidebar}
                                            style={{
                                                width: sidebarWidth,
                                                minWidth: sidebarWidth,
                                                maxWidth: sidebarWidth,
                                                transition: isDraggingSidebar ? "none" : undefined,
                                            }}
                                            aria-label="Conversation sidebar"
                                        >
                                        <div className={styles.sidebarHeader}>
                                            {agentRuntime === "agentHub" || providers.length <= 1 ? (
                                                <button
                                                    type="button"
                                                    className={styles.sidebarNewChatBtn}
                                                    title="New chat"
                                                    aria-label="New chat"
                                                    disabled={isStartingNewChat || !!resumingSessionId}
                                                    onClick={handleStartNewChat}
                                                >
                                                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                                        {isStartingNewChat ? <SolidSpinner size={14} className={styles.inlineSolidSpinner} /> : <Plus size={15} />}
                                                        <span>New chat</span>
                                                    </span>
                                                </button>
                                            ) : (
                                                <div className={styles.sidebarNewChatSplit} ref={providerMenuRef}>
                                                    <button
                                                        type="button"
                                                        className={styles.sidebarSplitActionBtn}
                                                        title={`New chat (${formatProviderName(providers.find((p) => p.id === selectedProvider)?.name) || "Native"})`}
                                                        aria-label="New chat"
                                                        disabled={isStartingNewChat || !!resumingSessionId}
                                                        onClick={handleStartNewChat}
                                                    >
                                                        {isStartingNewChat ? <SolidSpinner size={14} className={styles.inlineSolidSpinner} /> : <Plus size={15} />}
                                                        <span>New chat</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`${styles.sidebarSplitTriggerBtn} ${showProviderMenu ? styles.sidebarSplitTriggerActive : ""}`}
                                                        title={loadingProviders ? "Loading AI execution providers..." : "Select AI execution provider"}
                                                        aria-label="Select AI execution provider"
                                                        aria-expanded={showProviderMenu}
                                                        onClick={() => {
                                                            setShowProviderMenu((prev) => {
                                                                const next = !prev;
                                                                if (next) updateDropdownPosition();
                                                                return next;
                                                            });
                                                        }}
                                                    >
                                                        {loadingProviders ? (
                                                            <SolidSpinner size={12} className={styles.inlineSolidSpinner} />
                                                        ) : (
                                                            <ChevronDown size={13} className={`${styles.splitChevron} ${showProviderMenu ? styles.splitChevronOpen : ""}`} />
                                                        )}
                                                    </button>
                                                    {showProviderMenu && (
                                                        <div className={styles.providerDropdown} style={dropdownStyle} role="menu">
                                                            <div className={styles.providerDropdownHeader}>
                                                                <strong>Select AI Provider</strong>
                                                                {providersLoadError && (
                                                                    <button type="button" className={styles.providerRetryButton} onClick={retryProviders}>
                                                                        Provider list unavailable — retry
                                                                    </button>
                                                                )}
                                                            </div>
                                                            {loadingProviders && providers.length === 0 ? (
                                                                <div className={styles.providerLoadingItem}>
                                                                    <SolidSpinner size={13} className={styles.inlineSolidSpinner} />
                                                                    <span>Loading providers...</span>
                                                                </div>
                                                            ) : (
                                                                <div className={styles.providerList}>
                                                                    {providers.map((p) => {
                                                                        const isSelected = p.id === selectedProvider;
                                                                        const isCli = p.id !== "solidx";
                                                                        const authStatus = getProviderAuthStatus(p);
                                                                        const isAuthChecking = isCli && authStatus === "checking";
                                                                        const isAuthError = isCli && authStatus === "error";
                                                                        const isUnauthenticated = isCli && authStatus === "unauthenticated";
                                                                        return (
                                                                            <button
                                                                                key={p.id}
                                                                                type="button"
                                                                                className={`${styles.providerItem} ${isSelected ? styles.providerItemActive : ""}`}
                                                                                onClick={() => handleSelectProvider(p.id)}
                                                                            >
                                                                                <div className={styles.providerItemMeta}>
                                                                                    <span className={styles.providerItemName}>{formatProviderName(p.name)}</span>
                                                                                </div>
                                                                                {isAuthChecking ? (
                                                                                    <div className={styles.providerItemEnd}>
                                                                                        <SolidTooltip delayDuration={120}>
                                                                                            <SolidTooltipTrigger asChild>
                                                                                                <span
                                                                                                    className={styles.providerBadgeChecking}
                                                                                                    role="status"
                                                                                                    aria-label="Checking authentication status"
                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                >
                                                                                                    <SolidSpinner size={12} className={styles.inlineSolidSpinner} />
                                                                                                </span>
                                                                                            </SolidTooltipTrigger>
                                                                                            <SolidTooltipContent side="top" align="center" className={styles.providerUnauthTooltip}>
                                                                                                Checking authentication status…
                                                                                            </SolidTooltipContent>
                                                                                        </SolidTooltip>
                                                                                    </div>
                                                                                ) : isAuthError ? (
                                                                                    <div className={styles.providerItemEnd}>
                                                                                        <SolidTooltip delayDuration={120}>
                                                                                            <SolidTooltipTrigger asChild>
                                                                                                <span
                                                                                                    className={styles.providerBadgeAuthError}
                                                                                                    role="button"
                                                                                                    tabIndex={0}
                                                                                                    aria-label={`Retry ${formatProviderName(p.name)} authentication check`}
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        retryProviderAuth(p.id);
                                                                                                    }}
                                                                                                    onKeyDown={(e) => {
                                                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                                                            e.preventDefault();
                                                                                                            e.stopPropagation();
                                                                                                            retryProviderAuth(p.id);
                                                                                                        }
                                                                                                    }}
                                                                                                >
                                                                                                    <AlertCircle size={12} strokeWidth={1.8} />
                                                                                                </span>
                                                                                            </SolidTooltipTrigger>
                                                                                            <SolidTooltipContent side="top" align="center" className={styles.providerUnauthTooltip}>
                                                                                                Could not verify authentication. Click to retry.
                                                                                            </SolidTooltipContent>
                                                                                        </SolidTooltip>
                                                                                    </div>
                                                                                ) : isUnauthenticated ? (
                                                                                    <div className={styles.providerItemEnd}>
                                                                                        <SolidTooltip delayDuration={120}>
                                                                                            <SolidTooltipTrigger asChild>
                                                                                                <span
                                                                                                    className={styles.providerBadgeUnauth}
                                                                                                    role="img"
                                                                                                    aria-label="Unauthenticated"
                                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                                >
                                                                                                    <AlertCircle size={12} strokeWidth={1.8} />
                                                                                                </span>
                                                                                            </SolidTooltipTrigger>
                                                                                            <SolidTooltipContent side="top" align="center" className={styles.providerUnauthTooltip}>
                                                                                                {p.id === "opencode"
                                                                                                    ? "Unauthenticated: Free models are available; CLI login required for paid models."
                                                                                                    : "Unauthenticated: Login required."}
                                                                                            </SolidTooltipContent>
                                                                                        </SolidTooltip>
                                                                                    </div>
                                                                                ) : null}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {(historyInitialLoading || sessions.length > 0 || historySearchQuery) && (
                                            <div className={styles.sidebarSearchWrap}>
                                                {renderSearchBox()}
                                            </div>
                                        )}
                                        <div
                                            className={`${styles.sidebarSessions} ${menuSessionId ? styles.sidebarSessionsMenuOpen : ""}`}
                                            ref={(el) => { historyScrollRef.current = el; }}
                                        >
                                            {(historyInitialLoading || sessions.length > 0) && <div className={styles.sidebarSectionTitle}>Recents</div>}
                                            {renderSessionList()}
                                        </div>
                                    </aside>
                                    <div
                                        className={`${styles.sidebarResizer} ${isDraggingSidebar ? styles.sidebarResizerActive : ""}`}
                                        role="separator"
                                        aria-orientation="vertical"
                                        aria-label="Resize sidebar"
                                        aria-valuenow={sidebarWidth}
                                        aria-valuemin={MIN_SIDEBAR_WIDTH}
                                        aria-valuemax={MAX_SIDEBAR_WIDTH}
                                        tabIndex={0}
                                        onPointerDown={handleSidebarResizeStart}
                                        onKeyDown={handleSidebarResizeKeyDown}
                                    />
                                </>
                            )}
                            <div className={styles.fullScreenMain}>
                                    <SolidTooltip delayDuration={150}>
                                        <SolidTooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className={`solid-admin-sidebar-trigger ${styles.sidebarTriggerFloating}`}
                                                onClick={() => setSidebarOpen((v) => !v)}
                                                title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                                                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                    <rect x="1.5" y="2" width="13" height="12" rx="2" stroke="currentColor" />
                                                    <path d="M5.5 2V14" stroke="currentColor" />
                                                    <rect x="8" y="5.25" width="4.5" height="5.5" rx="0.9" stroke="currentColor" />
                                                </svg>
                                            </button>
                                        </SolidTooltipTrigger>
                                        <SolidTooltipContent side="right" align="center">
                                            {sidebarOpen ? "Close sidebar" : "Open sidebar"}
                                        </SolidTooltipContent>
                                    </SolidTooltip>
                                    {threadComponent}
                                    {composerComponent}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <>
                            {showHistory ? (
                                <div className={styles.historyPanel} aria-label="Past conversations">
                                    {(historyInitialLoading || sessions.length > 0 || historySearchQuery) && renderSearchBox()}
                                    <div
                                        className={`${styles.historyList} ${menuSessionId ? styles.historyListMenuOpen : ""}`}
                                        ref={(el) => { historyScrollRef.current = el; }}
                                    >
                                        {renderSessionList()}
                                    </div>
                                </div>
                            ) : (
                                threadComponent
                            )}
                            {composerComponent}
                        </>
                    );
                })()}
                </>
            )}
        </>
    );
}
