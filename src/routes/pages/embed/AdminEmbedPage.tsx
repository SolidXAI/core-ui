import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  HashRouter, matchRoutes, UNSAFE_DataRouterContext, UNSAFE_DataRouterStateContext,
  UNSAFE_LocationContext, UNSAFE_RouteContext, useLocation, useRoutes, type RouteObject,
} from "react-router-dom";
import { registerAdminEmbedSession, type PortalSession } from "../../../adapters/auth/adminEmbedSession";
import { isAdminEmbedDocument } from "../../../adapters/auth/storage";
import SolidPopupContainer from "../../../components/common/SolidPopupContainer";
import { SolidToastProvider } from "../../../components/common/SolidToastProvider";
import { SolidLoadingState } from "../../../components/common/SolidLoadingState";
import { SolidRouteMetadataBoundary } from "../../SolidRouteMetadataBoundary";
import styles from "./AdminEmbedPage.module.css";

const channel = "solidx-admin-embed";
const emptyRouteContext = { outlet: null, matches: [], isDataRoute: false };

function EmbedRoutes({ routes, authGuard }: { routes: RouteObject[]; authGuard?: ReactNode }) {
  return useRoutes([
    {
      element: authGuard,
      children: [{
        element: <SolidRouteMetadataBoundary routes={routes} />,
        children: routes,
      }],
    },
    { path: "*", element: <p role="alert">This SolidX admin screen could not be found.</p> },
  ]);
}

export function AdminEmbedPage({ routes, authGuard }: { routes: RouteObject[]; authGuard?: ReactNode }) {
  const { search } = useLocation();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const initialRoutes = useRef(routes);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const parentOrigin = params.get("parentOrigin") ?? "";
    const instanceId = params.get("instanceId") ?? "";
    const parent = URL.canParse(parentOrigin) ? new URL(parentOrigin) : null;
    if (!isAdminEmbedDocument || window.parent === window || !instanceId || !parent
        || parent.origin !== parentOrigin || parentOrigin === window.location.origin
        || !["https:", "http:"].includes(parent.protocol)) {
      setError("Open this screen using the SolidX admin embed SDK.");
      return;
    }

    const target = window.location.hash.slice(1);
    if (!/^\/admin(?:[/?#]|$)/.test(target) || !matchRoutes(initialRoutes.current, target)) {
      setError("This SolidX admin screen could not be found.");
      return;
    }

    let pending: {
      requestId: string;
      timer: ReturnType<typeof setTimeout>;
      resolve: (token: PortalSession) => void;
      reject: (error: Error) => void;
    } | undefined;
    function requestToken(): Promise<PortalSession> {
      return new Promise((resolve, reject) => {
        const requestId = crypto.randomUUID();
        const timer = setTimeout(() => {
          pending = undefined;
          reject(new Error("The host application did not respond to the SolidX session request."));
        }, 30_000);
        pending = { requestId, timer, resolve, reject };
        window.parent.postMessage({ channel, instanceId, type: "token_request", requestId }, parentOrigin);
      });
    }
    const receive = (event: MessageEvent) => {
      const message = event.data;
      if (event.source !== window.parent || event.origin !== parentOrigin
          || message?.channel !== channel || message.instanceId !== instanceId
          || !pending || message.requestId !== pending.requestId
          || !["token", "token_error"].includes(message.type)) return;
      const request = pending;
      pending = undefined;
      clearTimeout(request.timer);
      if (message.type === "token") request.resolve(message.session);
      else request.reject(new Error("The host application could not authorize this SolidX screen."));
    };
    const auth = registerAdminEmbedSession(requestToken, (failure) => {
      setReady(false);
      setError(failure instanceof Error ? failure.message : "Unable to start a SolidX session.");
    });
    window.addEventListener("message", receive);
    void auth.refresh().then((session) => {
      if (session) setReady(true);
    });

    return () => {
      auth.dispose();
      window.removeEventListener("message", receive);
      if (pending) {
        clearTimeout(pending.timer);
        pending.reject(new Error("Embedded screen closed."));
        pending = undefined;
      }
    };
  }, [search]);

  if (error) {
    return <main className={styles.message} role="alert">
      <p>{error}</p>
      <button type="button" onClick={() => window.location.reload()}>Reload screen</button>
    </main>;
  }
  if (!ready) return <SolidLoadingState title="Opening SolidX" description="Connecting to the host application." />;

  // Isolate the screen's route context while keeping the host UI's Redux and theme providers.
  // The real document stays at /embed/admin, including on reload.
  return <UNSAFE_LocationContext.Provider value={null!}>
    <UNSAFE_RouteContext.Provider value={emptyRouteContext}>
      <UNSAFE_DataRouterContext.Provider value={null}>
        <UNSAFE_DataRouterStateContext.Provider value={null}>
          <HashRouter>
            <div className="solidx-admin-embed">
              <SolidPopupContainer />
              <SolidToastProvider />
              <EmbedRoutes routes={routes} authGuard={authGuard} />
            </div>
          </HashRouter>
        </UNSAFE_DataRouterStateContext.Provider>
      </UNSAFE_DataRouterContext.Provider>
    </UNSAFE_RouteContext.Provider>
  </UNSAFE_LocationContext.Provider>;
}
