import { useCallback, useContext, useEffect, useState } from "react";
import { LayoutContext } from "../layout/context/layoutcontext";
import { solidGet } from "../../http/solidHttp";
import { toLegacySettingsShape } from "../../helpers/settingsPayload";
import { SOLID_SETTINGS_UPDATED_EVENT } from "./SolidFaviconProvider";
import { getDefaultThemeKey, isRegisteredThemeKey, type ThemeMode } from "../../theme/theme-registry";

const THEME_MODE_STORAGE_KEY = "solidx.theme.mode";
const LIGHT_THEME_STORAGE_KEY = "solidx.theme.light";
const DARK_THEME_STORAGE_KEY = "solidx.theme.dark";
const LIGHT_THEME_KEY = "lightTheme";
const DARK_THEME_KEY = "darkTheme";

function normalizeThemeMode(value?: string | null): ThemeMode {
  return value === "dark" ? "dark" : "light";
}

function normalizeThemeFamily(value: string | null | undefined, mode: ThemeMode) {
  if (isRegisteredThemeKey(value, mode)) {
    return value;
  }

  return getDefaultThemeKey(mode);
}

function getThemeFamilyStorageKey(mode: ThemeMode) {
  return mode === "dark" ? DARK_THEME_STORAGE_KEY : LIGHT_THEME_STORAGE_KEY;
}

export const SolidThemeProvider = () => {
  const layoutContext = useContext(LayoutContext);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return normalizeThemeMode(window.localStorage.getItem(THEME_MODE_STORAGE_KEY));
  });
  const [themeFamilies, setThemeFamilies] = useState<Record<ThemeMode, string>>(() => {
    if (typeof window === "undefined") {
      return {
      light: getDefaultThemeKey("light"),
      dark: getDefaultThemeKey("dark"),
      };
    }

    return {
      light: normalizeThemeFamily(window.localStorage.getItem(LIGHT_THEME_STORAGE_KEY), "light"),
      dark: normalizeThemeFamily(window.localStorage.getItem(DARK_THEME_STORAGE_KEY), "dark"),
    };
  });
  const theme = normalizeThemeFamily(themeFamilies[themeMode], themeMode);

  const refreshThemeSettings = useCallback(async () => {
    try {
      const response = await solidGet("/setting/wrapped");
      const settings = toLegacySettingsShape(response?.data ?? null);
      const nextLightThemeFamily = normalizeThemeFamily(
        settings?.data?.[LIGHT_THEME_KEY],
        "light",
      );
      const nextDarkThemeFamily = normalizeThemeFamily(
        settings?.data?.[DARK_THEME_KEY],
        "dark",
      );

      setThemeFamilies({
        light: nextLightThemeFamily,
        dark: nextDarkThemeFamily,
      });

      if (typeof window !== "undefined") {
        window.localStorage.setItem(getThemeFamilyStorageKey("light"), nextLightThemeFamily);
        window.localStorage.setItem(getThemeFamilyStorageKey("dark"), nextDarkThemeFamily);
      }
    } catch (error) {
      if (typeof window !== "undefined") {
        const nextThemeMode = normalizeThemeMode(window.localStorage.getItem(THEME_MODE_STORAGE_KEY));
        setThemeFamilies({
          light: normalizeThemeFamily(window.localStorage.getItem(getThemeFamilyStorageKey("light")), "light"),
          dark: normalizeThemeFamily(window.localStorage.getItem(getThemeFamilyStorageKey("dark")), "dark"),
        });
        setThemeMode(nextThemeMode);
      }
      console.error("[SolidThemeProvider] Failed to load theme settings", error);
    }
  }, [layoutContext]);

  useEffect(() => {
    const themeLink = document.getElementById("theme-css") as HTMLLinkElement | null;
    if (!themeLink) {
      return;
    }

    themeLink.href = `/themes/${theme}/theme.css`;
  }, [theme]);

  useEffect(() => {
    const nextThemeMode = layoutContext?.themeMode === "dark" ? "dark" : "light";
    setThemeMode((current) => (current === nextThemeMode ? current : nextThemeMode));
  }, [layoutContext?.themeMode]);

  useEffect(() => {
    refreshThemeSettings();
    const handler = () => refreshThemeSettings();
    window.addEventListener(SOLID_SETTINGS_UPDATED_EVENT, handler);
    return () => window.removeEventListener(SOLID_SETTINGS_UPDATED_EVENT, handler);
  }, [refreshThemeSettings]);

  return null;
};
