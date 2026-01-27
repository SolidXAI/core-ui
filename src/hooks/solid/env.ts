export function env(key: string, fallback = ""): string {
  const candidates: string[] = [];

  if (key.startsWith("NEXT_PUBLIC_")) {
    candidates.push(`VITE_${key.slice("NEXT_PUBLIC_".length)}`, key);
  } else if (key.startsWith("VITE_")) {
    candidates.push(key, `NEXT_PUBLIC_${key.slice("VITE_".length)}`);
  } else {
    candidates.push(`VITE_${key}`, `NEXT_PUBLIC_${key}`, key);
  }

  // Prefer Vite env when available
  const metaEnv = typeof import.meta !== "undefined" ? (import.meta as any).env : undefined;
  if (metaEnv) {
    for (const candidate of candidates) {
      const value = metaEnv[candidate];
      if (typeof value === "string") return value;
    }
  }

  if (typeof process !== "undefined" && process.env) {
    for (const candidate of candidates) {
      const value = process.env[candidate];
      if (typeof value === "string") return value;
    }
  }

  return fallback;
}
