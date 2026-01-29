import { loadSession, saveSession, clearSession } from "./storage";
import { refreshAccessToken } from "./refreshAccessToken";
import { eventBus, AppEvents } from "../../helpers/eventBus";
import type { Session } from "./types";
import { signOut } from "./signOut";

export async function getSession(): Promise<Session> {
  const session = loadSession();
  if (!session?.user?.accessToken) return null;

  const expiresAt = session.user.accessTokenExpires;
  const bufferMs = 60_000;
  if (expiresAt && Date.now() >= expiresAt - bufferMs) {
    const refreshed = await refreshAccessToken({ refreshToken: session.user.refreshToken });
    if ((refreshed as any)?.error) {
      // clearSession();
      // return { ...session, error: "RefreshAccessTokenError" };
      await signOut({ callbackUrl: '/auth/login' });
    }

    const nextSession: Session = {
      ...session,
      user: {
        ...session.user,
        accessToken: (refreshed as any).accessToken,
        refreshToken: (refreshed as any).refreshToken,
        accessTokenExpires: (refreshed as any).accessTokenExpires,
      },
      error: null,
    };
    saveSession(nextSession);
    eventBus.emit(AppEvents.SessionUpdated, nextSession);
    return nextSession;
  }

  return session;
}
