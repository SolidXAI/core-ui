import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
// import { SolidAiChat } from "../core/solid-ai/SolidAiChat";
import { exitStudioMode, setStudioView, type StudioView } from "../../redux/features/solidStudioSlice";
import { useSession } from "../../hooks/useSession";
import { signOut } from "../../adapters/auth/index";
import { createPortal } from "react-dom";
import { enableStudioMode, disableStudioMode } from "../../helpers/studioSandbox";
import { env } from "../../adapters/env";

const HEADER_HEIGHT = "44px";
const PANEL_WIDTH_DEFAULT = 420;

// ── Icons ──────────────────────────────────────────────────────────────────────

const StudioIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8Z" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 2V1M8 15v-1M1 8H0M16 8h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const PanelOpenIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M10 1v14" stroke="currentColor" strokeWidth="1.3" />
    <path d="M12.5 6l1.5 2-1.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PanelCloseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="14" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M10 1v14" stroke="currentColor" strokeWidth="1.3" />
    <path d="M13.5 6L12 8l1.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DotsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="3" r="1.3" />
    <circle cx="8" cy="8" r="1.3" />
    <circle cx="8" cy="13" r="1.3" />
  </svg>
);

const ExitStudioIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M9.5 4.5 5 9M5 4.5l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const PreviewIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M1 7s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    <circle cx="7" cy="7" r="1.8" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M5 2H2.5A1.5 1.5 0 0 0 1 3.5v7A1.5 1.5 0 0 0 2.5 12H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path d="M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const ChatIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ── SolidStudio ────────────────────────────────────────────────────────────────
// Single component that renders both the Studio header and the AI panel.
// Mount this ONCE at the app root via AppEventListener.
// When studio mode is off it renders nothing.

