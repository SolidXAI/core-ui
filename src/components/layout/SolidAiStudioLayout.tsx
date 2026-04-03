import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { SolidAiChat } from "../core/solid-ai/SolidAiChat";
import { exitStudioMode, setStudioView, type StudioView } from "../../redux/features/solidStudioSlice";
import { useSession } from "../../hooks/useSession";
import { env } from "../../adapters/env";

const HEADER_HEIGHT = "44px";
const PANEL_WIDTH_DEFAULT = 420;
const PANEL_WIDTH_MIN = 280;
const PANEL_WIDTH_MAX = 720;

// ── Icons ──────────────────────────────────────────────────────────────────────

const StudioIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8Z" stroke="currentColor" strokeWidth="1.4" />
    <path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 2V1M8 15v-1M1 8H0M16 8h-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const ExitIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M9.5 4.5 5 9M5 4.5l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="1" y="1" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" />
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

// ── SolidStudio ────────────────────────────────────────────────────────────────
// Single component that renders both the Studio header and the AI panel.
// Mount this ONCE at the app root via AppEventListener.
// When studio mode is off it renders nothing.

export function SolidStudio() {
  const isStudioMode = useSelector((state: any) => state.solidStudio?.isStudioMode ?? false);
  const studioView = useSelector((state: any) => state.solidStudio?.studioView ?? null) as StudioView;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(PANEL_WIDTH_DEFAULT);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(PANEL_WIDTH_DEFAULT);

  // Apply body padding + CSS variable so all fixed/sticky elements shift correctly
  useEffect(() => {
    const active = isStudioMode && isAuthenticated;
    document.body.style.paddingRight = active && isPanelOpen ? `${panelWidth}px` : "";
    document.body.style.paddingTop = active ? HEADER_HEIGHT : "";
    document.body.style.transition = isDragging ? "none" : "padding 220ms ease";
    // CSS variable consumed by sidebar, hotspot, admin-header, shell, main
    document.documentElement.style.setProperty(
      "--solid-studio-header-height",
      active ? HEADER_HEIGHT : "0px"
    );
    return () => {
      document.body.style.paddingRight = "";
      document.body.style.paddingTop = "";
      document.body.style.transition = "";
      document.documentElement.style.setProperty("--solid-studio-header-height", "0px");
    };
  }, [isStudioMode, isAuthenticated, isPanelOpen, panelWidth, isDragging]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = panelWidth;
    setIsDragging(true);

    const onMove = (ev: MouseEvent) => {
      const delta = dragStartX.current - ev.clientX;
      const next = Math.min(PANEL_WIDTH_MAX, Math.max(PANEL_WIDTH_MIN, dragStartWidth.current + delta));
      setPanelWidth(next);
    };
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [panelWidth]);

  // Auto-exit studio if the user logs out
  useEffect(() => {
    if (status === "unauthenticated" && isStudioMode) {
      dispatch(exitStudioMode());
    }
  }, [status, isStudioMode, dispatch]);

  if (!isStudioMode || !isAuthenticated) return null;

  const handleExit = () => {
    dispatch(exitStudioMode());
    navigate(env("NEXT_PUBLIC_LOGIN_REDIRECT_URL") || "/admin");
  };

  const handleViewSwitch = (view: StudioView) => {
    dispatch(setStudioView(view));
    navigate(view === "backend" ? "/admin" : "/landing");
  };

  return (
    <>
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
          <button
            type="button"
            className="solid-studio-panel-toggle-btn"
            onClick={() => setIsPanelOpen((o) => !o)}
            title={isPanelOpen ? "Collapse AI panel" : "Expand AI panel"}
          >
            {isPanelOpen ? <PanelCloseIcon /> : <PanelOpenIcon />}
          </button>
          <button
            type="button"
            className="solid-studio-exit-btn"
            onClick={handleExit}
            title="Exit Studio mode"
          >
            <ExitIcon />
            Exit Studio
          </button>
        </div>
      </div>

      {/* ── AI chat panel ────────────────────────────────────────────────────── */}
      <div
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
      </div>
    </>
  );
}

// ── SolidStudioWrapper ─────────────────────────────────────────────────────────
// Kept for backwards compatibility. Now a pure pass-through.
export function SolidStudioWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Legacy aliases
export const SolidAiStudioLayout = SolidStudioWrapper;
export const SolidStudioPanel = SolidStudio;
