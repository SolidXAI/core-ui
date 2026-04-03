import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { enterStudioMode, setStudioView } from "../../../redux/features/solidStudioSlice";

const BackendIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M2 11h28" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="6.5" cy="8.5" r="1" fill="currentColor" />
    <circle cx="10" cy="8.5" r="1" fill="currentColor" />
    <circle cx="13.5" cy="8.5" r="1" fill="currentColor" />
    <path d="M9 17l3 3-3 3M15 23h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FrontendIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="28" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10 28h12M16 22v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M11 13l3-3-3-3M17 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function StudioHomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Entering studio mode when landing on this page
  useEffect(() => {
    dispatch(enterStudioMode());
    dispatch(setStudioView(null)); // clear previous view so neither button shows active
  }, [dispatch]);

  const handleSelect = (view: "backend" | "frontend") => {
    dispatch(setStudioView(view));
    navigate(view === "backend" ? "/admin" : "/landing");
  };

  return (
    <div className="solid-studio-home">
      <div className="solid-studio-home-inner">
        <div className="solid-studio-home-heading">
          <h1>Welcome to SolidX Studio</h1>
          <p>Choose where you want to work today.</p>
        </div>

        <div className="solid-studio-home-cards">
          <button
            type="button"
            className="solid-studio-home-card"
            onClick={() => handleSelect("backend")}
          >
            <div className="solid-studio-home-card-icon">
              <BackendIcon />
            </div>
            <div className="solid-studio-home-card-content">
              <span className="solid-studio-home-card-title">Backend</span>
              <span className="solid-studio-home-card-desc">
                Admin panel, data management, configuration, and settings.
              </span>
            </div>
          </button>

          <button
            type="button"
            className="solid-studio-home-card"
            onClick={() => handleSelect("frontend")}
          >
            <div className="solid-studio-home-card-icon">
              <FrontendIcon />
            </div>
            <div className="solid-studio-home-card-content">
              <span className="solid-studio-home-card-title">Frontend</span>
              <span className="solid-studio-home-card-desc">
                Custom UI, landing pages, and user-facing layouts.
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
