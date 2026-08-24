import { clearSession } from "./storage";
import { eventBus, AppEvents } from "../../helpers/eventBus";

type SignOutOptions = {
  callbackUrl?: string;
};

export async function signOut(options: SignOutOptions = {}) {
  clearSession();
  if (options.callbackUrl && typeof window !== "undefined") {
    const currentPathname = window.location.pathname;

    if (currentPathname.startsWith("/admin")) {
      // clearSession() has already removed the saved session. Because this
      // path is leaving the page completely, redirect now instead of notifying
      // the current page and letting it render the unauthenticated route first.
      window.location.href = options.callbackUrl;
      return;
    }
  }

  // No page reload happens in this case, so notify mounted components that
  // the saved session was cleared so they can update their current state.
  eventBus.emit(AppEvents.SessionCleared);
  return;
}
