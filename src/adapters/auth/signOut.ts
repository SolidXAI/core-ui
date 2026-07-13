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

    if (currentPathname.startsWith("/admin")) {
      window.location.href = options.callbackUrl;
    }
  }
  return;
}
