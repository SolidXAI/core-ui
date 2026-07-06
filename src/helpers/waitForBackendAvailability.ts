import { env } from "../adapters/env";

type WaitForBackendAvailabilityOptions = {
  retries?: number;
  delayMs?: number;
};

function sleep(delayMs: number) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

export async function pingBackendAvailability() {
  const pingUrl = `${env("NEXT_PUBLIC_BACKEND_API_URL")}/api/ping`;

  try {
    const response = await fetch(pingUrl, {
      method: "GET",
      cache: "no-store",
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function waitForBackendAvailability(options: WaitForBackendAvailabilityOptions = {}) {
  const retries = options.retries ?? 60;
  const delayMs = options.delayMs ?? 1500;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    const isAvailable = await pingBackendAvailability();
    if (isAvailable) {
      return true;
    }

    if (attempt < retries - 1) {
      await sleep(delayMs);
    }
  }

  return false;
}
