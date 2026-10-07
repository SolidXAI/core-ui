import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { exitStudioMode, setStudioView, type StudioView } from "../../redux/features/solidStudioSlice";
import { useSession } from "../../hooks/useSession";
import { signOut } from "../../adapters/auth/index";
import { createPortal } from "react-dom";
import { env } from "../../adapters/env";
import { hasAnyRole } from "../../helpers/rolesHelper";

// ── Icons ──────────────────────────────────────────────────────────────────────

const DotsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="3" r="1.3" />
    <circle cx="8" cy="8" r="1.3" />
    <circle cx="8" cy="13" r="1.3" />
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

const BackendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2.2" y="3" width="11.6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <rect x="2.2" y="9" width="11.6" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="4.5" cy="5" r="0.7" fill="currentColor" />
    <circle cx="4.5" cy="11" r="0.7" fill="currentColor" />
  </svg>
);

const FrontendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1.8" y="2" width="12.4" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    <path d="M6 13.5 5 15h6l-1-1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 5 7.5 7l-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m10.5 5 2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── SolidStudio ────────────────────────────────────────────────────────────────
// Single component that renders both the Studio header and the AI panel.
// Mount this ONCE at the app root via AppEventListener.
// Visible to Admin users in dev environments.

export function SolidStudio() {
  const isStudioMode = useSelector((state: any) => state.solidStudio?.isStudioMode ?? false);
  const studioView = useSelector((state: any) => state.solidStudio?.studioView ?? null) as StudioView;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data, status } = useSession();
  const isAdmin = hasAnyRole(data?.user?.roles, ["Admin"]);
  const isDev = env("VITE_SOLIDX_ENV") === "dev";
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

  // Auto-exit studio if the user logs out
  useEffect(() => {
    if (status === "unauthenticated" && isStudioMode) {
      dispatch(exitStudioMode());
    }
  }, [status, isStudioMode, dispatch]);

  if (!isAdmin || !isDev) return null;

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
    <div className="solid-studio-island" style={{ zIndex: "var(--z-studio)" }}>
      <div className="solid-studio-island-inner">
        <button
          type="button"
          className={`solid-studio-island-btn${studioView === "backend" ? " active" : ""}`}
          onClick={() => handleViewSwitch("backend")}
          aria-label="Backend studio"
        >
          <BackendIcon />
        </button>
        <button
          type="button"
          className={`solid-studio-island-btn${studioView === "frontend" ? " active" : ""}`}
          onClick={() => handleViewSwitch("frontend")}
          aria-label="Frontend studio"
        >
          <FrontendIcon />
        </button>
        <div className="solid-studio-island-menu" ref={menuRef}>
          <button
            type="button"
            className={`solid-studio-island-btn${isMenuOpen ? " active" : ""}`}
            onClick={() => setIsMenuOpen((o) => !o)}
            aria-label="Studio options"
          >
            <DotsIcon />
          </button>
          {isMenuOpen && (
            <div className="solid-studio-island-dropdown">
              <button
                type="button"
                className="solid-studio-island-dropdown-item danger"
                onClick={handleLogout}
              >
                <LogoutIcon />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(studioUI, document.body) : null;
}

// ── SolidStudioWrapper ─────────────────────────────────────────────────────────
// Kept for backwards compatibility. Now a pure pass-through.
export function SolidStudioWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Legacy aliases
export const SolidAiStudioLayout = SolidStudioWrapper;
export const SolidStudioPanel = SolidStudio;
