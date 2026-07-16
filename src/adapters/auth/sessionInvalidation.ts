import { signOut } from "./signOut";
import { SESSION_INVALID_ERROR_CODE } from "../../constants/error-messages";

let isHandlingSessionInvalidation = false;

export function isSessionInvalidError(payload: unknown, status?: unknown): boolean {
  if (status !== 401) return false;
  if (!payload || typeof payload !== "object") return false;

  return (payload as { errorCode?: unknown }).errorCode === SESSION_INVALID_ERROR_CODE;
}

export async function handleSessionInvalidation() {
  if (isHandlingSessionInvalidation) return;

  isHandlingSessionInvalidation = true;
  try {
    await signOut({ callbackUrl: "/auth/login" });
  } finally {
    isHandlingSessionInvalidation = false;
  }
}
