import { clearSession } from "./storage";

type SignOutOptions = {
  callbackUrl?: string;
};

export async function signOut(options: SignOutOptions = {}) {
  clearSession();
  if (options.callbackUrl && typeof window !== "undefined") {
    window.location.href = options.callbackUrl;
  }
  return;
}
