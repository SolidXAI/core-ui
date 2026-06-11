import { env } from "../adapters/env";

const DEV_ENVIRONMENT_NAMES = new Set([
  "dev",
  "development",
  "local",
  "localhost",
  "test",
  "testing",
  "stage",
  "staging",
  "uat",
]);

export function getCurrentSolidEnvironmentLabel(): "dev" | "prod" {
  const envName = (env("VITE_SOLIDX_ENV") || env("SOLIDX_ENV") || "").trim().toLowerCase();
  return DEV_ENVIRONMENT_NAMES.has(envName) ? "dev" : "prod";
}

export function isButtonVisibleInCurrentEnv(buttonAttrs?: { env?: string[] | string | null }): boolean {
  const allowedEnvironments = buttonAttrs?.env;
  if (!allowedEnvironments) {
    return true;
  }

  const normalizedAllowedEnvironments = (Array.isArray(allowedEnvironments) ? allowedEnvironments : [allowedEnvironments])
    .map((entry) => String(entry).trim().toLowerCase())
    .filter(Boolean);

  if (normalizedAllowedEnvironments.length === 0) {
    return true;
  }

  return normalizedAllowedEnvironments.includes(getCurrentSolidEnvironmentLabel());
}
