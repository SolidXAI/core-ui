import React, { Suspense } from "react";

const SolidAgentHost = React.lazy(() => import("./SolidAgentHost"));

/** If the agent UI fails (render error or chunk load), hide it and leave the admin app untouched. */
class AgentHostBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error: Error) {
        console.error("[solidAgent] the agent launcher failed and was hidden", error);
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

/** Lazy, isolated mount point for the SolidX Agent launcher. Render once in the admin layout. */
export function SolidAgentMount() {
    return (
        <AgentHostBoundary>
            <Suspense fallback={null}>
                <SolidAgentHost />
            </Suspense>
        </AgentHostBoundary>
    );
}
