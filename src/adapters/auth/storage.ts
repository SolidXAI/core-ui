import type { Session } from "./types";

const STORAGE_KEY = "solidx.session";
let embedSession: Session = null;

export const isAdminEmbedDocument =
  typeof window !== "undefined" && /\/embed\/admin\/?$/.test(window.location.pathname);

export function saveSession(session: Session) {
  if (isAdminEmbedDocument) {
    embedSession = session;
    return;
  }
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): Session {
  if (isAdminEmbedDocument) return embedSession;
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearSession() {
  saveSession(null);
}
