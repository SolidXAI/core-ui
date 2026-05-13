import type { AnyAction, Dispatch, Middleware, Reducer } from "@reduxjs/toolkit";
import type { DynamicEntityApiMiddlewareManager } from "./dynamicEntityApiMiddleware";
import type { DynamicReducerManager } from "./dynamicReducerManager";

export const SOLID_ENTITY_API_POOL_LIMIT = 64;

type SolidEntityApi = {
  reducerPath: string;
  reducer: Reducer;
  middleware: Middleware;
  util?: {
    resetApiState?: () => AnyAction;
  };
};

type SolidEntityApiPoolEntry = {
  entityName: string;
  api: SolidEntityApi;
  registeredAt: number;
  lastAccessedAt: number;
};

type SolidEntityApiStore = {
  dispatch: Dispatch;
  getState: () => any;
  replaceReducer: (nextReducer: Reducer) => void;
  reducerManager: DynamicReducerManager;
  middlewareManager: DynamicEntityApiMiddlewareManager;
};

let activeStore: SolidEntityApiStore | null = null;
let clock = 0;
const pool = new Map<string, SolidEntityApiPoolEntry>();

function nextTimestamp() {
  clock += 1;
  return clock;
}

function log(message: string, data?: Record<string, unknown>) {
  // Centralized logs make pool behavior easy to trace in consuming apps.
  console.info(`[SolidEntityApiPool] ${message}`, data ?? {});
}

function warn(message: string, data?: Record<string, unknown>) {
  console.warn(`[SolidEntityApiPool] ${message}`, data ?? {});
}

function getLiveSnapshot() {
  return Array.from(pool.values()).map((entry) => ({
    entityName: entry.entityName,
    reducerPath: entry.api.reducerPath,
    registeredAt: entry.registeredAt,
    lastAccessedAt: entry.lastAccessedAt,
    active: Boolean(activeStore?.middlewareManager.has(entry.api.reducerPath)),
  }));
}

function getActiveEntries() {
  return Array.from(pool.values()).filter((entry) => activeStore?.middlewareManager.has(entry.api.reducerPath));
}

function hasActiveUsage(entry: SolidEntityApiPoolEntry) {
  if (!activeStore) return false;

  const state = activeStore.getState()?.[entry.api.reducerPath];
  if (!state) return false;

  const hasSubscriptions = Object.values(state.subscriptions ?? {}).some((subscription: any) => {
    return subscription && Object.keys(subscription).length > 0;
  });
  const hasPendingQueries = Object.values(state.queries ?? {}).some((query: any) => query?.status === "pending");
  const hasPendingMutations = Object.values(state.mutations ?? {}).some((mutation: any) => mutation?.status === "pending");

  return hasSubscriptions || hasPendingQueries || hasPendingMutations;
}

function findEvictionCandidate() {
  return getActiveEntries()
    .filter((entry) => !hasActiveUsage(entry))
    .sort((left, right) => left.lastAccessedAt - right.lastAccessedAt)[0] ?? null;
}

function evictIfNeeded(nextEntityName: string) {
  if (!activeStore) return;

  const activeEntries = getActiveEntries();
  if (activeEntries.length < SOLID_ENTITY_API_POOL_LIMIT) return;

  warn("Pool is full; attempting LRU eviction.", {
    limit: SOLID_ENTITY_API_POOL_LIMIT,
    requestedEntityName: nextEntityName,
    activeCount: activeEntries.length,
  });

  const candidate = findEvictionCandidate();
  if (!candidate) {
    warn("Pool is full but all entries look active; allowing temporary overflow.", {
      limit: SOLID_ENTITY_API_POOL_LIMIT,
      requestedEntityName: nextEntityName,
      activeCount: activeEntries.length,
    });
    return;
  }

  const resetApiState = candidate.api.util?.resetApiState;
  if (resetApiState) {
    activeStore.dispatch(resetApiState());
  }
  activeStore.middlewareManager.remove(candidate.api.reducerPath);
  activeStore.reducerManager.remove(candidate.api.reducerPath);
  activeStore.replaceReducer(activeStore.reducerManager.reduce);

  log("Evicted entity API from pool.", {
    entityName: candidate.entityName,
    reducerPath: candidate.api.reducerPath,
    requestedEntityName: nextEntityName,
  });
}

export function setSolidEntityApiStore(store: SolidEntityApiStore) {
  activeStore = store;
}

export function ensureSolidEntityApiRegistered(entityName: string, api: SolidEntityApi) {
  const timestamp = nextTimestamp();
  const existingEntry = pool.get(entityName);

  if (existingEntry) {
    existingEntry.lastAccessedAt = timestamp;
  } else {
    pool.set(entityName, {
      entityName,
      api,
      registeredAt: timestamp,
      lastAccessedAt: timestamp,
    });
    log("Created entity API cache entry.", {
      entityName,
      reducerPath: api.reducerPath,
    });
  }

  if (!activeStore || activeStore.middlewareManager.has(api.reducerPath)) return;

  evictIfNeeded(entityName);

  activeStore.reducerManager.add(api.reducerPath, api.reducer);
  activeStore.middlewareManager.add(api.reducerPath, api.middleware);

  log("Dynamically registered entity API reducer and middleware.", {
    entityName,
    reducerPath: api.reducerPath,
    activeCount: getActiveEntries().length,
    limit: SOLID_ENTITY_API_POOL_LIMIT,
  });
}

export function getSolidEntityApiPoolSnapshot() {
  return getLiveSnapshot();
}

export function resetSolidEntityApiPoolForTests() {
  activeStore = null;
  clock = 0;
  pool.clear();
}
