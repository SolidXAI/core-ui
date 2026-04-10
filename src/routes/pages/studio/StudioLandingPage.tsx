import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSolidLayoutRegistry } from "../../SolidLayoutRegistry";
import type { SolidLayoutEntry } from "../../SolidLayoutRegistry";
import { ChatIcon } from "@/components/layout/SolidAiStudioLayout";
import { env } from "../../../adapters/env";

// ── Icons ──────────────────────────────────────────────────────────────────────

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LayoutPlaceholderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
    <path d="M1 6h16" stroke="currentColor" strokeWidth="1.1" />
    <path d="M6 6v11" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

const NoLayoutIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeDasharray="4 3" />
    <path d="M11 16h10M16 11v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const GridViewIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
    <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
    <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
    <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

const ListViewIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
    <rect x="1" y="2.5" width="13" height="2.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
    <rect x="1" y="6.25" width="13" height="2.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
    <rect x="1" y="10" width="13" height="2.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
  </svg>
);

// ── Per-card accent colours (cycles by index) ──────────────────────────────────

const CARD_ACCENTS = [
  { bg: "hsl(224 70% 54%)", cls: "solid-studio-home-card-icon--backend" },
  { bg: "hsl(158 64% 42%)", cls: "solid-studio-home-card-icon--list" },
  { bg: "hsl(32  95% 48%)", cls: "solid-studio-home-card-icon--kanban" },
  { bg: "hsl(270 65% 58%)", cls: "solid-studio-home-card-icon--form" },
  { bg: "hsl(199 89% 48%)", cls: "solid-studio-home-card-icon--tree" },
  { bg: "hsl(215 25% 52%)", cls: "solid-studio-home-card-icon--settings" },
];

// ── Generic layout wireframe thumbnail ────────────────────────────────────────

