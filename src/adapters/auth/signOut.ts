import { clearSession } from "./storage";
import { eventBus, AppEvents } from "../../helpers/eventBus";

type SignOutOptions = {
  callbackUrl?: string;
  forceRedirect?: boolean;
};

export async function signOut(options: SignOutOptions = {}) {
  clearSession();
  eventBus.emit(AppEvents.SessionCleared);
  if (options.callbackUrl && typeof window !== "undefined") {
    const currentPathname = window.location.pathname;

    // `forceRedirect` is used for backend-driven session invalidation such as
    // concurrent-login eviction, where we must always land on the login page
    // even if the current shell would normally handle SessionCleared itself.
    // Most app shells can react to SessionCleared themselves, but explicit
    // session invalidation paths can force a redirect back to login.
    if (options.forceRedirect || currentPathname.startsWith("/admin")) {
      window.location.href = options.callbackUrl;
    }
  }
  return;
}
