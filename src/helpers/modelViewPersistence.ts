const MODEL_VIEW_STORAGE_KEY = "solidx.model.last-view";

const MODEL_VIEW_ROUTE_REGEX =
  /^\/admin\/core\/([^/]+)\/([^/]+)\/(list|tree|kanban|card)$/;

type ParsedModelViewRoute = {
  actionId: string;
  fullPath: string;
  menuItemId: string;
  modelName: string;
  moduleName: string;
  pathname: string;
  viewType: "list" | "tree" | "kanban" | "card";
};

type StoredModelViewEntry = {
  path: string;
  updatedAt: number;
};

type StoredModelViewMap = Record<string, StoredModelViewEntry | string>;

const getRouteParsingBase = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }

};

// Normalize a list/tree/kanban/card URL into a shape we can store and compare.
// We keep the full query string because menu/action params are part of the return route.
const parseModelViewRoute = (target: string): ParsedModelViewRoute | null => {
  if (!target) return null;

  try {
    const url = new URL(target, getRouteParsingBase());
    const match = url.pathname.match(MODEL_VIEW_ROUTE_REGEX);

    if (!match) return null;

    const [, moduleName, modelName, viewType] = match;
    const menuItemId = url.searchParams.get("menuItemId") || "";
    const actionId = url.searchParams.get("actionId") || "";

    return {
      actionId,
      fullPath: `${url.pathname}${url.search}`,
      menuItemId,
      modelName,
      moduleName,
      pathname: url.pathname,
      viewType: viewType as ParsedModelViewRoute["viewType"],
    };
  } catch (error) {
    return null;
  }
};

const getScopedStorageKey = (route: ParsedModelViewRoute) =>
  `model:${route.moduleName}:${route.modelName}:menu:${route.menuItemId}:action:${route.actionId}`;

const getMenuStorageKey = (route: ParsedModelViewRoute) =>
  `model:${route.moduleName}:${route.modelName}:menu:${route.menuItemId}`;

const getModelStorageKey = (route: ParsedModelViewRoute) =>
  `model:${route.moduleName}:${route.modelName}`;

// Older saved values may exist as plain strings from previous implementations.
// Convert everything into one consistent shape before comparing timestamps.
const normalizeStoredEntry = (value: StoredModelViewEntry | string | undefined | null): StoredModelViewEntry | null => {
  if (!value) return null;

  if (typeof value === "string") {
    return {
      path: value,
      updatedAt: 0,
    };
  }

  if (typeof value.path !== "string" || !value.path) {
    return null;
  }

  return {
    path: value.path,
    updatedAt: Number(value.updatedAt) || 0,
  };
};

const readStoredModelViews = (): StoredModelViewMap => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(MODEL_VIEW_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
};

const writeStoredModelViews = (next: StoredModelViewMap) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(MODEL_VIEW_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    // Ignore storage write failures and keep navigation working.
  }
};

// Save the current route at three scopes:
// 1. exact model + menu + action
// 2. model + menu
// 3. model
// This lets us reopen the most useful last-selected view even when the user
// returns through a slightly different sidebar/menu link.
export const persistLastModelViewRoute = (target: string) => {
  if (typeof window === "undefined") return;

  const route = parseModelViewRoute(target);
  if (!route) return;

  const next = readStoredModelViews();
  const entry: StoredModelViewEntry = {
    path: route.fullPath,
    updatedAt: Date.now(),
  };

  next[getScopedStorageKey(route)] = entry;
  if (route.menuItemId) {
    next[getMenuStorageKey(route)] = entry;
  }
  next[getModelStorageKey(route)] = entry;
  writeStoredModelViews(next);
};

// Resolve the best saved route for the current model context.
// We prefer the newest entry and use scope priority as a tie-breaker.
export const getPersistedLastModelViewRoute = (target: string): string | null => {
  if (typeof window === "undefined") return null;

  const route = parseModelViewRoute(target);
  if (!route) return null;

  const stored = readStoredModelViews();
  const candidateKeys = [
    Boolean(route.menuItemId || route.actionId) ? getScopedStorageKey(route) : null,
    route.menuItemId ? getMenuStorageKey(route) : null,
    getModelStorageKey(route),
  ].filter(Boolean) as string[];

  let bestMatch: { entry: StoredModelViewEntry; priority: number } | null = null;

  for (let priority = 0; priority < candidateKeys.length; priority += 1) {
    const key = candidateKeys[priority];
    const entry = normalizeStoredEntry(stored[key]);
    if (!entry) continue;

    if (!bestMatch || entry.updatedAt > bestMatch.entry.updatedAt || (entry.updatedAt === bestMatch.entry.updatedAt && priority < bestMatch.priority)) {
      bestMatch = { entry, priority };
    }
  }

  return bestMatch ? bestMatch.entry.path : null;
};

// Sidebar and menu links often point to `/list` by default.
// If we have a retained non-list view for the same model context, reopen that instead.
export const resolveRetainedModelViewRoute = (target: string): string => {
  const route = parseModelViewRoute(target);
  if (!route || route.viewType !== "list") return target;

  const storedRoute = getPersistedLastModelViewRoute(target);
  return storedRoute || target;
};

// Keep short-lived "back to previous view" state in sessionStorage and also
// refresh the longer-lived localStorage route retention in one call.
export const storeCurrentModelViewContext = (target?: string) => {
  if (typeof window === "undefined") return;

  const fallbackTarget = `${window.location.pathname}${window.location.search}`;
  const nextTarget = target || fallbackTarget;
  const route = parseModelViewRoute(nextTarget);

  try {
    if (route?.viewType) {
      sessionStorage.setItem("fromView", route.viewType);
    }
    sessionStorage.setItem("fromViewUrl", route?.fullPath || nextTarget);
  } catch (error) {
    // Ignore storage failures so navigation can still continue.
  }

  if (route) {
    persistLastModelViewRoute(route.fullPath);
  }
};