export function SolidStudio() {
  const isStudioMode = useSelector((state: any) => state.solidStudio?.isStudioMode ?? false);
  const studioView = useSelector((state: any) => state.solidStudio?.studioView ?? null) as StudioView;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isOnStudioPage = pathname === "/studio";
  const isPreviewMode = new URLSearchParams(search).get("preview") === "true" || (typeof sessionStorage !== "undefined" && sessionStorage.getItem("solid-preview") === "true");
  const isPreviewable = !isOnStudioPage && pathname !== "/landing";
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelWidth] = useState(PANEL_WIDTH_DEFAULT);
  const [isDragging] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the 3-dot menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMenuOpen]);

  // Apply sandbox wrapper isolating app root so all fixed/sticky elements shift correctly
  useEffect(() => {
    const active = isStudioMode && isAuthenticated && !isPreviewMode;

    if (active) {
      enableStudioMode();
    } else {
      disableStudioMode();
    }

    // CSS variable consumed by sidebar, hotspot, admin-header, shell, main
    document.documentElement.style.setProperty(
      "--solid-studio-header-height",
      active ? HEADER_HEIGHT : "0px"
    );

    return () => {
      disableStudioMode();
      document.documentElement.style.setProperty("--solid-studio-header-height", "0px");
    };
  }, [isStudioMode, isAuthenticated, isPreviewMode]);

  // const onDragStart = useCallback((e: React.MouseEvent) => {
  //   e.preventDefault();
  //   dragStartX.current = e.clientX;
  //   dragStartWidth.current = panelWidth;
  //   setIsDragging(true);
  //   const onMove = (ev: MouseEvent) => {
  //     const delta = dragStartX.current - ev.clientX;
  //     const next = Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, dragStartWidth.current + delta));
  //     setPanelWidth(next);
  //   };
  //   const onUp = () => {
  //     setIsDragging(false);
  //     window.removeEventListener("mousemove", onMove);
  //     window.removeEventListener("mouseup", onUp);
  //   };
  //   window.addEventListener("mousemove", onMove);
  //   window.addEventListener("mouseup", onUp);
  // }, [panelWidth]);

  // Auto-exit studio if the user logs out
  useEffect(() => {
    if (status === "unauthenticated" && isStudioMode) {
      dispatch(exitStudioMode());
    }
  }, [status, isStudioMode, dispatch]);

  if (!isStudioMode || !isAuthenticated || isPreviewMode) return null;

  const handleExit = () => {
    setIsMenuOpen(false);
    dispatch(exitStudioMode());
    navigate("/studio");
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    dispatch(exitStudioMode());
    signOut({ callbackUrl: "/auth/login" });
  };

  const handleViewSwitch = (view: StudioView) => {
    dispatch(setStudioView(view));
    navigate(view === "backend" ? "/admin" : "/landing");
  };

  const studioUI = (
    <div style={{ zIndex: "var(--z-studio)", position: "fixed", top: 0, left: 0, right: 0 }}>
      {/* ── Studio global header ─────────────────────────────────────────────── */}
      <div className="solid-studio-header">
        <button
          type="button"
          className="solid-studio-header-brand"
          onClick={() => navigate("/studio")}
          title="Go to Studio home"
        >
          <StudioIcon />
          <span>SolidX Studio</span>
          <span className="solid-studio-bar-badge">BETA</span>
        </button>

        <nav className="solid-studio-header-nav">
          <button
            type="button"
            className={`solid-studio-view-btn${studioView === "backend" ? " active" : ""}`}
            onClick={() => handleViewSwitch("backend")}
          >
            Backend
          </button>
          <button
            type="button"
            className={`solid-studio-view-btn${studioView === "frontend" ? " active" : ""}`}
            onClick={() => handleViewSwitch("frontend")}
          >
            Frontend
          </button>
        </nav>

        <div className="solid-studio-header-actions">
          {/* <button
            type="button"
            className="solid-studio-panel-toggle-btn"
            onClick={() => setIsPanelOpen((o) => !o)}
            title={isPanelOpen ? "Collapse AI panel" : "Expand AI panel"}
          >
            {isPanelOpen ? <PanelCloseIcon /> : <PanelOpenIcon />}
          </button> */}

          {/* ── 3-dot menu ─────────────────────────────────────────────────── */}
          <div className="solid-studio-menu" ref={menuRef}>
            <button
              type="button"
              className="solid-studio-menu-trigger"
              onClick={() => setIsMenuOpen((o) => !o)}
              title="More options"
            >
              <DotsIcon />
            </button>
            {isMenuOpen && (
              <div className="solid-studio-menu-dropdown">
                {isPreviewable && (
                  <button
                    type="button"
                    className="solid-studio-menu-item"
                    onClick={() => {
                      setIsMenuOpen(false);
                      const params = new URLSearchParams(search);
                      params.set("preview", "true");
                      window.open(`${pathname}?${params.toString()}`, "_blank");
                    }}
                  >
                    <PreviewIcon />
                    Preview page
                  </button>
                )}
                {/* {!isOnStudioPage && (
                  <button type="button" className="solid-studio-menu-item" onClick={handleExit}>
                    <ExitStudioIcon />
                    Exit Studio
                  </button>
                )} */}
                <button type="button" className="solid-studio-menu-item danger" onClick={handleLogout}>
                  <LogoutIcon />
                  Logout
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="solid-studio-menu-trigger"
            style={{ color: "var(--primary-foreground)" }}
            onClick={() => {
              const aiUrl = env("VITE_SOLIDX_AI_URL");
              if (aiUrl) window.open(aiUrl, "_blank");
            }}
            title="Open AI Chat"
          >
            <ChatIcon />
          </button>
        </div>
      </div>

      {/* ── AI chat panel (commented out — moved to agent-ui) ───────────────── */}
      {/* <div
        className={`solid-studio-panel-fixed${isPanelOpen ? "" : " collapsed"}`}
        style={{ width: `${panelWidth}px` }}
      >
        <div
          className={`solid-studio-resize-handle${isDragging ? " dragging" : ""}`}
          onMouseDown={onDragStart}
        />
        <div className="solid-studio-panel-body">
          <SolidAiChat />
        </div>
      </div> */}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(studioUI, document.body) : null;
}

// ── PreviewModePersist ─────────────────────────────────────────────────────────
// Mount once at the app root alongside SolidStudio.
// sessionStorage is tab-scoped, so preview opened in a new tab stays isolated.
// Closing the tab is the natural way to exit preview mode.

const PREVIEW_KEY = "solid-preview";

export function PreviewModePersist() {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  // Activate: when URL has ?preview=true, store it in sessionStorage for this tab
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("preview") === "true") {
      sessionStorage.setItem(PREVIEW_KEY, "true");
    }
  }, [search]);

  // Persist: re-inject ?preview=true on every navigation if it was set
  useEffect(() => {
    if (sessionStorage.getItem(PREVIEW_KEY) !== "true") return;
    const params = new URLSearchParams(search);
    if (params.get("preview") === "true") return;
    params.set("preview", "true");
    navigate({ pathname, search: `?${params.toString()}` }, { replace: true });
  }, [pathname, search, navigate]);

  return null;
}

// ── SolidStudioWrapper ─────────────────────────────────────────────────────────
// Kept for backwards compatibility. Now a pure pass-through.
export function SolidStudioWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Legacy aliases
export const SolidAiStudioLayout = SolidStudioWrapper;
export const SolidStudioPanel = SolidStudio;
