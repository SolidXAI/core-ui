import type { Middleware, MiddlewareAPI } from "@reduxjs/toolkit";

type MiddlewareWithApi = ReturnType<Middleware>;

export type DynamicEntityApiMiddlewareManager = {
  middleware: Middleware;
  add: (key: string, middleware: Middleware) => boolean;
  remove: (key: string) => boolean;
  has: (key: string) => boolean;
  keys: () => string[];
};

export function createDynamicEntityApiMiddlewareManager(): DynamicEntityApiMiddlewareManager {
  const middlewares = new Map<string, Middleware>();
  let middlewareApi: MiddlewareAPI | null = null;
  const handlers = new Map<string, MiddlewareWithApi>();

  const manager: DynamicEntityApiMiddlewareManager = {
    middleware: (api) => {
      middlewareApi = api;
      middlewares.forEach((middleware, key) => {
        if (!handlers.has(key)) {
          handlers.set(key, middleware(api));
        }
      });

      return (next) => (action) => {
        const chain = Array.from(handlers.values());
        const dynamicNext = chain.reduceRight((nextHandler, handler) => handler(nextHandler), next);
        return dynamicNext(action);
      };
    },
    add(key, middleware) {
      if (!key || middlewares.has(key)) return false;

      middlewares.set(key, middleware);
      if (middlewareApi) {
        handlers.set(key, middleware(middlewareApi));
      }
      return true;
    },
    remove(key) {
      if (!middlewares.has(key)) return false;

      middlewares.delete(key);
      handlers.delete(key);
      return true;
    },
    has(key) {
      return middlewares.has(key);
    },
    keys() {
      return Array.from(middlewares.keys());
    },
  };

  return manager;
}
