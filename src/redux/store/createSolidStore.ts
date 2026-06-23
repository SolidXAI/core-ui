import { configureStore } from "@reduxjs/toolkit";
import type { Middleware, ReducersMapObject } from "@reduxjs/toolkit";
import { solidApiSlices, solidReducers } from "./defaultStoreConfig";
import { createDynamicReducerManager } from "./dynamicReducerManager";
import { createDynamicEntityApiMiddlewareManager } from "./dynamicEntityApiMiddleware";
import { setSolidEntityApiStore } from "./solidEntityApiPool";

export type CreateSolidStoreOptions = {
  entities?: string[];
  reducers?: ReducersMapObject;
  middlewares?: Middleware[];
};

/**
 * createSolidStore builds the default SolidX store and lets consumers extend it.
 *
 * To add custom slices/middlewares in a consuming app:
 *   import { createSolidStore } from "@solidxai/core-ui";
 *   import myReducer from "./myReducer";
 *   import myMiddleware from "./myMiddleware";
 *
 *   const store = createSolidStore({
 *     entities,
 *     reducers: { mySlice: myReducer },
 *     middlewares: [myMiddleware],
 *   });
 */
export function createSolidStore(options: CreateSolidStoreOptions = {}) {
  const { reducers = {}, middlewares = [] } = options;

  const rootReducers: ReducersMapObject = {
    ...solidReducers,
    ...Object.fromEntries(solidApiSlices.map((api) => [api.reducerPath, api.reducer])),
    ...reducers,
  } as ReducersMapObject;

  const rootMiddlewares: Middleware[] = [
    ...solidApiSlices.map((api) => api.middleware as Middleware),
    ...middlewares,
  ];

  const reducerManager = createDynamicReducerManager(rootReducers);
  const entityApiMiddlewareManager = createDynamicEntityApiMiddlewareManager();

  const store = configureStore({
    reducer: reducerManager.reduce,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(...rootMiddlewares, entityApiMiddlewareManager.middleware),
  });

  setSolidEntityApiStore({
    dispatch: store.dispatch,
    getState: store.getState,
    replaceReducer: store.replaceReducer,
    reducerManager,
    middlewareManager: entityApiMiddlewareManager,
  });

  return store;
}

export type SolidStore = ReturnType<typeof createSolidStore>;
export type SolidRootState = ReturnType<SolidStore["getState"]>;
export type SolidDispatch = SolidStore["dispatch"];
