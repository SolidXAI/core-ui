const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 6 2 12l6 6M16 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function StudioLandingPage() {
  return (
    <div className="solid-studio-landing">
      <div className="solid-studio-landing-inner">
        <div className="solid-studio-landing-icon">
          <CodeIcon />
        </div>
        <h2 className="solid-studio-landing-title">No landing page yet</h2>
        <p className="solid-studio-landing-desc">
          Create a custom landing page for your app and register it at{" "}
          <code>/landing</code> in your <code>AppRoutes</code>.
        </p>
        <div className="solid-studio-landing-snippet">
          <pre>{`// src/routes/AppRoutes.tsx
import { LandingPage } from "../pages/LandingPage";

{ path: "/landing", element: <LandingPage /> }`}</pre>
        </div>
        <p className="solid-studio-landing-hint">
          Your route will take priority over this default page automatically.
        </p>
      </div>
    </div>
  );
}
