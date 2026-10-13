import { useMemo } from "react";
import { camelCase } from "lodash";
import { useLocation } from "react-router-dom";

export type AgentInputContext = Record<string, unknown>;

/** Infer model-view context from Solid Core's admin route structure. */
export function useAdminInputContext(): AgentInputContext {
    const { pathname } = useLocation();

    return useMemo(() => {
        const segments = pathname.split("/").filter(Boolean).map((segment) => {
            try {
                return decodeURIComponent(segment);
            } catch {
                return segment;
            }
        });
        const adminCoreIndex = segments.findIndex((segment, index) => segment === "admin" && segments[index + 1] === "core");
        if (adminCoreIndex < 0) return {};

        const moduleName = segments[adminCoreIndex + 2];
        const modelSegment = segments[adminCoreIndex + 3];
        const viewName = segments[adminCoreIndex + 4];
        if (!moduleName || !modelSegment || !viewName) return {};

        if (["list", "card", "kanban", "tree"].includes(viewName)) {
            return { viewName, moduleName, modelName: camelCase(modelSegment) };
        }

        if (viewName === "form") {
            const modelId = segments[adminCoreIndex + 5];
            return {
                viewName,
                moduleName,
                modelName: camelCase(modelSegment),
                ...(modelId && modelId !== "new" ? { modelId } : {}),
            };
        }

        // Custom admin pages (for example, /<model>/editor/:id) still carry
        // the module and model in the standard route positions. Treat their
        // route as a custom view and pass along an optional record identifier.
        const modelId = segments[adminCoreIndex + 5];
        return {
            viewName: "custom",
            moduleName,
            modelName: camelCase(modelSegment),
            ...(modelId && modelId !== "new" ? { modelId } : {}),
        };
    }, [pathname]);
}
