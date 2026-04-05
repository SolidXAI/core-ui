import { Message } from "primereact/message";
import { env } from "../../adapters/env";
import SolidLogo from '../../resources/images/SolidXLogo.svg'

export const SolidAdmin = () => {
  const redirectUrl = env("NEXT_PUBLIC_LOGIN_REDIRECT_URL");
  const hasRedirect = Boolean(redirectUrl);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        .solid-welcome {
          min-height: calc(100vh - var(--solid-studio-header-height, 0px));
          background: #FFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 2rem;
        }

        .welcome-card {
          text-align: center;
          max-width: 560px;
          width: 100%;
        }


        .logo-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: #1A1A1A;
          border-radius: 14px;
          margin-bottom: 2rem;
        }

        .logo-letter {
          font-family: 'Lora', serif;
          font-weight: 500;
          font-size: 1.5rem;
          color: #FAFAF8;
          letter-spacing: -0.02em;
        }

        .welcome-eyebrow {
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #A0A096;
          margin-bottom: 0.85rem;
        }

        .welcome-title {
          font-family: 'Lora', serif;
          font-size: 2.4rem;
          font-weight: 400;
          color: #1A1A1A;
          line-height: 1.2;
          margin-bottom: 1.25rem;
          letter-spacing: -0.02em;
        }

        .welcome-title em {
          font-style: italic;
          color: #555550;
        }

        .divider {
          width: 36px;
          height: 1.5px;
          background: #D4D4CC;
          margin: 0 auto 1.25rem;
        }

        .welcome-desc {
          font-size: 0.975rem;
          font-weight: 300;
          color: #6E6E66;
          line-height: 1.75;
          margin-bottom: 2.25rem;
        }

        .features-row {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .feature-pill {
          font-size: 0.78rem;
          font-weight: 400;
          color: #7A7A72;
          background: #F0F0EC;
          border: 1px solid #E4E4DF;
          border-radius: 100px;
          padding: 0.35rem 0.9rem;
          letter-spacing: 0.01em;
          transition: background 0.2s, color 0.2s;
          cursor: default;
        }

        .feature-pill:hover {
          background: #E8E8E3;
          color: #3A3A35;
        }

        .hint {
          margin-top: 2.5rem;
          font-size: 0.78rem;
          color: #B0B0A8;
          font-weight: 300;
        }

        .hint span {
          display: inline-block;
          background: #EDEDE9;
          border: 1px solid #E0E0DB;
          border-radius: 5px;
          padding: 0.1rem 0.45rem;
          font-size: 0.72rem;
          color: #8A8A82;
          font-family: monospace;
          vertical-align: middle;
        }
      `}</style>

      {/* <div className="flex flex-column align-items-center justify-content-center min-h-screen bg-white">
        {!hasRedirect && (
          <div className="mb-3">
            <Message
              severity="warn"
              text="Default redirect URL is not configured. Please ask your system administrator to set VITE_LOGIN_REDIRECT_URL."
            />
          </div>
        )}
        {hasRedirect && (
          <>
            <img
              alt="solid logo"
              src={SolidLogo}
              className="mb-5 w-6rem flex-shrink-0"
            />
            <h1 className="mt-0 mb-3">Welcome to SolidX</h1>
            <p className="text-600 line-height-3 mt-0 mb-5 text-xl w-5 text-center">
              SolidX is the admin console for managing modules, models, views, and permissions. Use the
              left navigation to explore modules, configure settings, and build your app.
            </p>
          </>
        )}
      </div> */}
      <div className="solid-welcome">

        <div className="welcome-card">

          <img
            alt="solid logo"
            src={SolidLogo}
            className="mb-5 w-6rem flex-shrink-0"
          />

          <p className="welcome-eyebrow">Admin Console</p>

          <h1 className="welcome-title">
            Welcome to <em>SolidX</em>
          </h1>

          <div className="divider" />

          <p className="welcome-desc">
            Manage your modules, models, views, and permissions
            from one place. Use the navigation on the left to
            explore and configure your application.
          </p>

          <div className="features-row">
            {["Modules", "Models", "Views", "Permissions", "Settings"].map((label) => (
              <span key={label} className="feature-pill">{label}</span>
            ))}
          </div>

          <p className="hint">
            Get started by selecting a section from the <span>left nav</span>
          </p>

        </div>

      </div>
    </>
  );
};
