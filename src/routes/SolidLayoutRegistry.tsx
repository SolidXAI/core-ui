import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { RouteObject } from "react-router-dom";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SolidLayoutEntry {
  /** The root path of this layout, e.g. "/jenendar" */
  path: string;
  /** Display title. Falls back to title-casing the path segment. */
  title: string;
  /** Optional subtitle shown on the card. */
  description?: string;
  /** Resolved URL to navigate to when the card is clicked (first child). */
  to: string;
}

/**
 * Optionally attach this to a route's `handle` to customise the card.
 *
 * @example
 * ```tsx
 * {
 *   path: "/my-layout",
 *   handle: { title: "My Layout", description: "Custom layout" } satisfies SolidLayoutHandle,
 *   element: <MyLayout />,
 *   children: [...],
 * }
 * ```
 */
export interface SolidLayoutHandle {
  title?: string;
  description?: string;
}

// ── Module-level store ────────────────────────────────────────────────────────
// Populated automatically inside getSolidRoutes() — no consumer changes needed.

let _autoRoutes: RouteObject[] = [];

/**
 * Called by getSolidRoutes() whenever extraRoutes are provided.
 * @internal — not part of the public API.
 */
export function _solidRegisterExtraRoutes(routes: RouteObject[]): void {
  _autoRoutes = routes;
}

// ── Context (optional override) ───────────────────────────────────────────────
// Mount SolidLayoutRegistryProvider anywhere above StudioLandingPage to
// override the auto-registered list (e.g. async / runtime route lists).

const SolidLayoutRegistryContext = createContext<SolidLayoutEntry[] | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

function pathToTitle(path: string): string {
  return (
    path
      .replace(/^\//, "")
      .split(/[-_/]/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || path
  );
}

/**
 * Walk a route tree and return the first concrete relative or absolute path found.
 * Skips index routes (they render at the parent path) and pathless wrappers
 * (guards, layout wrappers) by looking inside their children recursively.
 */
function findFirstConcretePath(children: RouteObject[]): string | undefined {
  // 1. FIRST PASS → prioritize index (including inside pathless wrappers)
  for (const child of children) {
    if ((child as any).index || child.path === "") {
      return "";
    }
    // Deep check for pathless wrappers in the first pass too
    if (!child.path && child.children?.length) {
      const nested = findFirstConcretePath(child.children);
      if (nested === "") return "";
    }
  }

  // 2. SECOND PASS → find first path
  for (const child of children) {
    if (child.path) return child.path;

    if (child.children?.length) {
      const nested = findFirstConcretePath(child.children);
      if (nested !== undefined) return nested;
    }
  }

  return undefined;
}
function resolveFirstChildTo(basePath: string, children: RouteObject[]): string {
  const concretePath = findFirstConcretePath(children);
  if (concretePath === undefined || concretePath === "") return basePath;
  if (concretePath.startsWith("/")) return concretePath;
  return `${basePath.replace(/\/$/, "")}/${concretePath}`;
}

function extractLayouts(routes: RouteObject[]): SolidLayoutEntry[] {
  return routes
    .filter((r) => !!r.path)
    .map((r) => {
      const handle = r.handle as SolidLayoutHandle | undefined;

      const to = r.children?.length
        ? resolveFirstChildTo(r.path!, r.children)
        : r.path!; // 👈 fallback for standalone routes

      return {
        path: r.path!,
        title: handle?.title ?? pathToTitle(r.path!),
        description: handle?.description,
        to,
      };
    });
}

// ── Provider (optional override) ──────────────────────────────────────────────

/**
 * Optional — most apps do NOT need this.
 * Use only when you need to override the auto-registered list at runtime.
 */
export function SolidLayoutRegistryProvider({
  routes,
  children,
}: {
  routes: RouteObject[];
  children: ReactNode;
}) {
  const layouts = useMemo(() => extractLayouts(routes), [routes]);
  return (
    <SolidLayoutRegistryContext.Provider value={layouts}>
      {children}
    </SolidLayoutRegistryContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the registered layout entries.
 *
 * Priority order:
 * 1. SolidLayoutRegistryProvider context (if mounted)
 * 2. Routes auto-registered when getSolidRoutes({ extraRoutes }) was called
 */
export function useSolidLayoutRegistry(): SolidLayoutEntry[] {
  const contextLayouts = useContext(SolidLayoutRegistryContext);
  if (contextLayouts !== null) return contextLayouts;
  return extractLayouts(_autoRoutes);
}
