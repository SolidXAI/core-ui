import { clearSession } from "./storage";
import { eventBus, AppEvents } from "../../helpers/eventBus";

type SignOutOptions = {
  callbackUrl?: string;
};

export type SessionClearedPayload = {
  redirecting?: boolean;
};

export async function signOut(options: SignOutOptions = {}) {
  // Remove the persisted session first. This makes the user unauthenticated
  // for the next page load and prevents the old access token from being used.
  clearSession();
  if (options.callbackUrl && typeof window !== "undefined") {
    const currentPathname = window.location.pathname;

    if (currentPathname.startsWith("/admin")) {
      // Start the redirect before notifying the current page. The event is
      // still emitted, but the redirect flag tells mounted listeners to wait
      // for the new page instead of rendering the login screen once here.
      window.location.href = options.callbackUrl;
      console.log("[Auth] SessionCleared emitted from admin logout");
      eventBus.emit<SessionClearedPayload>(AppEvents.SessionCleared, { redirecting: true });
      return;
    }
  }

  // When there is no full-page redirect, mounted components must receive this
  // event so useSession can clear their in-memory user and status values.
  console.log("[Auth] SessionCleared emitted from signOut");
  eventBus.emit<SessionClearedPayload>(AppEvents.SessionCleared);
  return;
}