function LayoutThumb({ accentColor, title }: { accentColor: string; title: string }) {
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <svg
      className="solid-studio-home-card-thumb"
      viewBox="0 0 280 122"
      fill="none"
      aria-hidden="true"
    >
      {/* background */}
      <rect width="280" height="122" fill="var(--sidebar-background)" />

      {/* sidebar */}
      <rect width="40" height="122" fill="var(--border)" opacity="0.7" />
      <rect x="7" y="14" width="26" height="4" rx="2" fill="var(--muted)" opacity="0.45" />
      <rect x="7" y="26" width="26" height="4" rx="2" fill="var(--muted)" opacity="0.28" />
      <rect x="7" y="38" width="26" height="4" rx="2" fill="var(--muted)" opacity="0.28" />
      <rect x="7" y="50" width="26" height="4" rx="2" fill="var(--muted)" opacity="0.28" />

      {/* top bar */}
      <rect x="40" y="0" width="240" height="18" fill="var(--border)" opacity="0.5" />

      {/* accent header band */}
      <rect x="48" y="22" width="224" height="28" rx="3" fill={accentColor} opacity="0.12" />
      <rect x="56" y="30" width="80" height="7" rx="2" fill={accentColor} opacity="0.45" />
      <rect x="56" y="40" width="50" height="4" rx="2" fill="var(--muted)" opacity="0.3" />

      {/* content blocks */}
      <rect x="48" y="58" width="70" height="58" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.8" />
      <rect x="126" y="58" width="70" height="58" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.8" />
      <rect x="204" y="58" width="68" height="26" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.8" />
      <rect x="204" y="90" width="68" height="26" rx="3" fill="var(--card)" stroke="var(--border)" strokeWidth="0.8" />

      {/* inner muted lines */}
      <rect x="54" y="65" width="48" height="4" rx="2" fill="var(--muted)" opacity="0.28" />
      <rect x="54" y="73" width="36" height="3" rx="2" fill="var(--muted)" opacity="0.2" />
      <rect x="132" y="65" width="48" height="4" rx="2" fill="var(--muted)" opacity="0.28" />
      <rect x="132" y="73" width="36" height="3" rx="2" fill="var(--muted)" opacity="0.2" />

      {/* initials badge */}
      <circle cx="60" cy="98" r="9" fill={accentColor} opacity="0.18" />
      <text
        x="60"
        y="102"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill={accentColor}
        opacity="0.8"
        fontFamily="system-ui, sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}

// ── Card Components (shadcn-inspired) ────────────────────────────────────────

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`solid-studio-card ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`solid-studio-card-header ${className}`}>{children}</div>;
}

function CardTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`solid-studio-card-title ${className}`}>{children}</h3>;
}

function CardDescription({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`solid-studio-card-description ${className}`}>{children}</p>;
}

function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`solid-studio-card-content ${className}`}>{children}</div>;
}

function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`solid-studio-card-footer ${className}`}>{children}</div>;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="solid-studio-landing-empty-container">
      <Card className="solid-studio-landing-empty-card">
        <CardHeader className="solid-studio-landing-empty-header">
          <div className="solid-studio-home-badge" style={{ marginBottom: '12px' }}>Frontend Studio</div>
          <CardTitle>Frontend layout will appear here</CardTitle>
          <CardDescription>
            Register your app layouts to explore and customize them in the Studio.
          </CardDescription>
        </CardHeader>

        <CardContent className="solid-studio-landing-empty-body">
          <div className="solid-studio-landing-empty-primary-action">
            <p>To get started, use the <strong>SolidX AI Agent</strong> to add a new custom layout.</p>
            <button
              type="button"
              className="solid-studio-empty-cta-button"
              onClick={() => {
                const aiUrl = env("VITE_SOLIDX_AI_URL");
                if (aiUrl) window.open(aiUrl, "_blank");
              }}
            >
              <ChatIcon />
              <span>Open AI Chat</span>
              {/* <ArrowIcon /> */}
            </button>
          </div>

          <div className="solid-studio-landing-empty-divider" />

          <div className="solid-studio-landing-empty-details">
            <p className="solid-studio-landing-empty-instruction">
              Any route with a <code>path</code> and <code>children</code> passed to{" "}
              <code>getSolidRoutes()</code> will automatically appear as a card.
            </p>
            <div className="solid-studio-landing-snippet">
              <pre>
                <code>{`// AppRoutes.tsx\nconst extraRoutes = [\n  {\n    path: "/my-layout",\n    element: <MyLayout />,\n    children: [{ index: true, element: <MyPage /> }],\n  },\n];\n\ngetSolidRoutes({ extraRoutes });`}</code>
              </pre>
            </div>
            <p className="solid-studio-landing-hint">
              <strong>Pro Tip:</strong> Add <code>handle: {`{ title, description }`}</code> to a route to customize its appearance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function LayoutCard({
  entry,
  index,
  listView,
}: {
  entry: SolidLayoutEntry;
  index: number;
  listView: boolean;
}) {
  const navigate = useNavigate();
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  return (
    <button
      type="button"
      className={`solid-studio-home-card${listView ? " solid-studio-home-card--list" : ""}`}
      onClick={() => navigate(entry.to)}
      aria-label={`Open ${entry.title}`}
    >
      {!listView && (
        <div className="solid-studio-home-card-image-wrap">
          <LayoutThumb accentColor={accent.bg} title={entry.title} />
          <div className="solid-studio-home-card-image-overlay" />
        </div>
      )}
      <div className="solid-studio-home-card-body">
        <div className={`solid-studio-home-card-icon ${accent.cls}`}>
          <LayoutPlaceholderIcon />
        </div>
        <div className="solid-studio-home-card-content">
          <span className="solid-studio-home-card-title">{entry.title}</span>
          {entry.description && (
            <span className="solid-studio-home-card-desc">{entry.description}</span>
          )}
          <span className="solid-studio-home-card-desc" style={{ opacity: 0.6, fontSize: 11 }}>
            {entry.to}
          </span>
        </div>
        <div className="solid-studio-home-card-cta">
          <span>Open</span>
          <ArrowIcon />
        </div>
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function StudioLandingPage() {
  const layouts = useSolidLayoutRegistry();
  const [listView, setListView] = useState(false);

  return (
    <div className="solid-studio-home solid-studio-home--top">
      <div className="solid-studio-home-inner solid-studio-home-inner--fluid">

        {/* Toolbar: title left, view toggle right */}
        <div className="solid-studio-home-toolbar">
          {/* <div className="solid-studio-home-toolbar-left">
            <div className="solid-studio-home-heading">
              <div className="solid-studio-home-badge">Frontend Studio</div>
              <h1>Frontend Layouts</h1>
              <p>
                {layouts.length > 0
                  ? `${layouts.length} layout${layouts.length === 1 ? "" : "s"} registered in your app.`
                  : "Register your app layouts to explore them here."}
              </p>
            </div>
          </div> */}
          {layouts.length > 0 && (
            <div className="solid-studio-home-toolbar-right">
              <button
                type="button"
                className={`solid-studio-home-view-btn${!listView ? " solid-studio-home-view-btn--active" : ""}`}
                onClick={() => setListView(false)}
                aria-label="Grid view"
                title="Grid view"
              >
                <GridViewIcon />
              </button>
              <button
                type="button"
                className={`solid-studio-home-view-btn${listView ? " solid-studio-home-view-btn--active" : ""}`}
                onClick={() => setListView(true)}
                aria-label="List view"
                title="List view"
              >
                <ListViewIcon />
              </button>
            </div>
          )}
        </div>

        {layouts.length === 0 ? (
          <EmptyState />
        ) : listView ? (
          <div className="solid-studio-home-cards--list">
            {layouts.map((entry, i) => (
              <LayoutCard key={entry.path} entry={entry} index={i} listView />
            ))}
          </div>
        ) : (
          <div className="solid-studio-home-cards solid-studio-home-cards--fluid">
            {layouts.map((entry, i) => (
              <LayoutCard key={entry.path} entry={entry} index={i} listView={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
