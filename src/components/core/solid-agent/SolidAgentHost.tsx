import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import styles from "./SolidAgent.module.css";
import { agentModeChanged, agentOpenRequested, agentSelected, type AgentState } from "../../../redux/features/agentSlice";
import { SolidAgentChat } from "./SolidAgentChat";
import { useAgentAvailability } from "./useAgentAvailability";
import { useAdminInputContext } from "./useAdminInputContext";
import { onBeforeUserMessageSend } from "./client/beforeUserMessageSend";
import { onAgentPublicEvent } from "./client/agentPublicEvents";
import { withAgent } from "./client/agentUrls";
import { solidGet } from "../../../http/solidHttp";
import type { AgentMessageContext, AgentMode, AgentRuntimeType } from "./types";
import { buildAdminCustomPath, buildAdminDashboardPath, buildAdminModelViewPath, buildAdminRecordFormPath } from "../../../helpers/routePaths";
import { requestAdminViewRefresh } from "../../../helpers/adminViewRefresh";

const PREFS_KEY = "solid-agent.window";
const MIN_DOCK = 360;
const MAX_DOCK = 720;
const _DEBUG_AGENT_EVENTS = true;
type WindowPrefs = { dockWidth: number; open?: boolean; mode?: Exclude<AgentMode, "bubble"> };

function readPrefs(): WindowPrefs {
    try {
        const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
        const mode = ["compact", "docked", "maximized"].includes(parsed.mode) ? parsed.mode as WindowPrefs["mode"] : undefined;
        return { dockWidth: Number(parsed.dockWidth) || 420, open: parsed.open === true, mode };
    } catch {
        return { dockWidth: 420 };
    }
}

function writePrefs(prefs: Partial<WindowPrefs>) {
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ ...readPrefs(), ...prefs }));
    } catch {
        // ignore
    }
}

/**
 * The single mount point of the SolidX Agent in the admin shell (rendered by AdminLayout).
 * Shows the floating bubble and the chat window; hidden unless the `solidAgentEnabled` setting
 * is on, `solidxAgentBackendUrl` is set and the user has agent:invoke. Ctrl/Cmd+J toggles the window,
 * Esc inside it minimizes back to the bubble.
 */
const DEFAULT_AGENTS = [
    { name: "solidx-native", title: "Solid Native Agent", isBuiltin: true },
    { name: "testhub", title: "TestHub Quality Engineer", isBuiltin: true },
];

