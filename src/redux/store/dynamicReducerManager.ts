import { combineReducers } from "@reduxjs/toolkit";
import type { AnyAction, Reducer, ReducersMapObject } from "@reduxjs/toolkit";

export type DynamicReducerManager = {
  reduce: Reducer;
  add: (key: string, reducer: Reducer) => boolean;
  remove: (key: string) => boolean;
  has: (key: string) => boolean;
  getReducerMap: () => ReducersMapObject;
};

export function createDynamicReducerManager(initialReducers: ReducersMapObject): DynamicReducerManager {
  const reducers: ReducersMapObject = { ...initialReducers };
  let combinedReducer = combineReducers(reducers);
  let keysToRemove: string[] = [];

  return {
    reduce(state: any, action: AnyAction) {
      if (keysToRemove.length > 0 && state) {
        state = { ...state };
        keysToRemove.forEach((key) => {
          delete state[key];
        });
        keysToRemove = [];
      }

      return combinedReducer(state, action);
    },
    add(key: string, reducer: Reducer) {
      if (!key || reducers[key]) return false;

      reducers[key] = reducer;
      combinedReducer = combineReducers(reducers);
      return true;
    },
    remove(key: string) {
      if (!key || !reducers[key]) return false;

      delete reducers[key];
      keysToRemove.push(key);
      combinedReducer = combineReducers(reducers);
      return true;
    },
    has(key: string) {
      return Boolean(reducers[key]);
    },
    getReducerMap() {
      return { ...reducers };
    },
  };
}
