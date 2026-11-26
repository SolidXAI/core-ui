import { jwtDecode } from "jwt-decode";
import { AppEvents, eventBus } from "../../helpers/eventBus";
import { loadSession, saveSession } from "./storage";
import type { Session } from "./types";

export type PortalSession = {
  accessToken: string;
  user: { id: number; username: string; email?: string; roles: string[] };
};

let renew: (() => Promise<Session>) | undefined;

export function getAdminEmbedSession(): Promise<Session> {
  const session = loadSession();
  if (session?.user?.accessTokenExpires && session.user.accessTokenExpires > Date.now() + 15_000) {
    return Promise.resolve(session);
  }
  return renew?.() ?? Promise.resolve(null);
}

export function registerAdminEmbedSession(requestToken: () => Promise<PortalSession>, onError: (error: unknown) => void) {
  let pending: Promise<Session> | undefined;
  let ownerId: number | undefined;
  let disposed = false;
  const refresh = () => {
    pending ??= requestToken().then(({ accessToken, user }) => {
      if (disposed) return null;
      const { exp, sub, portalApiKeyId } = jwtDecode<{ exp: number; sub: number; portalApiKeyId: number }>(accessToken);
      if (!Number.isSafeInteger(portalApiKeyId) || portalApiKeyId <= 0 || !Number.isSafeInteger(user?.id)
          || user.id <= 0 || user.id !== sub || !Array.isArray(user.roles) || !Number.isFinite(exp)
          || exp * 1000 <= Date.now()) {
        throw new Error("Invalid SolidX portal session.");
      }
      if (ownerId !== undefined && user.id !== ownerId) {
        throw new Error("The SolidX integration user changed. Reload the embedded screen to continue.");
      }
      ownerId = user.id;
      const session: Session = {
        user: { ...user, accessToken, refreshToken: "", accessTokenExpires: exp * 1000 },
      };
      saveSession(session);
      eventBus.emit(AppEvents.SessionUpdated, session);
      return session;
    }).catch((error) => {
      if (!disposed) {
        saveSession(null);
        eventBus.emit(AppEvents.SessionCleared);
        onError(error);
      }
      return null;
    }).finally(() => { pending = undefined; });
    return pending;
  };
  renew = refresh;

  return {
    refresh,
    dispose() {
      disposed = true;
      if (renew === refresh) {
        renew = undefined;
        saveSession(null);
        eventBus.emit(AppEvents.SessionCleared);
      }
    },
  };
}
