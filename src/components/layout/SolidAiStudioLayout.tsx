import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { exitStudioMode, setStudioView, type StudioView } from "../../redux/features/solidStudioSlice";
import { showToast } from "../../redux/features/toastSlice";
import { useSession } from "../../hooks/useSession";
import { getSession, signOut } from "../../adapters/auth/index";
import { createPortal } from "react-dom";
import { env } from "../../adapters/env";
import { ERROR_MESSAGES } from "../../constants/error-messages";

// ── Icons ──────────────────────────────────────────────────────────────────────

const DotsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <circle cx="8" cy="3" r="1.3" />
    <circle cx="8" cy="8" r="1.3" />
    <circle cx="8" cy="13" r="1.3" />
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
// When studio mode is off it renders nothing.

export function SolidStudio() {
  const isStudioMode = useSelector((state: any) => state.solidStudio?.isStudioMode ?? false);
  const studioView = useSelector((state: any) => state.solidStudio?.studioView ?? null) as StudioView;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isPreviewMode = new URLSearchParams(search).get("preview") === "true" || (typeof sessionStorage !== "undefined" && sessionStorage.getItem("solid-preview") === "true");
  const isPreviewable = pathname !== "/studio" && pathname !== "/landing";
  const { data, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChatRedirecting, setIsChatRedirecting] = useState(false);
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

  if (!isStudioMode || !isAuthenticated || isPreviewMode) return null;

  const handleLogout = () => {
    setIsMenuOpen(false);
    dispatch(exitStudioMode());
    signOut({ callbackUrl: "/auth/login" });
  };

  const handleViewSwitch = (view: StudioView) => {
    dispatch(setStudioView(view));
    navigate(view === "backend" ? "/admin" : "/landing");
  };

  const handleAiChatClick = async () => {
    if (isChatRedirecting) return;

    const aiUrl = env("VITE_SOLIDX_AI_URL");
    if (!aiUrl) return;

    setIsChatRedirecting(true);
    try {
      const session = await getSession();
      const accessToken = session?.user?.accessToken || data?.user?.accessToken;
      if (!accessToken) return;

      const apiBaseUrl = env("API_URL", "http://localhost:8080").replace(/\/+$/, "");
      const response = await fetch(`${apiBaseUrl}/api/iam/sso/code`, {
        method: "POST",
        headers: {
          accept: "*/*",
          Authorization: `Bearer ${accessToken}`,
        },
        body: "",
      });

      if (!response.ok) {
        let detail = `Failed to fetch ssoCode (${response.status})`;
        try {
          const errorPayload = await response.json();
          detail =
            errorPayload?.message ||
            errorPayload?.error?.message ||
            errorPayload?.data?.message ||
            detail;
        } catch {
          // no-op: keep default message
        }
        throw new Error(detail);
      }

      const payload = await response.json();
      const ssoCode = payload?.ssoCode ?? payload?.data?.ssoCode;
      if (!ssoCode) {
        throw new Error("ssoCode missing in response");
      }

      const redirectUrl = new URL(aiUrl, window.location.origin);
      redirectUrl.searchParams.set("ssoCode", String(ssoCode));
      window.open(redirectUrl.toString(), "_blank");
    } catch (error) {
      const detail = error instanceof Error ? error.message : ERROR_MESSAGES.SOMETHING_WRONG;
      dispatch(
        showToast({
          severity: "error",
          summary: ERROR_MESSAGES.ERROR,
          detail,
          life: 4000,
        })
      );
      console.error("Failed to open AI chat with ssoCode:", error);
    } finally {
      setIsChatRedirecting(false);
    }
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
        <button
          type="button"
          className="solid-studio-island-btn"
          onClick={handleAiChatClick}
          disabled={isChatRedirecting}
          aria-busy={isChatRedirecting}
          aria-label="AI chat"
        >
          <ChatIcon />
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
              {isPreviewable && (
                <button
                  type="button"
                  className="solid-studio-island-dropdown-item"
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
