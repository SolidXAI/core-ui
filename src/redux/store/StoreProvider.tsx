import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { createSolidStore, type SolidStore } from "./createSolidStore";
import { backendHealthMonitor } from "../../helpers/backendHealthMonitor";
import { solidGet } from "../../http/solidHttp";
import { SolidLoadingState } from "../../components/common/SolidLoadingState";

async function fetchEntities(): Promise<string[]> {
  const response = await solidGet("/model-metadata/public");
  const data = response?.data;
  const records = data?.data?.records || [];
  return records.map((r: { singularName: string }) => r.singularName);
}

let cachedStore: SolidStore | null = null;

function areReducersEqual(
  a?: NonNullable<Parameters<typeof createSolidStore>[0]>["reducers"],
  b?: NonNullable<Parameters<typeof createSolidStore>[0]>["reducers"],
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => a[k] === b[k]);
}

export function StoreProvider({
  children,
  reducers,
  middlewares,
}: {
  children: ReactNode;
  reducers?: NonNullable<Parameters<typeof createSolidStore>[0]>["reducers"];
  middlewares?: NonNullable<Parameters<typeof createSolidStore>[0]>["middlewares"];
}) {
  const [store, setStore] = useState<SolidStore | null>(() => cachedStore);
  const prevReducersRef = useRef(reducers);

  useEffect(() => {
    if (cachedStore) {
      if (!areReducersEqual(prevReducersRef.current, reducers)) {
        prevReducersRef.current = reducers;
        const manager = cachedStore.reducerManager;
        if (manager && reducers) {
          let updated = false;
          for (const [key, reducer] of Object.entries(reducers)) {
            if (!manager.has(key)) {
              manager.add(key, reducer);
              updated = true;
            }
          }
          if (updated) {
            cachedStore.replaceReducer(manager.reduce);
          }
        }
      }
      if (store !== cachedStore) {
        setStore(cachedStore);
      }
      return;
    }

    let mounted = true;
    prevReducersRef.current = reducers;
    fetchEntities()
      .then((entities) => {
        if (!mounted) return;
        backendHealthMonitor.reportSuccess();
        const newStore = createSolidStore({ entities, reducers, middlewares });
        cachedStore = newStore;
        setStore(newStore);
      })
      .catch(() => {
        if (!mounted) return;
        backendHealthMonitor.reportFailure({
          message: "Unable to reach the server. Reconnecting...",
        });
        const fallbackStore = createSolidStore({ entities: [], reducers, middlewares });
        cachedStore = fallbackStore;
        setStore(fallbackStore);
      });

    return () => {
      mounted = false;
    };
  }, [reducers, middlewares, store]);

  const content = useMemo(() => {
    if (!store) {
      return (
        <SolidLoadingState
          title="Preparing workspace"
          description="We are loading the application shell and getting your workspace ready."
        />
      );
    }
    return <Provider store={store}>{children}</Provider>;
  }, [store, children]);

  return content;
}
