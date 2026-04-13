import { env } from "../../adapters/env";
import SolidLogo from '../../resources/images/SolidXLogo-dark.svg'
import { ChatIcon } from "../layout/SolidAiStudioLayout";

export const SolidAdmin = () => {
  const redirectUrl = env("NEXT_PUBLIC_LOGIN_REDIRECT_URL");
  const hasRedirect = Boolean(redirectUrl);
  const aiChatUrl = env("VITE_SOLIDX_AI_URL");
  const canOpenChat = Boolean(aiChatUrl);

  const handleChatLaunch = () => {
    if (!aiChatUrl) return;
    window.open(aiChatUrl, "_blank");
  };

  return (
    <>
      <style>{`
        .solid-welcome {
          min-height: 100vh;
          background: var(--background);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .welcome-card {
          text-align: center;
          max-width: 480px;
          width: 100%;
          background-color: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .welcome-card-header {
          padding: 32px 32px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .welcome-card-content {
          padding: 0 32px 16px;
        }

        .welcome-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--foreground);
          line-height: 1.2;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .welcome-desc {
          font-size: 14px;
          color: var(--muted-foreground);
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .features-row {
          display: flex;
          justify-content: center;
          gap: 0px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .chat-hint {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }

        .chat-hint p {
          margin: 0;
          font-size: 13px;
          color: var(--muted-foreground);
        }

        .hint {
          font-size: 12px;
          color: var(--muted-foreground);
          opacity: 0.8;
        }

        .chat-button {
          border: none;
          background: #111827;
          color: #fff;
          border-radius: 999px;
          padding: 0.5rem 1.25rem;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .chat-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .chat-button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 15px rgba(17, 24, 39, 0.2);
        }
      `}</style>

      <div className="solid-welcome">

        <div className="solid-studio-card welcome-card">

          <div className="welcome-card-header">
            <img
              alt="solid logo"
              src={SolidLogo}
              className="mb-2 w-4rem flex-shrink-0"
              style={{ opacity: 0.9 }}
            />

            <div className="solid-studio-home-badge">Admin Console</div>

            <h1 className="welcome-title">
              Welcome to SolidX
            </h1>
          </div>

          <div className="welcome-card-content">
            <p className="welcome-desc">
              Manage modules, models, views, and permissions
              from one place. Use the navigation on the left to
              explore and configure your application.
            </p>

            <div className="features-row">
              {["Modules", "Models", "Views", "Permissions", "Settings"].map((label) => (
                <span key={label} className="solid-studio-home-badge" style={{ textTransform: 'none', letterSpacing: 'normal' }}>
                  {label}
                </span>
              ))}
            </div>

            <div className="chat-hint">
              <p>Need help scaffolding? Ask the SolidX AI Agent.</p>
              <button
                type="button"
                className="chat-button"
                onClick={handleChatLaunch}
                disabled={!canOpenChat}
                aria-label="Open SolidX AI chat"
              >
                <ChatIcon />
                <span>Open AI Chat</span>
              </button>
              <p className="hint">
                Or select a section from the left sidebar
              </p>
            </div>
          </div>

        </div>

      </div>
    </>
  );
};
