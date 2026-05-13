import { clearSession } from "./storage";
import { eventBus, AppEvents } from "../../helpers/eventBus";

type SignOutOptions = {
  callbackUrl?: string;
};

export async function signOut(options: SignOutOptions = {}) {
  clearSession();
  eventBus.emit(AppEvents.SessionCleared);
  if (options.callbackUrl && typeof window !== "undefined") {
    const currentPathname = window.location.pathname;

    // Only force the post-logout redirect when the admin app shell is active.
    // Other shells can react to SessionCleared and decide their own navigation.
    if (currentPathname.startsWith("/admin")) {
      window.location.href = options.callbackUrl;
    }
  }
  return;
}
