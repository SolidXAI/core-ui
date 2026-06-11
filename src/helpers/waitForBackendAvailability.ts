import { env } from "../adapters/env";

type WaitForBackendAvailabilityOptions = {
  retries?: number;
  delayMs?: number;
};

function sleep(delayMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

export async function waitForBackendAvailability(options: WaitForBackendAvailabilityOptions = {}) {
  const retries = options.retries ?? 60;
  const delayMs = options.delayMs ?? 1500;
  const pingUrl = `${env("NEXT_PUBLIC_BACKEND_API_URL")}/api/ping`;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(pingUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (response.ok) {
        return true;
      }
    } catch (error) {
      // Ignore transient startup failures while the backend is rebooting.
    }

    if (attempt < retries - 1) {
      await sleep(delayMs);
    }
  }

  return false;
}
