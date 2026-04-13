import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { enterStudioMode, setStudioView } from "../../../redux/features/solidStudioSlice";

const BackendIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M2 11h28" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="6.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="10" cy="8.5" r="1" fill="currentColor" />
    <circle cx="13.5" cy="8.5" r="1" fill="currentColor" />
    <path d="M9 17l3 3-3 3M15 23h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FrontendIcon = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10 28h12M16 22v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M11 13l3-3-3-3M17 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowIcon = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function StudioHomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(enterStudioMode());
    dispatch(setStudioView(null));
  }, [dispatch]);

  const handleSelect = (view: "backend" | "frontend") => {
    dispatch(setStudioView(view));
    navigate(view === "backend" ? "/admin" : "/landing");
  };

  return (
    <div className="solid-studio-home">
      <div className="solid-studio-home-inner solid-studio-home-inner--wide">
        <div className="solid-studio-home-heading">
          <div className="solid-studio-home-badge">SolidX Studio</div>
          <h1>Welcome to SolidX Studio</h1>
          <p>Choose your workspace to get started.</p>
        </div>

        <div className="solid-studio-home-cards solid-studio-home-cards--2col">
          {/* Backend Studio Card */}
          <button
            type="button"
            className="solid-studio-home-card solid-studio-home-card--backend"
            onClick={() => handleSelect("backend")}
            aria-label="Open Backend Studio"
          >
            <div className="solid-studio-home-card-body">
              <div className="solid-studio-home-card-icon solid-studio-home-card-icon--backend">
                <BackendIcon />
              </div>
              <div className="solid-studio-home-card-content">
                <span className="solid-studio-home-card-title">Backend Studio</span>
                <span className="solid-studio-home-card-desc">
                  Admin panel, data management, APIs, configuration, and settings.
                </span>
              </div>
              <div className="solid-studio-home-card-cta">
                <span>Open</span>
                <ArrowIcon />
              </div>
            </div>
          </button>

          {/* Frontend Studio Card */}
          <button
            type="button"
            className="solid-studio-home-card solid-studio-home-card--frontend"
            onClick={() => handleSelect("frontend")}
            aria-label="Open Frontend Studio"
          >
            <div className="solid-studio-home-card-body">
              <div className="solid-studio-home-card-icon solid-studio-home-card-icon--frontend">
                <FrontendIcon />
              </div>
              <div className="solid-studio-home-card-content">
                <span className="solid-studio-home-card-title">Frontend Studio</span>
                <span className="solid-studio-home-card-desc">
                  Custom UI, landing pages, components, and user-facing layouts.
                </span>
              </div>
              <div className="solid-studio-home-card-cta">
                <span>Open</span>
                <ArrowIcon />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
