export type ThemeMode = "light" | "dark";

const DEFAULT_THEME_KEYS: Record<ThemeMode, string> = {
  light: "solid-light-purple",
  dark: "solid-dark-purple",
};

const THEME_MODE_TOKENS: Record<ThemeMode, string> = {
  light: "-light-",
  dark: "-dark-",
};

const THEME_MODE_SUFFIXES: Record<ThemeMode, string> = {
  light: "-light",
  dark: "-dark",
};

function normalizeThemeKey(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

function matchesThemeMode(value: string, mode: ThemeMode): boolean {
  return (
    value.includes(THEME_MODE_TOKENS[mode])
    || value.endsWith(THEME_MODE_SUFFIXES[mode])
    || value === mode
  );
}

function replaceThemeMode(value: string, targetMode: ThemeMode): string | null {
  const sourceMode: ThemeMode = targetMode === "light" ? "dark" : "light";
  const sourceToken = THEME_MODE_TOKENS[sourceMode];
  const targetToken = THEME_MODE_TOKENS[targetMode];
  const sourceSuffix = THEME_MODE_SUFFIXES[sourceMode];
  const targetSuffix = THEME_MODE_SUFFIXES[targetMode];

  if (value.includes(sourceToken)) {
    return value.replace(sourceToken, targetToken);
  }

  if (value.endsWith(sourceSuffix)) {
    return `${value.slice(0, -sourceSuffix.length)}${targetSuffix}`;
  }

  return null;
}

export function getThemeModeFromThemeKey(value?: string | null): ThemeMode | null {
  const normalized = normalizeThemeKey(value);
  if (!normalized) return null;

  if (matchesThemeMode(normalized, "light")) return "light";
  if (matchesThemeMode(normalized, "dark")) return "dark";

  return null;
}

export function getDefaultThemeKey(mode: ThemeMode = "light"): string {
  return DEFAULT_THEME_KEYS[mode];
}

export function toThemeModeVariant(value: string, mode: ThemeMode): string | null {
  const normalized = normalizeThemeKey(value);
  if (!normalized) return null;

  if (getThemeModeFromThemeKey(normalized) === mode) {
    return normalized;
  }

  return replaceThemeMode(normalized, mode);
}

export function isRegisteredThemeKey(value?: string | null, mode?: ThemeMode): value is string {
  const currentMode = getThemeModeFromThemeKey(value);
  if (!value || !currentMode) return false;
  return mode ? currentMode === mode : true;
}