export default function SolidAgentHost() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { ready, enabled, agentUrl, agentUrls, canUse } = useAgentAvailability();
    const inputContext = useAdminInputContext();
    const inputContextRef = useRef(inputContext);
    inputContextRef.current = inputContext;
    const agent = useSelector((state: any) => state.solidAgent as AgentState | undefined);
    const [dockWidth, setDockWidth] = useState(() => readPrefs().dockWidth);
    const [registeredAgents, setRegisteredAgents] = useState<Array<{ name: string; title: string; id?: number; isBuiltin?: boolean }>>(DEFAULT_AGENTS);
    const prefsHydrated = useRef(false);
    const skipNextPrefsWrite = useRef(false);
    const lastDispatch = useRef(dispatch);
    const windowRef = useRef<HTMLDivElement>(null);
    const openerRef = useRef<Element | null>(null);

    const [sidebarWorkspace, setSidebarWorkspace] = useState<string>(() => {
        try {
            return localStorage.getItem("solidx.sidebar.selected-workspace") || "";
        } catch {
            return "";
        }
    });

    useEffect(() => {
        const handleWorkspace = (e: Event) => {
            const customEvent = e as CustomEvent<string>;
            if (typeof customEvent.detail === "string") {
                setSidebarWorkspace(customEvent.detail);
            } else {
                try {
                    setSidebarWorkspace(localStorage.getItem("solidx.sidebar.selected-workspace") || "");
                } catch {}
            }
        };
        window.addEventListener("solidx:workspace-change", handleWorkspace);
        window.addEventListener("storage", handleWorkspace);
        return () => {
            window.removeEventListener("solidx:workspace-change", handleWorkspace);
            window.removeEventListener("storage", handleWorkspace);
        };
    }, []);

    useEffect(() => {
        let alive = true;
        solidGet("/agent-registry?limit=100")
            .then((res: any) => {
                if (!alive) return;
                const records = Array.isArray(res?.data?.records)
                    ? res.data.records
                    : Array.isArray(res?.data?.data)
                    ? res.data.data
                    : Array.isArray(res?.data)
                    ? res.data
                    : [];
                const validRecords = records.filter((r: any) => r && r.name && r.status !== "archived");
                if (validRecords.length > 0) {
                    setRegisteredAgents(validRecords.map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        title: r.title || r.name,
                        isBuiltin: r.isBuiltin ?? r.is_builtin,
                    })));
                }
            })
            .catch(() => {});
        return () => { alive = false; };
    }, []);

    useEffect(() => onBeforeUserMessageSend((_request, signal) => {
        if (signal.aborted) throw new Error("Message preparation was cancelled.");
        const context = inputContextRef.current;
        if (Object.keys(context).length === 0) return undefined;
        const summary = [context.moduleName, context.modelName, context.viewName, context.modelId]
            .filter((value) => value !== undefined && value !== null && value !== "")
            .join(" · ");
        const contribution: AgentMessageContext = {
            schemaVersion: 1,
            namespaces: {
                "solidx.admin": {
                    context: context as AgentMessageContext["namespaces"][string]["context"],
                    revision: JSON.stringify(context),
                    ...(summary ? { displaySummary: summary } : {}),
                },
            },
        };
        return contribution;
    }), []);
    useEffect(() => {
        return onAgentPublicEvent(({ event, payload, agentType: source }) => {
            if (_DEBUG_AGENT_EVENTS && source === "solidx") console.log(`[SolidAgentHost] ${event}`, payload);
            if (event !== "onAgentNavigationRequested" || source !== "solidx") return;
            if (payload.schemaVersion !== 1 || payload.kind !== "navigation" || payload.domain !== "solidx.admin") return;

            const { operation, scope, moduleName, modelName, viewName, recordId, dashboardName, customRoute } = payload.payload;
            if (typeof moduleName !== "string" || typeof viewName !== "string") return;
            if (!/^[A-Za-z0-9_-]+$/.test(moduleName.trim())) return;
            if (operation === "refresh") {
                if (typeof modelName !== "string" || !/^[A-Za-z0-9_-]+$/.test(modelName.trim())) return;
                if (scope === "collection" && ["list", "tree", "kanban", "card"].includes(viewName)) {
                    requestAdminViewRefresh({ moduleName, modelName, viewName: viewName as "list" | "tree" | "kanban" | "card", scope });
                } else if (scope === "record" && viewName === "form" && (typeof recordId === "string" || typeof recordId === "number")) {
                    const refreshRecordId = String(recordId);
                    if (!/^[A-Za-z0-9_-]+$/.test(refreshRecordId)) return;
                    requestAdminViewRefresh({ moduleName, modelName, viewName, scope, recordId: refreshRecordId });
                }
                return;
            }
            if (operation !== undefined && operation !== "navigate") return;
            let path = "";
            if (viewName === "dashboard" && typeof dashboardName === "string") {
                path = buildAdminDashboardPath({ moduleName, dashboardName });
            } else if (viewName === "custom" && typeof customRoute === "string") {
                path = buildAdminCustomPath(customRoute);
            } else if (["list", "tree", "kanban", "card"].includes(viewName) && typeof modelName === "string") {
                path = buildAdminModelViewPath({ moduleName, modelName, viewName });
            } else if (viewName === "form" && typeof modelName === "string"
                && /^[A-Za-z0-9_-]+$/.test(modelName.trim())
                && (typeof recordId === "string" || typeof recordId === "number")) {
                const recordKey = String(recordId);
                if (!/^[A-Za-z0-9_-]+$/.test(recordKey)) return;
                path = buildAdminRecordFormPath({ moduleName, modelName, recordId: recordKey, viewMode: "view" });
            }
            if (path) navigate(path);
        });
    }, [navigate]);

    if (lastDispatch.current !== dispatch) {
        lastDispatch.current = dispatch;
        prefsHydrated.current = false;
    }

    const available = ready && enabled && canUse && !!agentUrl && !!agent;
    const mode = agent?.mode ?? "bubble";
    const isOpen = available && mode !== "bubble";

    // Restore the last visible presentation after the host has verified this user's access.
    useEffect(() => {
        if (!ready || !available || prefsHydrated.current) return;
        prefsHydrated.current = true;
        const prefs = readPrefs();
        if (prefs.open && prefs.mode) {
            if (mode !== prefs.mode) skipNextPrefsWrite.current = true;
            dispatch(agentModeChanged(prefs.mode));
        }
    }, [ready, available, dispatch, mode]);

    // Keep visibility and presentation in localStorage. When closed, retain the last mode so
    // the preference still records how the window had been presented.
    useEffect(() => {
        if (!prefsHydrated.current || !available) return;
        if (skipNextPrefsWrite.current) {
            skipNextPrefsWrite.current = false;
            return;
        }
        if (mode !== "bubble") writePrefs({ open: true, mode });
        else writePrefs({ open: false });
    }, [available, mode]);

    const toggle = useCallback(() => {
        if (!available) return;
        if (isOpen) dispatch(agentModeChanged("bubble"));
        else {
            openerRef.current = document.activeElement;
            dispatch(agentOpenRequested());
        }
    }, [available, isOpen, dispatch]);

    // Ctrl/Cmd + J toggles the chat from anywhere in the admin app.
    useEffect(() => {
        if (!available) return;
        const onKey = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === "j") {
                event.preventDefault();
                toggle();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [available, toggle]);

    // Docked mode pushes the admin shell over instead of covering it.
    useEffect(() => {
        const docked = isOpen && mode === "docked";
        document.body.classList.toggle("solid-agent-docked", docked);
        document.documentElement.style.setProperty("--solid-agent-docked-width", `${dockWidth}px`);
        return () => document.body.classList.remove("solid-agent-docked");
    }, [isOpen, mode, dockWidth]);

    // Focus returns to whatever opened the chat when it is minimized.
    useEffect(() => {
        if (!isOpen && openerRef.current instanceof HTMLElement) {
            openerRef.current.focus();
            openerRef.current = null;
        }
    }, [isOpen]);

    const startResize = (event: React.PointerEvent) => {
        event.preventDefault();
        const onMove = (move: PointerEvent) => {
            setDockWidth(Math.max(MIN_DOCK, Math.min(MAX_DOCK, window.innerWidth - move.clientX)));
        };
        const onUp = () => {
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
            setDockWidth((width) => {
                writePrefs({ dockWidth: width });
                return width;
            });
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
    };

    const handleSelectAgent = useCallback((name: string, id?: number) => {
        dispatch(agentSelected({ agentName: name, agentId: id }));
    }, [dispatch]);

    const isTestHub = (() => {
        if (inputContext.moduleName === "test-hub" || inputContext.moduleName === "test_hub") return true;
        const segments = location.pathname.split("/").filter(Boolean);
        if (segments.includes("test-hub") || segments.includes("test_hub")) return true;
        if (sidebarWorkspace === "test-hub" || sidebarWorkspace === "test_hub") return true;
        return false;
    })();

    const prevIsTestHubRef = useRef(isTestHub);
    useEffect(() => {
        if (prevIsTestHubRef.current !== isTestHub) {
            dispatch(agentSelected({ agentName: isTestHub ? "testhub" : "solidx-native" }));
        }
        prevIsTestHubRef.current = isTestHub;
    }, [isTestHub, dispatch]);

    if (!available || !agentUrl) return null;

    const defaultAgentName = isTestHub ? "testhub" : "solidx-native";
    const activeAgentName = agent?.selectedAgentName || agent?.requestedAgentName || defaultAgentName;
    const activeAgentInfo = registeredAgents.find((a) => a.name === activeAgentName);
    const activeAgentTitle = activeAgentInfo?.title || (activeAgentName === "testhub" ? "TestHub Quality Engineer" : "Solid Native Agent");

    const hubUrl = agentUrls.agentHub;
    const agentRuntime: AgentRuntimeType = hubUrl ? "agentHub" : "solidx";
    const baseUrl = hubUrl || agentUrls.solidx || agentUrl;
    const activeAgentUrl = hubUrl
        ? withAgent(hubUrl, activeAgentName ? { agentName: activeAgentName } : { agentId: activeAgentInfo?.id ?? agent?.selectedAgentId ?? agent?.requestedAgentId ?? undefined })
        : baseUrl;

    const frameClass = mode === "docked" ? styles.docked : mode === "maximized" ? styles.maximized : styles.compact;

    return (
        <div className={styles.root}>
            {isOpen ? (
                <div
                    ref={windowRef}
                    className={`${styles.window} ${frameClass}`}
                    style={mode === "docked" ? { width: dockWidth } : undefined}
                    role="complementary"
                    aria-label={activeAgentTitle}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            event.stopPropagation();
                            dispatch(agentModeChanged("bubble"));
                        }
                    }}
                >
                    {mode === "docked" && <div className={styles.resizeHandle} onPointerDown={startResize} aria-hidden="true" />}
                    <SolidAgentChat
                        agentUrl={activeAgentUrl}
                        agentName={activeAgentName}
                        agentRuntime={agentRuntime}
                        title={activeAgentTitle}
                        agents={registeredAgents}
                        onSelectAgent={handleSelectAgent}
                    />
                </div>
            ) : (
                <button type="button" className={styles.bubble} onClick={toggle} aria-label={`Open ${activeAgentTitle} (Ctrl+J)`} title={`${activeAgentTitle} (Ctrl+J)`}>
                    <Sparkles size={22} />
                    {agent?.working && <span className={styles.bubbleBadge} aria-label="Agent is working" />}
                </button>
            )}
        </div>
    );
}
